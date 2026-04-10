const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const util = require('util');
const prisma = require('../db');
const { protect, authorize } = require('../auth');
const { downloadVideoBackground } = require('../downloader');
const { sendPushNotification } = require('../push');

const execPromise = util.promisify(exec);
const upload = multer({ dest: 'uploads/' });
const router = express.Router();

const getYouTubeID = (url) => {
  const match = url.match(/^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|\/shorts\/)([^#\&\?]*).*/);
  return (match && match[2].length === 11) ? match[2] : null;
};

module.exports = (io) => {

  router.get('/user-history/:userId', protect, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const { skip = 0, take = 10, role = 'creator', month = 'all' } = req.query;

      let dateFilter = {};
      if (month !== 'all') {
        const [year, m] = month.split('-');
        dateFilter = {
          publishedAt: {
            gte: new Date(year, m - 1, 1),
            lt: new Date(year, m, 1),
          }
        };
      }

      // Фильтруем: если роль 'manager', ищем по managerId, иначе по creatorId
      const where = {
        status: 'PUBLISHED',
        [role === 'manager' ? 'managerId' : 'creatorId']: userId,
        ...dateFilter
      };

      const history = await prisma.task.findMany({
        where,
        include: { originalVideo: true, channel: true },
        orderBy: { publishedAt: 'desc' },
        skip: parseInt(skip),
        take: parseInt(take)
      });

      res.json(history);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get('/creators', protect, async (req, res) => {
    try {
      const creators = await prisma.user.findMany({
        where: { role: 'CREATOR' },
        select: { id: true, username: true, tgUsername: true }
      });
      res.json(creators);
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  router.post('/fetch-info', protect, async (req, res) => {
    const { url, force, useProxy } = req.body;
    const videoId = getYouTubeID(url);
    if (!videoId) return res.status(400).json({ error: 'Некорректная ссылка' });

    try {
      const proxySetting = await prisma.setting.findUnique({ where: { key: 'proxy_url' } });
      const proxyFlag = (useProxy && proxySetting) ? `--proxy "${proxySetting.value}"` : '';
      const ytDlpPath = process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp';

      let video = await prisma.originalVideo.findUnique({ where: { videoId } });
      let existingChannelIds = [];

      if (video) {
        const tasks = await prisma.task.findMany({ where: { originalVideoId: video.id }, select: { channelId: true } });
        existingChannelIds = tasks.map(t => t.channelId);
        if (video.status === 'TOO_LONG') return res.json({ ...video, existingChannelIds });
        if (video.status === 'READY' && fs.existsSync(video.filePath || '') && !force) return res.json({ ...video, existingChannelIds });
        video = await prisma.originalVideo.update({ where: { videoId }, data: { status: 'DOWNLOADING', errorMessage: null } });
      } else {
        video = await prisma.originalVideo.create({ data: { videoId, url, status: 'DOWNLOADING' } });
      }

      const { stdout } = await execPromise(`${ytDlpPath} ${proxyFlag} --dump-json --skip-download "${url}"`, { maxBuffer: 10 * 1024 * 1024 });
      const info = JSON.parse(stdout);

      if (info.duration > 180) {
        video = await prisma.originalVideo.update({ where: { videoId }, data: { title: info.title, duration: Math.round(info.duration), status: 'TOO_LONG', errorMessage: 'Видео длиннее 3 минут' } });
        return res.json({ ...video, existingChannelIds });
      }

      video = await prisma.originalVideo.update({ where: { videoId }, data: { title: info.title, duration: Math.round(info.duration) } });
      downloadVideoBackground(videoId, url, io, useProxy, video);
      res.json({ ...video, existingChannelIds });
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  router.get('/notifications/preferences', protect, async (req, res) => {
    try {
      const userId = parseInt(req.user.id);
      let prefs = await prisma.userPreference.findUnique({ where: { userId } });
      if (!prefs) {
        prefs = await prisma.userPreference.create({ data: { userId, enabled: true } });
      }
      res.json(prefs);
    } catch (err) {
      res.json({ enabled: true, userId: req.user.id });
    }
  });

  router.patch('/notifications/preferences', protect, async (req, res) => {
    try {
      const userId = parseInt(req.user.id);
      const updated = await prisma.userPreference.upsert({
        where: { userId },
        update: { enabled: Boolean(req.body.enabled) },
        create: { userId, enabled: Boolean(req.body.enabled) }
      });
      res.json(updated);
    } catch (err) {
      res.status(500).json({ error: "Ошибка сохранения" });
    }
  });

  router.get('/notifications', protect, async (req, res) => {
    const skip = parseInt(req.query.skip) || 0;
    const take = parseInt(req.query.take) || 20;

    try {
      const userId = parseInt(req.user.id);

      const notifications = await prisma.notification.findMany({
        where: { userId: userId },
        include: {
          task: {
            select: { 
              status: true // Подтягиваем только статус для проверки на фронте
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take
      });

      res.json(notifications);
    } catch (err) {
      console.error("Ошибка при получении уведомлений:", err);
      res.status(500).json({ error: "Ошибка сервера" });
    }
  });

  router.post('/notifications/read-all', protect, async (req, res) => {
    try {
      const userId = parseInt(req.user.id);
      
      // Помечаем все непрочитанные как прочитанные
      await prisma.notification.updateMany({
        where: { userId: userId, isRead: false },
        data: { isRead: true }
      });

      // МГНОВЕННЫЙ СИГНАЛ: Сообщаем фронтенду, что данные изменились
      io.to(`user_${userId}`).emit('new_notification'); 

      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // [MANAGER] Текущие задачи в очереди (все, что не опубликовано)
  router.get('/managed', protect, authorize('ADMIN', 'MANAGER'), async (req, res) => {
    try {
      const { channelId } = req.query;
      const where = {
        managerId: req.user.id,
        status: { not: 'PUBLISHED' } // Только активные
      };
      if (channelId && channelId !== 'all') where.channelId = parseInt(channelId);

      const tasks = await prisma.task.findMany({
        where,
        include: { originalVideo: true, channel: true, creator: true },
        orderBy: { updatedAt: 'desc' },
        take: 100 // Загружаем всё разом
      });
      res.json(tasks);
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  // [CREATOR] Мои текущие задачи (в процессе или на проверке)
  router.get('/my-work', protect, async (req, res) => {
    try {
      const { channelId } = req.query;
      const where = {
        creatorId: req.user.id,
        status: { in: ['IN_PROGRESS', 'REACTION_UPLOADED'] } // То, что еще не в архиве
      };
      if (channelId && channelId !== 'all') where.channelId = parseInt(channelId);

      const tasks = await prisma.task.findMany({
        where,
        include: { originalVideo: true, channel: true },
        orderBy: { updatedAt: 'desc' },
        take: 100
      });
      res.json(tasks);
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  // ==========================================
  // 2. МОДУЛЬ ПРОФИЛЯ (СТАТИСТИКА И ИСТОРИЯ)
  // ==========================================

  // Общая статистика пользователя
  router.get('/user-stats/:userId', protect, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const [totalTasks, publishedCount, pendingCount] = await Promise.all([
        prisma.task.count({ where: { creatorId: userId } }),
        prisma.task.count({ where: { creatorId: userId, status: 'PUBLISHED' } }),
        prisma.task.count({ where: { creatorId: userId, status: 'REACTION_UPLOADED' } })
      ]);
      res.json({ totalTasks, publishedCount, pendingCount });
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  // История выполненных работ с пагинацией (для профиля)
  router.get('/user-history/:userId', protect, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const skip = parseInt(req.query.skip) || 0;
      const take = parseInt(req.query.take) || 10;

      const history = await prisma.task.findMany({
        where: { creatorId: userId, status: 'PUBLISHED' },
        include: { originalVideo: true, channel: true },
        orderBy: { publishedAt: 'desc' },
        skip,
        take
      });
      res.json(history);
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  // ==========================================
  // 3. УПРАВЛЕНИЕ ЗАДАЧАМИ (ACTION ROUTES)
  // ==========================================

  router.post('/bulk', protect, authorize('ADMIN', 'MANAGER'), async (req, res) => {
    const { originalVideoId, tasks } = req.body;

    if (!originalVideoId || !tasks || !Array.isArray(tasks)) {
      return res.status(400).json({ error: "Некорректные данные" });
    }

    try {
      const parsedVideoId = parseInt(originalVideoId);
      const managerId = parseInt(req.user.id);

      // 1. ПРОВЕРКА: Существует ли оригинальное видео?
      const videoExists = await prisma.originalVideo.findUnique({ where: { id: parsedVideoId } });
      if (!videoExists) {
        return res.status(404).json({ error: `Оригинальное видео с ID ${parsedVideoId} не найдено` });
      }

      const createdTasks = [];

      // Используем обычный цикл для надежности и обработки ошибок поштучно
      for (const t of tasks) {
        const cId = t.creatorId ? parseInt(t.creatorId) : null;
        const chanId = parseInt(t.channelId);

        // 2. ПРОВЕРКА: Существует ли креатор (если назначен)?
        if (cId) {
          const userExists = await prisma.user.findUnique({ where: { id: cId } });
          if (!userExists) throw new Error(`Пользователь с ID ${cId} не найден. Перезайдите в аккаунт.`);
        }

        // 3. ПРОВЕРКА: Существует ли канал?
        const channelExists = await prisma.channel.findUnique({ where: { id: chanId } });
        if (!channelExists) throw new Error(`Канал с ID ${chanId} не найден.`);

        const deadlineDate = (t.deadline && !isNaN(new Date(t.deadline).getTime())) ? new Date(t.deadline) : null;
        const scheduledDate = (t.scheduledAt && !isNaN(new Date(t.scheduledAt).getTime())) ? new Date(t.scheduledAt) : null;

        const newTask = await prisma.task.create({
          data: {
            originalVideoId: parsedVideoId,
            channelId: chanId,
            managerId: managerId,
            priority: 'normal',
            creatorId: cId,
            status: cId ? 'IN_PROGRESS' : 'AWAITING_REACTION',
            claimedAt: cId ? new Date() : null,
            deadline: deadlineDate,
            scheduledAt: scheduledDate,
          },
          include: { 
            originalVideo: true, 
            channel: true, 
            creator: { select: { username: true } }, 
            manager: { select: { username: true } } 
          }
        });

        // Оповещаем админа через сокеты
        io.emit('task_updated', newTask);
        createdTasks.push(newTask);
      }

      // 4. Отправка уведомлений креаторам
      for (const task of createdTasks) {
        if (task.creatorId) {
          await prisma.notification.create({
            data: {
              userId: task.creatorId,
              taskId: task.id,
              title: "Новое задание! 🎬",
              message: `Для канала ${task.channel.name} до `,
              type: "TASK_ASSIGNED"
            }
          });
          io.to(`user_${task.creatorId}`).emit('new_notification');
          sendPushNotification(task.creatorId, { title: "Новое задание!", message: task.channel.name });
        }
      }

      res.json({ success: true, count: createdTasks.length });
    } catch (err) {
      console.error("Критическая ошибка /tasks/bulk:", err.message);
      res.status(500).json({ error: err.message || "Ошибка при создании задач" });
    }
  });

  // ==========================================
  // 4. УВЕДОМЛЕНИЯ, ФАЙЛЫ И СИСТЕМА
  // ==========================================

  router.get('/download-file', async (req, res) => {
    const { path: filePath, token, name } = req.query;
    try {
      require('jsonwebtoken').verify(token, process.env.JWT_SECRET);
      const fullPath = path.resolve(process.cwd(), filePath);
      if (!fs.existsSync(fullPath)) return res.status(404).send("File not found");

      const stat = fs.statSync(fullPath);
      const range = req.headers.range;
      res.setHeader('Content-Type', 'video/mp4');
      res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(name || 'video.mp4')}"`);

      if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
        res.writeHead(206, { 'Content-Range': `bytes ${start}-${end}/${stat.size}`, 'Accept-Ranges': 'bytes', 'Content-Length': (end - start) + 1 });
        fs.createReadStream(fullPath, { start, end }).pipe(res);
      } else {
        res.writeHead(200, { 'Content-Length': stat.size });
        fs.createReadStream(fullPath).pipe(res);
      }
    } catch (err) { res.status(401).send("Unauthorized"); }
  });

  // Вспомогательные роуты
  router.get('/alerts-status', protect, async (req, res) => {
    const now = new Date();
    try {
      const my = await prisma.task.count({ where: { creatorId: req.user.id, status: 'IN_PROGRESS', deadline: { lt: now } } });
      res.json({ my: my > 0 });
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  router.post('/:id/upload', protect, upload.single('video'), async (req, res) => {
    try {
      const taskId = parseInt(req.params.id);
      if (!req.file) return res.status(400).json({ error: "Файл не получен" });

      // Объединяем UPDATE и получение всех данных (INCLUDE)
      const fullTask = await prisma.task.update({
        where: { id: taskId },
        data: { 
          status: 'REACTION_UPLOADED', 
          reactionFilePath: req.file.path.replace(/\\/g, '/'), 
          reactionUploadedAt: new Date(), 
          needsFixing: false 
        },
        include: { originalVideo: true, channel: true, creator: true, manager: true }
      });

      // Оповещаем админа (Дашборд)
      io.emit('task_updated', fullTask);

      // Уведомления персоналу
      const staff = await prisma.user.findMany({ 
        where: { role: { in: ['MANAGER', 'ADMIN'] } },
        select: { id: true }
      });

      for (const s of staff) {
        await prisma.notification.create({
          data: {
            userId: s.id,
            taskId: fullTask.id,
            title: "Реакция готова ✅",
            message: `${req.user.username} сдал видео по каналу ${fullTask.channel.name}`,
            type: "REACTION_UPLOADED"
          }
        });
        io.to(`user_${s.id}`).emit('new_notification');
        sendPushNotification(s.id, { title: "Реакция готова ✅", message: fullTask.channel.name });
      }

      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  router.post('/:id/reject', protect, authorize('ADMIN', 'MANAGER'), async (req, res) => {
    try {
      const taskId = parseInt(req.params.id);
      const { reason } = req.body;

      const fullTask = await prisma.task.update({
        where: { id: taskId },
        data: { status: 'IN_PROGRESS', needsFixing: true, rejectionReason: reason },
        include: { creator: true, channel: true, originalVideo: true, manager: true }
      });

      // Оповещаем админа (Дашборд)
      io.emit('task_updated', fullTask);

      if (fullTask.creatorId) {
        await prisma.notification.create({
          data: {
            userId: fullTask.creatorId,
            taskId: fullTask.id,
            title: "Нужны правки ⚠️",
            message: `Канал: ${fullTask.channel.name}. Причина: ${reason}`,
            type: "REVISION_NEEDED"
          }
        });
        io.to(`user_${fullTask.creatorId}`).emit('new_notification');
        sendPushNotification(fullTask.creatorId, { title: "Нужны правки ⚠️", message: reason });
      }

      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/:id/publish', protect, authorize('ADMIN', 'MANAGER'), async (req, res) => {
    try {
      const taskId = parseInt(req.params.id);
      const { youtubeUrl, scheduledAt } = req.body;

      const scheduledDate = (scheduledAt && !isNaN(new Date(scheduledAt).getTime())) ? new Date(scheduledAt) : null;

      const fullTask = await prisma.task.update({
        where: { id: taskId },
        data: { 
          status: 'PUBLISHED', 
          youtubeUrl, 
          scheduledAt: scheduledDate, 
          publishedAt: new Date(), 
          uploaderId: req.user.id 
        },
        include: { originalVideo: true, channel: true, creator: true, manager: true }
      });

      // Оповещаем админа (Дашборд увидит статус PUBLISHED и удалит задачу из списка активных)
      io.emit('task_updated', fullTask);

      if (fullTask.creatorId) {
        await prisma.notification.create({
          data: {
            userId: fullTask.creatorId,
            taskId: fullTask.id,
            title: "Опубликовано! 🎉",
            message: `Видео для канала ${fullTask.channel.name} успешно вышло на YouTube`,
            type: "PUBLISHED"
          }
        });
        io.to(`user_${fullTask.creatorId}`).emit('new_notification');
        sendPushNotification(fullTask.creatorId, { title: "Опубликовано!", message: fullTask.channel.name });
      }

      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.patch('/:id', protect, authorize('ADMIN', 'MANAGER'), async (req, res) => {
    try {
      const { deadline, scheduledAt, creatorId } = req.body;
      
      const data = {
        deadline: deadline ? new Date(deadline) : null,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        creatorId: creatorId ? parseInt(creatorId) : null,
        // Если назначили креатора, статус меняется на "В работе"
        status: creatorId ? 'IN_PROGRESS' : 'AWAITING_REACTION'
      };

      const updatedTask = await prisma.task.update({
        where: { id: parseInt(req.params.id) },
        data: data,
        include: { 
          originalVideo: true, 
          channel: true, 
          creator: { select: { username: true } }, 
          manager: { select: { username: true } } 
        }
      });

      // ОПОВЕЩАЕМ АДМИНА ОБ ИЗМЕНЕНИИ
      io.emit('task_updated', updatedTask);

      res.json(updatedTask);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  router.delete('/:id', protect, authorize('ADMIN', 'MANAGER'), async (req, res) => {
    try { res.json(await prisma.task.delete({ where: { id: parseInt(req.params.id) } })); }
    catch (err) { res.status(500).json({ error: err.message }); }
  });

  return router;
};