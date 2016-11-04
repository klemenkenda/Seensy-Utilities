# LogCleaning
Performs log cleaning on Seensy logs. Removes empty requests and other non-parsable data in the log files. Also pushes cleaned log files into seensy miner.

## Prerequisites:
* Python 3.x.x
* Module requests (use ```pip install requests``` to install)

## Usage
Create directories:
* cleaned
* errors
* logs
Save non-clean log files (log*.txt) into logs folder.

### Cleaning
Execute with ```python clean_logs.py```.

The script will traverse ```logs``` directory and check each file there. It will create files with the same name in directories ```cleaned``` and ```errors```. This first level cleaning will only remove obsolete/syntactically wrong requests from the log files.

### Pushing
```push_logs.py``` will first filter first-level cleaned log files through data-cleaning Seensy instance and then push them to Seensy data analytics.

First you need to configure both instances: data cleaning (dc) and data server (ds) in the first part of the ```push_logs.py```. The following needs to be edited for your needs:

```
# configuration
config = {}
config["dir"] = "cleaned/"

# data server
config["dsLocation"]  = "http://localhost:9202"
config["dsRequest"] = "/data/add-measurement/"
# data cleaning
config["dcLocation"]  = "http://localhost:9214"
config["dcRequest"] = "/cleaning/add-measurement/"
```

## Daily Job
Script for fetching last day log from production server, cleaning it and then pushing it to local Seensy instance is ```load_clean_previous_day.py```. The task can be invoked with ```service.bat```. The best way to do so is to run this script from Task Scheduler (e.g. at 12:05AM each day). Take care that the task is run in the proper directory.
