CREATE TABLE `bookings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`code` text NOT NULL,
	`book_slug` text NOT NULL,
	`book_title` text NOT NULL,
	`name` text NOT NULL,
	`register_number` text NOT NULL,
	`year` text NOT NULL,
	`department` text NOT NULL,
	`phone` text NOT NULL,
	`instagram` text,
	`due_date` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_bookings_book_slug` ON `bookings` (`book_slug`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_bookings_register_number` ON `bookings` (`register_number`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_bookings_code` ON `bookings` (`code`);