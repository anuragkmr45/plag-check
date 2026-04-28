ALTER TABLE "submissions" ADD COLUMN "repository_reuse_consent_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "submissions" ADD COLUMN "repository_reuse_consent_by" uuid;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_repository_reuse_consent_by_users_id_fk" FOREIGN KEY ("repository_reuse_consent_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "submissions_repository_reuse_consent_by_idx" ON "submissions" USING btree ("repository_reuse_consent_by");