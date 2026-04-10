// server/routes/admin.js
const express = require('express');
const router = express.Router();
const prisma = require('../db');
const { protect, authorize } = require('../auth');

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
    const channel = await prisma.channel.create({ 
      data: { 
        name: req.body.name,
        showOriginalLink: true,
        titlePrefix: "",
        descriptionFooter: "",
        originalLinkPrefix: "CREDIT - "
      } 
    });
    res.json(channel);
  } catch (err) { res.status(500).json({ error: "Ошибка создания канала" }); }
});

router.patch('/channels/:id', async (req, res) => {
  try {
    const channel = await prisma.channel.update({
      where: { id: parseInt(req.params.id) },
      data: req.body
    });
    res.json(channel);
  } catch (err) { res.status(500).json({ error: "Ошибка обновления канала" }); }
});

router.delete('/channels/:id', async (req, res) => {
  try {
    await prisma.channel.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: "Ошибка удаления" }); }
});

// --- НАСТРОЙКИ (PROXY & TELEGRAM) ---

router.get('/settings', async (req, res) => {
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