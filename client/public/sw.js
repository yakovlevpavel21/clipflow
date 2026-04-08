self.addEventListener('push', function(event) {
  if (!event.data) return;
  const data = event.data.json();

  const options = {
    body: data.message,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: { url: data.url }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const targetUrl = event.notification.data.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(windowClients => {
      // Если сайт уже открыт — просто переходим на нужную страницу
      for (var i = 0; i < windowClients.length; i++) {
        var client = windowClients[i];
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      // Если закрыт — открываем новое окно
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});