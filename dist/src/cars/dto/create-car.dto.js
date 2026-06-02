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
exports.CreateCarDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class CreateCarDto {
    brand;
    model;
    year;
    price;
    km;
    fuel;
    transmission;
    location;
    description;
    bodyType;
    aiStatus;
    aiDamages;
    aiPriceMin;
    aiPriceMax;
    images;
}
exports.CreateCarDto = CreateCarDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'La marca es requerida.' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCarDto.prototype, "brand", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'El modelo es requerido.' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCarDto.prototype, "model", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreateCarDto.prototype, "year", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreateCarDto.prototype, "price", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreateCarDto.prototype, "km", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'El combustible es requerido.' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCarDto.prototype, "fuel", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'La transmisión es requerida.' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCarDto.prototype, "transmission", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'La ubicación es requerida.' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCarDto.prototype, "location", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCarDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCarDto.prototype, "bodyType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCarDto.prototype, "aiStatus", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCarDto.prototype, "aiDamages", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreateCarDto.prototype, "aiPriceMin", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreateCarDto.prototype, "aiPriceMax", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], CreateCarDto.prototype, "images", void 0);
//# sourceMappingURL=create-car.dto.js.map