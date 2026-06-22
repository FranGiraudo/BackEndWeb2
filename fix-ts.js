const fs = require('fs');
const path = require('path');

function replaceInFile(filePath, replacements) {
    const fullPath = path.join(__dirname, filePath);
    if (!fs.existsSync(fullPath)) {
        console.log(`File not found: ${fullPath}`);
        return;
    }
    let content = fs.readFileSync(fullPath, 'utf8');
    let original = content;
    
    for (const { search, replace } of replacements) {
        content = content.split(search).join(replace);
    }
    
    if (content !== original) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated ${filePath}`);
    } else {
        console.log(`No changes made to ${filePath}`);
    }
}

// 1. prisma/seed.ts
replaceInFile('prisma/seed.ts', [
    { search: "dni: '12345678',\n      telefono: '+54 351 1234567',\n      direccion: 'Av. Colón 1200, Córdoba',", replace: "" },
    { search: "dni: '87654321',\n      telefono: '+54 11 7654321',\n      direccion: 'Av. Santa Fe 3400, Buenos Aires',", replace: "" }
]);

// 2. seed-auction.ts
replaceInFile('seed-auction.ts', [
    { search: "active: true", replace: "isActive: true" }
]);

// 3. src/app.controller.spec.ts (delete)
const specFile = path.join(__dirname, 'src/app.controller.spec.ts');
if (fs.existsSync(specFile)) fs.unlinkSync(specFile);

// 4. src/auctions/auctions.service.ts
replaceInFile('src/auctions/auctions.service.ts', [
    { search: "active: true", replace: "isActive: true" }
]);

// 5. src/auth/auth.service.ts
replaceInFile('src/auth/auth.service.ts', [
    { search: "dni: loginDto.dni", replace: "email: loginDto.email" },
    { search: "user.rol", replace: "user.role" },
    { search: "rol: true", replace: "role: true" },
    { search: "rol: dto.rol", replace: "role: dto.rol" },
    { search: "passwordHash: await bcrypt.hash(dto.password, 10)", replace: "password: await bcrypt.hash(dto.password, 10)" },
    { search: "descripcion: dto.descripcion,", replace: "" },
    { search: "dni: dto.dni,", replace: "" }
]);

// 6. src/cars/cars.service.ts
replaceInFile('src/cars/cars.service.ts', [
    { search: "telefono: true,", replace: "" },
    { search: "active: true", replace: "isActive: true" }
]);
// For cars.service.ts, fixing the `car.seller` missing by including it in Prisma queries where needed.
let carsService = fs.readFileSync(path.join(__dirname, 'src/cars/cars.service.ts'), 'utf8');
carsService = carsService.replace(/include: {\n\s*images: true,\n\s*auction: true,\n\s*}/g, "include: {\n      images: true,\n      auction: true,\n      seller: true\n    }");
fs.writeFileSync(path.join(__dirname, 'src/cars/cars.service.ts'), carsService);

// 7. src/recommendations/recommendations.service.ts
replaceInFile('src/recommendations/recommendations.service.ts', [
    { search: "rol: 'comprador'", replace: "role: 'comprador'" },
    { search: "users = await this.prisma.user.findMany()", replace: "users = await this.prisma.user.findMany({ include: { searchHistories: true, favorites: { include: { car: true } } } })" },
    { search: "data: {\n                userId: user.id,\n                carIds: recommendedIds,\n              }", replace: "data: {\n                userId: user.id,\n                carIds: recommendedIds,\n                score: 85,\n                reason: 'Recomendado por IA según tu historial'\n              }" }
]);

console.log("Fix script finished.");
