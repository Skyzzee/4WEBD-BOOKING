import { processNotification } from "../business/notificationService";

jest.mock("nodemailer", () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({ messageId: "test-id" }),
  }),
}));

describe("NotificationService - processNotification", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should throw an error if template is not found", async () => {
    await expect(
      processNotification("UNKNOWN_TEMPLATE", "user@example.com", {}),
    ).rejects.toThrow("Template UNKNOWN_TEMPLATE non reconnu.");
  });

  it("should send email with WELCOME_EMAIL template", async () => {
    await expect(
      processNotification("WELCOME_EMAIL", "user@example.com", {}),
    ).resolves.not.toThrow();
  });

  it("should send email with TICKET_CONFIRMED template", async () => {
    await expect(
      processNotification("TICKET_CONFIRMED", "user@example.com", {
        eventName: "Concert",
        eventDate: new Date().toISOString(),
        location: "Paris",
        ticketId: "ticket-123",
        amountInCents: 2500,
      }),
    ).resolves.not.toThrow();
  });

  it("should send email with PAYMENT_REFUNDED template", async () => {
    await expect(
      processNotification("PAYMENT_REFUNDED", "user@example.com", {
        amount: 2500,
        currency: "EUR",
      }),
    ).resolves.not.toThrow();
  });
});
