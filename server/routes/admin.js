// server/routes/admin.js
const express = require('express');
const router = express.Router();
const prisma = require('../db');
const { protect, authorize } = require('../auth');
const { exec } = require('child_process');
const util = require('util');
const path = require('path');
const fs = require('fs');
const axios = require('axios');

const execPromise = util.promisify(exec);

module.exports = (io) => {

  // --- УПРАВЛЕНИЕ ПОЛЬЗОВАТЕЛЯМИ ---

  router.get('/users', protect, authorize('ADMIN'), async (req, res) => {
    const activeUsers = req.app.get('activeUsers');
    try {
      const users = await prisma.user.findMany({
        include: { 
          preference: true,
          _count: { select: { pushSubscriptions: true, tasks: true } } 
        },
        orderBy: { createdAt: 'desc' }
      });

      const usersWithStatus = users.map(user => ({
        ...user,
        isOnline: activeUsers.has(user.id)
      }));

      res.json(usersWithStatus);
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  router.post('/users', protect, authorize('ADMIN'), async (req, res) => {
    try {
      const { username, password, role, tgUsername } = req.body;
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const user = await prisma.user.create({ 
        data: { username, password: hashedPassword, role, tgUsername } 
      });
      res.json(user);
    } catch (err) { res.status(500).json({ error: "Ошибка создания" }); }
  });

  router.patch('/users/:id', protect, authorize('ADMIN'), async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { password, ...data } = req.body;
      const updateData = { ...data };
      let passwordChanged = false;

      if (password && password.trim() !== "") {
        const bcrypt = require('bcrypt');
        updateData.password = await bcrypt.hash(password, 10);
        passwordChanged = true;
      }

      const user = await prisma.user.update({
        where: { id: userId },
        data: updateData
      });

      if (passwordChanged) {
        io.to(`user_${userId}`).emit('force_logout', { reason: 'Пароль изменен' });
      }

      res.json(user);
    } catch (err) { res.status(500).json({ error: "Ошибка обновления" }); }
  });

  router.delete('/users/:id', protect, authorize('ADMIN'), async (req, res) => {
    try {
      await prisma.user.delete({ where: { id: parseInt(req.params.id) } });
      res.json({ success: true });
    } catch (err) { res.status(500).json({ error: "Ошибка удаления" }); }
  });

  // --- УПРАВЛЕНИЕ КАНАЛАМИ ---

  router.post('/channels/fetch-metadata', protect, authorize('ADMIN'), async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "Нужна ссылка" });
    const cleanUrl = url.split('?')[0];

    try {
      const ytDlpPath = process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp';
      const proxySetting = await prisma.setting.findUnique({ where: { key: 'proxy_url' } });
      const proxyFlag = proxySetting ? `--proxy "${proxySetting.value}"` : '';

      const command = `${ytDlpPath} ${proxyFlag} --dump-single-json --no-playlist --flat-playlist --skip-download "${cleanUrl}"`;
      const { stdout } = await execPromise(command, { maxBuffer: 10 * 1024 * 1024 });
      const info = JSON.parse(stdout);

      res.json({
        name: info.channel || info.uploader || info.title || "Unknown",
        thumbnail: info.thumbnails?.find(t => t.id === 'avatar_uncropped')?.url || info.thumbnail,
        youtubeUrl: cleanUrl
      });
    } catch (err) { res.status(500).json({ error: "Ошибка парсинга" }); }
  });

  router.post('/channels', protect, authorize('ADMIN'), async (req, res) => {
    try {
      const { 
        name, 
        youtubeUrl, 
        thumbnail, 
        titlePrefix, 
        descriptionFooter, 
        originalLinkPrefix, 
        showOriginalLink, 
        publishSlots 
      } = req.body;

      // Проверка уникальности имени
      const exists = await prisma.channel.findUnique({ where: { name } });
      if (exists) return res.status(400).json({ error: "Канал с таким названием уже есть" });

      let thumbnailPath = null;

      // Скачивание аватарки
      if (thumbnail && thumbnail.startsWith('http')) {
        try {
          const dir = path.join(process.cwd(), 'uploads');
          if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

          const fileName = `channel_${Date.now()}.jpg`;
          const filePath = path.join(dir, fileName);
          
          const response = await axios({ url: thumbnail, responseType: 'stream', timeout: 5000 });
          const writer = fs.createWriteStream(filePath);
          response.data.pipe(writer);

          await new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
          });
          thumbnailPath = `uploads/${fileName}`;
        } catch (e) { console.error("Img download failed"); }
      }

      // Создание в БД
      const channel = await prisma.channel.create({ 
        data: { 
          name, 
          youtubeUrl, 
          thumbnailPath,
          titlePrefix: titlePrefix || "",
          descriptionFooter: descriptionFooter || "",
          originalLinkPrefix: originalLinkPrefix || "Original: ",
          showOriginalLink: showOriginalLink ?? true,
          // Сохраняем слоты как строку (JSON массив)
          publishSlots: Array.isArray(publishSlots) ? JSON.stringify(publishSlots) : publishSlots
        } 
      });

      res.json(channel);
    } catch (err) {
      res.status(500).json({ error: `Ошибка создания: ${err.message}` });
    }
  });

  router.patch('/channels/:id', protect, authorize('ADMIN'), async (req, res) => {
    try {
      const { id } = req.params;
      const body = req.body;

      // Фильтруем данные: только то, что реально есть в БД
      const updateData = {};
      if (body.name !== undefined) updateData.name = body.name;
      if (body.youtubeUrl !== undefined) updateData.youtubeUrl = body.youtubeUrl;
      if (body.titlePrefix !== undefined) updateData.titlePrefix = body.titlePrefix;
      if (body.descriptionFooter !== undefined) updateData.descriptionFooter = body.descriptionFooter;
      if (body.originalLinkPrefix !== undefined) updateData.originalLinkPrefix = body.originalLinkPrefix;
      if (body.showOriginalLink !== undefined) updateData.showOriginalLink = Boolean(body.showOriginalLink);
      
      // Обработка слотов (если пришел массив - превращаем в строку)
      if (body.publishSlots !== undefined) {
        updateData.publishSlots = Array.isArray(body.publishSlots) 
          ? JSON.stringify(body.publishSlots) 
          : body.publishSlots;
      }

      const channel = await prisma.channel.update({
        where: { id: parseInt(id) },
        data: updateData
      });

      res.json(channel);
    } catch (err) {
      console.error("Patch error:", err.message);
      res.status(500).json({ error: "Ошибка при обновлении настроек" });
    }
  });

  router.delete('/channels/:id', protect, authorize('ADMIN'), async (req, res) => {
    try {
      await prisma.channel.delete({ where: { id: parseInt(req.params.id) } });
      res.json({ success: true });
    } catch (err) { res.status(500).json({ error: "Ошибка удаления" }); }
  });

  // --- НАСТРОЙКИ ---

  router.get('/settings', protect, authorize('ADMIN', 'MANAGER'), async (req, res) => {
    try {
      const settings = await prisma.setting.findMany();
      res.json(settings);
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  router.post('/settings', protect, authorize('ADMIN'), async (req, res) => {
    const { key, value } = req.body;
    try {
      await prisma.setting.upsert({
        where: { key },
        update: { value },
        create: { key, value }
      });
      res.json({ success: true });
    } catch (err) { res.status(500).json({ error: "Ошибка сохранения" }); }
  });

  // ВАЖНО: Возвращаем сконфигурированный роутер
  return router;
};