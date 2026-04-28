import { sql } from "drizzle-orm";
import {
  boolean,
  bigint,
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  real,
  text,
  timestamp,
  uniqueIndex,
  uuid
} from "drizzle-orm/pg-core";

export const userRole = pgEnum("user_role", [
  "SUPER_ADMIN",
  "INSTITUTION_ADMIN",
  "REVIEWER",
  "USER"
]);

export const submissionStatus = pgEnum("submission_status", [
  "DRAFT",
  "UPLOADED",
  "EXTRACTING",
  "READY_FOR_SCAN",
  "SCAN_QUEUED",
  "SCANNING",
  "SCAN_COMPLETE",
  "UNDER_REVIEW",
  "HOLD",
  "CLEARED",
  "ESCALATED",
  "FAILED"
]);

export const supportTicketStatus = pgEnum("support_ticket_status", [
  "OPEN",
  "IN_PROGRESS",
  "RESOLVED",
  "CLOSED"
]);

export const appMetadata = pgTable("app_metadata", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`)
});

export const tenants = pgTable(
  "tenants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`)
  },
  (table) => [uniqueIndex("tenants_slug_unique").on(table.slug)]
);

export const tenantSettings = pgTable(
  "tenant_settings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    settings: jsonb("settings").notNull().default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`)
  },
  (table) => [
    uniqueIndex("tenant_settings_tenant_id_unique").on(table.tenantId),
    index("tenant_settings_tenant_id_idx").on(table.tenantId)
  ]
);

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").references(() => tenants.id, {
      onDelete: "cascade"
    }),
    role: userRole("role").notNull(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`)
  },
  (table) => [
    uniqueIndex("users_email_unique").on(table.email),
    index("users_tenant_id_idx").on(table.tenantId),
    check(
      "users_tenant_required_unless_super_admin",
      sql`${table.role} = 'SUPER_ADMIN' OR ${table.tenantId} IS NOT NULL`
    )
  ]
);

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`)
  },
  (table) => [
    uniqueIndex("sessions_token_hash_unique").on(table.tokenHash),
    index("sessions_user_id_idx").on(table.userId),
    index("sessions_expires_at_idx").on(table.expiresAt)
  ]
);

export const auditEvents = pgTable(
  "audit_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    actorUserId: uuid("actor_user_id").references(() => users.id, {
      onDelete: "set null"
    }),
    tenantId: uuid("tenant_id").references(() => tenants.id, {
      onDelete: "set null"
    }),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id"),
    metadata: jsonb("metadata").notNull().default(sql`'{}'::jsonb`),
    ip: text("ip"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`)
  },
  (table) => [
    index("audit_events_tenant_id_created_at_idx").on(
      table.tenantId,
      table.createdAt
    ),
    index("audit_events_actor_user_id_idx").on(table.actorUserId),
    index("audit_events_action_idx").on(table.action),
    index("audit_events_entity_idx").on(table.entityType, table.entityId)
  ]
);

export const supportTickets = pgTable(
  "support_tickets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    createdByUserId: uuid("created_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    title: text("title").notNull(),
    description: text("description").notNull(),
    status: supportTicketStatus("status").notNull().default("OPEN"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`)
  },
  (table) => [
    index("support_tickets_tenant_id_idx").on(table.tenantId),
    index("support_tickets_created_by_user_id_idx").on(table.createdByUserId),
    index("support_tickets_status_idx").on(table.status),
    index("support_tickets_tenant_status_created_at_idx").on(
      table.tenantId,
      table.status,
      table.createdAt
    )
  ]
);

export const supportTicketComments = pgTable(
  "support_ticket_comments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    ticketId: uuid("ticket_id")
      .notNull()
      .references(() => supportTickets.id, { onDelete: "cascade" }),
    authorUserId: uuid("author_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`)
  },
  (table) => [
    index("support_ticket_comments_tenant_id_idx").on(table.tenantId),
    index("support_ticket_comments_ticket_id_idx").on(table.ticketId),
    index("support_ticket_comments_author_user_id_idx").on(table.authorUserId),
    index("support_ticket_comments_tenant_ticket_created_at_idx").on(
      table.tenantId,
      table.ticketId,
      table.createdAt
    )
  ]
);

export const submissions = pgTable(
  "submissions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    status: submissionStatus("status").notNull().default("DRAFT"),
    createdByUserId: uuid("created_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    assignedReviewerId: uuid("assigned_reviewer_id").references(
      () => users.id,
      { onDelete: "set null" }
    ),
    repositoryReuseConsentAt: timestamp("repository_reuse_consent_at", {
      withTimezone: true
    }),
    repositoryReuseConsentBy: uuid("repository_reuse_consent_by").references(
      () => users.id,
      { onDelete: "set null" }
    ),
    wordCount: integer("word_count"),
    metadata: jsonb("metadata").notNull().default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`)
  },
  (table) => [
    index("submissions_tenant_id_idx").on(table.tenantId),
    index("submissions_status_idx").on(table.status),
    index("submissions_created_by_user_id_idx").on(table.createdByUserId),
    index("submissions_assigned_reviewer_id_idx").on(table.assignedReviewerId),
    index("submissions_repository_reuse_consent_by_idx").on(
      table.repositoryReuseConsentBy
    ),
    index("submissions_tenant_status_created_at_idx").on(
      table.tenantId,
      table.status,
      table.createdAt
    ),
    check(
      "submissions_word_count_nonnegative",
      sql`${table.wordCount} IS NULL OR ${table.wordCount} >= 0`
    )
  ]
);

export const submissionFiles = pgTable(
  "submission_files",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    submissionId: uuid("submission_id")
      .notNull()
      .references(() => submissions.id, { onDelete: "cascade" }),
    originalFilename: text("original_filename").notNull(),
    storageBucket: text("storage_bucket").notNull(),
    storageKey: text("storage_key").notNull(),
    mimeType: text("mime_type").notNull(),
    fileSizeBytes: bigint("file_size_bytes", { mode: "number" }).notNull(),
    checksumSha256: text("checksum_sha256").notNull(),
    uploadedByUserId: uuid("uploaded_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`)
  },
  (table) => [
    index("submission_files_tenant_id_idx").on(table.tenantId),
    index("submission_files_submission_id_idx").on(table.submissionId),
    index("submission_files_uploaded_by_user_id_idx").on(table.uploadedByUserId),
    index("submission_files_checksum_sha256_idx").on(table.checksumSha256),
    uniqueIndex("submission_files_storage_object_unique").on(
      table.storageBucket,
      table.storageKey
    ),
    check(
      "submission_files_file_size_nonnegative",
      sql`${table.fileSizeBytes} >= 0`
    )
  ]
);

export const extractedTexts = pgTable(
  "extracted_texts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    submissionId: uuid("submission_id")
      .notNull()
      .references(() => submissions.id, { onDelete: "cascade" }),
    rawText: text("raw_text").notNull(),
    wordCount: integer("word_count").notNull(),
    charCount: integer("char_count").notNull(),
    extractionMethod: text("extraction_method").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`)
  },
  (table) => [
    index("extracted_texts_tenant_id_idx").on(table.tenantId),
    index("extracted_texts_submission_id_idx").on(table.submissionId),
    index("extracted_texts_tenant_submission_idx").on(
      table.tenantId,
      table.submissionId
    ),
    check("extracted_texts_word_count_nonnegative", sql`${table.wordCount} >= 0`),
    check("extracted_texts_char_count_nonnegative", sql`${table.charCount} >= 0`)
  ]
);

export const preprocessingRuns = pgTable(
  "preprocessing_runs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    submissionId: uuid("submission_id")
      .notNull()
      .references(() => submissions.id, { onDelete: "cascade" }),
    originalWordCount: integer("original_word_count").notNull(),
    sanitizedWordCount: integer("sanitized_word_count").notNull(),
    removedWordCount: integer("removed_word_count").notNull(),
    rulesApplied: jsonb("rules_applied").notNull().default(sql`'{}'::jsonb`),
    sanitizedText: text("sanitized_text").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`)
  },
  (table) => [
    index("preprocessing_runs_tenant_id_idx").on(table.tenantId),
    index("preprocessing_runs_submission_id_idx").on(table.submissionId),
    index("preprocessing_runs_tenant_submission_idx").on(
      table.tenantId,
      table.submissionId
    ),
    check(
      "preprocessing_runs_original_word_count_nonnegative",
      sql`${table.originalWordCount} >= 0`
    ),
    check(
      "preprocessing_runs_sanitized_word_count_nonnegative",
      sql`${table.sanitizedWordCount} >= 0`
    ),
    check(
      "preprocessing_runs_removed_word_count_nonnegative",
      sql`${table.removedWordCount} >= 0`
    )
  ]
);

export const textChunks = pgTable(
  "text_chunks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    submissionId: uuid("submission_id")
      .notNull()
      .references(() => submissions.id, { onDelete: "cascade" }),
    chunkIndex: integer("chunk_index").notNull(),
    text: text("text").notNull(),
    startChar: integer("start_char").notNull(),
    endChar: integer("end_char").notNull(),
    wordCount: integer("word_count").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`)
  },
  (table) => [
    index("text_chunks_tenant_id_idx").on(table.tenantId),
    index("text_chunks_submission_id_idx").on(table.submissionId),
    index("text_chunks_tenant_submission_idx").on(
      table.tenantId,
      table.submissionId
    ),
    uniqueIndex("text_chunks_submission_chunk_index_unique").on(
      table.tenantId,
      table.submissionId,
      table.chunkIndex
    ),
    check("text_chunks_chunk_index_nonnegative", sql`${table.chunkIndex} >= 0`),
    check("text_chunks_start_char_nonnegative", sql`${table.startChar} >= 0`),
    check("text_chunks_end_char_nonnegative", sql`${table.endChar} >= 0`),
    check("text_chunks_word_count_nonnegative", sql`${table.wordCount} >= 0`),
    check(
      "text_chunks_end_char_after_start_char",
      sql`${table.endChar} >= ${table.startChar}`
    )
  ]
);

export const scanJobs = pgTable(
  "scan_jobs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    submissionId: uuid("submission_id")
      .notNull()
      .references(() => submissions.id, { onDelete: "cascade" }),
    provider: text("provider").notNull(),
    scanMode: text("scan_mode").notNull().default("standard"),
    status: text("status").notNull(),
    attempts: integer("attempts").notNull().default(0),
    errorMessage: text("error_message"),
    startedAt: timestamp("started_at", { withTimezone: true }),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`)
  },
  (table) => [
    index("scan_jobs_tenant_id_idx").on(table.tenantId),
    index("scan_jobs_submission_id_idx").on(table.submissionId),
    index("scan_jobs_status_idx").on(table.status),
    index("scan_jobs_scan_mode_idx").on(table.scanMode),
    index("scan_jobs_tenant_submission_idx").on(
      table.tenantId,
      table.submissionId
    ),
    index("scan_jobs_tenant_status_created_at_idx").on(
      table.tenantId,
      table.status,
      table.createdAt
    ),
    check("scan_jobs_attempts_nonnegative", sql`${table.attempts} >= 0`),
    check(
      "scan_jobs_scan_mode_allowed",
      sql`${table.scanMode} IN ('standard', 'deep', 'fallback')`
    )
  ]
);

export const featureQuotaLimits = pgTable(
  "feature_quota_limits",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    featureKey: text("feature_key").notNull(),
    featureLabel: text("feature_label").notNull(),
    unitType: text("unit_type").notNull(),
    period: text("period").notNull(),
    limitUnits: integer("limit_units").notNull(),
    metadata: jsonb("metadata").notNull().default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`)
  },
  (table) => [
    index("feature_quota_limits_tenant_id_idx").on(table.tenantId),
    index("feature_quota_limits_feature_key_idx").on(table.featureKey),
    uniqueIndex("feature_quota_limits_tenant_feature_period_unique").on(
      table.tenantId,
      table.featureKey,
      table.period
    ),
    check("feature_quota_limits_limit_units_positive", sql`${table.limitUnits} > 0`),
    check(
      "feature_quota_limits_period_allowed",
      sql`${table.period} IN ('minute', 'day', 'month')`
    )
  ]
);

export const featureUsageEvents = pgTable(
  "feature_usage_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    userId: uuid("user_id").references(() => users.id, {
      onDelete: "set null"
    }),
    submissionId: uuid("submission_id").references(() => submissions.id, {
      onDelete: "set null"
    }),
    featureKey: text("feature_key").notNull(),
    featureLabel: text("feature_label").notNull(),
    unitsReserved: integer("units_reserved").notNull().default(0),
    unitsConsumed: integer("units_consumed").notNull().default(0),
    unitType: text("unit_type").notNull(),
    status: text("status").notNull(),
    period: text("period").notNull(),
    resetAt: timestamp("reset_at", { withTimezone: true }).notNull(),
    metadata: jsonb("metadata").notNull().default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`)
  },
  (table) => [
    index("feature_usage_events_tenant_id_idx").on(table.tenantId),
    index("feature_usage_events_user_id_idx").on(table.userId),
    index("feature_usage_events_submission_id_idx").on(table.submissionId),
    index("feature_usage_events_feature_period_idx").on(
      table.featureKey,
      table.period,
      table.createdAt
    ),
    index("feature_usage_events_tenant_feature_period_idx").on(
      table.tenantId,
      table.featureKey,
      table.period,
      table.createdAt
    ),
    index("feature_usage_events_status_idx").on(table.status),
    check(
      "feature_usage_events_units_reserved_nonnegative",
      sql`${table.unitsReserved} >= 0`
    ),
    check(
      "feature_usage_events_units_consumed_nonnegative",
      sql`${table.unitsConsumed} >= 0`
    ),
    check(
      "feature_usage_events_period_allowed",
      sql`${table.period} IN ('minute', 'day', 'month')`
    ),
    check(
      "feature_usage_events_status_allowed",
      sql`${table.status} IN ('estimated', 'reserved', 'consumed', 'refunded', 'fallback', 'blocked')`
    )
  ]
);

export const featureUsageRollups = pgTable(
  "feature_usage_rollups",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    featureKey: text("feature_key").notNull(),
    featureLabel: text("feature_label").notNull(),
    unitType: text("unit_type").notNull(),
    period: text("period").notNull(),
    periodStart: timestamp("period_start", { withTimezone: true }).notNull(),
    resetAt: timestamp("reset_at", { withTimezone: true }).notNull(),
    reservedUnits: integer("reserved_units").notNull().default(0),
    consumedUnits: integer("consumed_units").notNull().default(0),
    fallbackUnits: integer("fallback_units").notNull().default(0),
    blockedUnits: integer("blocked_units").notNull().default(0),
    metadata: jsonb("metadata").notNull().default(sql`'{}'::jsonb`),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`)
  },
  (table) => [
    index("feature_usage_rollups_tenant_id_idx").on(table.tenantId),
    index("feature_usage_rollups_feature_key_idx").on(table.featureKey),
    uniqueIndex("feature_usage_rollups_tenant_feature_period_start_unique").on(
      table.tenantId,
      table.featureKey,
      table.period,
      table.periodStart
    ),
    check(
      "feature_usage_rollups_period_allowed",
      sql`${table.period} IN ('minute', 'day', 'month')`
    ),
    check(
      "feature_usage_rollups_reserved_units_nonnegative",
      sql`${table.reservedUnits} >= 0`
    ),
    check(
      "feature_usage_rollups_consumed_units_nonnegative",
      sql`${table.consumedUnits} >= 0`
    ),
    check(
      "feature_usage_rollups_fallback_units_nonnegative",
      sql`${table.fallbackUnits} >= 0`
    ),
    check(
      "feature_usage_rollups_blocked_units_nonnegative",
      sql`${table.blockedUnits} >= 0`
    )
  ]
);

export const scanResults = pgTable(
  "scan_results",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    submissionId: uuid("submission_id")
      .notNull()
      .references(() => submissions.id, { onDelete: "cascade" }),
    scanJobId: uuid("scan_job_id")
      .notNull()
      .references(() => scanJobs.id, { onDelete: "cascade" }),
    similarityScore: real("similarity_score").notNull(),
    aiProbability: real("ai_probability").notNull(),
    originalWordCount: integer("original_word_count").notNull(),
    scannedWordCount: integer("scanned_word_count").notNull(),
    providerMetadata: jsonb("provider_metadata")
      .notNull()
      .default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`)
  },
  (table) => [
    index("scan_results_tenant_id_idx").on(table.tenantId),
    index("scan_results_submission_id_idx").on(table.submissionId),
    index("scan_results_scan_job_id_idx").on(table.scanJobId),
    index("scan_results_tenant_submission_idx").on(
      table.tenantId,
      table.submissionId
    ),
    check(
      "scan_results_similarity_score_range",
      sql`${table.similarityScore} >= 0 AND ${table.similarityScore} <= 100`
    ),
    check(
      "scan_results_ai_probability_range",
      sql`${table.aiProbability} >= 0 AND ${table.aiProbability} <= 1`
    ),
    check(
      "scan_results_original_word_count_nonnegative",
      sql`${table.originalWordCount} >= 0`
    ),
    check(
      "scan_results_scanned_word_count_nonnegative",
      sql`${table.scannedWordCount} >= 0`
    )
  ]
);

export const sourceMatches = pgTable(
  "source_matches",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    scanResultId: uuid("scan_result_id")
      .notNull()
      .references(() => scanResults.id, { onDelete: "cascade" }),
    sourceTitle: text("source_title").notNull(),
    sourceUrl: text("source_url"),
    matchedText: text("matched_text").notNull(),
    startChar: integer("start_char").notNull(),
    endChar: integer("end_char").notNull(),
    similarityScore: real("similarity_score").notNull()
  },
  (table) => [
    index("source_matches_tenant_id_idx").on(table.tenantId),
    index("source_matches_scan_result_id_idx").on(table.scanResultId),
    index("source_matches_tenant_scan_result_idx").on(
      table.tenantId,
      table.scanResultId
    ),
    check(
      "source_matches_similarity_score_range",
      sql`${table.similarityScore} >= 0 AND ${table.similarityScore} <= 100`
    ),
    check("source_matches_start_char_nonnegative", sql`${table.startChar} >= 0`),
    check("source_matches_end_char_nonnegative", sql`${table.endChar} >= 0`),
    check(
      "source_matches_end_char_after_start_char",
      sql`${table.endChar} >= ${table.startChar}`
    )
  ]
);

export const aiAssessments = pgTable(
  "ai_assessments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    scanResultId: uuid("scan_result_id")
      .notNull()
      .references(() => scanResults.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    probability: real("probability").notNull(),
    sentenceStartChar: integer("sentence_start_char").notNull(),
    sentenceEndChar: integer("sentence_end_char").notNull(),
    explanation: text("explanation")
  },
  (table) => [
    index("ai_assessments_tenant_id_idx").on(table.tenantId),
    index("ai_assessments_scan_result_id_idx").on(table.scanResultId),
    index("ai_assessments_tenant_scan_result_idx").on(
      table.tenantId,
      table.scanResultId
    ),
    check(
      "ai_assessments_probability_range",
      sql`${table.probability} >= 0 AND ${table.probability} <= 1`
    ),
    check(
      "ai_assessments_sentence_start_char_nonnegative",
      sql`${table.sentenceStartChar} >= 0`
    ),
    check(
      "ai_assessments_sentence_end_char_nonnegative",
      sql`${table.sentenceEndChar} >= 0`
    ),
    check(
      "ai_assessments_sentence_end_after_start",
      sql`${table.sentenceEndChar} >= ${table.sentenceStartChar}`
    )
  ]
);

export const grammarFindings = pgTable(
  "grammar_findings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    scanResultId: uuid("scan_result_id")
      .notNull()
      .references(() => scanResults.id, { onDelete: "cascade" }),
    message: text("message").notNull(),
    offset: integer("offset").notNull(),
    length: integer("length").notNull(),
    replacementSuggestions: jsonb("replacement_suggestions")
      .notNull()
      .default(sql`'[]'::jsonb`)
  },
  (table) => [
    index("grammar_findings_tenant_id_idx").on(table.tenantId),
    index("grammar_findings_scan_result_id_idx").on(table.scanResultId),
    index("grammar_findings_tenant_scan_result_idx").on(
      table.tenantId,
      table.scanResultId
    ),
    check("grammar_findings_offset_nonnegative", sql`${table.offset} >= 0`),
    check("grammar_findings_length_nonnegative", sql`${table.length} >= 0`)
  ]
);

export const reviewCases = pgTable(
  "review_cases",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    submissionId: uuid("submission_id")
      .notNull()
      .references(() => submissions.id, { onDelete: "cascade" }),
    assignedReviewerId: uuid("assigned_reviewer_id").references(() => users.id, {
      onDelete: "set null"
    }),
    status: text("status").notNull(),
    finalDecision: text("final_decision"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`)
  },
  (table) => [
    index("review_cases_tenant_id_idx").on(table.tenantId),
    index("review_cases_submission_id_idx").on(table.submissionId),
    index("review_cases_assigned_reviewer_id_idx").on(table.assignedReviewerId),
    index("review_cases_status_idx").on(table.status),
    index("review_cases_tenant_status_created_at_idx").on(
      table.tenantId,
      table.status,
      table.createdAt
    ),
    index("review_cases_tenant_submission_idx").on(
      table.tenantId,
      table.submissionId
    )
  ]
);

export const reviewEvents = pgTable(
  "review_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    reviewCaseId: uuid("review_case_id")
      .notNull()
      .references(() => reviewCases.id, { onDelete: "cascade" }),
    actorUserId: uuid("actor_user_id").references(() => users.id, {
      onDelete: "set null"
    }),
    eventType: text("event_type").notNull(),
    comment: text("comment"),
    metadata: jsonb("metadata").notNull().default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`)
  },
  (table) => [
    index("review_events_tenant_id_idx").on(table.tenantId),
    index("review_events_review_case_id_idx").on(table.reviewCaseId),
    index("review_events_actor_user_id_idx").on(table.actorUserId),
    index("review_events_event_type_idx").on(table.eventType),
    index("review_events_tenant_case_created_at_idx").on(
      table.tenantId,
      table.reviewCaseId,
      table.createdAt
    )
  ]
);

export const reportSnapshots = pgTable(
  "report_snapshots",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    submissionId: uuid("submission_id")
      .notNull()
      .references(() => submissions.id, { onDelete: "cascade" }),
    scanResultId: uuid("scan_result_id")
      .notNull()
      .references(() => scanResults.id, { onDelete: "cascade" }),
    snapshotVersion: integer("snapshot_version").notNull(),
    reportJson: jsonb("report_json").notNull(),
    pdfStorageKey: text("pdf_storage_key"),
    createdByUserId: uuid("created_by_user_id").references(() => users.id, {
      onDelete: "set null"
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`)
  },
  (table) => [
    index("report_snapshots_tenant_id_idx").on(table.tenantId),
    index("report_snapshots_submission_id_idx").on(table.submissionId),
    index("report_snapshots_scan_result_id_idx").on(table.scanResultId),
    index("report_snapshots_created_by_user_id_idx").on(table.createdByUserId),
    uniqueIndex("report_snapshots_tenant_submission_version_unique").on(
      table.tenantId,
      table.submissionId,
      table.snapshotVersion
    ),
    index("report_snapshots_tenant_submission_created_at_idx").on(
      table.tenantId,
      table.submissionId,
      table.createdAt
    ),
    check(
      "report_snapshots_snapshot_version_positive",
      sql`${table.snapshotVersion} > 0`
    )
  ]
);
