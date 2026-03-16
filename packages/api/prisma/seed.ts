import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const testUser = await prisma.user.upsert({
    where: { facebookId: 'test-fb-id-001' },
    update: {},
    create: {
      facebookId: 'test-fb-id-001',
      email: 'test@brazachat.shop',
      name: 'Test User',
      timezone: 'America/Sao_Paulo',
    },
  });

  console.log('Seed completed:', { testUser });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
