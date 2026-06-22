import { Test, TestingModule } from '@nestjs/testing';
import { CarsService } from './cars.service';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { NotificationsService } from '../notifications/notifications.service';
import { BadRequestException } from '@nestjs/common';

describe('CarsService', () => {
  let service: CarsService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CarsService,
        {
          provide: PrismaService,
          useValue: {
            car: {
              create: jest.fn(),
              findMany: jest.fn(),
            },
            historyPrice: {
              create: jest.fn(),
            }
          },
        },
        {
          provide: AiService,
          useValue: {},
        },
        {
          provide: NotificationsService,
          useValue: {
            createNotification: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CarsService>(CarsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('debe crear un vehículo con datos correctos', async () => {
      const createDto = {
        brand: 'Ford',
        model: 'Fiesta',
        year: 2018,
        km: 50000,
        price: 10000,
        color: 'Rojo',
        doors: 5,
        engine: '1.6',
        bodyType: 'Hatchback',
        location: 'CABA',
        images: ['img1.jpg'],
      };

      const mockCar = { id: 1, ...createDto, status: 'Disponible', sellerId: 1 };
      
      jest.spyOn(prisma.car, 'create').mockResolvedValue(mockCar as any);

      const result = await service.create(createDto as any, 1);

      expect(prisma.car.create).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });
});
