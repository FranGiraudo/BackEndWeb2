"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiService = void 0;
const common_1 = require("@nestjs/common");
let AiService = class AiService {
    analyzeVehicle(brand, model, price, imageCount) {
        const textoBusqueda = `${brand} ${model}`.toLowerCase();
        const diccionarios = {
            Hatchback: ['golf', '208', '308', 'onix', 'sandero', 'etios', 'fiesta', 'focus', 'argo', 'mobi', 'kwid', 'up'],
            'SUV / Crossover': ['sw4', 'crv', 'tracker', 'renegade', 'duster', 'kicks', 't-cross', 'nivus', 'compass', 'hrv', 'ecosport', 'taos', 'corolla cross'],
            Pickup: ['hilux', 'amarok', 'ranger', 'frontier', 'toro', 'oroch', 's10', 'f150', 'ram', 'saveiro', 'strada'],
            Sedán: ['corolla', 'cruze', 'cronos', 'virtus', 'yaris', 'civic', 'sentra', 'logan', 'prisma'],
        };
        let bodyType = 'Sedán';
        for (const [categoria, palabras] of Object.entries(diccionarios)) {
            if (palabras.some((p) => textoBusqueda.includes(p))) {
                bodyType = categoria;
                break;
            }
        }
        const estados = [
            'Excelente estado',
            'Buen estado',
            'Estado regular',
            'Requiere reparación',
        ];
        let aiStatus;
        if (imageCount >= 5)
            aiStatus = estados[0];
        else if (imageCount >= 3)
            aiStatus = estados[1];
        else if (imageCount >= 2)
            aiStatus = estados[2];
        else
            aiStatus = estados[3];
        const aiDamages = aiStatus === 'Excelente estado'
            ? 'Ninguno detectado'
            : aiStatus === 'Buen estado'
                ? 'Leves marcas de uso normal'
                : 'Leves rayones en paragolpes y carrocería';
        const aiPriceMin = Math.round(price * 0.85);
        const aiPriceMax = Math.round(price * 1.15);
        return {
            bodyType,
            aiStatus,
            aiDamages,
            aiPriceMin,
            aiPriceMax,
        };
    }
};
exports.AiService = AiService;
exports.AiService = AiService = __decorate([
    (0, common_1.Injectable)()
], AiService);
//# sourceMappingURL=ai.service.js.map