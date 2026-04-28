import { closeDatabaseConnection } from "../src/lib/db";
import { getSeedEnv } from "../src/lib/env";
import { seedDatabase } from "../src/server/services/seed.service";

async function main(): Promise<void> {
  const result = await seedDatabase(getSeedEnv());

  console.log(
    JSON.stringify(
      {
        demoTenant: result.demoTenant,
        users: result.users.map((user) => ({
          email: user.email,
          id: user.id,
          role: user.role,
          tenantId: user.tenantId
        }))
      },
      null,
      2
    )
  );
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : "Seed failed");
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeDatabaseConnection();
  });
