import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
};

export const programs = pgTable("programs", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull(),
  name: text("name").notNull(),
  autoTag: text("auto_tag").notNull(),
  stripePriceId: text("stripe_price_id"),
  ...timestamps,
}, (table) => [
  uniqueIndex("programs_slug_idx").on(table.slug),
  uniqueIndex("programs_auto_tag_idx").on(table.autoTag),
]);

export const guardians = pgTable("guardians", {
  id: uuid("id").primaryKey().defaultRandom(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email"),
  phone: text("phone"),
  relationship: text("relationship"),
  dob: text("dob"),
  ...timestamps,
}, (table) => [
  index("guardians_email_idx").on(table.email),
]);

export const students = pgTable("students", {
  id: uuid("id").primaryKey().defaultRandom(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email"),
  phone: text("phone"),
  dob: text("dob"),
  isMinor: boolean("is_minor").notNull().default(false),
  status: text("status").notNull().default("active"),
  guardianId: uuid("guardian_id").references(() => guardians.id, { onDelete: "set null" }),
  ...timestamps,
}, (table) => [
  index("students_email_idx").on(table.email),
  index("students_name_idx").on(table.lastName, table.firstName),
  index("students_status_idx").on(table.status),
  index("students_dob_idx").on(table.dob),
]);

export const studentPrograms = pgTable("student_programs", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: uuid("student_id")
    .notNull()
    .references(() => students.id, { onDelete: "cascade" }),
  programId: uuid("program_id")
    .notNull()
    .references(() => programs.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("active"),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  ...timestamps,
}, (table) => [
  uniqueIndex("student_programs_unique_idx").on(table.studentId, table.programId),
  index("student_programs_program_idx").on(table.programId),
]);

export const waivers = pgTable("waivers", {
  id: uuid("id").primaryKey().defaultRandom(),
  smartwaiverId: text("smartwaiver_id").notNull(),
  participantIndex: integer("participant_index").notNull().default(0),
  studentId: uuid("student_id").references(() => students.id, { onDelete: "set null" }),
  templateId: text("template_id"),
  title: text("title"),
  autoTag: text("auto_tag"),
  signedAt: timestamp("signed_at", { withTimezone: true }),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  expired: boolean("expired").notNull().default(false),
  verified: boolean("verified").notNull().default(false),
  raw: jsonb("raw").$type<Record<string, unknown>>().notNull(),
  ...timestamps,
}, (table) => [
  uniqueIndex("waivers_smartwaiver_participant_idx").on(table.smartwaiverId, table.participantIndex),
  index("waivers_student_idx").on(table.studentId),
  index("waivers_expires_idx").on(table.expiresAt),
]);

export const consents = pgTable("consents", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: uuid("student_id")
    .notNull()
    .references(() => students.id, { onDelete: "cascade" }),
  channel: text("channel").notNull(),
  granted: boolean("granted").notNull(),
  source: text("source").notNull(),
  evidence: text("evidence"),
  grantedAt: timestamp("granted_at", { withTimezone: true }),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  ...timestamps,
}, (table) => [
  uniqueIndex("consents_student_channel_idx").on(table.studentId, table.channel),
  index("consents_channel_granted_idx").on(table.channel, table.granted),
]);

export const notes = pgTable("notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: uuid("student_id")
    .notNull()
    .references(() => students.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  authorEmail: text("author_email").notNull(),
  ...timestamps,
}, (table) => [index("notes_student_idx").on(table.studentId)]);

export const tags = pgTable("tags", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  ...timestamps,
}, (table) => [uniqueIndex("tags_name_idx").on(table.name)]);

export const studentTags = pgTable("student_tags", {
  studentId: uuid("student_id")
    .notNull()
    .references(() => students.id, { onDelete: "cascade" }),
  tagId: uuid("tag_id")
    .notNull()
    .references(() => tags.id, { onDelete: "cascade" }),
}, (table) => [
  uniqueIndex("student_tags_unique_idx").on(table.studentId, table.tagId),
]);

export const auditLog = pgTable("audit_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  actorEmail: text("actor_email"),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("audit_log_entity_idx").on(table.entityType, table.entityId),
  index("audit_log_created_idx").on(table.createdAt),
]);

export const syncState = pgTable("sync_state", {
  provider: text("provider").primaryKey(),
  cursor: text("cursor"),
  lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const webhookEvents = pgTable("webhook_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  provider: text("provider").notNull(),
  eventId: text("event_id").notNull(),
  eventType: text("event_type"),
  payload: jsonb("payload").$type<Record<string, unknown>>(),
  processedAt: timestamp("processed_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("webhook_events_provider_event_idx").on(table.provider, table.eventId),
]);

export const identityReviews = pgTable("identity_reviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  waiverId: uuid("waiver_id").references(() => waivers.id, { onDelete: "set null" }),
  smartwaiverId: text("smartwaiver_id").notNull(),
  participantIndex: integer("participant_index").notNull().default(0),
  status: text("status").notNull().default("pending"),
  reason: text("reason").notNull(),
  snapshot: jsonb("snapshot").$type<Record<string, unknown>>().notNull(),
  candidateStudentIds: jsonb("candidate_student_ids").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  resolvedStudentId: uuid("resolved_student_id").references(() => students.id, { onDelete: "set null" }),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  ...timestamps,
}, (table) => [
  index("identity_reviews_status_idx").on(table.status),
  index("identity_reviews_smartwaiver_idx").on(table.smartwaiverId),
]);

export const stripeCustomers = pgTable("stripe_customers", {
  id: uuid("id").primaryKey().defaultRandom(),
  stripeCustomerId: text("stripe_customer_id").notNull(),
  studentId: uuid("student_id").references(() => students.id, { onDelete: "set null" }),
  email: text("email"),
  name: text("name"),
  raw: jsonb("raw").$type<Record<string, unknown>>(),
  ...timestamps,
}, (table) => [
  uniqueIndex("stripe_customers_stripe_id_idx").on(table.stripeCustomerId),
  index("stripe_customers_student_idx").on(table.studentId),
  index("stripe_customers_email_idx").on(table.email),
]);

export const stripeSubscriptions = pgTable("stripe_subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  stripeSubscriptionId: text("stripe_subscription_id").notNull(),
  stripeCustomerId: text("stripe_customer_id").notNull(),
  status: text("status").notNull(),
  priceId: text("price_id"),
  productName: text("product_name"),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),
  raw: jsonb("raw").$type<Record<string, unknown>>(),
  ...timestamps,
}, (table) => [
  uniqueIndex("stripe_subscriptions_stripe_id_idx").on(table.stripeSubscriptionId),
  index("stripe_subscriptions_customer_idx").on(table.stripeCustomerId),
  index("stripe_subscriptions_status_idx").on(table.status),
]);

export const stripePayments = pgTable("stripe_payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  stripeInvoiceId: text("stripe_invoice_id").notNull(),
  stripeCustomerId: text("stripe_customer_id"),
  amountDue: integer("amount_due").notNull().default(0),
  amountPaid: integer("amount_paid").notNull().default(0),
  currency: text("currency").notNull().default("cad"),
  status: text("status").notNull(),
  hostedInvoiceUrl: text("hosted_invoice_url"),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  raw: jsonb("raw").$type<Record<string, unknown>>(),
  ...timestamps,
}, (table) => [
  uniqueIndex("stripe_payments_invoice_idx").on(table.stripeInvoiceId),
  index("stripe_payments_customer_idx").on(table.stripeCustomerId),
  index("stripe_payments_status_idx").on(table.status),
]);

export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  channel: text("channel").notNull(),
  kind: text("kind").notNull(),
  studentId: uuid("student_id").references(() => students.id, { onDelete: "set null" }),
  toAddress: text("to_address").notNull(),
  subject: text("subject"),
  body: text("body").notNull(),
  status: text("status").notNull().default("queued"),
  provider: text("provider").notNull(),
  providerId: text("provider_id"),
  error: text("error"),
  sentByEmail: text("sent_by_email"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("messages_student_idx").on(table.studentId),
  index("messages_created_idx").on(table.createdAt),
  index("messages_provider_id_idx").on(table.providerId),
]);
