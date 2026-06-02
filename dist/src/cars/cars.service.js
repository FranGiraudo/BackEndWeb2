"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CarsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let CarsService = class CarsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    formatCar(car) {
        const imageUrls = car.images?.map((img) => img.url) || [];
        const primaryImage = car.images?.find((img) => img.isPrimary)?.url ||
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
            aiStatus: car.aiStatus,
            aiDamages: car.aiDamages,
            aiPriceMin: car.aiPriceMin,
            aiPriceMax: car.aiPriceMax,
            views: car.views,
            contacts: car.contacts,
            sellerId: car.sellerId,
            sellerEmail: car.seller?.email,
            sellerName: car.seller ? `${car.seller.nombre} ${car.seller.apellido}` : null,
            createdAt: car.createdAt,
        };
    }
    async findAll(filters) {
        const where = { isActive: true };
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
            if (filters.yearMin)
                where.year.gte = parseInt(filters.yearMin);
            if (filters.yearMax)
                where.year.lte = parseInt(filters.yearMax);
        }
        if (filters.priceMin || filters.priceMax) {
            where.price = {};
            if (filters.priceMin)
                where.price.gte = parseFloat(filters.priceMin);
            if (filters.priceMax)
                where.price.lte = parseFloat(filters.priceMax);
        }
        if (filters.kmMin || filters.kmMax) {
            where.km = {};
            if (filters.kmMin)
                where.km.gte = parseInt(filters.kmMin);
            if (filters.kmMax)
                where.km.lte = parseInt(filters.kmMax);
        }
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
    async findOne(id) {
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
            throw new common_1.NotFoundException(`Vehículo con ID ${id} no encontrado.`);
        }
        await this.prisma.car.update({
            where: { id },
            data: { views: { increment: 1 } },
        });
        return this.formatCar(car);
    }
    async create(dto, sellerId) {
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
    async update(id, dto, userId) {
        const car = await this.prisma.car.findUnique({ where: { id } });
        if (!car) {
            throw new common_1.NotFoundException(`Vehículo con ID ${id} no encontrado.`);
        }
        if (car.sellerId !== userId) {
            throw new common_1.ForbiddenException('No tenés permiso para editar este vehículo.');
        }
        const imageOperations = {};
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
    async remove(id, userId) {
        const car = await this.prisma.car.findUnique({ where: { id } });
        if (!car) {
            throw new common_1.NotFoundException(`Vehículo con ID ${id} no encontrado.`);
        }
        if (car.sellerId !== userId) {
            throw new common_1.ForbiddenException('No tenés permiso para eliminar este vehículo.');
        }
        await this.prisma.car.update({
            where: { id },
            data: { isActive: false },
        });
        return { success: true, message: 'Vehículo eliminado correctamente.' };
    }
};
exports.CarsService = CarsService;
exports.CarsService = CarsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CarsService);
//# sourceMappingURL=cars.service.js.map