import { createUser } from "../business/userService";
import { prisma } from "../data/prismaClient";

describe("UserService - createUser", () => {
  it("should throw AppError if user already exists", async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: "user-123",
      authId: "auth-123",
    });

    await expect(
      createUser({
        authId: "auth-123",
        firstName: "John",
        lastName: "Doe",
      }),
    ).rejects.toThrow("Un profil existe déjà pour cet utilisateur.");
  });

  it("should create user successfully", async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    (prisma.user.create as jest.Mock).mockResolvedValue({
      id: "user-123",
      authId: "auth-123",
      firstName: "John",
      lastName: "Doe",
    });

    const result = await createUser({
      authId: "auth-123",
      firstName: "John",
      lastName: "Doe",
    });

    expect(result.authId).toBe("auth-123");
    expect(result.firstName).toBe("John");
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        authId: "auth-123",
        firstName: "John",
        lastName: "Doe",
      },
    });
  });
});
