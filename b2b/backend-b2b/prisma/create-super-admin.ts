import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { authenticator } from 'otplib';

const prisma = new PrismaClient();

function getArg(name: string): string | undefined {
  const prefix = `--${name}=`;
  const arg = process.argv.find((a) => a.startsWith(prefix));
  return arg ? arg.slice(prefix.length).trim() : undefined;
}

function normalizeE164(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('998') && digits.length === 12) {
    return `+${digits}`;
  }
  if (digits.length === 9) {
    return `+998${digits}`;
  }
  return `+${digits}`;
}

async function main() {
  const rawPhone = getArg('phone') || process.env.ADMIN_PHONE;
  const rawPassword = getArg('password') || process.env.ADMIN_PASSWORD;
  const email = getArg('email') || process.env.ADMIN_EMAIL || 'admin@biznesgo.uz';
  const firstName = getArg('name') || 'Super Admin';

  if (!rawPhone || !rawPassword) {
    console.error('Xatolik: Telefon raqam va parol talab qilinadi!');
    console.log('Foydalanish:');
    console.log(
      '  npm run super-admin:create -- --phone=+998901112233 --password=StrongPassword2026! --email=admin@biznesgo.uz\n',
    );
    process.exit(1);
  }

  const phone = normalizeE164(rawPhone);
  const passwordHash = await bcrypt.hash(rawPassword, 12);
  const totpSecret = authenticator.generateSecret();
  const otpauthUrl = authenticator.keyuri(email, 'BiznesGO Super Admin', totpSecret);

  // Upsert user
  const user = await prisma.user.upsert({
    where: { phone },
    update: {
      email,
      role: UserRole.super_admin,
      password_hash: passwordHash,
      totp_secret: totpSecret,
      is_totp_enabled: true,
      is_active: true,
    },
    create: {
      phone,
      email,
      first_name: firstName,
      role: UserRole.super_admin,
      password_hash: passwordHash,
      totp_secret: totpSecret,
      is_totp_enabled: true,
      country_id: 'UZ',
    },
  });

  // Generate 8 single-use recovery codes
  const recoveryCodes: string[] = [];
  await prisma.adminRecoveryCode.deleteMany({ where: { user_id: user.id } });

  for (let i = 0; i < 8; i++) {
    const p1 = crypto.randomBytes(2).toString('hex').toUpperCase();
    const p2 = crypto.randomBytes(2).toString('hex').toUpperCase();
    const rawCode = `${p1}-${p2}`;
    recoveryCodes.push(rawCode);

    const codeHash = crypto
      .createHash('sha256')
      .update(rawCode.replace(/-/g, ''))
      .digest('hex');

    await prisma.adminRecoveryCode.create({
      data: {
        user_id: user.id,
        code_hash: codeHash,
        is_used: false,
      },
    });
  }

  console.log('\n================================================================');
  console.log('✅ SUPER ADMIN AKKAUNTI MUVAFFAQIYATLI YARATILDI / YANGILANDI');
  console.log('================================================================');
  console.log(`Telefon:       ${user.phone}`);
  console.log(`Email:         ${user.email}`);
  console.log(`Rol:           ${user.role}`);
  console.log(`2FA Statusi:   Majburiy TOTP yoqilgan`);
  console.log('----------------------------------------------------------------');
  console.log(`🔑 TOTP Maxfiy Kaliti (Secret): ${totpSecret}`);
  console.log(`📲 Google Authenticator URI:     ${otpauthUrl}`);
  console.log('----------------------------------------------------------------');
  console.log('🛡️  8 TA BIR MARTALIK RECOVERY KODLAR (Ularni xavfsiz joyga saqlang):');
  recoveryCodes.forEach((c, idx) => console.log(`   ${idx + 1}. ${c}`));
  console.log('================================================================\n');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

