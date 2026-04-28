import { NextResponse } from "next/server";
import { checkDatabaseConnection } from "@/lib/db";
import { validateCurrentEnv, type Env } from "@/lib/env";

export const dynamic = "force-dynamic";

type HealthStatus = "ok" | "error" | "skipped";

type HealthComponent = {
  status: HealthStatus;
  message?: string;
  latencyMs?: number;
};

function errorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message.trim() || error.name || "Unknown error";
  }

  return "Unknown error";
}

function checkConfig(): { component: HealthComponent; env?: Env } {
  const result = validateCurrentEnv();

  if (result.success) {
    return {
      component: {
        status: "ok"
      },
      env: result.env
    };
  }

  return {
    component: {
      status: "error",
      message: errorMessage(result.error)
    }
  };
}

function checkStorageConfig(env: Env | undefined): HealthComponent {
  if (!env) {
    return {
      status: "skipped",
      message: "Storage config check skipped because environment validation failed"
    };
  }

  return {
    status: "ok",
    message: "MinIO/S3-compatible storage configuration is present"
  };
}

async function checkDatabase(env: Env | undefined): Promise<HealthComponent> {
  if (!env) {
    return {
      status: "skipped",
      message: "Database check skipped because environment validation failed"
    };
  }

  try {
    const result = await checkDatabaseConnection();

    return {
      status: "ok",
      latencyMs: result.latencyMs
    };
  } catch (error) {
    return {
      status: "error",
      message: errorMessage(error)
    };
  }
}

export async function GET() {
  const config = checkConfig();
  const database = await checkDatabase(config.env);
  const storage = checkStorageConfig(config.env);
  const isHealthy =
    config.component.status === "ok" &&
    database.status === "ok" &&
    storage.status === "ok";

  return NextResponse.json(
    {
      status: isHealthy ? "ok" : "degraded",
      app: {
        status: "ok"
      },
      config: config.component,
      database,
      storage
    },
    {
      status: isHealthy ? 200 : 503
    }
  );
}
