CREATE TABLE "report_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"submission_id" uuid NOT NULL,
	"scan_result_id" uuid NOT NULL,
	"snapshot_version" integer NOT NULL,
	"report_json" jsonb NOT NULL,
	"pdf_storage_key" text,
	"created_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "report_snapshots_snapshot_version_positive" CHECK ("report_snapshots"."snapshot_version" > 0)
);
--> statement-breakpoint
CREATE TABLE "review_cases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"submission_id" uuid NOT NULL,
	"assigned_reviewer_id" uuid,
	"status" text NOT NULL,
	"final_decision" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "review_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"review_case_id" uuid NOT NULL,
	"actor_user_id" uuid,
	"event_type" text NOT NULL,
	"comment" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "report_snapshots" ADD CONSTRAINT "report_snapshots_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_snapshots" ADD CONSTRAINT "report_snapshots_submission_id_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_snapshots" ADD CONSTRAINT "report_snapshots_scan_result_id_scan_results_id_fk" FOREIGN KEY ("scan_result_id") REFERENCES "public"."scan_results"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_snapshots" ADD CONSTRAINT "report_snapshots_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_cases" ADD CONSTRAINT "review_cases_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_cases" ADD CONSTRAINT "review_cases_submission_id_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_cases" ADD CONSTRAINT "review_cases_assigned_reviewer_id_users_id_fk" FOREIGN KEY ("assigned_reviewer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_events" ADD CONSTRAINT "review_events_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_events" ADD CONSTRAINT "review_events_review_case_id_review_cases_id_fk" FOREIGN KEY ("review_case_id") REFERENCES "public"."review_cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_events" ADD CONSTRAINT "review_events_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "report_snapshots_tenant_id_idx" ON "report_snapshots" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "report_snapshots_submission_id_idx" ON "report_snapshots" USING btree ("submission_id");--> statement-breakpoint
CREATE INDEX "report_snapshots_scan_result_id_idx" ON "report_snapshots" USING btree ("scan_result_id");--> statement-breakpoint
CREATE INDEX "report_snapshots_created_by_user_id_idx" ON "report_snapshots" USING btree ("created_by_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "report_snapshots_tenant_submission_version_unique" ON "report_snapshots" USING btree ("tenant_id","submission_id","snapshot_version");--> statement-breakpoint
CREATE INDEX "report_snapshots_tenant_submission_created_at_idx" ON "report_snapshots" USING btree ("tenant_id","submission_id","created_at");--> statement-breakpoint
CREATE INDEX "review_cases_tenant_id_idx" ON "review_cases" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "review_cases_submission_id_idx" ON "review_cases" USING btree ("submission_id");--> statement-breakpoint
CREATE INDEX "review_cases_assigned_reviewer_id_idx" ON "review_cases" USING btree ("assigned_reviewer_id");--> statement-breakpoint
CREATE INDEX "review_cases_status_idx" ON "review_cases" USING btree ("status");--> statement-breakpoint
CREATE INDEX "review_cases_tenant_status_created_at_idx" ON "review_cases" USING btree ("tenant_id","status","created_at");--> statement-breakpoint
CREATE INDEX "review_cases_tenant_submission_idx" ON "review_cases" USING btree ("tenant_id","submission_id");--> statement-breakpoint
CREATE INDEX "review_events_tenant_id_idx" ON "review_events" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "review_events_review_case_id_idx" ON "review_events" USING btree ("review_case_id");--> statement-breakpoint
CREATE INDEX "review_events_actor_user_id_idx" ON "review_events" USING btree ("actor_user_id");--> statement-breakpoint
CREATE INDEX "review_events_event_type_idx" ON "review_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "review_events_tenant_case_created_at_idx" ON "review_events" USING btree ("tenant_id","review_case_id","created_at");