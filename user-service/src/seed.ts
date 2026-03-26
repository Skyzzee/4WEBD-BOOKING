import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is not defined in environment variables.");
}

const adapter = new PrismaPg({ connectionString: databaseUrl });
const prisma = new PrismaClient({ adapter });

const users = [
  {
    authId: "00000000-0000-0000-0000-000000000001",
    firstName: "Admin",
    lastName: "Booking",
  },
  {
    authId: "00000000-0000-0000-0000-000000000002",
    firstName: "Creator",
    lastName: "Booking",
  },
  {
    authId: "00000000-0000-0000-0000-000000000003",
    firstName: "User",
    lastName: "Booking",
  },
];

const seed = async () => {
  console.log("Seeding user-service...");

  for (const user of users) {
    const existing = await prisma.user.findUnique({
      where: { authId: user.authId },
    });

    if (existing) {
      console.log(`Profile ${user.authId} already exists, skipping.`);
      continue;
    }

    await prisma.user.create({
      data: user,
    });

    console.log(`Created profile for authId: ${user.authId}`);
  }

  console.log("User-service seeding complete.");
  await prisma.$disconnect();
};

seed().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
