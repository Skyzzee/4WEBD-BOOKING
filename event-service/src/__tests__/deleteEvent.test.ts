import { updateEvent } from "../business/eventService";
import { prisma } from "../data/prismaClient";

describe("EventService - updateEvent", () => {
  it("should throw AppError if event is not found", async () => {
    (prisma.event.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(
      updateEvent(
        "event-123",
        {
          title: "Concert",
          location: "Paris",
          date: new Date(),
          maxCapacity: 100,
          price: 10,
        },
        "user-123",
        "ADMIN",
        "token",
      ),
    ).rejects.toThrow("Événement non trouvé.");
  });

  it("should throw AppError if event is deleted", async () => {
    (prisma.event.findUnique as jest.Mock).mockResolvedValue({
      id: "event-123",
      deletedAt: new Date(),
      createdByUserId: "user-123",
    });

    await expect(
      updateEvent(
        "event-123",
        {
          title: "Concert",
          location: "Paris",
          date: new Date(),
          maxCapacity: 100,
          price: 10,
        },
        "user-123",
        "ADMIN",
        "token",
      ),
    ).rejects.toThrow("Événement non trouvé.");
  });

  it("should throw AppError if user is not authorized", async () => {
    (prisma.event.findUnique as jest.Mock).mockResolvedValue({
      id: "event-123",
      deletedAt: null,
      createdByUserId: "other-user",
    });

    await expect(
      updateEvent(
        "event-123",
        {
          title: "Concert",
          location: "Paris",
          date: new Date(),
          maxCapacity: 100,
          price: 10,
        },
        "user-123",
        "USER",
        "token",
      ),
    ).rejects.toThrow("Vous n'êtes pas autorisé à modifier cet événement.");
  });

  it("should update event successfully", async () => {
    (prisma.event.findUnique as jest.Mock).mockResolvedValue({
      id: "event-123",
      deletedAt: null,
      createdByUserId: "user-123",
    });

    (prisma.event.update as jest.Mock).mockResolvedValue({
      id: "event-123",
      title: "Concert Updated",
      location: "Paris",
    });

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest
        .fn()
        .mockResolvedValue({ data: { email: "creator@example.com" } }),
    });

    const result = await updateEvent(
      "event-123",
      {
        title: "Concert Updated",
        location: "Paris",
        date: new Date(),
        maxCapacity: 100,
        price: 10,
      },
      "user-123",
      "ADMIN",
      "token",
    );

    expect(result.title).toBe("Concert Updated");
    expect(prisma.event.update).toHaveBeenCalled();
  });
});
