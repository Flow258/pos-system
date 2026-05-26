-- SQL: Create paymongo_payments table
-- Run this manually if `php artisan migrate` fails (e.g. no MySQL access from this terminal)
-- Otherwise just use: php artisan migrate

CREATE TABLE IF NOT EXISTS `paymongo_payments` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `sale_id` bigint unsigned DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL,
  `payment_method` varchar(255) NOT NULL DEFAULT 'gcash',
  `paymongo_session_id` varchar(100) NOT NULL,
  `checkout_url` varchar(255) DEFAULT NULL,
  `status` varchar(255) NOT NULL DEFAULT 'pending',
  `webhook_data` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `paymongo_payments_paymongo_session_id_unique` (`paymongo_session_id`),
  KEY `paymongo_payments_sale_id_foreign` (`sale_id`),
  KEY `paymongo_payments_sale_id_index` (`sale_id`),
  KEY `paymongo_payments_status_index` (`status`),
  CONSTRAINT `paymongo_payments_sale_id_foreign` FOREIGN KEY (`sale_id`) REFERENCES `sales` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;