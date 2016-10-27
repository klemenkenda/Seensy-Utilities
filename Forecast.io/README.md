# Forecast.io
Forecast.io is a script, that is able to continually parse data from Forecast.io selected places. It stores data locally in an MySQL database and pushes it to the analytical platform as an updating stream. It also offers a script to push historical weather (forecast) data from MySQL to analytical platform.

WeatherOnline and OpenWeatherMap parsers are also included, but they have not been maintained since 2014.

## Config
TODO

## SQL
TODO

## Simulated service
The service is run simply via ```service.bat``` that runs the PHP update script every hour. Service can either parse historical data (if it is missing) or current data.

## Push old measurements
Old measurements can be pushed to the analytical platform via PHP script in the ```push``` directory. Just use ```run.bat``` to run it. Be aware that you need to take care so you do not push old data to analytical platform as the platform is trying linearly to find appropriate timestamp to update it.

You have to open ```push.php``` and correct the timestamp at line 51:
```
$timestamp = " AND me_time > '2015-04-01 00:00:00' ";
```
