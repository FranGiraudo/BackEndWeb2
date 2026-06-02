const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.car.findMany().then(c => console.log(c.map(x => ({id: x.id, sellerId: x.sellerId})))).catch(console.error).finally(() => prisma.$disconnect());
