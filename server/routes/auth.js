// server/routes/auth.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const prisma = require('../db');
const { protect } = require('../auth');

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user || user.password !== password) {
      return res.status(401).json({ error: 'Неверный логин или пароль' });
    }
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );
    res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.post('/subscribe', protect, async (req, res) => {
  const sub = req.body; // Это весь объект подписки

  // Лог для проверки: видишь ли ты данные в терминале сервера?
  console.log("Получена подписка от юзера:", req.user.id, sub);

  if (!sub.endpoint || !sub.keys) {
    return res.status(400).json({ error: "Неверный формат подписки" });
  }

  try {
    await prisma.pushSubscription.upsert({
      where: { endpoint: sub.endpoint },
      update: { 
        userId: req.user.id, 
        p256dh: sub.keys.p256dh, 
        auth: sub.keys.auth 
      },
      create: { 
        endpoint: sub.endpoint, 
        p256dh: sub.keys.p256dh, 
        auth: sub.keys.auth, 
        userId: req.user.id 
      }
    });
    res.status(201).json({ success: true });
  } catch (err) {
    console.error("Ошибка сохранения подписки в БД:", err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;