CREATE TABLE `question_templates` (
	`id` text PRIMARY KEY NOT NULL,
	`category` text NOT NULL,
	`stage` text NOT NULL,
	`question` text NOT NULL,
	`intent` text NOT NULL,
	`keywords` text NOT NULL,
	`source_name` text,
	`source_url` text,
	`source_fetched_at` integer,
	`created_at` integer NOT NULL
);
