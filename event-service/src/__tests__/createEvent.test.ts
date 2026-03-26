import { createEvent } from "../business/eventService";
import { prisma } from "../data/prismaClient";

describe("EventService - createEvent", () => {
  it("should throw AppError if required fields are missing", async () => {
    await expect(
      createEvent(
        {
          title: "",
          location: "",
          date: new Date(),
          maxCapacity: 100,
          price: 10,
        },
        "user-123",
        "token",
      ),
    ).rejects.toThrow("Tous les champs ormis la description sont obligatoire.");
  });

  it("should throw AppError if maxCapacity is <= 0", async () => {
    await expect(
      createEvent(
        {
          title: "Concert",
          location: "Paris",
          date: new Date(),
          maxCapacity: 0,
          price: 10,
        },
        "user-123",
        "token",
      ),
    ).rejects.toThrow("La capacité doit être supérieure à 0.");
  });

  it("should throw AppError if price is <= 0", async () => {
    await expect(
      createEvent(
        {
          title: "Concert",
          location: "Paris",
          date: new Date(),
          maxCapacity: 100,
          price: 0,
        },
        "user-123",
        "token",
      ),
    ).rejects.toThrow("Le prix doit être supérieur à 0.");
  });

  it("should create event successfully", async () => {
    (prisma.event.create as jest.Mock).mockResolvedValue({
      id: "event-123",
      title: "Concert",
      location: "Paris",
      date: new Date(),
      maxCapacity: 100,
      availableStock: 100,
      price: 10,
      createdByUserId: "user-123",
    });

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest
        .fn()
        .mockResolvedValue({ data: { email: "creator@example.com" } }),
    });

    const result = await createEvent(
      {
        title: "Concert",
        location: "Paris",
        date: new Date(),
        maxCapacity: 100,
        price: 10,
      },
      "user-123",
      "token",
    );

    expect(result.title).toBe("Concert");
    expect(prisma.event.create).toHaveBeenCalled();
  });
});
