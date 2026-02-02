ALTER TABLE "products" ADD COLUMN "createdAt" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "updatedAt" timestamp DEFAULT now() NOT NULL;