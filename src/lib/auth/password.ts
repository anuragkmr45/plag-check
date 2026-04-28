import argon2 from "argon2";

const argon2idOptions = {
  memoryCost: 19_456,
  parallelism: 1,
  timeCost: 2,
  type: argon2.argon2id
} satisfies argon2.Options & { type: typeof argon2.argon2id };

export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, argon2idOptions);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return argon2.verify(hash, password);
}
