# DataCleaning
Data Cleaning instance implements the following methods:
* hard limits by phenomena

TODO:
* hard limits by sensor
* adaptive filter (Kalman, LR, ANOVA ...)

## Configuration for Hard limits
Configuration is defined in file ```fixedBoundaries.json```. Example is below.

```
[
    {
        "type": "Phenomena",
        "list": [
            { "name": "Power", "min": 0, "max": 10000 },
            { "name": "Energy", "min": 0, "max": 10000 },
            { "name": "Tripped", "min": 0, "max": 1 },
            { "name": "Temperature", "min": -50, "max": 50 },
            { "name": "Humidity", "min": 0, "max": 100 },
            { "name": "LightLevel", "min": 0, "max": 1000 }
        ]
    }
]
```

## Running
The instance runs on port 9214 by default. We can run it with PM2 using ```pm2 start cleaning.js```.

Instance is listening to the following requests:
* GET cleaning/reload (reloads configuration from fixedBoundaries.json)
* GET/POST cleaning/add-measurement
* GET/POST cleaning/add-measurement-update
* GET cleaning/add-measurement-no-control

All add measurements methods accept NRG4CAST JSON streaming API format.
