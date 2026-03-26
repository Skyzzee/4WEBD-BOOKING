jest.mock("../data/prismaClient", () => ({
  prisma: {
    ticket: {
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

jest.mock("../business/config/tokenJwt", () => ({
  generateQrCode: jest.fn().mockReturnValue("mocked-qr-code"),
  verifyQrCode: jest.fn(),
}));

global.fetch = jest.fn();
