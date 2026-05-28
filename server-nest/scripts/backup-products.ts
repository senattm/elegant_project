import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function backup() {
    console.log('--- Veritabanı Yedekleme Başladı 🛡️ ---');
    try {
        const products = await prisma.products.findMany();
        const backupDir = path.join(process.cwd(), 'backups');
        if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir);

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const fileName = `products_backup_${timestamp}.json`;
        const filePath = path.join(backupDir, fileName);

        fs.writeFileSync(filePath, JSON.stringify(products, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value, 2));

        console.log(`✅ Yedek başarıyla oluşturuldu: ${fileName}`);
    } catch (error) {
        console.error('❌ Yedekleme hatası:', error);
    } finally {
        await prisma.$disconnect();
    }
}

backup();
