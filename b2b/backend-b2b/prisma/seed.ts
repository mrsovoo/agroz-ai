import { BusinessSector, PrismaClient, UserRole } from '@prisma/client';
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
      email: 'admin@biznesgo.uz',
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

  // 2. Demo Vet & Agro Pharmacy Business
  const business = await prisma.business.create({
    data: {
      name: 'AgroVet Markaz Do‘koni',
      sector: BusinessSector.pharmacy,
      country_id: 'UZ',
      currency: 'UZS',
      language: 'uz',
      address: 'Toshkent viloyati, Yangiyo‘l tumani',
      latitude: 41.1189,
      longitude: 69.0494,
      phone: '+998901234567',
    },
  });
  console.log(`✓ Demo Pharmacy Business created: ${business.name} (Sector: ${business.sector})`);

  // 3. Demo Catalog Product (Veterinary Medicine)
  const product = await prisma.catalogProduct.create({
    data: {
      name: 'Oksitetratsiklin 20% LA',
      sector: BusinessSector.pharmacy,
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

  // 4. Business Product & Batch
  const businessProduct = await prisma.businessProduct.create({
    data: {
      business_id: business.id,
      catalog_product_id: product.id,
      custom_name: 'Oksitetratsiklin 20% LA (100ml)',
      price: BigInt(8500000), // 85,000 UZS (8500000 tiyin)
      currency: 'UZS',
      country_id: 'UZ',
    },
  });

  await prisma.productBatch.create({
    data: {
      business_product_id: businessProduct.id,
      batch_no: 'B-2026-041',
      expiry_date: new Date('2028-06-30'),
      quantity: 50,
      cost_price: BigInt(6500000), // 65,000 UZS (6500000 tiyin)
      currency: 'UZS',
    },
  });
  console.log(`✓ Inventory batch added for: ${businessProduct.custom_name}`);

  // 5. Demo Contact
  const contact = await prisma.contact.create({
    data: {
      business_id: business.id,
      name: 'Ali Qosimov (Fermer)',
      phone: '+998909876543',
      type: 'customer',
      balance: BigInt(0),
      currency: 'UZS',
      country_id: 'UZ',
    },
  });
  console.log(`✓ Demo Contact created: ${contact.name} (Type: ${contact.type})`);

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
