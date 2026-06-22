// src/cars/cars.service.ts
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCarDto } from './dto/create-car.dto';
import { UpdateCarDto } from './dto/update-car.dto';
import { FilterCarsDto } from './dto/filter-cars.dto';
import { formatCar } from './car.formatter';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class CarsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService
  ) {}

  /**
   * GET /api/cars
   * Devuelve todos los vehículos activos con filtros opcionales.
   */
  async findAll(filters: FilterCarsDto) {
    const where: any = { isActive: true };

    if (filters.sellerId) {
      where.sellerId = parseInt(filters.sellerId);
    }

    if (filters.search) {
      where.OR = [
        { brand: { contains: filters.search, mode: 'insensitive' } },
        { model: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.brand) {
      where.brand = { contains: filters.brand, mode: 'insensitive' };
    }

    if (filters.model) {
      where.model = { contains: filters.model, mode: 'insensitive' };
    }

    if (filters.location) {
      where.location = { contains: filters.location, mode: 'insensitive' };
    }

    if (filters.yearMin || filters.yearMax) {
      where.year = {};
      if (filters.yearMin) where.year.gte = parseInt(filters.yearMin);
      if (filters.yearMax) where.year.lte = parseInt(filters.yearMax);
    }

    if (filters.priceMin || filters.priceMax) {
      where.price = {};
      if (filters.priceMin) where.price.gte = parseFloat(filters.priceMin);
      if (filters.priceMax) where.price.lte = parseFloat(filters.priceMax);
    }

    if (filters.kmMin || filters.kmMax) {
      where.km = {};
      if (filters.kmMin) where.km.gte = parseInt(filters.kmMin);
      if (filters.kmMax) where.km.lte = parseInt(filters.kmMax);
    }

    if (filters.body && filters.body !== 'all') {
      where.bodyType = { contains: filters.body, mode: 'insensitive' };
    }

    if (filters.fuel && filters.fuel !== 'all') {
      where.fuel = { contains: filters.fuel, mode: 'insensitive' };
    }

    if (filters.transmission && filters.transmission !== 'all') {
      where.transmission = {
        contains: filters.transmission,
        mode: 'insensitive',
      };
    }

    const cars = await this.prisma.car.findMany({
      where,
      include: {
        images: { orderBy: { isPrimary: 'desc' } },
        seller: { select: { email: true, nombre: true, apellido: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return cars.map(formatCar);
  }

  /**
   * Devuelve los vehículos de un vendedor con sus logs de vistas históricos.
   */
  async findMyCars(sellerId: number) {
    const cars = await this.prisma.car.findMany({
      where: { sellerId: parseInt(sellerId as any), isActive: true },
      include: {
        images: { orderBy: { isPrimary: 'desc' } },
        viewLogs: { orderBy: { date: 'asc' } },
        seller: { select: { email: true, nombre: true, apellido: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return cars.map(car => ({
      ...formatCar(car),
      viewLogs: car.viewLogs
    }));
  }

  /**
   * GET /api/cars/trending
   * Devuelve los 10 vehículos más vistos.
   */
  async getTrending() {
    const cars = await this.prisma.car.findMany({
      where: { isActive: true },
      include: {
        images: { orderBy: { isPrimary: 'desc' } },
        seller: { select: { email: true, nombre: true, apellido: true } },
      },
      orderBy: { viewCount: 'desc' },
      take: 10,
    });
    return cars.map(formatCar);
  }

  /**
   * GET /api/cars/:id
   * Devuelve el detalle de un vehículo y registra la visita.
   */
  async findOne(id: number) {
    const car = await this.prisma.car.findFirst({
      where: { id, isActive: true },
      include: {
        auction: true,
        images: { orderBy: { isPrimary: 'desc' } },
        seller: {
          select: {
            id: true,
            email: true,
            nombre: true,
            apellido: true,
            
            avatarUrl: true,
          },
        },
      },
    });

    if (!car) {
      throw new NotFoundException(`Vehículo con ID ${id} no encontrado.`);
    }

    const reviewAgg = await this.prisma.review.aggregate({
      where: { vendorId: car.seller.id },
      _avg: { score: true },
      _count: { score: true },
    });

    const totalReviews = reviewAgg._count.score;
    const ratingAverage = reviewAgg._avg.score ? Number(reviewAgg._avg.score.toFixed(1)) : 0;
    
    // Logica Top Vendedor
    const isTopVendedor = ratingAverage > 4.5 && totalReviews >= 10;

    const today = new Date(new Date().toISOString().split('T')[0]);

    await this.prisma.$transaction([
      this.prisma.car.update({
        where: { id },
        data: { viewCount: { increment: 1 } },
      }),
      this.prisma.carViewLog.upsert({
        where: { carId_date: { carId: id, date: today } },
        update: { views: { increment: 1 } },
        create: { carId: id, date: today, views: 1 },
      })
    ]);

    const formattedCar = formatCar(car);

    return {
      ...formattedCar,
      vendor: {
        name: `${car.seller.nombre} ${car.seller.apellido}`.trim(),
        profilePicture: car.seller.avatarUrl || `https://ui-avatars.com/api/?name=${car.seller.nombre}+${car.seller.apellido}&background=random&color=fff`,
        ratingAverage,
        totalReviews,
        isTopVendedor,
        rankingPosition: isTopVendedor ? 1 : null,
      } as {
        name: string;
        profilePicture: string;
        ratingAverage: number;
        totalReviews: number;
        isTopVendedor: boolean;
        rankingPosition: number | null;
      }
    };
  }

  /**
   * POST /api/cars
   * Crea una nueva publicación. Solo para vendedores.
   */
  async create(dto: CreateCarDto, sellerId: number) {
    const carData = {
      brand: dto.brand,
      model: dto.model,
      year: dto.year,
      price: dto.price,
      km: dto.km,
      fuel: dto.fuel,
      transmission: dto.transmission,
      location: dto.location,
      locationName: dto.locationName,
      latitude: dto.latitude,
      longitude: dto.longitude,
      description: dto.description,
      color: dto.color,
      doors: dto.doors,
      engine: dto.engine,
      status: dto.status || 'Disponible',
      bodyType: dto.bodyType || 'Sedán',
      aiStatus: dto.aiStatus,
      aiDamages: dto.aiDamages,
      aiPriceMin: dto.aiPriceMin,
      aiPriceMax: dto.aiPriceMax,
      aiScore: dto.aiScore,
      sellerId,
      images: dto.images?.length
        ? {
            create: dto.images.map((url, index) => ({
              url,
              filename: url.split('/').pop() || url,
              isPrimary: index === 0,
            })),
          }
        : undefined,
    };

    if (dto.isAuction && dto.auctionStartingPrice && dto.auctionDurationDays) {
      // Usar transacción para crear auto + subasta
      return await this.prisma.$transaction(async (tx) => {
        const car = await tx.car.create({
          data: carData,
          include: {
            images: true,
            seller: { select: { email: true, nombre: true, apellido: true } },
          },
        });

        const endsAt = new Date();
        endsAt.setTime(endsAt.getTime() + dto.auctionDurationDays! * 24 * 60 * 60 * 1000);

        await tx.auction.create({
          data: {
            carId: car.id,
            startingPrice: dto.auctionStartingPrice!,
            currentPrice: dto.auctionStartingPrice!,
            endsAt,
            isActive: true,
          },
        });

        // Refetch con auction
        const finalCar = await tx.car.findUnique({
          where: { id: car.id },
          include: {
            auction: true,
            images: true,
            seller: { select: { email: true, nombre: true, apellido: true } },
          },
        });
        return formatCar(finalCar);
      });
    }

    // Creación normal
    const car = await this.prisma.car.create({
      data: carData,
      include: {
        images: true,
        seller: { select: { email: true, nombre: true, apellido: true } },
      },
    });

    return formatCar(car);
  }

  /**
   * PUT /api/cars/:id
   * Actualiza una publicación activa. Solo puede hacerlo el vendedor dueño.
   */
  async update(id: number, dto: UpdateCarDto, userId: number) {
    // Solo permite editar autos activos — evita modificar un soft-deleted
    const car = await this.prisma.car.findFirst({
      where: { id, isActive: true },
    });

    if (!car) {
      throw new NotFoundException(`Vehículo con ID ${id} no encontrado.`);
    }

    if (car.sellerId !== userId) {
      throw new ForbiddenException('No tenés permiso para editar este vehículo.');
    }

    if (dto.price && dto.price < car.price) {
      await this.notificationsService.notifyPriceDrop(
        id, 
        car.price, 
        dto.price, 
        `${car.brand} ${car.model}`
      );
    }

    const imageOperations: any = {};
    if (dto.images !== undefined) {
      imageOperations.deleteMany = {};
      imageOperations.create = dto.images.map((url, index) => ({
        url,
        filename: url.split('/').pop() || url,
        isPrimary: index === 0,
      }));
    }

    const updatedCar = await this.prisma.car.update({
      where: { id },
      data: {
        brand: dto.brand,
        model: dto.model,
        year: dto.year,
        price: dto.price,
        km: dto.km,
        fuel: dto.fuel,
        transmission: dto.transmission,
        location: dto.location,
        locationName: dto.locationName,
        latitude: dto.latitude,
        longitude: dto.longitude,
        description: dto.description,
        color: dto.color,
        doors: dto.doors,
        engine: dto.engine,
        status: dto.status,
        bodyType: dto.bodyType,
        aiStatus: dto.aiStatus,
        aiDamages: dto.aiDamages,
        aiPriceMin: dto.aiPriceMin,
        aiPriceMax: dto.aiPriceMax,
        aiScore: dto.aiScore,
        images: Object.keys(imageOperations).length
          ? imageOperations
          : undefined,
      },
      include: {
        images: { orderBy: { isPrimary: 'desc' } },
        seller: { select: { email: true, nombre: true, apellido: true } },
      },
    });

    return formatCar(updatedCar);
  }

  /**
   * DELETE /api/cars/:id
   * Soft delete: marca el vehículo como inactivo. Solo el dueño puede hacerlo.
   */
  async remove(id: number, userId: number) {
    const car = await this.prisma.car.findFirst({
      where: { id, isActive: true },
    });

    if (!car) {
      throw new NotFoundException(`Vehículo con ID ${id} no encontrado.`);
    }

    if (car.sellerId !== userId) {
      throw new ForbiddenException(
        'No podés eliminar una publicación que no es tuya.',
      );
    }

    await this.prisma.car.update({
      where: { id },
      data: { isActive: false },
    });

    return { success: true, message: 'Publicación eliminada correctamente.' };
  }

  async updateStatus(id: number, status: string, userId: number) {
    const car = await this.prisma.car.findFirst({
      where: { id, isActive: true },
    });

    if (!car) throw new NotFoundException(`Vehículo no encontrado.`);
    if (car.sellerId !== userId) throw new ForbiddenException('No autorizado.');

    await this.prisma.car.update({
      where: { id },
      data: { status },
    });

    return { success: true, message: `Estado actualizado a ${status}` };
  }
}
