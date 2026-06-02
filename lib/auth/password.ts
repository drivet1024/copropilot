import bcrypt from "bcryptjs";

export async function verifyPassword(
  plainPassword: string,
  passwordHash: string
) {
  return bcrypt.compare(plainPassword, passwordHash);
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}