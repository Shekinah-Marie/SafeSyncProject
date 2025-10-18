-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Oct 18, 2025 at 06:09 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `cctv_system`
--

-- --------------------------------------------------------

--
-- Table structure for table `accounts`
--

CREATE TABLE `accounts` (
  `id` int(11) NOT NULL,
  `username` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `password` varchar(255) NOT NULL,
  `contact` varchar(50) DEFAULT NULL,
  `avatar_path` varchar(255) DEFAULT NULL,
  `is_logged_in` tinyint(1) DEFAULT 0,
  `last_active` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `accounts`
--

INSERT INTO `accounts` (`id`, `username`, `email`, `password`, `contact`, `avatar_path`, `is_logged_in`, `last_active`, `created_at`) VALUES
(7, 'Raidon', 'raidonamata@gmail.com', '$2y$10$FGArMiGWDfrroVT9QFy0v.cB8/cy9lnbv.6pxnrAttuAxuQDZtFP6', NULL, NULL, 0, '2025-10-18 02:40:00', '2025-10-15 13:27:18'),
(8, 'Princess', 'sfiamagsombol@gmail.com', '$2y$10$nHiIXReT6P1qmOas385SFOcgzlfQtxUHtTOeTxSoZMgyBUmWdn0VK', NULL, NULL, 0, '2025-10-18 04:06:55', '2025-10-15 13:36:02');

-- --------------------------------------------------------

--
-- Table structure for table `devices`
--

CREATE TABLE `devices` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `location` varchar(100) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `device_type` enum('USB','IP','Arduino','Other') DEFAULT 'USB',
  `camera_index` int(11) DEFAULT 0,
  `usb_port` int(11) DEFAULT NULL,
  `ip_address` varchar(100) DEFAULT NULL,
  `port` int(11) DEFAULT NULL,
  `status` enum('online','offline') DEFAULT 'offline',
  `last_seen` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp(),
  `username` varchar(255) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `rtsp_path` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `devices`
--

INSERT INTO `devices` (`id`, `name`, `location`, `description`, `device_type`, `camera_index`, `usb_port`, `ip_address`, `port`, `status`, `last_seen`, `created_at`, `updated_at`, `username`, `password`, `rtsp_path`) VALUES
(1, 'HD', 'Dinning', NULL, 'USB', 0, 1, NULL, NULL, 'offline', NULL, '2025-10-18 03:01:15', NULL, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `faces`
--

CREATE TABLE `faces` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `contact` varchar(50) DEFAULT NULL,
  `image_path` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `faces`
--

INSERT INTO `faces` (`id`, `user_id`, `name`, `contact`, `image_path`, `created_at`) VALUES
(1, 8, 'Shekinah', '09103251029', 'dataset/user_8/1760756460.jpg', '2025-10-18 03:01:00');

-- --------------------------------------------------------

--
-- Table structure for table `face_logs`
--

CREATE TABLE `face_logs` (
  `id` int(11) NOT NULL,
  `device_id` int(11) DEFAULT NULL,
  `name` varchar(100) NOT NULL,
  `confidence` float DEFAULT NULL,
  `timestamp` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `face_logs`
--

INSERT INTO `face_logs` (`id`, `device_id`, `name`, `confidence`, `timestamp`) VALUES
(3, 1, 'Shekinah', 48, '2025-10-18 12:04:40'),
(4, 1, 'Shekinah', 42, '2025-10-18 12:04:50'),
(5, 1, 'Shekinah', 41, '2025-10-18 12:05:01'),
(6, 1, 'Shekinah', 49, '2025-10-18 12:06:36'),
(7, 1, 'Shekinah', 52, '2025-10-18 12:06:46'),
(8, 1, 'Shekinah', 47, '2025-10-18 12:06:58');

-- --------------------------------------------------------

--
-- Table structure for table `hotlines`
--

CREATE TABLE `hotlines` (
  `id` int(11) NOT NULL,
  `name` varchar(150) NOT NULL,
  `contact` varchar(100) NOT NULL,
  `address` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `hotlines`
--

INSERT INTO `hotlines` (`id`, `name`, `contact`, `address`, `created_at`) VALUES
(2, 'Municipality of Mataas na Kahoy (LGU)', '(043) 461-0107/(043) 461-2374', 'Bahay Pamahalaan Ng Mataasnakahoy X467+5Q5, Lipa City, Batangas', '2025-10-10 20:38:20');

-- --------------------------------------------------------

--
-- Table structure for table `password_resets`
--

CREATE TABLE `password_resets` (
  `id` int(11) NOT NULL,
  `account_id` int(11) NOT NULL,
  `email` varchar(255) NOT NULL,
  `code` varchar(10) NOT NULL,
  `expires_at` datetime NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `sos_alerts`
--

CREATE TABLE `sos_alerts` (
  `id` int(11) NOT NULL,
  `username` varchar(100) NOT NULL,
  `location` varchar(255) NOT NULL,
  `message` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `accounts`
--
ALTER TABLE `accounts`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `devices`
--
ALTER TABLE `devices`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `faces`
--
ALTER TABLE `faces`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_user_face` (`user_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `face_logs`
--
ALTER TABLE `face_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `account_id` (`device_id`);

--
-- Indexes for table `hotlines`
--
ALTER TABLE `hotlines`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `password_resets`
--
ALTER TABLE `password_resets`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `unique_email` (`email`),
  ADD KEY `fk_password_resets_account` (`account_id`);

--
-- Indexes for table `sos_alerts`
--
ALTER TABLE `sos_alerts`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `accounts`
--
ALTER TABLE `accounts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `devices`
--
ALTER TABLE `devices`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `faces`
--
ALTER TABLE `faces`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `face_logs`
--
ALTER TABLE `face_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `hotlines`
--
ALTER TABLE `hotlines`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `password_resets`
--
ALTER TABLE `password_resets`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `sos_alerts`
--
ALTER TABLE `sos_alerts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `faces`
--
ALTER TABLE `faces`
  ADD CONSTRAINT `faces_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `accounts` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `face_logs`
--
ALTER TABLE `face_logs`
  ADD CONSTRAINT `face_logs_ibfk_1` FOREIGN KEY (`device_id`) REFERENCES `devices` (`id`);

--
-- Constraints for table `password_resets`
--
ALTER TABLE `password_resets`
  ADD CONSTRAINT `fk_password_resets_account` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
