import { updateUser } from "../business/userService";
import { prisma } from "../data/prismaClient";

describe("UserService - updateUser", () => {
  it("should throw AppError if user is not found", async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(
      updateUser("auth-123", {
        firstName: "John",
        lastName: "Doe",
        phone: "0612345678",
        avatarUrl: "https://avatar.com",
      }),
    ).rejects.toThrow("Utilisateur non trouvé.");
  });

  it("should throw AppError if user is deleted", async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: "user-123",
      authId: "auth-123",
      deletedAt: new Date(),
    });

    await expect(
      updateUser("auth-123", {
        firstName: "John",
        lastName: "Doe",
        phone: "0612345678",
        avatarUrl: "https://avatar.com",
      }),
    ).rejects.toThrow("Utilisateur non trouvé.");
  });

  it("should update user successfully", async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: "user-123",
      authId: "auth-123",
      deletedAt: null,
    });

    (prisma.user.update as jest.Mock).mockResolvedValue({
      id: "user-123",
      authId: "auth-123",
      firstName: "John",
      lastName: "Doe",
      phone: "0612345678",
      avatarUrl: "https://avatar.com",
    });

    const result = await updateUser("auth-123", {
      firstName: "John",
      lastName: "Doe",
      phone: "0612345678",
      avatarUrl: "https://avatar.com",
    });

    expect(result.firstName).toBe("John");
    expect(result.phone).toBe("0612345678");
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { authId: "auth-123" },
      data: {
        firstName: "John",
        lastName: "Doe",
        phone: "0612345678",
        avatarUrl: "https://avatar.com",
      },
    });
  });
});
