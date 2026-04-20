// server/routes/stats.js
const express = require('express');
const router = express.Router();
const prisma = require('../db');
const { protect } = require('../auth');

router.get('/dashboard-summary', protect, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Общие цифры
    const [totalPublished, activeQueue, publishedToday] = await Promise.all([
      prisma.task.count({ where: { status: 'PUBLISHED' } }),
      prisma.task.count({ where: { status: { not: 'PUBLISHED' } } }),
      prisma.task.count({ where: { status: 'PUBLISHED', publishedAt: { gte: today } } })
    ]);

    // 2. Статистика по каналам (Топ-5)
    const channelStats = await prisma.channel.findMany({
      include: {
        _count: {
          select: { tasks: { where: { status: 'PUBLISHED' } } }
        }
      },
      take: 6
    });

    // 3. Последние 5 задач
    const recentTasks = await prisma.task.findMany({
      take: 5,
      orderBy: { updatedAt: 'desc' },
      include: {
        originalVideo: true,
        channel: true,
        creator: { select: { username: true } }
      }
    });

    res.json({
      summary: { totalPublished, activeQueue, publishedToday },
      channels: channelStats.map(c => ({ name: c.name, count: c._count.tasks, thumb: c.thumbnailPath })),
      recentTasks
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/profile-stats/:userId', protect, async (req, res) => {
  const targetId = parseInt(req.params.userId);
  const { month } = req.query; // Формат: "2023-10" или "all"

  try {
    let dateFilter = {};
    if (month && month !== 'all') {
      const [year, m] = month.split('-');
      dateFilter = {
        publishedAt: {
          gte: new Date(year, m - 1, 1),
          lt: new Date(year, m, 1),
        }
      };
    }

    // 1. Информация о пользователе
    const user = await prisma.user.findUnique({
      where: { id: targetId },
      select: { id: true, username: true, role: true, createdAt: true }
    });

    // 2. Статистика как КРЕАТОРА
    const creatorStats = await prisma.task.findMany({
      where: { creatorId: targetId, status: 'PUBLISHED', ...dateFilter },
      include: { channel: true, originalVideo: true }
    });

    // 3. Статистика как МЕНЕДЖЕРА
    const managerStats = await prisma.task.findMany({
      where: { managerId: targetId, status: 'PUBLISHED', ...dateFilter },
      include: { channel: true, originalVideo: true }
    });

    // Хелпер для агрегации по каналам
    const groupByChannel = (data) => {
      const map = {};
      data.forEach(t => {
        const name = t.channel.name;
        map[name] = (map[name] || 0) + 1;
      });
      return Object.entries(map).map(([name, value]) => ({ name, value }));
    };

    // Хелпер для агрегации по дням (для графика)
    const groupByDay = (data) => {
      const map = {};
      data.forEach(t => {
        const day = new Date(t.publishedAt).getDate();
        map[day] = (map[day] || 0) + 1;
      });
      return Object.entries(map)
        .map(([day, count]) => ({ day: parseInt(day), count }))
        .sort((a, b) => a.day - b.day);
    };

    res.json({
      user,
      creator: {
        total: creatorStats.length,
        byChannel: groupByChannel(creatorStats),
        byDay: groupByDay(creatorStats),
        list: creatorStats
      },
      manager: {
        total: managerStats.length,
        byChannel: groupByChannel(managerStats),
        byDay: groupByDay(managerStats),
        list: managerStats
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;