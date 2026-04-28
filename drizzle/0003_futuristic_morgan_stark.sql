CREATE TABLE "extracted_texts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"submission_id" uuid NOT NULL,
	"raw_text" text NOT NULL,
	"word_count" integer NOT NULL,
	"char_count" integer NOT NULL,
	"extraction_method" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "extracted_texts_word_count_nonnegative" CHECK ("extracted_texts"."word_count" >= 0),
	CONSTRAINT "extracted_texts_char_count_nonnegative" CHECK ("extracted_texts"."char_count" >= 0)
);
--> statement-breakpoint
CREATE TABLE "preprocessing_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"submission_id" uuid NOT NULL,
	"original_word_count" integer NOT NULL,
	"sanitized_word_count" integer NOT NULL,
	"removed_word_count" integer NOT NULL,
	"rules_applied" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"sanitized_text" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "preprocessing_runs_original_word_count_nonnegative" CHECK ("preprocessing_runs"."original_word_count" >= 0),
	CONSTRAINT "preprocessing_runs_sanitized_word_count_nonnegative" CHECK ("preprocessing_runs"."sanitized_word_count" >= 0),
	CONSTRAINT "preprocessing_runs_removed_word_count_nonnegative" CHECK ("preprocessing_runs"."removed_word_count" >= 0)
);
--> statement-breakpoint
CREATE TABLE "text_chunks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"submission_id" uuid NOT NULL,
	"chunk_index" integer NOT NULL,
	"text" text NOT NULL,
	"start_char" integer NOT NULL,
	"end_char" integer NOT NULL,
	"word_count" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "text_chunks_chunk_index_nonnegative" CHECK ("text_chunks"."chunk_index" >= 0),
	CONSTRAINT "text_chunks_start_char_nonnegative" CHECK ("text_chunks"."start_char" >= 0),
	CONSTRAINT "text_chunks_end_char_nonnegative" CHECK ("text_chunks"."end_char" >= 0),
	CONSTRAINT "text_chunks_word_count_nonnegative" CHECK ("text_chunks"."word_count" >= 0),
	CONSTRAINT "text_chunks_end_char_after_start_char" CHECK ("text_chunks"."end_char" >= "text_chunks"."start_char")
);
--> statement-breakpoint
ALTER TABLE "extracted_texts" ADD CONSTRAINT "extracted_texts_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "extracted_texts" ADD CONSTRAINT "extracted_texts_submission_id_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "preprocessing_runs" ADD CONSTRAINT "preprocessing_runs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "preprocessing_runs" ADD CONSTRAINT "preprocessing_runs_submission_id_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "text_chunks" ADD CONSTRAINT "text_chunks_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "text_chunks" ADD CONSTRAINT "text_chunks_submission_id_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "extracted_texts_tenant_id_idx" ON "extracted_texts" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "extracted_texts_submission_id_idx" ON "extracted_texts" USING btree ("submission_id");--> statement-breakpoint
CREATE INDEX "extracted_texts_tenant_submission_idx" ON "extracted_texts" USING btree ("tenant_id","submission_id");--> statement-breakpoint
CREATE INDEX "preprocessing_runs_tenant_id_idx" ON "preprocessing_runs" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "preprocessing_runs_submission_id_idx" ON "preprocessing_runs" USING btree ("submission_id");--> statement-breakpoint
CREATE INDEX "preprocessing_runs_tenant_submission_idx" ON "preprocessing_runs" USING btree ("tenant_id","submission_id");--> statement-breakpoint
CREATE INDEX "text_chunks_tenant_id_idx" ON "text_chunks" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "text_chunks_submission_id_idx" ON "text_chunks" USING btree ("submission_id");--> statement-breakpoint
CREATE INDEX "text_chunks_tenant_submission_idx" ON "text_chunks" USING btree ("tenant_id","submission_id");--> statement-breakpoint
CREATE UNIQUE INDEX "text_chunks_submission_chunk_index_unique" ON "text_chunks" USING btree ("tenant_id","submission_id","chunk_index");