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

@Injectable()
export class CarsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Transforma un objeto Car de Prisma al formato exacto que espera el frontend.
   * El frontend usa: id, brand, model, year, price, km, image, images,
   * fuel, transmission, location, bodyType, description.
   */
  private formatCar(car: any) {
    const imageUrls = car.images?.map((img: any) => img.url) || [];
    const primaryImage =
      car.images?.find((img: any) => img.isPrimary)?.url ||
      imageUrls[0] ||
      null;

    return {
      id: car.id,
      brand: car.brand,
      model: car.model,
      year: car.year,
      price: car.price,
      km: car.km,
      bodyType: car.bodyType,
      location: car.location,
      transmission: car.transmission,
      fuel: car.fuel,
      description: car.description,
      image: primaryImage,
      images: imageUrls,
      // Datos de IA
      aiStatus: car.aiStatus,
      aiDamages: car.aiDamages,
      aiPriceMin: car.aiPriceMin,
      aiPriceMax: car.aiPriceMax,
      // Analytics
      views: car.views,
      contacts: car.contacts,
      // Info del vendedor
      sellerId: car.sellerId,
      sellerEmail: car.seller?.email,
      sellerName: car.seller ? `${car.seller.nombre} ${car.seller.apellido}` : null,
      createdAt: car.createdAt,
    };
  }

  /**
   * GET /api/cars
   * Devuelve todos los vehículos activos con filtros opcionales.
   * Soporta: brand, model, location, year, price, km, fuel, transmission, bodyType
   */
  async findAll(filters: FilterCarsDto) {
    const where: any = { isActive: true };

    // Filtro por vendedor específico
    if (filters.sellerId) {
      where.sellerId = parseInt(filters.sellerId);
    }

    // Filtros de texto (búsqueda parcial, insensible a mayúsculas)
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

    // Filtros de rango numérico
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

    // Filtros de categoría (ignorar si es "all")
    if (filters.body && filters.body !== 'all') {
      where.bodyType = { contains: filters.body, mode: 'insensitive' };
    }

    if (filters.fuel && filters.fuel !== 'all') {
      where.fuel = { contains: filters.fuel, mode: 'insensitive' };
    }

    if (filters.transmission && filters.transmission !== 'all') {
      where.transmission = { contains: filters.transmission, mode: 'insensitive' };
    }

    const cars = await this.prisma.car.findMany({
      where,
      include: {
        images: { orderBy: { isPrimary: 'desc' } },
        seller: {
          select: { email: true, nombre: true, apellido: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return cars.map((car) => this.formatCar(car));
  }

  /**
   * GET /api/cars/:id
   * Devuelve el detalle completo de un vehículo y registra la visita.
   */
  async findOne(id: number) {
    const car = await this.prisma.car.findFirst({
      where: { id, isActive: true },
      include: {
        images: { orderBy: { isPrimary: 'desc' } },
        seller: {
          select: { email: true, nombre: true, apellido: true, telefono: true },
        },
      },
    });

    if (!car) {
      throw new NotFoundException(`Vehículo con ID ${id} no encontrado.`);
    }

    // Registrar visita (equivalente a trackMetric del frontend)
    await this.prisma.car.update({
      where: { id },
      data: { views: { increment: 1 } },
    });

    return this.formatCar(car);
  }

  /**
   * POST /api/cars
   * Crea una nueva publicación de vehículo. Solo para vendedores.
   */
  async create(dto: CreateCarDto, sellerId: number) {
    const car = await this.prisma.car.create({
      data: {
        brand: dto.brand,
        model: dto.model,
        year: dto.year,
        price: dto.price,
        km: dto.km,
        fuel: dto.fuel,
        transmission: dto.transmission,
        location: dto.location,
        description: dto.description,
        bodyType: dto.bodyType || 'Sedán',
        aiStatus: dto.aiStatus,
        aiDamages: dto.aiDamages,
        aiPriceMin: dto.aiPriceMin,
        aiPriceMax: dto.aiPriceMax,
        sellerId,
        // Crear registros de imagen asociados
        images: dto.images?.length
          ? {
              create: dto.images.map((url, index) => ({
                url,
                filename: url.split('/').pop() || url,
                isPrimary: index === 0,
              })),
            }
          : undefined,
      },
      include: {
        images: true,
        seller: { select: { email: true, nombre: true, apellido: true } },
      },
    });

    return this.formatCar(car);
  }

  /**
   * PUT /api/cars/:id
   * Actualiza una publicación. Solo puede hacerlo el vendedor dueño.
   */
  async update(id: number, dto: UpdateCarDto, userId: number) {
    const car = await this.prisma.car.findUnique({ where: { id } });

    if (!car) {
      throw new NotFoundException(`Vehículo con ID ${id} no encontrado.`);
    }

    if (car.sellerId !== userId) {
      throw new ForbiddenException(
        'No tenés permiso para editar este vehículo.',
      );
    }

    // Si se envían nuevas imágenes, eliminar las anteriores y crear las nuevas
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
        description: dto.description,
        bodyType: dto.bodyType,
        aiStatus: dto.aiStatus,
        aiDamages: dto.aiDamages,
        aiPriceMin: dto.aiPriceMin,
        aiPriceMax: dto.aiPriceMax,
        images: Object.keys(imageOperations).length ? imageOperations : undefined,
      },
      include: {
        images: { orderBy: { isPrimary: 'desc' } },
        seller: { select: { email: true, nombre: true, apellido: true } },
      },
    });

    return this.formatCar(updatedCar);
  }

  /**
   * DELETE /api/cars/:id
   * Soft delete: marca el vehículo como inactivo. Solo el dueño puede hacerlo.
   */
  async remove(id: number, userId: number) {
    const car = await this.prisma.car.findUnique({ where: { id } });

    if (!car) {
      throw new NotFoundException(`Vehículo con ID ${id} no encontrado.`);
    }

    if (car.sellerId !== userId) {
      throw new ForbiddenException(
        'No tenés permiso para eliminar este vehículo.',
      );
    }

    await this.prisma.car.update({
      where: { id },
      data: { isActive: false },
    });

    return { success: true, message: 'Vehículo eliminado correctamente.' };
  }
}
