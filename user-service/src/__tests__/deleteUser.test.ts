import { deleteUser } from "../business/userService";
import { prisma } from "../data/prismaClient";

describe("UserService - deleteUser", () => {
  it("should throw AppError if user is not found", async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(deleteUser("auth-123")).rejects.toThrow(
      "Utilisateur non trouvé.",
    );
  });

  it("should throw AppError if user is already deleted", async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: "user-123",
      authId: "auth-123",
      deletedAt: new Date(),
    });

    await expect(deleteUser("auth-123")).rejects.toThrow(
      "Cet utilisateur a déjà été supprimé.",
    );
  });

  it("should delete user successfully", async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: "user-123",
      authId: "auth-123",
      deletedAt: null,
    });

    (prisma.user.update as jest.Mock).mockResolvedValue({
      id: "user-123",
      authId: "auth-123",
      deletedAt: new Date(),
    });

    await expect(deleteUser("auth-123")).resolves.not.toThrow();

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { authId: "auth-123" },
      data: { deletedAt: expect.any(Date) },
    });
  });
});
