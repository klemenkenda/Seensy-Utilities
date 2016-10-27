# dependancy on Requests 
# pip install requests 
 
# imports 
import os 
import sys 
import requests 
import datetime 
import urllib 
import codecs 
from time import sleep 
 
# configuration 
config = {} 
config["dir"] = "cleaned/" 
 
# data server 
config["dsLocation"]  = "http://localhost:9202" 
config["dsRequest"] = "/data/add-measurement/" 
# data cleaning 
config["dcLocation"]  = "http://localhost:9214" 
config["dcRequest"] = "/cleaning/add-measurement/" 
 
 
headers = {'Content-type': 'application/json', 'Accept': 'text/plain'} 
 
print("Starting streaming ...") 
 
# list files in the log file directory 
fList = os.listdir(config["dir"]) 
#fList.sort(key=lambda x: datetime.datetime.strptime(x.split('-')[1].split('.')[0], '%Y%m%d')) 
fList.sort() 
 
def streamLog(fName): 
    print("\n\nStreaming: " + fName) 
    size = os.path.getsize(fName) 
    i = 0 
    j = 0 
    fe = open('invalid_requests.txt', 'w') 
    with codecs.open(fName, 'Urb', encoding='utf-8') as f: 
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
                if r.status_code <> 200: 
                    fe.write(sline + '\n') 
                    print(r);  
 
                if r.status_code == 200:                                            
                    # all is well, make request to the real instance 
                    cleanLine = r.text 
                    s = requests.post(config["dsLocation"] + config["dsRequest"], data=cleanLine, headers=headers) 
 
            except requests.exceptions.RequestException as e: 
                print e 
     
    fe.close() 
    return 
 
for fName in fList: 
    if os.path.isfile(config["dir"] + fName) == True: 
        streamLog(config["dir"] + fName) 
        sleep(1)