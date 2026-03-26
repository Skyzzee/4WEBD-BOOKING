import { createLog } from "../business/loggerService";
import { ServiceName } from "../business/types/enums/serviceName";
import { prisma } from "../data/prismaClient";

describe("LoggerService - createLog", () => {
  it("should create a log successfully", async () => {
    (prisma.log.create as jest.Mock).mockResolvedValue({
      id: "log-123",
      level: "INFO",
      serviceName: ServiceName.AUTH_SERVICE,
      message: "User registered",
      userId: "user-123",
    });

    const result = await createLog({
      level: "INFO",
      serviceName: ServiceName.AUTH_SERVICE,
      message: "User registered",
      userId: "user-123",
    });

    expect(result.level).toBe("INFO");
    expect(result.serviceName).toBe("AUTH_SERVICE");
    expect(prisma.log.create).toHaveBeenCalledWith({
      data: {
        level: "INFO",
        serviceName: "AUTH_SERVICE",
        message: "User registered",
        userId: "user-123",
      },
    });
  });
});
