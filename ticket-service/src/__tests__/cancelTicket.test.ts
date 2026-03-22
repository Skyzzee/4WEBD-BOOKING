import { cancelTicket } from "../business/ticketService";
import { prisma } from "../data/prismaClient";
import { TicketStatus } from "@prisma/client";

describe("TicketService - cancelTicket", () => {
  it("should throw AppError if ticket is not found", async () => {
    (prisma.ticket.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(
      cancelTicket("ticket-123", "user-123", "USER"),
    ).rejects.toThrow("Billet non trouvé.");
  });

  it("should throw AppError if ticket is already cancelled", async () => {
    (prisma.ticket.findUnique as jest.Mock).mockResolvedValue({
      id: "ticket-123",
      userId: "user-123",
      status: TicketStatus.CANCELLED,
    });

    await expect(
      cancelTicket("ticket-123", "user-123", "USER"),
    ).rejects.toThrow("Ce billet est déjà annulé.");
  });

  it("should throw AppError if ticket is already used", async () => {
    (prisma.ticket.findUnique as jest.Mock).mockResolvedValue({
      id: "ticket-123",
      userId: "user-123",
      status: TicketStatus.USED,
    });

    await expect(
      cancelTicket("ticket-123", "user-123", "USER"),
    ).rejects.toThrow("Ce billet a déjà été utilisé.");
  });

  it("should throw AppError if user is not authorized", async () => {
    (prisma.ticket.findUnique as jest.Mock).mockResolvedValue({
      id: "ticket-123",
      userId: "other-user",
      status: TicketStatus.CONFIRMED,
    });

    await expect(
      cancelTicket("ticket-123", "user-123", "USER"),
    ).rejects.toThrow("Vous n'êtes pas autorisé à annuler ce billet.");
  });

  it("should cancel ticket successfully", async () => {
    (prisma.ticket.findUnique as jest.Mock).mockResolvedValue({
      id: "ticket-123",
      userId: "user-123",
      status: TicketStatus.CONFIRMED,
    });

    (prisma.ticket.update as jest.Mock).mockResolvedValue({
      id: "ticket-123",
      status: TicketStatus.CANCELLED,
    });

    const result = await cancelTicket("ticket-123", "user-123", "USER");

    expect(result.status).toBe(TicketStatus.CANCELLED);
    expect(prisma.ticket.update).toHaveBeenCalledWith({
      where: { id: "ticket-123" },
      data: { status: TicketStatus.CANCELLED },
    });
  });

  it("should allow admin to cancel any ticket", async () => {
    (prisma.ticket.findUnique as jest.Mock).mockResolvedValue({
      id: "ticket-123",
      userId: "other-user",
      status: TicketStatus.CONFIRMED,
    });

    (prisma.ticket.update as jest.Mock).mockResolvedValue({
      id: "ticket-123",
      status: TicketStatus.CANCELLED,
    });

    const result = await cancelTicket("ticket-123", "admin-123", "ADMIN");

    expect(result.status).toBe(TicketStatus.CANCELLED);
  });
});
