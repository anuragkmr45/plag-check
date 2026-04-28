import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "../src/lib/auth/password";

describe("password hashing", () => {
  it("hashes passwords with Argon2id and verifies only the correct password", async () => {
    const password = "correct horse battery staple";
    const hash = await hashPassword(password);

    expect(hash).not.toBe(password);
    expect(hash).toMatch(/^\$argon2id\$/);
    await expect(verifyPassword(password, hash)).resolves.toBe(true);
    await expect(verifyPassword("incorrect password", hash)).resolves.toBe(
      false
    );
  });
});
