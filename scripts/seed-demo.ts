import { closeDatabaseConnection } from "../src/lib/db";
import { getSeedEnv } from "../src/lib/env";
import { seedDemoData } from "../src/server/services/demo-seed.service";

async function main(): Promise<void> {
  const result = await seedDemoData(getSeedEnv());

  console.log(
    JSON.stringify(
      {
        demoTenant: result.demoTenant,
        submissions: result.submissions,
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
    console.error(error instanceof Error ? error.message : "Demo seed failed");
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeDatabaseConnection();
  });
