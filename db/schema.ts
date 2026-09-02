import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const bookings = sqliteTable("bookings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: text("code").notNull(),
  bookSlug: text("book_slug").notNull(),
  bookTitle: text("book_title").notNull(),
  name: text("name").notNull(),
  registerNumber: text("register_number").notNull(),
  year: text("year").notNull(),
  department: text("department").notNull(),
  phone: text("phone").notNull(),
  instagram: text("instagram"),
  dueDate: text("due_date").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
}, (table) => [
  uniqueIndex("idx_bookings_book_slug").on(table.bookSlug),
  uniqueIndex("idx_bookings_register_number").on(table.registerNumber),
  uniqueIndex("idx_bookings_code").on(table.code),
]);

export const customBooks = sqliteTable("custom_books", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull(),
  title: text("title").notNull(),
  author: text("author").notNull(),
  genre: text("genre").notNull(),
  tone: text("tone").notNull(),
  ink: text("ink").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
}, (table) => [uniqueIndex("idx_custom_books_slug").on(table.slug)]);

export const hiddenBooks = sqliteTable("hidden_books", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
}, (table) => [uniqueIndex("idx_hidden_books_slug").on(table.slug)]);
