import { deleteUser } from "../business/authService";
import { prisma } from "../data/prismaClient";

describe("AuthService - deleteUser", () => {
  it("should throw AppError if user is not found", async () => {
    (prisma.authUser.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(deleteUser("123")).rejects.toThrow("Utilisateur non trouvé.");
  });

  it("should throw AppError if user is already deleted", async () => {
    (prisma.authUser.findUnique as jest.Mock).mockResolvedValue({
      id: "123",
      email: "john@example.com",
      deletedAt: new Date(),
    });

    await expect(deleteUser("123")).rejects.toThrow(
      "Cet utilisateur a déjà été supprimé.",
    );
  });

  it("should rollback if user-service fails", async () => {
    (prisma.authUser.findUnique as jest.Mock).mockResolvedValue({
      id: "123",
      email: "john@example.com",
      deletedAt: null,
    });

    (prisma.authUser.update as jest.Mock).mockResolvedValue({
      id: "123",
      deletedAt: new Date(),
    });

    (global.fetch as jest.Mock).mockResolvedValue({ ok: false });

    await expect(deleteUser("123")).rejects.toThrow(
      "Erreur lors de la suppression du profil utilisateur.",
    );

    expect(prisma.authUser.update).toHaveBeenLastCalledWith({
      where: { id: "123" },
      data: { deletedAt: null, isActive: true },
    });
  });

  it("should delete user successfully", async () => {
    (prisma.authUser.findUnique as jest.Mock).mockResolvedValue({
      id: "123",
      email: "john@example.com",
      deletedAt: null,
    });

    (prisma.authUser.update as jest.Mock).mockResolvedValue({
      id: "123",
      deletedAt: new Date(),
    });

    (global.fetch as jest.Mock).mockResolvedValue({ ok: true });

    await expect(deleteUser("123")).resolves.not.toThrow();

    expect(prisma.authUser.update).toHaveBeenCalledWith({
      where: { id: "123" },
      data: { deletedAt: expect.any(Date) },
    });
  });
});
