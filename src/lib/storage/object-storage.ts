import {
  DeleteObjectCommand,
  GetObjectCommand,
  type GetObjectCommandOutput,
  PutObjectCommand,
  type PutObjectCommandInput,
  S3Client
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { z } from "zod";
import { env } from "../env";

const storageKeySchema = z.object({
  filename: z.string().trim().min(1),
  submissionId: z.string().uuid(),
  tenantId: z.string().uuid()
});

export type ObjectBody = PutObjectCommandInput["Body"];

export type ObjectStorageClient = Pick<S3Client, "send">;

export type StoredObjectReference = {
  bucket: string;
  key: string;
};

export type PutObjectInput = {
  body: ObjectBody;
  contentType?: string;
  key: string;
  metadata?: Record<string, string>;
};

export type ObjectStorageConfig = {
  bucket: string;
  endpoint: string;
  region: string;
};

let cachedClient: S3Client | undefined;

export function getObjectStorageConfig(): ObjectStorageConfig {
  return {
    bucket: env.MINIO_BUCKET,
    endpoint: env.MINIO_ENDPOINT,
    region: env.MINIO_REGION
  };
}

export function getObjectStorageClient(): S3Client {
  cachedClient ??= new S3Client({
    credentials: {
      accessKeyId: env.MINIO_ACCESS_KEY,
      secretAccessKey: env.MINIO_SECRET_KEY
    },
    endpoint: env.MINIO_ENDPOINT,
    forcePathStyle: true,
    region: env.MINIO_REGION
  });

  return cachedClient;
}

export function resetObjectStorageClientForTests(): void {
  cachedClient = undefined;
}

export function buildTenantStorageKey(
  tenantId: string,
  submissionId: string,
  filename: string
): string {
  const parsed = storageKeySchema.parse({
    filename,
    submissionId,
    tenantId
  });
  const safeFilename = sanitizeFilename(parsed.filename);

  return `tenants/${parsed.tenantId}/submissions/${parsed.submissionId}/${safeFilename}`;
}

export function buildTenantReportStorageKey(
  tenantId: string,
  submissionId: string,
  filename: string
): string {
  const parsed = storageKeySchema.parse({
    filename,
    submissionId,
    tenantId
  });
  const safeFilename = sanitizeFilename(parsed.filename);

  return `tenants/${parsed.tenantId}/submissions/${parsed.submissionId}/reports/${safeFilename}`;
}

export async function putObject(
  input: PutObjectInput,
  client: ObjectStorageClient = getObjectStorageClient()
): Promise<StoredObjectReference> {
  await client.send(
    new PutObjectCommand({
      Body: input.body,
      Bucket: env.MINIO_BUCKET,
      ContentType: input.contentType,
      Key: input.key,
      Metadata: input.metadata
    })
  );

  return {
    bucket: env.MINIO_BUCKET,
    key: input.key
  };
}

export async function getObject(
  key: string,
  client: ObjectStorageClient = getObjectStorageClient()
): Promise<GetObjectCommandOutput> {
  return client.send(
    new GetObjectCommand({
      Bucket: env.MINIO_BUCKET,
      Key: key
    })
  );
}

export async function deleteObject(
  key: string,
  client: ObjectStorageClient = getObjectStorageClient()
): Promise<StoredObjectReference> {
  await client.send(
    new DeleteObjectCommand({
      Bucket: env.MINIO_BUCKET,
      Key: key
    })
  );

  return {
    bucket: env.MINIO_BUCKET,
    key
  };
}

export async function getPresignedUploadUrl(
  input: {
    contentType?: string;
    expiresInSeconds?: number;
    key: string;
  },
  client: S3Client = getObjectStorageClient()
): Promise<string> {
  return getSignedUrl(
    client,
    new PutObjectCommand({
      Bucket: env.MINIO_BUCKET,
      ContentType: input.contentType,
      Key: input.key
    }),
    {
      expiresIn: input.expiresInSeconds ?? 300
    }
  );
}

export async function getPresignedDownloadUrl(
  input: {
    expiresInSeconds?: number;
    key: string;
  },
  client: S3Client = getObjectStorageClient()
): Promise<string> {
  return getSignedUrl(
    client,
    new GetObjectCommand({
      Bucket: env.MINIO_BUCKET,
      Key: input.key
    }),
    {
      expiresIn: input.expiresInSeconds ?? 300
    }
  );
}

function sanitizeFilename(filename: string): string {
  const basename = filename.split(/[\\/]/).pop()?.trim() ?? "";
  const withoutControlCharacters = basename.replace(/[\u0000-\u001f\u007f]/g, "");
  const safeFilename = withoutControlCharacters
    .replace(/^\.+/, "")
    .replace(/[^A-Za-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 160);

  return safeFilename || "file";
}
