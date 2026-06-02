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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImagesController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const path_1 = require("path");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const roles_guard_1 = require("../auth/guards/roles.guard");
const ai_service_1 = require("../ai/ai.service");
const images_service_1 = require("./images.service");
let ImagesController = class ImagesController {
    aiService;
    imagesService;
    constructor(aiService, imagesService) {
        this.aiService = aiService;
        this.imagesService = imagesService;
    }
    uploadImages(files, brand = '', model = '', price = '10000', req) {
        if (!files || files.length === 0) {
            throw new common_1.BadRequestException('Debés subir al menos una imagen.');
        }
        const imageUrls = files.map((file) => this.imagesService.buildImageUrl(file.filename));
        const aiAnalysis = this.aiService.analyzeVehicle(brand, model, parseFloat(price) || 10000, files.length);
        return {
            success: true,
            images: imageUrls,
            primaryImage: imageUrls[0],
            aiAnalysis: {
                bodyType: aiAnalysis.bodyType,
                aiStatus: aiAnalysis.aiStatus,
                aiDamages: aiAnalysis.aiDamages,
                priceRange: {
                    min: aiAnalysis.aiPriceMin,
                    max: aiAnalysis.aiPriceMax,
                },
            },
        };
    }
};
exports.ImagesController = ImagesController;
__decorate([
    (0, common_1.Post)('upload-images'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('vendedor'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FilesInterceptor)('images', 10, {
        storage: (0, multer_1.diskStorage)({
            destination: (0, path_1.join)(process.cwd(), 'uploads'),
            filename: (req, file, callback) => {
                const uniqueName = `${Date.now()}-${file.originalname.replace(/\s/g, '_')}`;
                callback(null, uniqueName);
            },
        }),
        fileFilter: (req, file, callback) => {
            const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
            if (allowedMimes.includes(file.mimetype)) {
                callback(null, true);
            }
            else {
                callback(new common_1.BadRequestException('Solo se permiten imágenes (jpeg, png, webp, gif).'), false);
            }
        },
        limits: {
            fileSize: 10 * 1024 * 1024,
        },
    })),
    __param(0, (0, common_1.UploadedFiles)()),
    __param(1, (0, common_1.Query)('brand')),
    __param(2, (0, common_1.Query)('model')),
    __param(3, (0, common_1.Query)('price')),
    __param(4, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array, String, String, String, Object]),
    __metadata("design:returntype", void 0)
], ImagesController.prototype, "uploadImages", null);
exports.ImagesController = ImagesController = __decorate([
    (0, common_1.Controller)('cars'),
    __metadata("design:paramtypes", [ai_service_1.AiService,
        images_service_1.ImagesService])
], ImagesController);
//# sourceMappingURL=images.controller.js.map