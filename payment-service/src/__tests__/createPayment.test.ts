import { createPayment } from "../business/paymentService";
import { prisma } from "../data/prismaClient";
import stripe from "../business/config/stripe";
import { PaymentStatus } from "@prisma/client";

describe("PaymentService - createPayment", () => {
  it("should throw AppError if payment already exists for ticket", async () => {
    (prisma.payment.findUnique as jest.Mock).mockResolvedValue({
      id: "payment-123",
      ticketId: "ticket-123",
    });

    await expect(createPayment("ticket-123", "user-123", 1000)).rejects.toThrow(
      "Un paiement existe déjà pour ce billet.",
    );
  });

  it("should save FAILED payment and throw if Stripe throws", async () => {
    (prisma.payment.findUnique as jest.Mock).mockResolvedValue(null);

    (stripe.paymentIntents.create as jest.Mock).mockRejectedValue(
      new Error("Card declined"),
    );

    (prisma.payment.create as jest.Mock).mockResolvedValue({});

    await expect(createPayment("ticket-123", "user-123", 1000)).rejects.toThrow(
      "Paiement Stripe échoué : Card declined",
    );

    expect(prisma.payment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: PaymentStatus.FAILED }),
      }),
    );
  });

  it("should save FAILED payment and throw if PaymentIntent status is not succeeded", async () => {
    (prisma.payment.findUnique as jest.Mock).mockResolvedValue(null);

    (stripe.paymentIntents.create as jest.Mock).mockResolvedValue({
      id: "pi-123",
      status: "requires_action",
    });

    (prisma.payment.create as jest.Mock).mockResolvedValue({});

    await expect(createPayment("ticket-123", "user-123", 1000)).rejects.toThrow(
      "Paiement non abouti. Statut Stripe : requires_action",
    );

    expect(prisma.payment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: PaymentStatus.FAILED }),
      }),
    );
  });

  it("should create payment successfully", async () => {
    (prisma.payment.findUnique as jest.Mock).mockResolvedValue(null);

    (stripe.paymentIntents.create as jest.Mock).mockResolvedValue({
      id: "pi-123",
      status: "succeeded",
    });

    (prisma.payment.create as jest.Mock).mockResolvedValue({
      id: "payment-123",
      ticketId: "ticket-123",
      userId: "user-123",
      amount: 1000,
      currency: "EUR",
      status: PaymentStatus.SUCCESS,
      stripePaymentIntentId: "pi-123",
    });

    const result = await createPayment("ticket-123", "user-123", 1000);

    expect(result.status).toBe(PaymentStatus.SUCCESS);
    expect(result.stripePaymentIntentId).toBe("pi-123");
    expect(prisma.payment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: PaymentStatus.SUCCESS }),
      }),
    );
  });
});
