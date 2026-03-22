import { decrementStock } from "../business/eventService";
import { prisma } from "../data/prismaClient";
import { EventStatus } from "@prisma/client";

describe("EventService - decrementStock", () => {
  it("should throw AppError if event is not found", async () => {
    (prisma.event.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(decrementStock("event-123")).rejects.toThrow(
      "Événement non trouvé.",
    );
  });

  it("should throw AppError if event is deleted", async () => {
    (prisma.event.findUnique as jest.Mock).mockResolvedValue({
      id: "event-123",
      deletedAt: new Date(),
      availableStock: 10,
    });

    await expect(decrementStock("event-123")).rejects.toThrow(
      "Événement non trouvé.",
    );
  });

  it("should throw AppError if no stock available", async () => {
    (prisma.event.findUnique as jest.Mock).mockResolvedValue({
      id: "event-123",
      deletedAt: null,
      availableStock: 0,
    });

    await expect(decrementStock("event-123")).rejects.toThrow(
      "Aucune place disponible.",
    );
  });

  it("should decrement stock successfully", async () => {
    (prisma.event.findUnique as jest.Mock).mockResolvedValue({
      id: "event-123",
      deletedAt: null,
      availableStock: 10,
    });

    (prisma.event.update as jest.Mock).mockResolvedValue({
      id: "event-123",
      availableStock: 9,
      status: EventStatus.PUBLISHED,
    });

    const result = await decrementStock("event-123");

    expect(result.availableStock).toBe(9);
    expect(prisma.event.update).toHaveBeenCalled();
  });

  it("should set status to SOLD_OUT when last ticket is taken", async () => {
    (prisma.event.findUnique as jest.Mock).mockResolvedValue({
      id: "event-123",
      deletedAt: null,
      availableStock: 1,
    });

    (prisma.event.update as jest.Mock).mockResolvedValue({
      id: "event-123",
      availableStock: 0,
      status: EventStatus.SOLD_OUT,
    });

    const result = await decrementStock("event-123");

    expect(result.status).toBe(EventStatus.SOLD_OUT);
    expect(prisma.event.update).toHaveBeenCalledWith({
      where: { id: "event-123", availableStock: { gt: 0 } },
      data: {
        availableStock: { decrement: 1 },
        status: EventStatus.SOLD_OUT,
      },
    });
  });
});
