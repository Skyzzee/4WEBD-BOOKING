import { validateTicket } from "../business/ticketService";
import { prisma } from "../data/prismaClient";
import { TicketStatus } from "@prisma/client";
import * as tokenJwt from "../business/config/tokenJwt";

describe("TicketService - validateTicket", () => {
  it("should throw AppError if ticket is not found", async () => {
    (prisma.ticket.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(validateTicket("ticket-123")).rejects.toThrow(
      "Billet non trouvé.",
    );
  });

  it("should throw AppError if ticket is already used", async () => {
    (prisma.ticket.findUnique as jest.Mock).mockResolvedValue({
      id: "ticket-123",
      status: TicketStatus.USED,
    });

    await expect(validateTicket("ticket-123")).rejects.toThrow(
      "Ce billet a déjà été utilisé.",
    );
  });

  it("should throw AppError if ticket is not confirmed", async () => {
    (prisma.ticket.findUnique as jest.Mock).mockResolvedValue({
      id: "ticket-123",
      status: TicketStatus.PENDING,
    });

    await expect(validateTicket("ticket-123")).rejects.toThrow(
      "Ce billet ne peut pas être validé.",
    );
  });

  it("should throw AppError if qrCode is missing", async () => {
    (prisma.ticket.findUnique as jest.Mock).mockResolvedValue({
      id: "ticket-123",
      status: TicketStatus.CONFIRMED,
      qrCode: null,
    });

    await expect(validateTicket("ticket-123")).rejects.toThrow(
      "QR code manquant.",
    );
  });

  it("should throw AppError if qrCode is invalid", async () => {
    (prisma.ticket.findUnique as jest.Mock).mockResolvedValue({
      id: "ticket-123",
      userId: "user-123",
      eventId: "event-123",
      status: TicketStatus.CONFIRMED,
      qrCode: "valid-qr-code",
    });

    (tokenJwt.verifyQrCode as jest.Mock).mockReturnValue({
      ticketId: "wrong-ticket",
      userId: "user-123",
      eventId: "event-123",
    });

    await expect(validateTicket("ticket-123")).rejects.toThrow(
      "QR code invalide.",
    );
  });

  it("should validate ticket successfully", async () => {
    (prisma.ticket.findUnique as jest.Mock).mockResolvedValue({
      id: "ticket-123",
      userId: "user-123",
      eventId: "event-123",
      status: TicketStatus.CONFIRMED,
      qrCode: "valid-qr-code",
    });

    (tokenJwt.verifyQrCode as jest.Mock).mockReturnValue({
      ticketId: "ticket-123",
      userId: "user-123",
      eventId: "event-123",
    });

    (prisma.ticket.update as jest.Mock).mockResolvedValue({
      id: "ticket-123",
      status: TicketStatus.USED,
    });

    const result = await validateTicket("ticket-123");

    expect(result.status).toBe(TicketStatus.USED);
    expect(prisma.ticket.update).toHaveBeenCalledWith({
      where: { id: "ticket-123" },
      data: { status: TicketStatus.USED },
    });
  });
});
