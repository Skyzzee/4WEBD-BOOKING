import "dotenv/config";
import bcrypt from "bcrypt";
import { PrismaClient, Role } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is not defined in environment variables.");
}

const adapter = new PrismaPg({ connectionString: databaseUrl });
const prisma = new PrismaClient({ adapter });

const users = [
  {
    id: "00000000-0000-0000-0000-000000000001",
    email: "admin@booking.com",
    password: "Admin1234",
    role: Role.ADMIN,
  },
  {
    id: "00000000-0000-0000-0000-000000000002",
    email: "creator@booking.com",
    password: "Creator1234",
    role: Role.EVENT_CREATOR,
  },
  {
    id: "00000000-0000-0000-0000-000000000003",
    email: "user@booking.com",
    password: "User1234",
    role: Role.USER,
  },
];

const seed = async () => {
  console.log("Seeding auth-service...");

  for (const user of users) {
    const existing = await prisma.authUser.findUnique({
      where: { email: user.email },
    });

    if (existing) {
      console.log(`User ${user.email} already exists, skipping.`);
      continue;
    }

    const passwordHash = await bcrypt.hash(user.password, 10);

    await prisma.authUser.create({
      data: {
        id: user.id,
        email: user.email,
        passwordHash,
        role: user.role,
        isActive: true,
      },
    });

    console.log(`Created user: ${user.email} (${user.role})`);
  }

  console.log("Auth-service seeding complete.");
  await prisma.$disconnect();
};

seed().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
