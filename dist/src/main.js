"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const common_1 = require("@nestjs/common");
const express_1 = __importDefault(require("express"));
const path_1 = require("path");
const images_service_1 = require("./images/images.service");
async function bootstrap() {
    const application = await core_1.NestFactory.create(app_module_1.AppModule);
    application.enableCors({
        origin: true,
        credentials: true,
    });
    application.setGlobalPrefix('api');
    application.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
    }));
    application.use('/uploads', express_1.default.static((0, path_1.join)(process.cwd(), 'uploads')));
    const imagesService = application.get(images_service_1.ImagesService);
    imagesService.ensureUploadsDir();
    const port = process.env.PORT ?? 3000;
    await application.listen(port);
    console.log(`SmartAuto API escuchando en el puerto ${port}`);
}
bootstrap();
//# sourceMappingURL=main.js.map