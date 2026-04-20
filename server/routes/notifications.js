const express = require('express');
const router = express.Router();
const prisma = require('../db');
const { protect } = require('../auth');

module.exports = (io) => {
  // Получение настроек
  router.get('/preferences', protect, async (req, res) => {
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

  // Сохранение настроек
  router.patch('/preferences', protect, async (req, res) => {
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

  // Получение списка уведомлений
  router.get('/', protect, async (req, res) => {
    const skip = parseInt(req.query.skip) || 0;
    const take = parseInt(req.query.take) || 20;
    try {
      const userId = parseInt(req.user.id);
      const notifications = await prisma.notification.findMany({
        where: { userId },
        include: { task: { select: { status: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take
      });
      res.json(notifications);
    } catch (err) {
      res.status(500).json({ error: "Ошибка сервера" });
    }
  });

  // Пометить всё прочитанным
  router.post('/read-all', protect, async (req, res) => {
    try {
      const userId = parseInt(req.user.id);
      await prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true }
      });
      io.to(`user_${userId}`).emit('new_notification'); 
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  return router;
};