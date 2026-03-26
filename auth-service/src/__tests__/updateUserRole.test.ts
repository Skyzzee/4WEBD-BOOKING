import { updateUserRole } from "../business/authService";
import { prisma } from "../data/prismaClient";
import { Role } from "@prisma/client";

describe("AuthService - updateUserRole", () => {
  it("should throw AppError if user is not found", async () => {
    (prisma.authUser.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(updateUserRole("123", Role.ADMIN)).rejects.toThrow(
      "Utilisateur non trouvé.",
    );
  });

  it("should throw AppError if user is deleted", async () => {
    (prisma.authUser.findUnique as jest.Mock).mockResolvedValue({
      id: "123",
      email: "john@example.com",
      deletedAt: new Date(),
    });

    await expect(updateUserRole("123", Role.ADMIN)).rejects.toThrow(
      "Utilisateur non trouvé.",
    );
  });

  it("should update user role successfully", async () => {
    (prisma.authUser.findUnique as jest.Mock).mockResolvedValue({
      id: "123",
      email: "john@example.com",
      deletedAt: null,
    });

    (prisma.authUser.update as jest.Mock).mockResolvedValue({
      id: "123",
      email: "john@example.com",
      role: Role.ADMIN,
    });

    const result = await updateUserRole("123", Role.ADMIN);

    expect(result.role).toBe(Role.ADMIN);
    expect(prisma.authUser.update).toHaveBeenCalledWith({
      where: { id: "123" },
      data: { role: Role.ADMIN },
    });
  });
});
