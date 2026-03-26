import { getLogById } from "../business/loggerService";
import { prisma } from "../data/prismaClient";
import { ServiceName } from "../business/types/enums/serviceName";

describe("LoggerService - getLogById", () => {
  it("should throw AppError if log is not found", async () => {
    (prisma.log.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(getLogById("log-123")).rejects.toThrow("Log non trouvé.");
  });

  it("should return log successfully", async () => {
    (prisma.log.findUnique as jest.Mock).mockResolvedValue({
      id: "log-123",
      level: "INFO",
      serviceName: ServiceName.AUTH_SERVICE,
      message: "User registered",
      userId: "user-123",
    });

    const result = await getLogById("log-123");

    expect(result.id).toBe("log-123");
    expect(result.serviceName).toBe(ServiceName.AUTH_SERVICE);
    expect(prisma.log.findUnique).toHaveBeenCalledWith({
      where: { id: "log-123" },
    });
  });
});
