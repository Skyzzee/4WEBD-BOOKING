import { TicketStatus } from "@prisma/client";
import { prisma } from "../data/prismaClient";
import { AppError } from "./config/appError";
import { EventStatus } from "./types/enums/eventStatus";
import { Role } from "./types/enums/role";
import { generateQrCode, verifyQrCode } from "./config/tokenJwt";
import { publishNotification } from "./publisher/notificationPublisher";
import { logger } from "./utils/logger";

const EVENT_SERVICE_URL =
  process.env.EVENT_SERVICE_URL || "http://event-service:3000";
const PAYMENT_SERVICE_URL =
  process.env.PAYMENT_SERVICE_URL || "http://payment-service:3000";
const AUTH_SERVICE_URL =
  process.env.AUTH_SERVICE_URL || "http://auth-service:3000";

const getAuthUser = async (userId: string) => {
  const authResponse = await fetch(
    `${AUTH_SERVICE_URL}/api/auth/internal/${userId}`,
    {
      headers: { "internal-api-key": process.env.INTERNAL_API_KEY || "" },
    },
  );

  const result = await authResponse.json();
  return result.data;
};

export const buyTicket = async (eventId: string, userId: string) => {
  const eventResponse = await fetch(
    `${EVENT_SERVICE_URL}/api/events/internal/${eventId}`,
    {
      headers: { "internal-api-key": process.env.INTERNAL_API_KEY || "" },
    },
  );

  if (!eventResponse.ok) {
    throw new AppError("Événement non trouvé.", 404);
  }

  const eventResult = await eventResponse.json();
  const event = eventResult.data;

  if (event.availableStock <= 0 || event.status === EventStatus.SOLD_OUT) {
    throw new AppError("Aucune place disponible.", 409);
  }

  if (event.status !== EventStatus.PUBLISHED) {
    throw new AppError("Cet événement n'est pas disponible.", 400);
  }

  const ticket = await prisma.ticket.create({
    data: {
      eventId,
      userId,
      status: TicketStatus.PENDING,
      qrCode: null,
    },
  });

  const authUser = await getAuthUser(userId);

  const paymentResponse = await fetch(`${PAYMENT_SERVICE_URL}/api/payments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "internal-api-key": process.env.INTERNAL_API_KEY || "",
    },
    body: JSON.stringify({
      ticketId: ticket.id,
      userId,
      amountInCents: event.price,
    }),
  });

  const paymentResult = await paymentResponse.json();

  if (!paymentResponse.ok || paymentResult.data?.status === "FAILED") {
    await prisma.ticket.update({
      where: { id: ticket.id },
      data: { status: TicketStatus.CANCELLED },
    });

    try {
      await publishNotification({
        template: "PAYMENT_FAILED",
        to: authUser.email,
        data: { eventName: event.title },
      });
    } catch (error) {
      await logger.warn(
        `Failed to publish PAYMENT_FAILED notification for ${authUser.email}`,
        { userId },
      );
    }

    throw new AppError("Le paiement a échoué.", 502);
  }

  const updatedTicket = await prisma.ticket.update({
    where: { id: ticket.id },
    data: {
      status: TicketStatus.CONFIRMED,
      paymentId: paymentResult.data.id,
      qrCode: generateQrCode({
        ticketId: ticket.id,
        userId: ticket.userId,
        eventId: ticket.eventId,
      }),
      purchasedAt: new Date(),
    },
  });

  const decrementResponse = await fetch(
    `${EVENT_SERVICE_URL}/api/events/${eventId}/decrement`,
    {
      method: "POST",
      headers: { "internal-api-key": process.env.INTERNAL_API_KEY || "" },
    },
  );

  if (!decrementResponse.ok) {
    throw new AppError(
      "Erreur lors de la mise à jour du stock de l'événement.",
      502,
    );
  }

  try {
    await publishNotification({
      template: "TICKET_CONFIRMED",
      to: authUser.email,
      data: {
        eventName: event.title,
        eventDate: event.date,
        location: event.location,
        ticketId: updatedTicket.id,
        qrCode: updatedTicket.qrCode,
        amountInCents: event.price,
      },
    });
  } catch (error) {
    await logger.warn(
      `Failed to publish TICKET_CONFIRMED notification for ${authUser.email}`,
      { userId },
    );
  }

  await logger.info(`Ticket purchased successfully: ${updatedTicket.id}`, {
    userId,
  });

  return updatedTicket;
};

export const getTicketById = async (
  id: string,
  userId: string,
  userRole: string,
) => {
  const ticket = await prisma.ticket.findUnique({
    where: { id },
  });

  if (!ticket) {
    throw new AppError("Billet non trouvé.", 404);
  }

  if (userRole !== Role.ADMIN && ticket.userId !== userId) {
    throw new AppError("Vous n'êtes pas autorisé à voir ce billet.", 403);
  }

  await logger.info(`Ticket retrieved successfully: ${id}`, {
    userId,
  });

  return ticket;
};

export const getTicketsByUserId = async (userId: string) => {
  const tickets = await prisma.ticket.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  await logger.info(`User tickets retrieved successfully: ${tickets.length}`, {
    userId,
  });

  return tickets;
};

export const getTicketsByEventId = async (eventId: string) => {
  const tickets = await prisma.ticket.findMany({
    where: { eventId },
    orderBy: { createdAt: "desc" },
  });

  await logger.info(`Event tickets retrieved successfully: ${tickets.length}`);

  return tickets;
};

export const validateTicket = async (id: string) => {
  const ticket = await prisma.ticket.findUnique({
    where: { id },
  });

  if (!ticket) {
    throw new AppError("Billet non trouvé.", 404);
  }

  if (ticket.status === TicketStatus.USED) {
    throw new AppError("Ce billet a déjà été utilisé.", 409);
  }

  if (ticket.status !== TicketStatus.CONFIRMED) {
    throw new AppError("Ce billet ne peut pas être validé.", 400);
  }

  if (!ticket.qrCode) {
    throw new AppError("QR code manquant.", 400);
  }

  const decoded = verifyQrCode(ticket.qrCode);

  if (
    decoded.ticketId !== ticket.id ||
    decoded.userId !== ticket.userId ||
    decoded.eventId !== ticket.eventId
  ) {
    throw new AppError("QR code invalide.", 400);
  }

  const updatedTicket = await prisma.ticket.update({
    where: { id },
    data: { status: TicketStatus.USED },
  });

  await logger.info(`Ticket validated successfully: ${id}`, {
    userId: ticket.userId,
  });

  return updatedTicket;
};

export const cancelTicket = async (
  id: string,
  userId: string,
  userRole: string,
) => {
  const ticket = await prisma.ticket.findUnique({
    where: { id },
  });

  if (!ticket) {
    throw new AppError("Billet non trouvé.", 404);
  }

  if (ticket.status === TicketStatus.CANCELLED) {
    throw new AppError("Ce billet est déjà annulé.", 409);
  }

  if (ticket.status === TicketStatus.USED) {
    throw new AppError("Ce billet a déjà été utilisé.", 400);
  }

  if (userRole !== Role.ADMIN && ticket.userId !== userId) {
    throw new AppError("Vous n'êtes pas autorisé à annuler ce billet.", 403);
  }

  const cancelledTicket = await prisma.ticket.update({
    where: { id },
    data: { status: TicketStatus.CANCELLED },
  });

  await logger.info(`Ticket cancelled successfully: ${id}`, {
    userId,
  });

  return cancelledTicket;
};
