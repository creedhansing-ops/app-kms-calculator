const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.nutritionist.upsert({
    where: { id: 'mock-nutritionist-id' },
    update: {},
    create: {
      id: 'mock-nutritionist-id',
      email: 'ahligizi@mock.com',
      password: 'mockpassword',
      name: 'Ahli Gizi',
      clinic: 'Puskesmas Pusat'
    }
  });
  console.log('Mock nutritionist seeded');
}

main().catch(console.error).finally(() => prisma.$disconnect());
