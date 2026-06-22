const fs = require('fs');
const path = require('path');

function patchFile(relPath, patches) {
    const fullPath = path.join(__dirname, relPath);
    let content = fs.readFileSync(fullPath, 'utf8');
    patches.forEach(p => {
        if (typeof p.search === 'string') {
            content = content.replace(p.search, p.replace);
        } else {
            content = content.replace(p.search, p.replace);
        }
    });
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`Patched ${relPath}`);
}

patchFile('src/auctions/auctions.service.ts', [
    { search: /active:/g, replace: "isActive:" }
]);

patchFile('src/auth/auth.service.ts', [
    { search: /telefono: [^,]*,/g, replace: "" },
    { search: /telefono: true,?/g, replace: "" },
    { search: /dni: loginDto\.dni/g, replace: "email: loginDto.email" },
    { search: /dni: dto\.dni,?/g, replace: "" },
    { search: /passwordHash:/g, replace: "password:" },
    { search: /descripcion: dto\.descripcion,?/g, replace: "" }
]);
