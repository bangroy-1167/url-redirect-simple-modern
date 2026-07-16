-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Jul 16, 2026 at 12:45 PM
-- Server version: 11.4.10-MariaDB-cll-lve
-- PHP Version: 8.4.22

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `thin1722_urlsRF`
--

-- --------------------------------------------------------

--
-- Table structure for table `url8`
--

CREATE TABLE `url8` (
  `id_rd` int(11) NOT NULL,
  `shorturl` varchar(255) NOT NULL,
  `targeturl` text NOT NULL,
  `pswd` varchar(255) DEFAULT NULL,
  `exp_date` date DEFAULT NULL,
  `tglbuat` datetime NOT NULL DEFAULT current_timestamp(),
  `tglreset` datetime DEFAULT NULL,
  `hitcounter` int(11) NOT NULL DEFAULT 0,
  `keterangan` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `url8`
--

INSERT INTO `url8` (`id_rd`, `shorturl`, `targeturl`, `pswd`, `exp_date`, `tglbuat`, `tglreset`, `hitcounter`, `keterangan`) VALUES
(2, '204Ruang_Dua', 'https://us05web.zoom.us/j/84976242987?pwd=iWar7jAH2FotDminBNMQ9En4LXqTcy.1', NULL, NULL, '2025-06-21 20:09:31', '2025-09-16 15:51:13', 1, 'zoom, bk ruang 2 zoom ruangdya iyaya'),
(5, '204Ruang_Satu', 'https://us05web.zoom.us/j/84976242987?pwd=iWar7jAH2FotDminBNMQ9En4LXqTcy.1', NULL, NULL, '2025-06-23 19:46:08', '2026-06-02 19:43:22', 652, 'zoom ruangsatu update 5c 7juli-iyaya'),
(6, 'ZoomSosialisasiMekanismeDanBimtek_Lampung', 'https://us06web.zoom.us/j/83927227307?pwd=7xeIUNvAzRf5C1VKla9TCTgLzy51Qd.1', NULL, '2025-07-03', '2025-06-25 16:01:28', '2025-07-02 13:08:11', 460, 'zoom, sosialisasi bimtek 500, old-pswd: pks8'),
(7, 'P2UPAUtama', 'https://us06web.zoom.us/j/86495445622?pwd=SRzzcLabDrNa22SUmJ5asQaua7QzSV.1', NULL, '2025-06-29', '2025-06-28 17:20:24', NULL, 16, 'BK Dpw, 300k'),
(9, 'PPW_AnggotaUtama', 'https://us06web.zoom.us/j/86495445622?pwd=SRzzcLabDrNa22SUmJ5asQaua7QzSV.1', NULL, '2025-06-29', '2025-06-29 07:13:05', NULL, 195, 'BK Dpw, 300k . ahad sore'),
(10, 'DrafLPJWilayah_per1Juli', 'https://drive.google.com/drive/folders/158JumbcjffGnk5ZUo3Q9Vp2FF8l9NTu2?usp=sharing', '$2y$10$ZJfmjbf.KZQpjrpckuXsZenUH8FYdmFm0x85Mfnk2YCZi2iBEApGq', NULL, '2025-07-01 16:13:10', NULL, 27, 'drive lpj menuju september, pswd: 888pks888'),
(11, 'ZoomReserveL', 'https://zoom.us/j/93543071953?pwd=lcXN4UxqpahLtCPeoSh7Hh34LAeQfW.1', NULL, NULL, '2025-07-12 05:23:28', NULL, 0, 'zoom, bk , 300 l'),
(12, 'PAAWil_2025Juli', 'https://zoom.us/j/93543071953?pwd=lcXN4UxqpahLtCPeoSh7Hh34LAeQfW.1.us/j/81844352483?pwd=dmyBnoM22JRapr1fQ9xaZEGkd5KYS9.1', NULL, NULL, '2025-07-15 14:11:56', NULL, 2, 'zoom, bk ruang 1, 300c - lt'),
(13, 'ZoomPAAWil_2025Juli', 'https://us06web.zoom.us/j/82866873799?pwd=flrurebKqoP7IobE30sxUOdgcav7a4.1', NULL, NULL, '2025-07-15 14:16:08', NULL, 21, 'zoom, PAA, 100c -'),
(14, 'FamilyTimeMunawardi', 'https://us06web.zoom.us/j/86250282798?pwd=y6WW9X4wbPpH2UtCKUuk9hTamL7GBj.1', NULL, NULL, '2025-07-28 17:06:25', NULL, 2, 'zoom, 3c, 1c... 96331839230\r\nashleysz'),
(15, 'zoomPGM_6agustus2025', 'https://us06web.zoom.us/j/86250282798?pwd=y6WW9X4wbPpH2UtCKUuk9hTamL7GBj.1', NULL, '2025-08-08', '2025-07-31 19:58:42', NULL, 3, 'zoom, PGM, 6agustus2025 1c\r\nashleysz'),
(16, 'WawancaraYayRagomSejahtera', 'https://us06web.zoom.us/j/88969558055?pwd=Hbupm3TgYdlPq5CMWIBo6DddOyg472.1', NULL, NULL, '2025-08-02 09:51:42', '2025-08-02 11:00:00', 19, 'zoom, c, 1c... 88969558055\r\nashleysz'),
(17, 'zoomPGM_Kita2025', 'https://us06web.zoom.us/j/87358727657?pwd=8QonFwYQ5NHSpdqVZSu6Q0EiaYoYfy.1', NULL, '2025-08-27', '2025-08-08 10:32:29', NULL, 94, 'zoom PGM 2025'),
(18, 'acaraKitaZoom', 'https://us06web.zoom.us/j/87358727657?pwd=8QonFwYQ5NHSpdqVZSu6Q0EiaYoYfy.1', NULL, '2025-08-27', '2025-08-14 09:40:34', NULL, 2, 'zoom PGM 2025'),
(19, 'PraWeFestCII', 'https://us06web.zoom.us/j/87358727657?pwd=8QonFwYQ5NHSpdqVZSu6Q0EiaYoYfy.1', NULL, '2025-08-19', '2025-08-14 09:45:08', NULL, 112, 'zoom PGM 2025'),
(20, 'aplodrio', 'https://drive.google.com/drive/folders/1lD_NCSkcpIqophfKZZSW0qv90d7ArHHe?usp=sharing', '$2y$10$BFwR.ZSXyUpFRODJ37f/Zu9.eVTAHSqei6YmEdAatnCfWT3kBHuJa', NULL, '2025-08-14 15:29:02', NULL, 26, ''),
(21, 'mediaacara2025', 'https://drive.google.com/drive/folders/1x60wWDj5uc9-N8YyveIiTPzG8IItzO-6?usp=sharing', NULL, NULL, '2025-08-15 13:46:18', NULL, 2, 'indonesia raya mars hymne pks 2025'),
(22, 'zoomRapatSekretarisDPW_DPD', 'https://zoom.us/j/91919305279?pwd=TiOG63n580CpGAtCLEV5VUcKIAPAIK.1', NULL, NULL, '2025-08-16 18:50:59', '2025-10-13 12:22:23', 66, 'zoom Rapat sekretaris DPW-DPD ~ sampe kapan ja -- richardgrif'),
(23, 'SilaturahimHybrid_DSW_DEDLampung_2025', 'https://us06web.zoom.us/j/87358727657?pwd=8QonFwYQ5NHSpdqVZSu6Q0EiaYoYfy.1', NULL, '2025-08-21', '2025-08-17 10:04:39', NULL, 94, 'zoom hybrid tanggal 19 agustus\r\ndsw'),
(24, 'BahanRapatSekretarisLampung_17Ags2025', 'https://drive.google.com/drive/folders/1h3Q_UL_Lp2l-evIA0-uvaoG64PXwFVhH?usp=sharing', NULL, '2025-08-19', '2025-08-17 20:33:52', NULL, 3, 'rapat sekretaris 17 agustus hybrid.. old..'),
(25, 'PraWefestCII3.0', 'https://us06web.zoom.us/j/87358727657?pwd=8QonFwYQ5NHSpdqVZSu6Q0EiaYoYfy.1', NULL, '2025-08-27', '2025-08-19 14:54:29', NULL, 103, 'zoom PGM 2025'),
(26, 'Arahan-Amanat_KetuaDPW_2025Agustus', 'https://drive.google.com/drive/folders/1ZQXz5ROQ5Xzt0BBO9r6FoisL9gE6n811?usp=sharing', NULL, NULL, '2025-08-20 16:21:12', NULL, 32, ''),
(27, 'COCCII2025', 'https://us06web.zoom.us/j/81579309391?pwd=lGMGslCN7H2AHT25InrFetm7hW7al2.1', NULL, '2025-08-30', '2025-08-22 16:32:18', NULL, 70, 'zoom pgm 28 agsutus 2025'),
(28, 'PraWefestCII4.0', 'https://us06web.zoom.us/j/81579309391?pwd=lGMGslCN7H2AHT25InrFetm7hW7al2.1', NULL, '2025-09-02', '2025-08-26 12:58:00', NULL, 125, 'zoom pgm 31 agsutus 2025'),
(29, 'SekDPWDPD_Musda', 'https://zoom.us/j/96029816547?pwd=DSV54pASiaockh8V4QMJjJ1kLdCB2L.1', NULL, NULL, '2025-08-28 10:17:27', NULL, 239, 'zoom 100c bp5-1c musda'),
(30, 'ZoomBidang_Siang', 'https://zoom.us/j/96561952045?pwd=HbjHBFBMyfaioj7KaOcPqb71VoETLL.1', NULL, NULL, '2025-09-01 12:51:42', NULL, 6, 'zoom bidang siang | mbail'),
(31, 'ZoomBidang_Sore', 'https://zoom.us/j/95981425553?pwd=Katud3Cy6zhVr6wkbdRNP6tXKRbnvT.1', NULL, NULL, '2025-09-01 12:52:21', NULL, 39, 'zoom bidang 2 sore | mbail'),
(32, 'ZoomBidang_Malam', 'https://zoom.us/j/93519236762?pwd=m1oMu35y8igHe4a0ce09xegLR8IZXh.1', NULL, NULL, '2025-09-01 12:53:12', NULL, 80, 'zoom bidang 3 Malem | mbail'),
(33, 'SosialisasiSensusPeloporLampung', 'https://zoom.us/j/93381066411?pwd=0JoLhn3JoLztLScfwqZmOFrPlLXsGy.1', NULL, '2025-09-28', '2025-09-08 14:42:16', NULL, 564, 'zoom sensusPelopor | loriyey | 500c'),
(34, 'ZoomBelajarCodingBareng10September2025', 'https://us06web.zoom.us/j/89084456754?pwd=j3WK2bUy4qbpBCQsotaKDzJicbGVBM.1', NULL, NULL, '2025-09-10 16:38:04', NULL, 31, 'zoom ketemuan coder'),
(35, 'FormulirBOP_GurihkuChicken_BoemkrafPKSLampung', 'https://forms.gle/kX8FGFN3gPM4qvzP9', NULL, NULL, '2025-09-17 13:24:56', NULL, 11, ''),
(37, 'murbaystorage', 'https://drive.google.com/drive/folders/1gvQ_S7b3_4rJw7pnW2mq4zmwYD-AhqZS?usp=sharing', NULL, NULL, '2025-09-22 16:00:33', NULL, 10, 'murbay234'),
(38, 'ZoomBidang_BoemKraf25Sept', 'https://zoom.us/j/98137952554?pwd=zj7jdwxDq4TfNClzwmmRQObNngUhDX.1', NULL, NULL, '2025-09-25 17:38:57', NULL, 58, 'zoom bidang boemkraf | bp51c'),
(39, 'ZoomBidang_Bipeka', 'https://zoom.us/j/91945863828?pwd=Q4CKu78nQELM21PbHlAiC3m7n9d6hh.1', NULL, NULL, '2025-10-17 11:36:30', NULL, 337, 'zoom bidang bipeka | bipeka 19 okt'),
(41, 'sehatbugar_MasAgung', 'https://drive.google.com/drive/folders/1Vn8xPUisEzLMT5aI_YPo9qKtIIKQVE0G?usp=sharing', NULL, NULL, '2025-10-25 09:02:02', NULL, 5, ''),
(42, 'linkzoom1nov', 'https://us02web.zoom.us/j/85923515566?pwd=9uci6WaBNnDrx2C2vow0cMYqKsPynU.1', NULL, NULL, '2025-10-31 17:47:07', NULL, 3, 'mpp-mpw-dpw zoom'),
(43, 'PKKUtama21Nov2025', 'https://telkomsel.zoom.us/j/91301537534?pwd=InuJoY1XTObVCqDXJFFFpsAN58wQTS.1', NULL, NULL, '2025-11-12 18:09:49', NULL, 277, 'zoom lerto 500'),
(44, '204Ruang_Tiga', 'https://us05web.zoom.us/j/87047266314?pwd=VZjHInYhvdO85OLvBIbD2xojdcvrTK.1', NULL, NULL, '2025-11-19 08:11:50', NULL, 83, 'ZOOM RUANG 3 kwk3 |w7g4'),
(46, 'MonitoringCalonPengajar', 'https://docs.google.com/spreadsheets/d/1g7tW6Fj6_vHKr4NFATFYP6z2416sv7pZFymtMBQ3sJE/edit?usp=sharing', '$2y$10$Mir/14SjD8.mW1uJwzBQnOY4n3Le51pnDf1eqIwjBpVmT5uD8QTrS', NULL, '2025-11-19 09:56:59', NULL, 2, 'passwd: 8888'),
(47, 'contohshare', 'https://drive.google.com/drive/folders/1T0G60YauWPJz_17t74WT-rBPw8f-gtc5?usp=sharing', NULL, NULL, '2025-11-19 13:32:35', NULL, 2, 'contohshareeee'),
(48, 'FormulirCalonPengajarBBQLansia', 'https://bit.ly/3X4jN4l', NULL, NULL, '2025-11-19 13:43:25', NULL, 562, 'bu rosinah'),
(49, 'zoomRakerwilDPP', 'https://us02web.zoom.us/j/81476230775?pwd=B162gHjS9t7cyj0aUL8wWfaFZ1X7zK.1', NULL, NULL, '2025-11-20 15:55:08', NULL, 1, ''),
(50, 'KonfirmasiKehadiranRakerwilLampung', 'https://bit.ly/4a1M03l', NULL, NULL, '2025-11-20 17:52:29', NULL, 346, 'gf via bitly'),
(51, 'kenalanyuk_sukarame', 'https://bit.ly/kenalanyuk_sukarame', NULL, NULL, '2025-11-23 13:43:14', NULL, 1, ''),
(52, 'BahanBidangDPWRakerwil25', 'https://bit.ly/3Knryzy', NULL, NULL, '2025-11-25 18:49:24', NULL, 108, 'bahan bidang via bitly'),
(53, 'ZoomRakerwil_kaMPWSession', 'https://zoom.us/j/93951365401?pwd=qnQkJleR2FpcDIZrMh3jDMP7bpKUxy.1', NULL, NULL, '2025-11-26 07:39:48', NULL, 16, ''),
(55, 'ZoomBidang_BPUKB_7Des', 'https://zoom.us/j/98810800324?pwd=spdswZwMuxDGqHRIMxi4Bgsdy1l9Vi.1', NULL, NULL, '2025-12-05 09:23:11', NULL, 3, 'ZoomBidang_BPUKB_7Des rchrdgrf'),
(56, 'ZoomBidang_Boemkraf_6Des', 'https://zoom.us/j/91717138962?pwd=oEhnti19E4FFwvTzvXYeGZBOcEba0M.1', NULL, NULL, '2025-12-05 17:27:04', NULL, 64, 'ZoomBidang_BPUKB_7Des rchrdgrf'),
(57, 'cc7des2025', 'https://zoom.us/j/92469641664?pwd=aoEwQ7OFswPXlHQq1xlMIzU1QRZdaD.1', NULL, NULL, '2025-12-06 17:43:15', NULL, 3, 'zoom owner lrt'),
(58, 'RakorBPPMLampung25', 'https://zoom.us/j/91877183914?pwd=T2eqyXaPNELZsxqzpNs37MZzHmJT88.1', NULL, NULL, '2025-12-09 12:56:06', NULL, 68, 'zoom bidang 3 Malem | jmsdc1c'),
(59, 'OrientasiLembagaAnakYatim14Desember', 'https://zoom.us/j/95280331061?pwd=rIi1ZfcAqyTlX9sI3TaDphSFvXQ0WZ.1', NULL, NULL, '2025-12-10 09:29:44', NULL, 138, 'zoom dsw OrientasiLembagaAnakYatim14Desember jmsdc1c'),
(60, 'rakorbidLamsel121225', 'https://telkomsel.zoom.us/j/91301537534?pwd=InuJoY1XTObVCqDXJFFFpsAN58wQTS.1', NULL, NULL, '2025-12-12 07:42:51', NULL, 202, 'zoom rakor bidang lamsel eko'),
(61, 'bidnaker2025Des13', 'https://zoom.us/j/94947938943?pwd=Q30Kbc8gnosPvn25K6Xat1BZIhFOpQ.1', NULL, NULL, '2025-12-13 15:45:28', NULL, 38, 'zoom bidang bidnaker | jmsdc1c'),
(62, 'zoomBELHPILampung_151225', 'https://zoom.us/j/92616571283?pwd=9ADrQ2Za5gkvhxCDj0ZETsdRW2wLUZ.1', NULL, NULL, '2025-12-15 13:43:13', NULL, 23, 'zoom bidang belhpi| jmsdc1c'),
(63, 'zoomBKAPLampung_171225', 'https://us05web.zoom.us/j/81715586691?pwd=lG5WV8xly4QZMEPVVCuCH2JcOuEQNQ.1', NULL, NULL, '2025-12-15 16:30:56', NULL, 104, 'zoom bkpa 17 des - buana - utyadnac'),
(64, 'zoomBKAPLampung_181225', 'https://us05web.zoom.us/j/81715586691?pwd=lG5WV8xly4QZMEPVVCuCH2JcOuEQNQ.1', NULL, NULL, '2025-12-17 18:45:00', NULL, 2, 'zoom bkpa 18 des - buana utyadnac'),
(65, 'BKZoom28Desember', 'https://zoom.us/j/91510877196?pwd=5B5jHzKFVBMnhgaWHmRMLhQ4v2FoqM.1', NULL, NULL, '2025-12-25 09:08:24', NULL, 8, 'zoom, bk 28 Des, | rkdnd'),
(66, 'zoomBidBoemkraf10Jan26', 'https://us05web.zoom.us/j/83066518256?pwd=YGFBDPDrIA3wg8OXXZjM6ODUOb9Cg9.1', NULL, NULL, '2026-01-08 09:01:07', NULL, 128, 'zoom boemkraf 10jan  kwk8'),
(67, 'bipekara_korwil2', 'https://us05web.zoom.us/j/87166311147?pwd=VrR7Fg1EIaCrByw7dfGpL5dtlvaFab.1', NULL, NULL, '2026-01-17 11:52:51', NULL, 3, 'Nama acara : Rakorwil 2 Bipeka DPW PKS Lampung\r\nhari/Tanggal acara : Ahad, 18 Januari 2026 pkl. 08.00-12.00 WIB'),
(68, 'BPPNLampung4Feb2026Zoom', 'https://zoom.us/j/99406718882?pwd=sEJNaSAbf6FvATexbXGQSwFJypguzi.1', NULL, NULL, '2026-02-02 11:15:43', NULL, 74, 'zoom bppn februari 2026'),
(69, 'CommanderCall_hybrid', 'https://zoom.us/j/94882244540?pwd=rxQ2fe9KQ20BWh1P4Xbj2qIGoF3U4l.1', NULL, NULL, '2026-02-02 15:58:45', NULL, 2, 'commander call'),
(70, 'BKAP15Feb2026', 'https://zoom.us/j/93070792452?pwd=CcQqxhKaUXYTtvFTMit1FHIHpF4FGf.1', NULL, NULL, '2026-02-02 16:21:17', '2026-02-14 13:46:16', 251, ''),
(71, 'PelantikanDewanPenasihat&Pakar', 'https://zoom.us/j/97670822106?pwd=yatdftDX5OTbJsnRNz2XJ1rWzUYd0D.1', NULL, NULL, '2026-02-03 18:25:26', NULL, 0, ''),
(72, 'PelantikanDewanPenasihat_Pakar', 'https://zoom.us/j/97670822106?pwd=yatdftDX5OTbJsnRNz2XJ1rWzUYd0D.1', NULL, NULL, '2026-02-03 18:26:03', NULL, 28, ''),
(73, 'driveabiyo', 'https://bit.ly/3LTdX3Y', NULL, NULL, '2026-02-04 08:48:43', NULL, 44, 'drive titipabiyo googledrive via bitly'),
(74, 'CommandersCall', 'https://zoom.us/j/98318574442?pwd=a6xTICqkfPVaXpfWWpbbdltD03tS3J.1', NULL, NULL, '2026-02-14 13:45:47', NULL, 173, 'commander call zoom 300 15feb sore'),
(75, 'RakorBinapora', 'https://zoom.us/j/92357901977?pwd=ofA4XPwxI0IOyeIb364jQY8S5JOyol.1', NULL, NULL, '2026-02-14 14:01:54', NULL, 41, 'zoom rakor binapora'),
(76, 'zoomBOPBoemkraf15Feb26', 'https://zoom.us/j/99443090621?pwd=YPY4FzQyuYu1qK1Uav57VNSuhzrK4m.1', NULL, NULL, '2026-02-14 14:02:30', NULL, 43, 'zoom rakor bop bumkraf'),
(77, 'rakorMHQJuknis', 'https://zoom.us/j/93400818659?pwd=xyaZIhZHWLbKZ55rSuWJEqwu1b150K.1', NULL, NULL, '2026-02-16 07:18:36', NULL, 102, 'zoom rakor mhq bkap yuli 300'),
(78, 'zoomBOPBoemkraf16FebSore', 'https://zoom.us/j/97687149029?pwd=g8ROXFt2a6UpMahkfjmazeVavtnXVb.1', NULL, NULL, '2026-02-16 13:42:04', NULL, 70, 'zoom rakor bop bumkraf'),
(79, 'MHQajaLamsel', 'https://zoom.us/j/98989483373?pwd=52pUbZPFvkkzY1k5WcT3VRHbpyvvCr.1', NULL, NULL, '2026-02-20 13:01:57', NULL, 42, 'mhq lamsel aj zoom ahad 22'),
(80, 'MHQ', 'https://telkomsel.zoom.us/j/95325835586?pwd=mOe2X0gETtHZGXsFDcEkbPnn5XV5On.1', NULL, NULL, '2026-02-28 14:56:39', NULL, 20, 'zoom mhq final provinsi'),
(81, 'KajianBIPEKA', 'https://zoom.us/j/99348484669?pwd=tVRtdiMFr9AkRvXcU42Lk7ME5ixCgo.1', NULL, NULL, '2026-03-04 21:26:41', NULL, 170, 'zoom 300 default bangroy'),
(82, 'drivetitip', 'https://bit.ly/4bA5wEs', NULL, NULL, '2026-03-10 14:17:42', NULL, 7, 'drive titip all my google drive'),
(83, 'rapatpanitiaLPK25maret', 'https://zoom.us/j/91268917621?pwd=Ko42owlMtt0HHtdZfNdCwHRHoklHY9.1', NULL, NULL, '2026-03-25 12:56:47', NULL, 32, 'zoom 1c panitia lpk'),
(84, 'rapatBKBN31Maret2026', 'https://zoom.us/j/96555759609?pwd=faZFZxO9lI2Uz1HTUmhkXgsp7E8QDN.1', NULL, NULL, '2026-03-30 17:38:05', NULL, 53, 'zoom rapat bkbn 31 maret 2026'),
(85, 'rapatLPK_BKBN', 'https://zoom.us/j/93701677140?pwd=71W76OFB95X5dBpF6qLoW6sbOc2Pui.1', NULL, NULL, '2026-04-07 19:46:02', NULL, 18, 'rapat lpk bkbn'),
(86, 'rakorBidBoemkrafLampung240426', 'https://zoom.us/j/96332728034?pwd=3Ajr0laCjC1c7hcaHIQZxTlg69Lxsd.1', NULL, NULL, '2026-04-21 20:20:51', NULL, 37, 'zoom xa213'),
(87, 'PPWUtama', 'https://telkomsel.zoom.us/j/96326865190?pwd=LnIgVfPbQeZDtylm9wGHWPtzjY5jTA.1', NULL, NULL, '2026-04-23 15:19:26', NULL, 6, 'zoom ppw utama sabtu 6 juni 2026'),
(88, 'mnst-pkslampung2026', 'http://146.190.110.121:35527/', '$2y$10$I9QYeXndqi/CLDZ8JwUBuuiybAqcbXqvwyqdqICmqS7yZxcEf.uz6', NULL, '2026-05-01 06:51:07', NULL, 1, ''),
(89, 'rakorBELHPI', 'https://zoom.us/j/91335559880?pwd=CA9zNnIrwSPP5UNarRbROjBsTx4Iao.1', NULL, NULL, '2026-05-05 19:58:56', NULL, 39, ''),
(90, 'RakorDSW_DED_Mei2026', 'https://zoom.us/j/93110393910?pwd=sj1a1tuLgbObhwydIkbqmvW9MwSBap.1', NULL, NULL, '2026-05-07 16:06:07', NULL, 3, 'zoom rakor dsw ded 11 januari'),
(91, 'bimtekLampungGo2653', 'https://zoom.us/j/93699823642?pwd=37NUF9PPbuBTHqvK5bXaSiU6Sg5Vu4.1', NULL, NULL, '2026-05-18 07:50:28', NULL, 15, ''),
(92, 'LG2653app', 'https://146.190.110.121:35527/', NULL, NULL, '2026-05-18 13:32:15', NULL, 1, ''),
(93, 'zoomRakorBELHPI', 'https://us05web.zoom.us/j/82365307398?pwd=s2Vsqwmj1cmbbIkbhxUwGXNGX8RCzF.1', NULL, NULL, '2026-05-24 20:14:51', NULL, 34, ''),
(94, 'zoomCommandersCall', 'https://us05web.zoom.us/j/88170959484?pwd=ZPUzmYr5mkQn1D06fKs09VjY9lfqSE.1', NULL, NULL, '2026-05-28 16:16:44', NULL, 68, ''),
(95, 'PPWAnggotaUtama', 'https://zoom.us/j/96326865190?pwd=LnIgVfPbQeZDtylm9wGHWPtzjY5jTA.1', NULL, NULL, '2026-06-05 05:28:19', NULL, 219, 'zoom ppw anggota utama 2026 Juni 6 3c'),
(96, 'admin2kumpul', 'https://zoom.us/j/98577420826?pwd=MQ5ATlfXJPRnbb2sRad7FMaib9divg.1', NULL, NULL, '2026-06-10 15:11:10', NULL, 25, ''),
(97, 'rapatkembara2026', 'https://zoom.us/j/97711792361?pwd=2vTbETUgyXznc9XV6bMXbSvYfUSSPW.1', NULL, NULL, '2026-06-15 20:40:21', NULL, 167, ''),
(98, 'rapatpersiapanzoom', 'https://zoom.us/j/97711792361?pwd=2vTbETUgyXznc9XV6bMXbSvYfUSSPW.1', NULL, NULL, '2026-06-22 11:44:14', NULL, 133, ''),
(99, 'zoomPenyerahanBantuan', 'https://zoom.us/j/97711792361?pwd=2vTbETUgyXznc9XV6bMXbSvYfUSSPW.1', NULL, NULL, '2026-06-25 16:20:55', NULL, 29, ''),
(100, 'pralatansaDU2026', 'https://zoom.us/j/91598759700?pwd=URMvsvCEJTbAEfvbrdX0lyKjgpaP3a.1', NULL, NULL, '2026-07-01 12:05:37', NULL, 5, 'zoom pralatansa 2026'),
(102, 'zoomParentingSeriesPAALampung', 'https://us05web.zoom.us/j/84976242987?pwd=iWar7jAH2FotDminBNMQ9En4LXqTcy.1', NULL, NULL, '2026-07-09 22:00:14', NULL, 19, 'zoom 25 juli malam paa perlu ganti 3c'),
(103, 'latansa_ud', 'https://us05web.zoom.us/j/87004039339?pwd=hmHif6NVWDJCWaWpwWqsKScp8PIWnF.1', NULL, NULL, '2026-07-15 11:37:37', NULL, 26, 'zoom panitia latansa update');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `url8`
--
ALTER TABLE `url8`
  ADD PRIMARY KEY (`id_rd`),
  ADD UNIQUE KEY `shorturl` (`shorturl`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `url8`
--
ALTER TABLE `url8`
  MODIFY `id_rd` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=104;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
