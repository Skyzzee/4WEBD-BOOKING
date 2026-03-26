import { register } from "../business/authService";

jest.mock("bcrypt", () => ({
  hash: jest.fn().mockResolvedValue("hashed_password"),
  compare: jest.fn(),
}));

describe("AuthService - register", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should throw AppError if email is invalid", async () => {
    await expect(
      register({
        email: "invalid-email",
        password: "Password1",
        confirmPassword: "Password1",
        firstName: "John",
        lastName: "Doe",
      }),
    ).rejects.toThrow("Email invalide.");
  });

  it("should throw AppError if password is invalid", async () => {
    await expect(
      register({
        email: "john@example.com",
        password: "weak",
        confirmPassword: "weak",
        firstName: "John",
        lastName: "Doe",
      }),
    ).rejects.toThrow(
      "Le mot de passe doit contenir au moins 8 caractères, 1 majuscule et 1 chiffre.",
    );
  });

  it("should throw AppError if passwords do not match", async () => {
    await expect(
      register({
        email: "john@example.com",
        password: "Password1",
        confirmPassword: "Password2",
        firstName: "John",
        lastName: "Doe",
      }),
    ).rejects.toThrow("Les mots de passe ne correspondent pas.");
  });

  it("should throw AppError if firstName or lastName is missing", async () => {
    await expect(
      register({
        email: "john@example.com",
        password: "Password1",
        confirmPassword: "Password1",
        firstName: "",
        lastName: "Doe",
      }),
    ).rejects.toThrow("Le prénom et le nom sont obligatoires.");
  });
});
