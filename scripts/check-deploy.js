import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Verificando configuración para deploy...\n');

let hasErrors = false;

// Verificar que existe .env
if (!fs.existsSync(path.join(__dirname, '..', '.env'))) {
    console.log('❌ No se encontró el archivo .env');
    hasErrors = true;
} else {
    console.log('✅ Archivo .env encontrado');

    // Leer .env y verificar variables requeridas
    const envContent = fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf-8');
    const requiredVars = [
        'DATABASE_URL',
        'RESEND_API_KEY',
        'VITE_NEON_AUTH_URL',
        'ALLOWED_EMAILS'
    ];

    requiredVars.forEach(varName => {
        if (envContent.includes(varName)) {
            console.log(`✅ ${varName} configurado`);
        } else {
            console.log(`❌ ${varName} no encontrado en .env`);
            hasErrors = true;
        }
    });
}

// Verificar que existe vercel.json
if (!fs.existsSync(path.join(__dirname, '..', 'vercel.json'))) {
    console.log('❌ No se encontró vercel.json');
    hasErrors = true;
} else {
    console.log('✅ vercel.json encontrado');
}

// Verificar que existe server.js
if (!fs.existsSync(path.join(__dirname, '..', 'server.js'))) {
    console.log('❌ No se encontró server.js');
    hasErrors = true;
} else {
    console.log('✅ server.js encontrado');
}

// Verificar package.json
const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf-8'));
if (packageJson.scripts['vercel-build']) {
    console.log('✅ Script vercel-build configurado');
} else {
    console.log('❌ Script vercel-build no encontrado en package.json');
    hasErrors = true;
}

console.log('\n' + '='.repeat(50));

if (hasErrors) {
    console.log('❌ Hay errores que corregir antes del deploy');
    process.exit(1);
} else {
    console.log('✅ Todo listo para el deploy!');
    console.log('\nPróximos pasos:');
    console.log('1. Ejecuta: npm run build (para verificar que compila)');
    console.log('2. Ejecuta: vercel (para deployar)');
    console.log('3. Configura las variables de entorno en Vercel');
    console.log('4. Lee DEPLOY.md para más detalles');
}
