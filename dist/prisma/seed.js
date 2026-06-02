"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('Iniciando el sembrado de datos (Seeding)...');
    await prisma.favorite.deleteMany({});
    await prisma.reply.deleteMany({});
    await prisma.inquiry.deleteMany({});
    await prisma.image.deleteMany({});
    await prisma.car.deleteMany({});
    await prisma.user.deleteMany({});
    const passwordHash = await bcrypt.hash('123', 12);
    const vendor = await prisma.user.create({
        data: {
            nombre: 'Test',
            apellido: 'Vendor',
            dni: '12345678',
            telefono: '+54 351 1234567',
            direccion: 'Av. Colón 1200, Córdoba',
            email: 'admin@vendor',
            passwordHash,
            rol: 'vendedor',
        },
    });
    const client = await prisma.user.create({
        data: {
            nombre: 'Test',
            apellido: 'Client',
            dni: '87654321',
            telefono: '+54 11 7654321',
            direccion: 'Av. Santa Fe 3400, Buenos Aires',
            email: 'admin@client',
            passwordHash,
            rol: 'comprador',
        },
    });
    console.log('Usuarios creados con éxito:');
    console.log(`- Vendedor: ${vendor.email}`);
    console.log(`- Comprador: ${client.email}`);
    const initialCars = [
        {
            brand: 'Volkswagen',
            model: 'Golf GTI',
            year: 2022,
            price: 35000,
            km: 15000,
            bodyType: 'Hatchback',
            location: 'Córdoba',
            transmission: 'Automática',
            fuel: 'Nafta',
            description: 'Impecable estado, todos los services oficiales. Cubiertas nuevas.',
            images: [
                'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=1200',
            ],
            aiStatus: 'Excelente estado',
            aiDamages: 'Ninguno visible',
            aiPriceMin: 32000,
            aiPriceMax: 37500,
        },
        {
            brand: 'Toyota',
            model: 'SW4',
            year: 2023,
            price: 55000,
            km: 5000,
            bodyType: 'SUV',
            location: 'Buenos Aires',
            transmission: 'Automática',
            fuel: 'Diesel',
            description: 'Versión SRX de 7 asientos. Auxilio sin rodar.',
            images: [
                'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=1200',
            ],
            aiStatus: 'Excelente estado',
            aiDamages: 'Ninguno visible',
            aiPriceMin: 51000,
            aiPriceMax: 59000,
        },
        {
            brand: 'Peugeot',
            model: '208',
            year: 2021,
            price: 18000,
            km: 30000,
            bodyType: 'Hatchback',
            location: 'Rosario',
            transmission: 'Manual',
            fuel: 'Nafta',
            description: 'Techo panorámico, pantalla con Apple CarPlay.',
            images: [
                'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=1200',
            ],
            aiStatus: 'Buen estado',
            aiDamages: 'Micro rayones en el paragolpes delantero',
            aiPriceMin: 16000,
            aiPriceMax: 19500,
        },
        {
            brand: 'Toyota',
            model: 'Hilux',
            year: 2024,
            price: 62000,
            km: 0,
            bodyType: 'Pickup',
            location: 'Córdoba',
            transmission: 'Manual',
            fuel: 'Diesel',
            description: 'Unidad 0km lista para patentar.',
            images: [
                'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=1200',
            ],
            aiStatus: 'Excelente estado',
            aiDamages: 'Ninguno visible',
            aiPriceMin: 58000,
            aiPriceMax: 65000,
        },
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
//# sourceMappingURL=seed.js.map