
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
    const categories = await prisma.categories.findMany();
    const output = categories.map(c => `ID: ${c.id}, Name: ${c.name}`).join('\n');
    fs.writeFileSync(path.join(__dirname, 'categories-list.txt'), output);
    console.log('Categories written to categories-list.txt');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
