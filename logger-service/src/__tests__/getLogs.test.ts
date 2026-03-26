import { getLogs } from "../business/loggerService";
import { prisma } from "../data/prismaClient";
import { ServiceName } from "../business/types/enums/serviceName";

describe("LoggerService - getLogs", () => {
  it("should return all logs without filters", async () => {
    (prisma.log.findMany as jest.Mock).mockResolvedValue([
      {
        id: "log-123",
        level: "INFO",
        serviceName: ServiceName.AUTH_SERVICE,
        message: "User registered",
        userId: "user-123",
      },
      {
        id: "log-456",
        level: "ERROR",
        serviceName: ServiceName.PAYMENT_SERVICE,
        message: "Payment failed",
        userId: "user-456",
      },
    ]);

    const result = await getLogs({});

    expect(result).toHaveLength(2);
    expect(prisma.log.findMany).toHaveBeenCalledWith({
      where: {},
      orderBy: { createdAt: "desc" },
    });
  });

  it("should filter logs by level", async () => {
    (prisma.log.findMany as jest.Mock).mockResolvedValue([
      {
        id: "log-123",
        level: "ERROR",
        serviceName: ServiceName.AUTH_SERVICE,
        message: "Something went wrong",
        userId: "user-123",
      },
    ]);

    const result = await getLogs({ level: "ERROR" });

    expect(result).toHaveLength(1);
    expect(prisma.log.findMany).toHaveBeenCalledWith({
      where: { level: "ERROR" },
      orderBy: { createdAt: "desc" },
    });
  });

  it("should filter logs by date range", async () => {
    const from = new Date("2026-01-01");
    const to = new Date("2026-12-31");

    (prisma.log.findMany as jest.Mock).mockResolvedValue([]);

    await getLogs({ from, to });

    expect(prisma.log.findMany).toHaveBeenCalledWith({
      where: {
        createdAt: {
          gte: from,
          lte: to,
        },
      },
      orderBy: { createdAt: "desc" },
    });
  });
});
