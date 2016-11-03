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
import time
from time import sleep
from datetime import date, timedelta

# configuration
config = {}
config["dir"] = "logs/"
config["cleandir"] = "cleaned/"
config["errordir"] = "errors/"

# data server
config["dsLocation"]  = "http://localhost:9201"
config["dsRequest"] = "/data/add-measurement/"
# data cleaning
config["dcLocation"]  = "http://localhost:9214"
config["dcRequest"] = "/cleaning/add-measurement/"


headers = {'Content-type': 'application/json', 'Accept': 'text/plain'}

print("Starting loading and cleaning previous day ...")

def startPreviousDay():
    # get date
    yesterday = date.today() - timedelta(1)
    fName = "log-" + yesterday.strftime("%Y%m%d") + ".txt"
    url = "http://dashboard.seensy.me/logs/" + fName

    # load file
    print("Downloading: " + url)
    downloadFile(url)

    # clean file
    cleanLog(fName)

    # stream file
    streamLog(fName)

def downloadFile(url):
    local_filename = url.split('/')[-1]
    r = requests.get(url)
    f = open(config["dir"] + local_filename, 'wb')
    for chunk in r.iter_content(chunk_size=512 * 1024):
        if chunk: # filter out keep-alive new chunks
            f.write(chunk)
            sys.stdout.write('.')
            sys.stdout.flush()
    f.close()
    return

def cleanLog(fName):
    print("\nCleaning log file: " + fName)
    size = os.path.getsize(config["dir"] + fName)
    i = 0
    fe = open(config["errordir"] + fName, 'w')
    fok = open(config["cleandir"] + fName, 'w')
    with codecs.open(config["dir"] + fName, 'Urb', encoding='utf-8') as f:
        for line in f:
            try:
                i = i + len(line)
                if (i % 100 == 0):
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

def streamLog(fName):
    print("\n\nStreaming: " + fName)
    size = os.path.getsize(config["cleandir"] + fName)
    i = 0
    j = 0
    fe = open('invalid_requests.txt', 'w')
    with codecs.open(config["cleandir"] + fName, 'Urb', encoding='utf-8') as f:
        for line in f:
            try:
                i = i + len(line)
                j = j + 1
                if j % 1000 == 0:
                    sleep(0.240)
                print(str(i) + " / " + str(size) + " " + str(round(float(i)/size, 3)*100) + "%")
                sys.stdout.flush()

                sline = line.strip()
                cleanLine = sline;

                r = requests.post(config["dcLocation"] + config["dcRequest"], data=sline, headers=headers)
                sleep(0.02);
                if r.status_code != 200:
                    fe.write(sline + '\n')
                    print(r);

                if r.status_code == 200:
                    # all is well, make request to the real instance
                    cleanLine = r.text
                    s = requests.post(config["dsLocation"] + config["dsRequest"], data=cleanLine, headers=headers)

            except requests.exceptions.RequestException as e:
                print(e)

    fe.close()
    return

# main program
startPreviousDay()
