CREATE TYPE "public"."support_ticket_status" AS ENUM('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');--> statement-breakpoint
CREATE TABLE "support_ticket_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"ticket_id" uuid NOT NULL,
	"author_user_id" uuid NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "support_tickets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"created_by_user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"status" "support_ticket_status" DEFAULT 'OPEN' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "support_ticket_comments" ADD CONSTRAINT "support_ticket_comments_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_ticket_comments" ADD CONSTRAINT "support_ticket_comments_ticket_id_support_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."support_tickets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_ticket_comments" ADD CONSTRAINT "support_ticket_comments_author_user_id_users_id_fk" FOREIGN KEY ("author_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "support_ticket_comments_tenant_id_idx" ON "support_ticket_comments" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "support_ticket_comments_ticket_id_idx" ON "support_ticket_comments" USING btree ("ticket_id");--> statement-breakpoint
CREATE INDEX "support_ticket_comments_author_user_id_idx" ON "support_ticket_comments" USING btree ("author_user_id");--> statement-breakpoint
CREATE INDEX "support_ticket_comments_tenant_ticket_created_at_idx" ON "support_ticket_comments" USING btree ("tenant_id","ticket_id","created_at");--> statement-breakpoint
CREATE INDEX "support_tickets_tenant_id_idx" ON "support_tickets" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "support_tickets_created_by_user_id_idx" ON "support_tickets" USING btree ("created_by_user_id");--> statement-breakpoint
CREATE INDEX "support_tickets_status_idx" ON "support_tickets" USING btree ("status");--> statement-breakpoint
CREATE INDEX "support_tickets_tenant_status_created_at_idx" ON "support_tickets" USING btree ("tenant_id","status","created_at");