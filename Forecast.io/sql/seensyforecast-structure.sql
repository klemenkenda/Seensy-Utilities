-- phpMyAdmin SQL Dump
-- version 4.1.14
-- http://www.phpmyadmin.net
--
-- Host: 127.0.0.1
-- Generation Time: Oct 27, 2016 at 05:30 PM
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

-- --------------------------------------------------------

--
-- Table structure for table `measurement`
--

CREATE TABLE `measurement` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `me_time` timestamp NOT NULL,
  `me_sensorid` int(11) NOT NULL,
  `me_value` float NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `time_sensor_index` (`me_time`,`me_sensorid`),
  KEY `me_sensorid` (`me_sensorid`,`me_value`),
  KEY `me_time` (`me_time`),
  KEY `me_time_2` (`me_time`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 COLLATE=utf8_slovenian_ci;

-- --------------------------------------------------------

--
-- Table structure for table `node`
--

CREATE TABLE `node` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `no_name` varchar(255) COLLATE utf8_slovenian_ci NOT NULL,
  `no_gpslat` float NOT NULL,
  `no_gpslng` float NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `no_name_2` (`no_name`),
  KEY `no_name` (`no_name`,`no_gpslat`,`no_gpslng`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 COLLATE=utf8_slovenian_ci;

-- --------------------------------------------------------

--
-- Table structure for table `sensor`
--

CREATE TABLE `sensor` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `se_nodeid` int(11) NOT NULL,
  `se_typeid` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `node_type_index` (`se_nodeid`,`se_typeid`),
  KEY `se_nodeid` (`se_nodeid`,`se_typeid`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 COLLATE=utf8_slovenian_ci;

-- --------------------------------------------------------

--
-- Table structure for table `source`
--

CREATE TABLE `source` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `so_name` varchar(255) COLLATE utf8_slovenian_ci NOT NULL,
  `so_typeid` int(11) NOT NULL,
  `so_apikey` varchar(255) COLLATE utf8_slovenian_ci NOT NULL,
  `so_parameters` text COLLATE utf8_slovenian_ci NOT NULL,
  `so_lastcrawl` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  `so_successcrawl` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  `so_status` varchar(255) COLLATE utf8_slovenian_ci NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 COLLATE=utf8_slovenian_ci;

-- --------------------------------------------------------

--
-- Table structure for table `sourcetype`
--

CREATE TABLE `sourcetype` (
  `id` int(11) NOT NULL,
  `st_name` varchar(255) COLLATE utf8_slovenian_ci NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_slovenian_ci;

-- --------------------------------------------------------

--
-- Table structure for table `type`
--

CREATE TABLE `type` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ty_name` varchar(255) COLLATE utf8_slovenian_ci NOT NULL,
  `ty_phenomenon` varchar(30) COLLATE utf8_slovenian_ci NOT NULL,
  `ty_uom` varchar(10) COLLATE utf8_slovenian_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ty_name` (`ty_name`),
  KEY `ty_phenomenon` (`ty_phenomenon`,`ty_uom`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 COLLATE=utf8_slovenian_ci;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
