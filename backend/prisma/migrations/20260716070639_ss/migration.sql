-- CreateTable
CREATE TABLE `url8` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `shorturl` VARCHAR(50) NOT NULL,
    `targeturl` VARCHAR(2048) NOT NULL,
    `keterangan` VARCHAR(255) NULL,
    `pswd` VARCHAR(255) NULL,
    `exp_date` DATETIME(0) NULL,
    `hitcounter` INTEGER NOT NULL DEFAULT 0,
    `tglbuat` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `tglreset` DATETIME(0) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `user_id` INTEGER NULL,
    `title` VARCHAR(255) NULL,
    `description` TEXT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,

    UNIQUE INDEX `url8_shorturl_key`(`shorturl`),
    INDEX `idx_shorturl`(`shorturl`),
    INDEX `idx_exp_date`(`exp_date`),
    INDEX `idx_user_id`(`user_id`),
    INDEX `idx_is_active`(`is_active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(50) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `role` ENUM('ADMIN', 'USER') NOT NULL DEFAULT 'USER',
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,

    UNIQUE INDEX `users_username_key`(`username`),
    UNIQUE INDEX `users_email_key`(`email`),
    INDEX `idx_email`(`email`),
    INDEX `idx_role`(`role`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_sessions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `token` VARCHAR(255) NOT NULL,
    `refresh_token` VARCHAR(255) NULL,
    `expires_at` DATETIME(0) NOT NULL,
    `ip_address` VARCHAR(45) NULL,
    `user_agent` VARCHAR(255) NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_token`(`token`),
    INDEX `idx_refresh_token`(`refresh_token`),
    INDEX `idx_expires`(`expires_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `url_hits` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `url_id` INTEGER NOT NULL,
    `shorturl` VARCHAR(50) NOT NULL,
    `ip_address` VARCHAR(45) NULL,
    `user_agent` VARCHAR(500) NULL,
    `referer` VARCHAR(500) NULL,
    `country` VARCHAR(50) NULL,
    `device_type` ENUM('DESKTOP', 'MOBILE', 'TABLET', 'OTHER') NOT NULL DEFAULT 'OTHER',
    `browser` VARCHAR(100) NULL,
    `os` VARCHAR(100) NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_hits_shorturl`(`shorturl`),
    INDEX `idx_hits_created`(`created_at`),
    INDEX `idx_hits_ip`(`ip_address`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `url8` ADD CONSTRAINT `url8_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_sessions` ADD CONSTRAINT `user_sessions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `url_hits` ADD CONSTRAINT `url_hits_url_id_fkey` FOREIGN KEY (`url_id`) REFERENCES `url8`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
