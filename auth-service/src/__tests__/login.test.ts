import { login } from "../business/authService";
import { prisma } from "../data/prismaClient";
import bcrypt from "bcrypt";

jest.mock("bcrypt", () => ({
  hash: jest.fn().mockResolvedValue("hashed_password"),
  compare: jest.fn(),
}));

describe("AuthService - login", () => {
  it("should throw AppError if email or password is missing", async () => {
    await expect(
      login({
        email: "",
        password: "",
      }),
    ).rejects.toThrow("Email et mot de passe sont requis.");
  });

  it("should throw AppError if user is not found", async () => {
    (prisma.authUser.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(
      login({
        email: "john@example.com",
        password: "Password1",
      }),
    ).rejects.toThrow("Email ou mot de passe incorrect.");
  });

  it("should throw AppError if user is not active", async () => {
    (prisma.authUser.findUnique as jest.Mock).mockResolvedValue({
      id: "123",
      email: "john@example.com",
      passwordHash: "hashed_password",
      isActive: false,
      deletedAt: null,
    });

    await expect(
      login({
        email: "john@example.com",
        password: "Password1",
      }),
    ).rejects.toThrow(
      "Veuillez confirmer votre email avant de vous connecter.",
    );
  });

  it("should throw AppError if user is deleted", async () => {
    (prisma.authUser.findUnique as jest.Mock).mockResolvedValue({
      id: "123",
      email: "john@example.com",
      passwordHash: "hashed_password",
      isActive: true,
      deletedAt: new Date(),
    });

    await expect(
      login({
        email: "john@example.com",
        password: "Password1",
      }),
    ).rejects.toThrow("Votre compte à été supprimé.");
  });

  it("should throw AppError if password is invalid", async () => {
    (prisma.authUser.findUnique as jest.Mock).mockResolvedValue({
      id: "123",
      email: "john@example.com",
      passwordHash: "hashed_password",
      isActive: true,
      deletedAt: null,
    });

    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    await expect(
      login({
        email: "john@example.com",
        password: "WrongPassword1",
      }),
    ).rejects.toThrow("Email ou mot de passe incorrect.");
  });

  it("should return loginResponse if credentials are valid", async () => {
    (prisma.authUser.findUnique as jest.Mock).mockResolvedValue({
      id: "123",
      email: "john@example.com",
      passwordHash: "hashed_password",
      isActive: true,
      deletedAt: null,
      role: "USER",
    });

    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    const result = await login({
      email: "john@example.com",
      password: "Password1",
    });

    expect(result).toHaveProperty("accessToken");
    expect(result.email).toBe("john@example.com");
    expect(result.role).toBe("USER");
  });
});
