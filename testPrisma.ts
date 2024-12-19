// testPrisma.ts

import prisma from "./lib/prisma";

async function main() {
  const users = await prisma.user.findMany();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
