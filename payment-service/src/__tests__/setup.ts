jest.mock("../business/config/stripe", () => ({
  __esModule: true,
  default: {
    paymentIntents: {
      create: jest.fn(),
    },
    refunds: {
      create: jest.fn(),
    },
  },
}));

jest.mock("../data/prismaClient", () => ({
  prisma: {
    payment: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock("../business/publisher/notificationPublisher", () => ({
  publishNotification: jest.fn(),
}));

global.fetch = jest.fn();
