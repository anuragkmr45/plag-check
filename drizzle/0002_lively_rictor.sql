CREATE TYPE "public"."submission_status" AS ENUM('DRAFT', 'UPLOADED', 'EXTRACTING', 'READY_FOR_SCAN', 'SCAN_QUEUED', 'SCANNING', 'SCAN_COMPLETE', 'UNDER_REVIEW', 'HOLD', 'CLEARED', 'ESCALATED', 'FAILED');--> statement-breakpoint
CREATE TABLE "submission_files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"submission_id" uuid NOT NULL,
	"original_filename" text NOT NULL,
	"storage_bucket" text NOT NULL,
	"storage_key" text NOT NULL,
	"mime_type" text NOT NULL,
	"file_size_bytes" bigint NOT NULL,
	"checksum_sha256" text NOT NULL,
	"uploaded_by_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "submission_files_file_size_nonnegative" CHECK ("submission_files"."file_size_bytes" >= 0)
);
--> statement-breakpoint
CREATE TABLE "submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"title" text NOT NULL,
	"status" "submission_status" DEFAULT 'DRAFT' NOT NULL,
	"created_by_user_id" uuid NOT NULL,
	"assigned_reviewer_id" uuid,
	"word_count" integer,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "submissions_word_count_nonnegative" CHECK ("submissions"."word_count" IS NULL OR "submissions"."word_count" >= 0)
);
--> statement-breakpoint
ALTER TABLE "submission_files" ADD CONSTRAINT "submission_files_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submission_files" ADD CONSTRAINT "submission_files_submission_id_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submission_files" ADD CONSTRAINT "submission_files_uploaded_by_user_id_users_id_fk" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_assigned_reviewer_id_users_id_fk" FOREIGN KEY ("assigned_reviewer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "submission_files_tenant_id_idx" ON "submission_files" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "submission_files_submission_id_idx" ON "submission_files" USING btree ("submission_id");--> statement-breakpoint
CREATE INDEX "submission_files_uploaded_by_user_id_idx" ON "submission_files" USING btree ("uploaded_by_user_id");--> statement-breakpoint
CREATE INDEX "submission_files_checksum_sha256_idx" ON "submission_files" USING btree ("checksum_sha256");--> statement-breakpoint
CREATE UNIQUE INDEX "submission_files_storage_object_unique" ON "submission_files" USING btree ("storage_bucket","storage_key");--> statement-breakpoint
CREATE INDEX "submissions_tenant_id_idx" ON "submissions" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "submissions_status_idx" ON "submissions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "submissions_created_by_user_id_idx" ON "submissions" USING btree ("created_by_user_id");--> statement-breakpoint
CREATE INDEX "submissions_assigned_reviewer_id_idx" ON "submissions" USING btree ("assigned_reviewer_id");--> statement-breakpoint
CREATE INDEX "submissions_tenant_status_created_at_idx" ON "submissions" USING btree ("tenant_id","status","created_at");