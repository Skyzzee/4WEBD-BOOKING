import { prisma } from "../data/prismaClient";

jest.mock("../data/prismaClient", () => ({
  prisma: {
    authUser: {
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

jest.mock("../business/publisher/notificationPublisher", () => ({
  publishNotification: jest.fn(),
}));

global.fetch = jest.fn();
