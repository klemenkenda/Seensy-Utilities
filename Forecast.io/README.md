# Forecast.io
Forecast.io is a script, that is able to continually parse data from Forecast.io selected places. It stores data locally in an MySQL database and pushes it to the analytical platform as an updating stream. It also offers a script to push historical weather (forecast) data from MySQL to analytical platform.

WeatherOnline and OpenWeatherMap parsers are also included, but they have not been maintained since 2014.


## SQL
Create your database. Not to change any data in the config files, use name ```sensyforecast``` for your database. It should have writing and reading permissions for user (root/*no password*).

Import ```seensyforecast-structure.sql``` into this database to create basic structure.

### Config
Config is done via entering lines to SQL.

First, you need to insert a source type for 'Forecast.io - API'.
```
INSERT INTO `sourcetype` (`id`, `st_name`) VALUES (1, 'Forecast.io - API');
```

Second, you can enter your own source (replace ****Forecast.io-KEY**** with your own key).
```
INSERT INTO `source` (`id`, `so_name`, `so_typeid`, `so_apikey`, `so_parameters`, `so_lastcrawl`, `so_successcrawl`, `so_status`) VALUES (1, 'Forecast - HTC - Vienna', 1, '****Forecast.io-KEY****', '48.163619,16.337704,Vienna-HTC;', '2016-10-27 15:10:39', '2016-10-27 15:00:00', '48.163619,16.337704,Vienna-HTC=');
```

## Simulated service
The service is run simply via ```service.bat``` that runs the PHP update script every hour. Service can either parse historical data (if it is missing) or current data.

## Push old measurements
Old measurements can be pushed to the analytical platform via PHP script in the ```push``` directory. Just use ```run.bat``` to run it. Be aware that you need to take care so you do not push old data to analytical platform as the platform is trying linearly to find appropriate timestamp to update it.

You have to open ```push.php``` and correct the timestamp at line 51:
```
$timestamp = " AND me_time > '2015-04-01 00:00:00' ";
```
