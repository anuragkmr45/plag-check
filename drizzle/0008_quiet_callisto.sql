CREATE TABLE "feature_quota_limits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"feature_key" text NOT NULL,
	"feature_label" text NOT NULL,
	"unit_type" text NOT NULL,
	"period" text NOT NULL,
	"limit_units" integer NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "feature_quota_limits_limit_units_positive" CHECK ("feature_quota_limits"."limit_units" > 0),
	CONSTRAINT "feature_quota_limits_period_allowed" CHECK ("feature_quota_limits"."period" IN ('minute', 'day', 'month'))
);
--> statement-breakpoint
CREATE TABLE "feature_usage_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid,
	"submission_id" uuid,
	"feature_key" text NOT NULL,
	"feature_label" text NOT NULL,
	"units_reserved" integer DEFAULT 0 NOT NULL,
	"units_consumed" integer DEFAULT 0 NOT NULL,
	"unit_type" text NOT NULL,
	"status" text NOT NULL,
	"period" text NOT NULL,
	"reset_at" timestamp with time zone NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "feature_usage_events_units_reserved_nonnegative" CHECK ("feature_usage_events"."units_reserved" >= 0),
	CONSTRAINT "feature_usage_events_units_consumed_nonnegative" CHECK ("feature_usage_events"."units_consumed" >= 0),
	CONSTRAINT "feature_usage_events_period_allowed" CHECK ("feature_usage_events"."period" IN ('minute', 'day', 'month')),
	CONSTRAINT "feature_usage_events_status_allowed" CHECK ("feature_usage_events"."status" IN ('estimated', 'reserved', 'consumed', 'refunded', 'fallback', 'blocked'))
);
--> statement-breakpoint
CREATE TABLE "feature_usage_rollups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"feature_key" text NOT NULL,
	"feature_label" text NOT NULL,
	"unit_type" text NOT NULL,
	"period" text NOT NULL,
	"period_start" timestamp with time zone NOT NULL,
	"reset_at" timestamp with time zone NOT NULL,
	"reserved_units" integer DEFAULT 0 NOT NULL,
	"consumed_units" integer DEFAULT 0 NOT NULL,
	"fallback_units" integer DEFAULT 0 NOT NULL,
	"blocked_units" integer DEFAULT 0 NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "feature_usage_rollups_period_allowed" CHECK ("feature_usage_rollups"."period" IN ('minute', 'day', 'month')),
	CONSTRAINT "feature_usage_rollups_reserved_units_nonnegative" CHECK ("feature_usage_rollups"."reserved_units" >= 0),
	CONSTRAINT "feature_usage_rollups_consumed_units_nonnegative" CHECK ("feature_usage_rollups"."consumed_units" >= 0),
	CONSTRAINT "feature_usage_rollups_fallback_units_nonnegative" CHECK ("feature_usage_rollups"."fallback_units" >= 0),
	CONSTRAINT "feature_usage_rollups_blocked_units_nonnegative" CHECK ("feature_usage_rollups"."blocked_units" >= 0)
);
--> statement-breakpoint
ALTER TABLE "scan_jobs" ADD COLUMN "scan_mode" text DEFAULT 'standard' NOT NULL;--> statement-breakpoint
ALTER TABLE "feature_quota_limits" ADD CONSTRAINT "feature_quota_limits_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feature_usage_events" ADD CONSTRAINT "feature_usage_events_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feature_usage_events" ADD CONSTRAINT "feature_usage_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feature_usage_events" ADD CONSTRAINT "feature_usage_events_submission_id_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feature_usage_rollups" ADD CONSTRAINT "feature_usage_rollups_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "feature_quota_limits_tenant_id_idx" ON "feature_quota_limits" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "feature_quota_limits_feature_key_idx" ON "feature_quota_limits" USING btree ("feature_key");--> statement-breakpoint
CREATE UNIQUE INDEX "feature_quota_limits_tenant_feature_period_unique" ON "feature_quota_limits" USING btree ("tenant_id","feature_key","period");--> statement-breakpoint
CREATE INDEX "feature_usage_events_tenant_id_idx" ON "feature_usage_events" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "feature_usage_events_user_id_idx" ON "feature_usage_events" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "feature_usage_events_submission_id_idx" ON "feature_usage_events" USING btree ("submission_id");--> statement-breakpoint
CREATE INDEX "feature_usage_events_feature_period_idx" ON "feature_usage_events" USING btree ("feature_key","period","created_at");--> statement-breakpoint
CREATE INDEX "feature_usage_events_tenant_feature_period_idx" ON "feature_usage_events" USING btree ("tenant_id","feature_key","period","created_at");--> statement-breakpoint
CREATE INDEX "feature_usage_events_status_idx" ON "feature_usage_events" USING btree ("status");--> statement-breakpoint
CREATE INDEX "feature_usage_rollups_tenant_id_idx" ON "feature_usage_rollups" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "feature_usage_rollups_feature_key_idx" ON "feature_usage_rollups" USING btree ("feature_key");--> statement-breakpoint
CREATE UNIQUE INDEX "feature_usage_rollups_tenant_feature_period_start_unique" ON "feature_usage_rollups" USING btree ("tenant_id","feature_key","period","period_start");--> statement-breakpoint
CREATE INDEX "scan_jobs_scan_mode_idx" ON "scan_jobs" USING btree ("scan_mode");--> statement-breakpoint
ALTER TABLE "scan_jobs" ADD CONSTRAINT "scan_jobs_scan_mode_allowed" CHECK ("scan_jobs"."scan_mode" IN ('standard', 'deep', 'fallback'));