import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  
  for (const user of users) {
    await prisma.notification.create({
      data: {
        userId: user.id,
        title: '¡Bienvenido al sistema de notificaciones!',
        message: 'Esta es una notificación de prueba para ver cómo se ve el panel.',
        type: 'NEW_INQUIRY',
        isRead: false
      }
    });
    console.log(`Notificación creada para usuario ${user.id} (${user.email})`);
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
