// server/routes/admin.js
const express = require('express');
const router = express.Router();
const prisma = require('../db');
const { protect, authorize } = require('../auth');
const { exec } = require('child_process');
const util = require('util');
const path = require('path');
const fs = require('fs');
const axios = require('axios'); // для скачивания аватарки
const execPromise = util.promisify(exec);

// Все роуты здесь защищены: только для ADMIN
router.use(protect, authorize('ADMIN'));

// --- УПРАВЛЕНИЕ ПОЛЬЗОВАТЕЛЯМИ ---

router.get('/users', async (req, res) => {
  const activeUsers = req.app.get('activeUsers');
  try {
    const users = await prisma.user.findMany({
      include: { _count: { select: { tasks: true } } },
      orderBy: { createdAt: 'desc' }
    });

    const usersWithStatus = users.map(user => ({
      ...user,
      isOnline: activeUsers.has(user.id)
    }));

    res.json(usersWithStatus);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/users', async (req, res) => {
  try {
    const user = await prisma.user.create({ data: req.body });
    res.json(user);
  } catch (err) { res.status(500).json({ error: "Ошибка создания пользователя" }); }
});

router.patch('/users/:id', async (req, res) => {
  const { password, ...data } = req.body;
  if (password && password.trim() !== "") data.password = password;
  try {
    const user = await prisma.user.update({
      where: { id: parseInt(req.params.id) },
      data
    });
    res.json(user);
  } catch (err) { res.status(500).json({ error: "Ошибка обновления" }); }
});

router.delete('/users/:id', async (req, res) => {
  try {
    await prisma.user.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: "Ошибка удаления" }); }
});

// --- УПРАВЛЕНИЕ КАНАЛАМИ ---

router.post('/channels', async (req, res) => {
  try {
    const { name, youtubeUrl, thumbnail, ...settings } = req.body;

    // 1. ПРОВЕРКА: Существует ли уже такой канал?
    const exists = await prisma.channel.findUnique({ where: { name } });
    if (exists) {
      return res.status(400).json({ error: `Канал с названием "${name}" уже подключен` });
    }

    let thumbnailPath = null;

    // 2. СКАЧИВАНИЕ АВАТАРКИ
    if (thumbnail && thumbnail.startsWith('http')) {
      try {
        // Убеждаемся, что папка uploads существует
        const dir = path.join(process.cwd(), 'uploads');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

        const fileName = `channel_${Date.now()}.jpg`;
        const filePath = path.join(dir, fileName);
        
        const response = await axios({ 
          url: thumbnail, 
          responseType: 'stream',
          timeout: 5000 // Таймаут 5 секунд
        });

        const writer = fs.createWriteStream(filePath);
        response.data.pipe(writer);

        await new Promise((resolve, reject) => {
          writer.on('finish', resolve);
          writer.on('error', reject);
        });

        thumbnailPath = `uploads/${fileName}`;
      } catch (imgErr) {
        console.error("Image download failed:", imgErr.message);
        // Не прерываем создание канала, если не удалось скачать только картинку
      }
    }

    // 3. СОЗДАНИЕ В БАЗЕ
    const channel = await prisma.channel.create({ 
      data: { 
        name, 
        youtubeUrl, 
        thumbnailPath,
        titlePrefix: settings.titlePrefix || "",
        descriptionFooter: settings.descriptionFooter || "",
        originalLinkPrefix: settings.originalLinkPrefix || "Original: ",
        showOriginalLink: settings.showOriginalLink ?? true
      } 
    });

    res.json(channel);
  } catch (err) {
    console.error("Channel Create Error:", err);
    res.status(500).json({ error: `Ошибка БД: ${err.message}` });
  }
});

router.post('/channels/fetch-metadata', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "Введите ссылку на канал" });

  // Очистка ссылки: убираем лишние параметры после знака ?, если они есть
  const cleanUrl = url.split('?')[0];

  try {
    const ytDlpPath = process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp';
    
    const proxySetting = await prisma.setting.findUnique({ where: { key: 'proxy_url' } });
    const proxyFlag = proxySetting ? `--proxy "${proxySetting.value}"` : '';

    // --dump-single-json более стабилен для метаданных одного объекта
    // --no-playlist заставляет yt-dlp смотреть на сам объект ссылки (канал), а не на его видео
    // Добавляем user-agent, чтобы YouTube не выдавал 403 Forbidden
    const command = `${ytDlpPath} ${proxyFlag} --dump-single-json --no-playlist --flat-playlist --skip-download --user-agent "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36" "${cleanUrl}"`;

    const { stdout, stderr } = await execPromise(command, { maxBuffer: 10 * 1024 * 1024 });
    
    if (stderr && !stdout) {
      throw new Error(stderr);
    }

    const info = JSON.parse(stdout);

    // YouTube в dump-json для каналов отдает название в полях: channel, uploader или title
    res.json({
      name: info.channel || info.uploader || info.title || "Название не найдено",
      thumbnail: info.thumbnails?.find(t => t.id === 'avatar_uncropped')?.url || 
                 info.thumbnails?.find(t => t.id === 'avatar')?.url || 
                 info.thumbnail || info.thumbnails?.at(-1)?.url,
      youtubeUrl: cleanUrl
    });
  } catch (err) {
    console.error("YT-DLP Error Detail:", err.message);
    
    // Если YouTube просит подтвердить, что вы не бот
    if (err.message.includes("Sign in to confirm")) {
       return res.status(500).json({ error: "YouTube заблокировал запрос (бот-детект). Используйте прокси в настройках админки." });
    }

    res.status(500).json({ 
      error: `Ошибка парсинга: ${err.message.slice(0, 100)}...` 
    });
  }
});

router.patch('/channels/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // Убираем thumbnail из данных обновления, если это просто ссылка http, 
    // чтобы не перезаписывать путь к локальному файлу ссылкой на youtube
    const { thumbnail, thumbnailPath, ...data } = req.body;

    const channel = await prisma.channel.update({
      where: { id: parseInt(id) },
      data: data
    });
    res.json(channel);
  } catch (err) { 
    res.status(500).json({ error: "Ошибка обновления канала" }); 
  }
});

router.delete('/channels/:id', async (req, res) => {
  try {
    await prisma.channel.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: "Ошибка удаления" }); }
});

// --- НАСТРОЙКИ (PROXY & TELEGRAM) ---

router.get('/settings', protect, authorize('ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const settings = await prisma.setting.findMany();
    res.json(settings);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/settings', async (req, res) => {
  const { key, value } = req.body;
  try {
    await prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value }
    });
    // Если обновили прокси, меняем его в текущем процессе
    if (key === 'proxy_url') process.env.PROXY_URL = value;
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: "Ошибка сохранения" }); }
});

router.get('/dashboard-tasks', protect, authorize('ADMIN'), async (req, res) => {
  try {
    const tasks = await prisma.task.findMany({
      where: {
        status: { not: 'PUBLISHED' } // Только активные
      },
      include: {
        originalVideo: true,
        channel: true,
        creator: { select: { username: true } },
        manager: { select: { username: true } }
      },
      orderBy: { updatedAt: 'desc' }
    });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;