CREATE TABLE "ai_assessments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"scan_result_id" uuid NOT NULL,
	"label" text NOT NULL,
	"probability" real NOT NULL,
	"sentence_start_char" integer NOT NULL,
	"sentence_end_char" integer NOT NULL,
	"explanation" text,
	CONSTRAINT "ai_assessments_probability_range" CHECK ("ai_assessments"."probability" >= 0 AND "ai_assessments"."probability" <= 1),
	CONSTRAINT "ai_assessments_sentence_start_char_nonnegative" CHECK ("ai_assessments"."sentence_start_char" >= 0),
	CONSTRAINT "ai_assessments_sentence_end_char_nonnegative" CHECK ("ai_assessments"."sentence_end_char" >= 0),
	CONSTRAINT "ai_assessments_sentence_end_after_start" CHECK ("ai_assessments"."sentence_end_char" >= "ai_assessments"."sentence_start_char")
);
--> statement-breakpoint
CREATE TABLE "grammar_findings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"scan_result_id" uuid NOT NULL,
	"message" text NOT NULL,
	"offset" integer NOT NULL,
	"length" integer NOT NULL,
	"replacement_suggestions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	CONSTRAINT "grammar_findings_offset_nonnegative" CHECK ("grammar_findings"."offset" >= 0),
	CONSTRAINT "grammar_findings_length_nonnegative" CHECK ("grammar_findings"."length" >= 0)
);
--> statement-breakpoint
CREATE TABLE "scan_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"submission_id" uuid NOT NULL,
	"provider" text NOT NULL,
	"status" text NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"error_message" text,
	"started_at" timestamp with time zone,
	"finished_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "scan_jobs_attempts_nonnegative" CHECK ("scan_jobs"."attempts" >= 0)
);
--> statement-breakpoint
CREATE TABLE "scan_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"submission_id" uuid NOT NULL,
	"scan_job_id" uuid NOT NULL,
	"similarity_score" real NOT NULL,
	"ai_probability" real NOT NULL,
	"original_word_count" integer NOT NULL,
	"scanned_word_count" integer NOT NULL,
	"provider_metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "scan_results_similarity_score_range" CHECK ("scan_results"."similarity_score" >= 0 AND "scan_results"."similarity_score" <= 100),
	CONSTRAINT "scan_results_ai_probability_range" CHECK ("scan_results"."ai_probability" >= 0 AND "scan_results"."ai_probability" <= 1),
	CONSTRAINT "scan_results_original_word_count_nonnegative" CHECK ("scan_results"."original_word_count" >= 0),
	CONSTRAINT "scan_results_scanned_word_count_nonnegative" CHECK ("scan_results"."scanned_word_count" >= 0)
);
--> statement-breakpoint
CREATE TABLE "source_matches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"scan_result_id" uuid NOT NULL,
	"source_title" text NOT NULL,
	"source_url" text,
	"matched_text" text NOT NULL,
	"start_char" integer NOT NULL,
	"end_char" integer NOT NULL,
	"similarity_score" real NOT NULL,
	CONSTRAINT "source_matches_similarity_score_range" CHECK ("source_matches"."similarity_score" >= 0 AND "source_matches"."similarity_score" <= 100),
	CONSTRAINT "source_matches_start_char_nonnegative" CHECK ("source_matches"."start_char" >= 0),
	CONSTRAINT "source_matches_end_char_nonnegative" CHECK ("source_matches"."end_char" >= 0),
	CONSTRAINT "source_matches_end_char_after_start_char" CHECK ("source_matches"."end_char" >= "source_matches"."start_char")
);
--> statement-breakpoint
ALTER TABLE "ai_assessments" ADD CONSTRAINT "ai_assessments_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_assessments" ADD CONSTRAINT "ai_assessments_scan_result_id_scan_results_id_fk" FOREIGN KEY ("scan_result_id") REFERENCES "public"."scan_results"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grammar_findings" ADD CONSTRAINT "grammar_findings_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grammar_findings" ADD CONSTRAINT "grammar_findings_scan_result_id_scan_results_id_fk" FOREIGN KEY ("scan_result_id") REFERENCES "public"."scan_results"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scan_jobs" ADD CONSTRAINT "scan_jobs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scan_jobs" ADD CONSTRAINT "scan_jobs_submission_id_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scan_results" ADD CONSTRAINT "scan_results_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scan_results" ADD CONSTRAINT "scan_results_submission_id_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scan_results" ADD CONSTRAINT "scan_results_scan_job_id_scan_jobs_id_fk" FOREIGN KEY ("scan_job_id") REFERENCES "public"."scan_jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_matches" ADD CONSTRAINT "source_matches_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_matches" ADD CONSTRAINT "source_matches_scan_result_id_scan_results_id_fk" FOREIGN KEY ("scan_result_id") REFERENCES "public"."scan_results"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ai_assessments_tenant_id_idx" ON "ai_assessments" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "ai_assessments_scan_result_id_idx" ON "ai_assessments" USING btree ("scan_result_id");--> statement-breakpoint
CREATE INDEX "ai_assessments_tenant_scan_result_idx" ON "ai_assessments" USING btree ("tenant_id","scan_result_id");--> statement-breakpoint
CREATE INDEX "grammar_findings_tenant_id_idx" ON "grammar_findings" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "grammar_findings_scan_result_id_idx" ON "grammar_findings" USING btree ("scan_result_id");--> statement-breakpoint
CREATE INDEX "grammar_findings_tenant_scan_result_idx" ON "grammar_findings" USING btree ("tenant_id","scan_result_id");--> statement-breakpoint
CREATE INDEX "scan_jobs_tenant_id_idx" ON "scan_jobs" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "scan_jobs_submission_id_idx" ON "scan_jobs" USING btree ("submission_id");--> statement-breakpoint
CREATE INDEX "scan_jobs_status_idx" ON "scan_jobs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "scan_jobs_tenant_submission_idx" ON "scan_jobs" USING btree ("tenant_id","submission_id");--> statement-breakpoint
CREATE INDEX "scan_jobs_tenant_status_created_at_idx" ON "scan_jobs" USING btree ("tenant_id","status","created_at");--> statement-breakpoint
CREATE INDEX "scan_results_tenant_id_idx" ON "scan_results" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "scan_results_submission_id_idx" ON "scan_results" USING btree ("submission_id");--> statement-breakpoint
CREATE INDEX "scan_results_scan_job_id_idx" ON "scan_results" USING btree ("scan_job_id");--> statement-breakpoint
CREATE INDEX "scan_results_tenant_submission_idx" ON "scan_results" USING btree ("tenant_id","submission_id");--> statement-breakpoint
CREATE INDEX "source_matches_tenant_id_idx" ON "source_matches" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "source_matches_scan_result_id_idx" ON "source_matches" USING btree ("scan_result_id");--> statement-breakpoint
CREATE INDEX "source_matches_tenant_scan_result_idx" ON "source_matches" USING btree ("tenant_id","scan_result_id");