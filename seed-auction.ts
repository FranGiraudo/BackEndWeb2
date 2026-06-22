import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const car = await prisma.car.findFirst({
    where: { isActive: true, auction: null },
  });

  if (!car) {
    console.log('No se encontraron autos disponibles para subastar.');
    return;
  }

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const auction = await prisma.auction.create({
    data: {
      carId: car.id,
      startingPrice: Math.floor(car.price * 0.8), // Empieza al 80% del valor original
      currentPrice: Math.floor(car.price * 0.8),
      endsAt: tomorrow,
      isActive: true,
    },
  });

  console.log(`¡Éxito! El auto con ID ${car.id} (${car.brand} ${car.model}) ahora está en subasta.`);
  console.log('Detalles de la subasta:', auction);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
