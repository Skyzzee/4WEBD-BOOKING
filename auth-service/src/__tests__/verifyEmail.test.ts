import { verifyEmail } from "../business/authService";
import { prisma } from "../data/prismaClient";
import * as tokenJwt from "../business/config/tokenJwt";
import { VerificationTokenType } from "../business/types/tokens/verificationTokenDto";

jest.mock("../business/config/tokenJwt", () => ({
  verifyToken: jest.fn(),
  generateToken: jest.fn(),
}));

describe("AuthService - verifyEmail", () => {
  it("should throw AppError if token type is invalid", async () => {
    (tokenJwt.verifyToken as jest.Mock).mockReturnValue({
      userId: "123",
      email: "john@example.com",
      type: VerificationTokenType.PASSWORD_RESET,
    });

    await expect(verifyEmail("invalid-token")).rejects.toThrow(
      "Token invalide.",
    );
  });

  it("should throw AppError if user is not found", async () => {
    (tokenJwt.verifyToken as jest.Mock).mockReturnValue({
      userId: "123",
      email: "john@example.com",
      type: VerificationTokenType.EMAIL_CONFIRMATION,
    });

    (prisma.authUser.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(verifyEmail("valid-token")).rejects.toThrow(
      "Utilisateur non trouvé.",
    );
  });

  it("should throw AppError if account is already active", async () => {
    (tokenJwt.verifyToken as jest.Mock).mockReturnValue({
      userId: "123",
      email: "john@example.com",
      type: VerificationTokenType.EMAIL_CONFIRMATION,
    });

    (prisma.authUser.findUnique as jest.Mock).mockResolvedValue({
      id: "123",
      email: "john@example.com",
      isActive: true,
    });

    await expect(verifyEmail("valid-token")).rejects.toThrow(
      "Ce compte est déjà activé.",
    );
  });

  it("should activate user account successfully", async () => {
    (tokenJwt.verifyToken as jest.Mock).mockReturnValue({
      userId: "123",
      email: "john@example.com",
      type: VerificationTokenType.EMAIL_CONFIRMATION,
    });

    (prisma.authUser.findUnique as jest.Mock).mockResolvedValue({
      id: "123",
      email: "john@example.com",
      isActive: false,
    });

    (prisma.authUser.update as jest.Mock).mockResolvedValue({
      id: "123",
      email: "john@example.com",
      isActive: true,
    });

    await expect(verifyEmail("valid-token")).resolves.not.toThrow();
    expect(prisma.authUser.update).toHaveBeenCalledWith({
      where: { id: "123" },
      data: { isActive: true },
    });
  });
});
