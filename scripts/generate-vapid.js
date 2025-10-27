// Script para generar claves VAPID
const webpush = require('web-push');

console.log('Generando claves VAPID...\n');

const vapidKeys = webpush.generateVAPIDKeys();

console.log('Claves VAPID generadas exitosamente:\n');
console.log('NEXT_PUBLIC_VAPID_PUBLIC_KEY=' + vapidKeys.publicKey);
console.log('VAPID_PRIVATE_KEY=' + vapidKeys.privateKey);
console.log('\nCopia estas claves a tu archivo .env');
console.log('No compartas la clave privada!');
