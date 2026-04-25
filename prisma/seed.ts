import { PrismaClient } from "@prisma/client";
import { initialCards } from "../lib/cards";

const prisma = new PrismaClient();

async function main() {
  for (const card of initialCards) {
    await prisma.card.upsert({
      where: { id: card.id },
      update: card,
      create: card
    });
  }

  await prisma.adminUser.upsert({
    where: { apiKey: process.env.ADMIN_KEY ?? "techtaluo" },
    update: { name: "默认管理员" },
    create: {
      name: "默认管理员",
      apiKey: process.env.ADMIN_KEY ?? "techtaluo"
    }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
