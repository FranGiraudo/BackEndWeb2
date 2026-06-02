const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const cars = await prisma.car.findMany();
  const users = await prisma.user.findMany();
  console.log('--- CARS IN RAILWAY DB ---');
  console.log(cars.map(c => ({ id: c.id, model: c.model, sellerId: c.sellerId })));
  console.log('--- USERS IN RAILWAY DB ---');
  console.log(users.map(u => ({ id: u.id, email: u.email })));
}
main().finally(() => prisma.$disconnect());
