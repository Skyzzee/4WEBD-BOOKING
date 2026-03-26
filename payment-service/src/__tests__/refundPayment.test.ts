import { refundPayment } from "../business/paymentService";
import { prisma } from "../data/prismaClient";
import stripe from "../business/config/stripe";
import { PaymentStatus } from "@prisma/client";

describe("PaymentService - refundPayment", () => {
  it("should throw AppError if payment is not found", async () => {
    (prisma.payment.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(refundPayment("payment-123")).rejects.toThrow(
      "Paiement non trouvé.",
    );
  });

  it("should throw AppError if payment is already refunded", async () => {
    (prisma.payment.findUnique as jest.Mock).mockResolvedValue({
      id: "payment-123",
      status: PaymentStatus.REFUNDED,
    });

    await expect(refundPayment("payment-123")).rejects.toThrow(
      "Ce paiement a déjà été remboursé.",
    );
  });

  it("should throw AppError if payment is not SUCCESS", async () => {
    (prisma.payment.findUnique as jest.Mock).mockResolvedValue({
      id: "payment-123",
      status: PaymentStatus.FAILED,
    });

    await expect(refundPayment("payment-123")).rejects.toThrow(
      "Seuls les paiements réussis peuvent être remboursés.",
    );
  });

  it("should throw AppError if no stripePaymentIntentId", async () => {
    (prisma.payment.findUnique as jest.Mock).mockResolvedValue({
      id: "payment-123",
      status: PaymentStatus.SUCCESS,
      stripePaymentIntentId: null,
    });

    await expect(refundPayment("payment-123")).rejects.toThrow(
      "Aucun identifiant Stripe associé à ce paiement.",
    );
  });

  it("should throw AppError if Stripe refund fails", async () => {
    (prisma.payment.findUnique as jest.Mock).mockResolvedValue({
      id: "payment-123",
      status: PaymentStatus.SUCCESS,
      stripePaymentIntentId: "pi-123",
      userId: "user-123",
    });

    (stripe.refunds.create as jest.Mock).mockRejectedValue(
      new Error("Refund failed"),
    );

    await expect(refundPayment("payment-123")).rejects.toThrow(
      "Remboursement Stripe échoué : Refund failed",
    );
  });

  it("should refund payment successfully", async () => {
    (prisma.payment.findUnique as jest.Mock).mockResolvedValue({
      id: "payment-123",
      status: PaymentStatus.SUCCESS,
      stripePaymentIntentId: "pi-123",
      userId: "user-123",
      amount: 1000,
      currency: "EUR",
    });

    (stripe.refunds.create as jest.Mock).mockResolvedValue({
      id: "refund-123",
    });

    (prisma.payment.update as jest.Mock).mockResolvedValue({
      id: "payment-123",
      status: PaymentStatus.REFUNDED,
    });

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest
        .fn()
        .mockResolvedValue({ data: { email: "user@example.com" } }),
    });

    const result = await refundPayment("payment-123");

    expect(result.status).toBe(PaymentStatus.REFUNDED);
    expect(stripe.refunds.create).toHaveBeenCalledWith({
      payment_intent: "pi-123",
    });
    expect(prisma.payment.update).toHaveBeenCalledWith({
      where: { id: "payment-123" },
      data: { status: PaymentStatus.REFUNDED },
    });
  });
});
