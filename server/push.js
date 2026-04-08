// server/push.js
const webpush = require('web-push');
const prisma = require('./db');

webpush.setVapidDetails(
  process.env.VAPID_EMAIL,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_EMAIL || 'mailto:admin@clipsio.ru',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
  console.log("✅ Web Push инициализирован");
} else {
  console.log("⚠️ Web Push не настроен (пропустите это, если не используете пуши)");
}

const sendPushNotification = async (userId, payload) => {
  console.log(`[Push] Пытаюсь отправить уведомление пользователю ${userId}`);
  
  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId: parseInt(userId) }
  });

  console.log(`[Push] Найдено подписок для юзера: ${subscriptions.length}`);

  const notifications = subscriptions.map(sub => {
    const pushConfig = {
      endpoint: sub.endpoint,
      keys: { auth: sub.auth, p256dh: sub.p256dh }
    };

    return webpush.sendNotification(pushConfig, JSON.stringify(payload))
      .then(() => console.log(`[Push] Успешно отправлено на ${sub.endpoint.slice(0, 30)}...`))
      .catch(err => {
        console.error("[Push] Ошибка при отправке конкретному устройству:", err.message);
        if (err.statusCode === 410) {
          return prisma.pushSubscription.delete({ where: { id: sub.id } });
        }
      });
  });

  await Promise.all(notifications);
};

module.exports = { sendPushNotification };