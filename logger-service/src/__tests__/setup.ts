jest.mock("../data/prismaClient", () => ({
  prisma: {
    log: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
    },
  },
}));
