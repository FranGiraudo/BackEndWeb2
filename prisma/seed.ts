// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando el sembrado de datos (Seeding)...');

  // Limpiar tablas para evitar duplicados
  await prisma.favorite.deleteMany({});
  await prisma.reply.deleteMany({});
  await prisma.inquiry.deleteMany({});
  await prisma.image.deleteMany({});
  await prisma.car.deleteMany({});
  await prisma.user.deleteMany({});

  // Crear contraseñas hasheadas
  const passwordHash = await bcrypt.hash('123', 12);

  // 1. Crear usuarios
  const vendor = await prisma.user.create({
    data: {
      nombre: 'Ventas',
      apellido: 'SmartAuto',
      email: 'ventas@smartauto.com.ar',
      password: passwordHash,
      role: 'vendedor',
    },
  });

  const client = await prisma.user.create({
    data: {
      nombre: 'Lucas',
      apellido: 'Perez',
      email: 'lucas.perez@gmail.com',
      password: passwordHash,
      role: 'comprador',
    },
  });

  console.log('Usuarios creados con éxito:');
  console.log(`- Vendedor: ${vendor.email}`);
  console.log(`- Comprador: ${client.email}`);

  // 2. Autos iniciales (equivalentes a Mercado Libre Argentina)
  const initialCars = [
    {
      brand: 'Volkswagen',
      model: 'Amarok',
      year: 2023,
      price: 45000,
      km: 15000,
      bodyType: 'Pickup',
      location: 'Córdoba Capital',
      transmission: 'Automática',
      fuel: 'Diesel',
      engine: '3.0 V6 Extreme',
      description: 'Amarok V6 Extreme impecable. Único dueño, servicios oficiales. En garantía. Posee lona marítima y estribos.',
      images: [
        'https://images.unsplash.com/photo-1559416523-140ddc3d238c?w=1200',
        'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=1200'
      ],
      aiStatus: 'Excelente estado',
      aiDamages: 'Ninguno visible',
      aiPriceMin: 43000,
      aiPriceMax: 47000,
      aiScore: 95
    },
    {
      brand: 'Toyota',
      model: 'Corolla Cross',
      year: 2022,
      price: 32000,
      km: 25000,
      bodyType: 'SUV',
      location: 'Rosario, Santa Fe',
      transmission: 'Automática',
      fuel: 'Híbrido',
      engine: '1.8 XRX Hybrid',
      description: 'Versión tope de gama híbrida. Consumo bajísimo en ciudad. Techo corredizo, tapizado de cuero, asistencias a la conducción (TSS).',
      images: [
        'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=1200',
      ],
      aiStatus: 'Muy buen estado',
      aiDamages: 'Mínimo raspón en llanta delantera derecha',
      aiPriceMin: 30000,
      aiPriceMax: 33500,
      aiScore: 92
    },
    {
      brand: 'Peugeot',
      model: '208',
      year: 2021,
      price: 18500,
      km: 35000,
      bodyType: 'Hatchback',
      location: 'CABA, Buenos Aires',
      transmission: 'Manual',
      fuel: 'Nafta',
      engine: '1.6 Feline Tiptronic',
      description: 'Versión Feline 1.6 con tablero i-Cockpit 3D. Techo panorámico, luces Full LED. Papeles al día, listo para transferir.',
      images: [
        'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=1200',
      ],
      aiStatus: 'Buen estado',
      aiDamages: 'Detalles leves en paragolpes trasero',
      aiPriceMin: 17500,
      aiPriceMax: 19500,
      aiScore: 88
    },
    {
      brand: 'Ford',
      model: 'Ranger Raptor',
      year: 2024,
      price: 78000,
      km: 500,
      bodyType: 'Pickup',
      location: 'Mendoza',
      transmission: 'Automática',
      fuel: 'Nafta',
      engine: '3.0 V6 Bi-Turbo',
      description: 'Ranger Raptor V6 nueva generación. Prácticamente 0km. 397 CV de potencia, suspensión Fox Racing. Oportunidad.',
      images: [
        'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=1200',
      ],
      aiStatus: 'Igual a 0km',
      aiDamages: 'Ninguno',
      aiPriceMin: 75000,
      aiPriceMax: 82000,
      aiScore: 99
    },
    {
      brand: 'Chevrolet',
      model: 'Cruze',
      year: 2020,
      price: 19000,
      km: 45000,
      bodyType: 'Sedán',
      location: 'La Plata, Buenos Aires',
      transmission: 'Automática',
      fuel: 'Nafta',
      engine: '1.4 Turbo Premier',
      description: 'Cruze Premier línea nueva. Motor 1.4T 153cv. Asistencia de estacionamiento, alerta de punto ciego y colisión frontal. Impecable.',
      images: [
        'https://images.unsplash.com/photo-1550355291-bbee04a92027?w=1200',
      ],
      aiStatus: 'Muy buen estado',
      aiDamages: 'Desgaste normal de interior',
      aiPriceMin: 18000,
      aiPriceMax: 20500,
      aiScore: 90
    }
  ];

  for (const carData of initialCars) {
    const { images, ...carInfo } = carData;

    const car = await prisma.car.create({
      data: {
        ...carInfo,
        sellerId: vendor.id,
        isActive: true,
        images: {
          create: images.map((url, index) => ({
            url,
            filename: url.split('/').pop() || 'image',
            isPrimary: index === 0,
          })),
        },
      },
    });
    console.log(`Vehículo creado: ${car.brand} ${car.model} (ID: ${car.id})`);
  }

  console.log('Seeding completado con éxito!');
}

main()
  .catch((e) => {
    console.error('Error al realizar el seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
