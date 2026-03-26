import { buyTicket } from "../business/ticketService";
import { prisma } from "../data/prismaClient";
import { TicketStatus } from "@prisma/client";
import { EventStatus } from "../business/types/enums/eventStatus";

describe("TicketService - buyTicket", () => {
  it("should throw AppError if event is not found", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false });

    await expect(buyTicket("event-123", "user-123")).rejects.toThrow(
      "Événement non trouvé.",
    );
  });

  it("should throw AppError if no stock available", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue({
        data: { availableStock: 0, status: EventStatus.PUBLISHED },
      }),
    });

    await expect(buyTicket("event-123", "user-123")).rejects.toThrow(
      "Aucune place disponible.",
    );
  });

  it("should throw AppError if event is not published", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue({
        data: { availableStock: 10, status: EventStatus.DRAFT },
      }),
    });

    await expect(buyTicket("event-123", "user-123")).rejects.toThrow(
      "Cet événement n'est pas disponible.",
    );
  });

  it("should cancel ticket and throw if payment fails", async () => {
    // event response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue({
        data: {
          availableStock: 10,
          status: EventStatus.PUBLISHED,
          title: "Concert",
          price: 1000,
        },
      }),
    });

    // auth user response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: jest
        .fn()
        .mockResolvedValue({ data: { email: "user@example.com" } }),
    });

    // payment response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: jest.fn().mockResolvedValue({ data: { status: "FAILED" } }),
    });

    (prisma.ticket.create as jest.Mock).mockResolvedValue({
      id: "ticket-123",
      eventId: "event-123",
      userId: "user-123",
      status: TicketStatus.PENDING,
    });

    (prisma.ticket.update as jest.Mock).mockResolvedValue({
      id: "ticket-123",
      status: TicketStatus.CANCELLED,
    });

    await expect(buyTicket("event-123", "user-123")).rejects.toThrow(
      "Le paiement a échoué.",
    );

    expect(prisma.ticket.update).toHaveBeenCalledWith({
      where: { id: "ticket-123" },
      data: { status: TicketStatus.CANCELLED },
    });
  });

  it("should buy ticket successfully", async () => {
    // event response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue({
        data: {
          availableStock: 10,
          status: EventStatus.PUBLISHED,
          title: "Concert",
          price: 1000,
          date: new Date().toISOString(),
          location: "Paris",
        },
      }),
    });

    // auth user response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: jest
        .fn()
        .mockResolvedValue({ data: { email: "user@example.com" } }),
    });

    // payment response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: jest
        .fn()
        .mockResolvedValue({ data: { id: "payment-123", status: "SUCCESS" } }),
    });

    // decrement stock response
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true });

    (prisma.ticket.create as jest.Mock).mockResolvedValue({
      id: "ticket-123",
      eventId: "event-123",
      userId: "user-123",
      status: TicketStatus.PENDING,
    });

    (prisma.ticket.update as jest.Mock).mockResolvedValue({
      id: "ticket-123",
      eventId: "event-123",
      userId: "user-123",
      status: TicketStatus.CONFIRMED,
      paymentId: "payment-123",
      qrCode: "mocked-qr-code",
    });

    const result = await buyTicket("event-123", "user-123");

    expect(result.status).toBe(TicketStatus.CONFIRMED);
    expect(result.qrCode).toBe("mocked-qr-code");
    expect(prisma.ticket.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: TicketStatus.CONFIRMED }),
      }),
    );
  });
});
