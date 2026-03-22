import Stripe from "stripe";
import stripe from "./config/stripe";
import { prisma } from "../data/prismaClient";
import { AppError } from "./config/appError";
import { PaymentStatus } from "@prisma/client";
import { Role } from "./types/enums/role";
import { TicketDto } from "./types/ticketDto";
import { publishNotification } from "./publisher/notificationPublisher";

const TICKET_SERVICE_URL =
  process.env.TICKET_SERVICE_URL || "http://ticket-service:3000";
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

export const createPayment = async (
  ticketId: string,
  userId: string,
  amount: number,
  currency: string = "eur",
) => {
  const existing = await prisma.payment.findUnique({
    where: { ticketId },
  });

  if (existing) {
    throw new AppError("Un paiement existe déjà pour ce billet.", 409);
  }

  let paymentIntent: Stripe.PaymentIntent;
  try {
    paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      payment_method: "pm_card_visa",
      confirm: true,
      return_url: "https://future-frontend.com",
    });
  } catch (stripeError: any) {
    await prisma.payment.create({
      data: {
        ticketId,
        userId,
        amount,
        currency: currency.toUpperCase(),
        status: PaymentStatus.FAILED,
        providerName: "STRIPE",
      },
    });
    throw new AppError(`Paiement Stripe échoué : ${stripeError.message}`, 402);
  }

  if (paymentIntent.status !== "succeeded") {
    await prisma.payment.create({
      data: {
        ticketId,
        userId,
        amount,
        currency: currency.toUpperCase(),
        status: PaymentStatus.FAILED,
        providerName: "STRIPE",
        stripePaymentIntentId: paymentIntent.id,
      },
    });
    throw new AppError(
      `Paiement non abouti. Statut Stripe : ${paymentIntent.status}`,
      402,
    );
  }

  const payment = await prisma.payment.create({
    data: {
      ticketId,
      userId,
      amount,
      currency: currency.toUpperCase(),
      status: PaymentStatus.SUCCESS,
      providerName: "STRIPE",
      stripePaymentIntentId: paymentIntent.id,
    },
  });

  return payment;
};

export const getPaymentById = async (id: string) => {
  const payment = await prisma.payment.findUnique({
    where: { id },
  });

  if (!payment) {
    throw new AppError("Paiement non trouvé.", 404);
  }

  return payment;
};

export const getPaymentByTicketId = async (
  ticketId: string,
  userId: string,
  userRole: string,
) => {
  const payment = await prisma.payment.findUnique({
    where: { ticketId },
  });

  if (!payment) {
    throw new AppError("Paiement non trouvé.", 404);
  }

  if (userRole !== Role.ADMIN && payment.userId !== userId) {
    throw new AppError("Vous n'êtes pas autorisé à voir ce paiement.", 403);
  }

  return payment;
};

export const getPaymentsByUserId = async (userId: string) => {
  return await prisma.payment.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
};

export const getPaymentsByEventId = async (eventId: string) => {
  const ticketsResponse = await fetch(
    `${TICKET_SERVICE_URL}/api/tickets/internal/event/${eventId}`,
    {
      headers: { "internal-api-key": process.env.INTERNAL_API_KEY || "" },
    },
  );

  if (!ticketsResponse.ok) {
    throw new AppError("Événement non trouvé.", 404);
  }

  const ticketsResult = await ticketsResponse.json();
  const tickets: TicketDto[] = ticketsResult.data;

  const ticketIds = tickets.map((ticket: TicketDto) => ticket.id);

  return await prisma.payment.findMany({
    where: { ticketId: { in: ticketIds } },
    orderBy: { createdAt: "desc" },
  });
};

export const refundPayment = async (id: string) => {
  const payment = await prisma.payment.findUnique({
    where: { id },
  });

  if (!payment) {
    throw new AppError("Paiement non trouvé.", 404);
  }

  if (payment.status === PaymentStatus.REFUNDED) {
    throw new AppError("Ce paiement a déjà été remboursé.", 409);
  }

  if (payment.status !== PaymentStatus.SUCCESS) {
    throw new AppError(
      "Seuls les paiements réussis peuvent être remboursés.",
      400,
    );
  }

  if (!payment.stripePaymentIntentId) {
    throw new AppError("Aucun identifiant Stripe associé à ce paiement.", 500);
  }

  try {
    await stripe.refunds.create({
      payment_intent: payment.stripePaymentIntentId,
    });
  } catch (stripeError: any) {
    throw new AppError(
      `Remboursement Stripe échoué : ${stripeError.message}`,
      402,
    );
  }

  const updatedPayment = await prisma.payment.update({
    where: { id },
    data: { status: PaymentStatus.REFUNDED },
  });

  const authUser = await getAuthUser(payment.userId);

  try {
    await publishNotification({
      template: "PAYMENT_REFUNDED",
      to: authUser.email,
      data: {
        amount: payment.amount,
        currency: payment.currency,
      },
    });
  } catch (error: any) {
    console.error("Erreur publication notification:", error.message);
    // TODO: publish an event for the log queue
  }

  return updatedPayment;
};
