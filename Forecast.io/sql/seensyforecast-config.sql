-- phpMyAdmin SQL Dump
-- version 4.1.14
-- http://www.phpmyadmin.net
--
-- Host: 127.0.0.1
-- Generation Time: Oct 27, 2016 at 05:31 PM
-- Server version: 5.6.17
-- PHP Version: 5.5.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;

--
-- Database: `seensyforecast`
--

--
-- Dumping data for table `source`
--

INSERT INTO `source` (`id`, `so_name`, `so_typeid`, `so_apikey`, `so_parameters`, `so_lastcrawl`, `so_successcrawl`, `so_status`) VALUES
(1, 'Forecast - HTC - Vienna', 1, '****Forecast.io-KEY****', '48.163619,16.337704,Vienna-HTC;', '2016-10-27 15:10:39', '2016-10-27 15:00:00', '48.163619,16.337704,Vienna-HTC=');

--
-- Dumping data for table `sourcetype`
--

INSERT INTO `sourcetype` (`id`, `st_name`) VALUES
(1, 'Forecast.io - API');

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
