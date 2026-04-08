// server/push.js
const webpush = require('web-push');
const prisma = require('./db');

// Инициализация (убедись, что переменные есть в .env)
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_EMAIL || 'mailto:admin@clipsio.ru',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

const sendPushNotification = async (userId, payload) => {
  if (!process.env.VAPID_PUBLIC_KEY) return;

  try {
    // 1. Находим ВСЕ подписки пользователя
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId: parseInt(userId) }
    });

    if (subscriptions.length === 0) return;

    // 2. Отправляем на все устройства параллельно
    const pushPromises = subscriptions.map(sub => {
      const pushConfig = {
        endpoint: sub.endpoint,
        keys: { auth: sub.auth, p256dh: sub.p256dh }
      };

      return webpush.sendNotification(pushConfig, JSON.stringify(payload))
        .catch(async (err) => {
          console.error(`[Push Error] Устройство: ${sub.id} | Код: ${err.statusCode} | Сообщение: ${err.message}`);
          
          if (err.statusCode === 410 || err.statusCode === 404) {
            console.log(`[Push] Удаление неактивной подписки: ${sub.id}`);
            await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
          }
        });
    });

    await Promise.all(pushPromises);
  } catch (err) {
    console.error("[Push] Критическая ошибка рассылки:", err.message);
  }
};

module.exports = { sendPushNotification };