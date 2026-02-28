import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seed() {
    console.log('🌱 Seeding database...\n');

    // ── Admin User ──
    const adminEmail = 'admin@printme.com';
    const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });

    if (!existingAdmin) {
        const passwordHash = await bcrypt.hash('Admin1234', 12);
        const admin = await prisma.user.create({
            data: {
                email: adminEmail,
                passwordHash,
                name: 'PrintME Admin',
                role: 'ADMIN',
            },
        });
        console.log(`  ✅ Admin user created: ${admin.email} (password: Admin1234)`);
    } else {
        console.log(`  ⏭️  Admin user already exists: ${adminEmail}`);
    }

    // ── Sample Products ──
    const productsData = [
        { name: 'Classic T-Shirt', slug: 't-shirt', description: 'Premium cotton custom printed t-shirt', basePrice: 299, imageUrl: null },
        { name: 'Hoodie', slug: 'hoodie', description: 'Warm and cozy custom printed hoodie', basePrice: 599, imageUrl: null },
        { name: 'Coffee Mug', slug: 'mug', description: 'Ceramic mug with custom print', basePrice: 199, imageUrl: null },
        { name: 'Art Poster', slug: 'poster', description: 'High-quality art poster on premium paper', basePrice: 149, imageUrl: null },
        { name: 'Phone Case', slug: 'phone-case', description: 'Durable phone case with custom design', basePrice: 249, imageUrl: null },
        { name: 'Tote Bag', slug: 'tote-bag', description: 'Eco-friendly canvas tote bag with print', basePrice: 199, imageUrl: null },
    ];

    for (const p of productsData) {
        const existing = await prisma.product.findUnique({ where: { slug: p.slug } });
        if (!existing) {
            const product = await prisma.product.create({ data: p });
            console.log(`  ✅ Product created: ${product.name}`);

            // Create a few SKUs for each product
            const sizes = p.slug === 'mug' || p.slug === 'poster' ? ['Standard'] : ['S', 'M', 'L', 'XL'];
            const colors = ['Black', 'White'];

            for (const size of sizes) {
                for (const color of colors) {
                    await prisma.sku.create({
                        data: {
                            productId: product.id,
                            size,
                            color,
                            stock: 100,
                            price: p.basePrice,
                        },
                    });
                }
            }
            console.log(`     └── ${sizes.length * colors.length} SKUs created`);
        } else {
            console.log(`  ⏭️  Product already exists: ${p.name}`);
        }
    }

    console.log('\n✨ Seeding complete!');
}

seed()
    .catch((e) => {
        console.error('❌ Seed error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
