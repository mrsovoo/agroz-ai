import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { authenticator } from 'otplib';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding AgrozGO B2B database...');

  // 1. Super Admin with TOTP 2FA secret
  const superAdminPhone = '+998901112233';
  const superAdminPassword = await bcrypt.hash('Admin@Secure2026!', 10);
  const superAdminTotpSecret = authenticator.generateSecret();

  const superAdmin = await prisma.user.upsert({
    where: { phone: superAdminPhone },
    update: {},
    create: {
      phone: superAdminPhone,
      first_name: 'Super',
      last_name: 'Admin',
      role: UserRole.super_admin,
      password_hash: superAdminPassword,
      totp_secret: superAdminTotpSecret,
      is_totp_enabled: true,
      country_id: 'UZ',
    },
  });
  console.log(`✓ Super Admin created: ${superAdmin.phone} (Role: super_admin)`);
  console.log(`  TOTP Secret: ${superAdminTotpSecret}`);

  // 2. Demo Vet & Agro Pharmacy Shop
  const shop = await prisma.shop.create({
    data: {
      name: 'AgroVet Markaz Do‘koni',
      sector: 'pharmacy',
      country_id: 'UZ',
      currency: 'UZS',
      language: 'uz',
      address: 'Toshkent viloyati, Yangiyo‘l tumani',
      latitude: 41.1189,
      longitude: 69.0494,
      phone: '+998901234567',
    },
  });
  console.log(`✓ Demo Pharmacy Shop created: ${shop.name} (Sector: ${shop.sector})`);

  // 3. Demo Catalog Product (Veterinary Medicine)
  const product = await prisma.catalogProduct.create({
    data: {
      name: 'Oksitetratsiklin 20% LA',
      sector: 'pharmacy',
      category: 'Antibiotiklar',
      active_substance: 'Oxytetracycline dihydrate',
      manufacturer: 'Bioveta, Chexiya',
      unit: 'flakon 100ml',
      barcode: '8594004850123',
      target_species: ['qoramol', 'qo‘y', 'echki', 'cho‘chqa'],
      country_id: 'UZ',
    },
  });
  console.log(`✓ Catalog Product created: ${product.name} (Active: ${product.active_substance})`);

  // 4. Shop Product & Batch
  const shopProduct = await prisma.shopProduct.create({
    data: {
      shop_id: shop.id,
      catalog_product_id: product.id,
      custom_name: 'Oksitetratsiklin 20% LA (100ml)',
      price: BigInt(8500000), // 85,000 UZS (8500000 tiyin)
      currency: 'UZS',
      country_id: 'UZ',
    },
  });

  await prisma.productBatch.create({
    data: {
      shop_product_id: shopProduct.id,
      batch_no: 'B-2026-041',
      expiry_date: new Date('2028-06-30'),
      quantity: 50,
      cost_price: BigInt(6500000), // 65,000 UZS (6500000 tiyin)
      currency: 'UZS',
    },
  });
  console.log(`✓ Inventory batch added for: ${shopProduct.custom_name}`);

  console.log('\nSeed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
