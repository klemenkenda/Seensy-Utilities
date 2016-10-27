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
