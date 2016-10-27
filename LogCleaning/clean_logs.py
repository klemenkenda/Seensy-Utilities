# dependancy on Requests
# pip install requests

# imports
import os
import sys
import requests
import datetime
import urllib
import codecs
import json

# configuration
config = {}
config["dir"] = "logs/"
config["cleandir"] = "cleaned/"
config["errordir"] = "errors/"

print("Starting cleaning ...")

# list files in the log file directory
fList = os.listdir(config["dir"])
#fList.sort(key=lambda x: datetime.datetime.strptime(x.split('-')[1].split('.')[0], '%Y%m%d'))
fList.sort()

def streamLog(fName):
    print("\nCleaning log file: " + fName)
    size = os.path.getsize(config["dir"] + fName)
    i = 0
    fe = open(config["errordir"] + fName, 'w')
    fok = open(config["cleandir"] + fName, 'w')
    with codecs.open(config["dir"] + fName, 'Urb', encoding='utf-8') as f:
        for line in f:
            try:
                i = i + len(line)
                print(str(i) + " / " + str(size) + " " + str(round(float(i)/size, 3)*100) + "%")
                sys.stdout.flush()

                sline = line.strip()
                cleanLine = sline;

                # parse JSON
                try:
                    obj = json.loads(sline)
                    ok = False
                    for node in obj:
                        if (("measurements" in node['node']) and (node['node']['measurements'] != [])):
                            ok = True;

                    if (ok == True):
                        fok.write(sline + "\n");
                except ValueError:
                    fe.write(sline + "\n");
                    print("JSON error!");


            except requests.exceptions.RequestException as e:
                print(e)

    fok.close()
    fe.close()
    return

for fName in fList:
    if os.path.isfile(config["dir"] + fName) == True:
        streamLog(fName)
