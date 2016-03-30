var schedule = require('node-schedule');
var mysql = require('mysql');
var syncRequest = require('sync-request');

var connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    passwrod: '',
    database: 'swatchdog'
});

connection.connect();

/* Source Types
 * ping
 * seensysensors
 * masterping
 * pingcheckin
 */

function selectFirstRelevantSource(rows, fields) {
    var ct = new Date();

    for (var i in rows) {
        if ((ct - rows[i].so_last.getTime()) > rows[i].so_frequency) return rows[i];
    }

    return null;
}

function notFiltered(sensor, config) {    
    for (var i in config) {
        var filter = config[i];
        var match = sensor.search(filter);
        if (match != -1) return false;
    }

    return true;
}

function testSeensySensors(config, type, source, callBack) {
    var url = config.url;
    var ct = new Date();
    console.log("Seensy instance - sensor test: " + url);
    var res = syncRequest("GET", url);
    var data = JSON.parse(res.getBody());
    
    var alarms = [];    
    
    for (var i in data) {
        var node = data[i];
        for (var j in node.Sensors) {
            var sensor = node.Sensors[j];
            
            if (notFiltered(sensor.Name, config.filters)) {
                
                var sensorTs = Date.parse(sensor.LastTs);
                
                // TODO: implement particular case
                
                // general case
                alarmT = config.general.alarmTreshold;
                warningT = config.general.warningTreshold;
                diff = (ct.getTime() - sensorTs);
                console.log(diff);
                
                var alarm = 0;
                if (diff > warningT) alarm = 1;
                if (diff > alarmT) alarm = 2;
                
                if (alarm) {
                    var alarmDescription = ["nothing", "warning", "alarm"];
                    /*
                    if (alarm == 1) {
                        expectedTs = ct.getTime() - warningT;
                    } else {
                        expectedTs = ct.getTime() - alarmT;
                    };
                    */

                    alarms.push({
                        "Type": type,
                        "Sensor": sensor.Name,
                        "AlarmID": alarm,
                        "AlarmIDName": alarmDescription[alarm],
                        "LastTs": sensorTs
                    })
                }
            }
        }
    }        

    callBack(alarms, source);
}

function IsJsonString(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}

function testPing(config, type, source, callBack) {
    var url = config.url;
    var res;
    console.log("Seensy instance - running test: " + url);
    var alarms = [];
    try {
        res = syncRequest("GET", url);    

        var checks = config.checks;            

        for (var i in checks) {
            var test = checks[i];
            if (test.type == "HTTP.statusCode") {
                if (res.statusCode != test.response) {
                    alarms.push({
                        "Type": type,
                        "AlarmID": 2,
                        "AlarmIDName": "alarm",
                        "Description": "HTTP.statusCode = " + test.response + " failed!"
                    });
                }
            } else if (test.type == "JSON") {
                if (!IsJsonString(res.getBody())) {
                    alarms.push({
                        "Type": type,
                        "AlarmID": 2, 
                        "AlarmIDName": "alarm",
                        "Description": "Not valid JSON response!"
                    })
                }
            }
        }
    } catch (err) {
        alarms.push({
            "Type": type,
            "AlarmID": 2,
            "AlarmIDName": "alarm",
            "Description": err.message
        });
    }

    callBack(alarms, source);
}

function testPingCheckIn(config, type, source, callBack) {
    console.log("pingCheckIn - test: " + source.so_name);

    var sql = "SELECT * FROM source, ping WHERE ping.pi_source = source.id AND source.id = " + source.id;
    connection.query(sql, function (err, rows) {
        if (err == null) {
            var alarms = [];
            
            var ping = rows[0];            
            var ts = ping.ts;
            var ct = new Date();
            
            var warningT = config.general.warningTreshold;
            var alarmT = config.general.alarmTreshold;
            
            diff = (ct.getTime() - ping.ts.getTime());
            
            var alarm = 0;
            if (diff > warningT) alarm = 1;
            if (diff > alarmT) alarm = 2;
            
            if (alarm) {
                var alarmDescription = ["nothing", "warning", "alarm"];

                alarms.push({
                    "Type": type,                    
                    "AlarmID": alarm,
                    "AlarmIDName": alarmDescription[alarm],
                    "LastTs": ping.ts.getTime()
                })
            }
            
            callBack(alarms, source);
        } else {
            cosole.log(err);
        }
    });
}

function testSourceUpdateAlarms(source) {
    var config = JSON.parse(source.so_config);
    
    switch (source.ty_name) {
        case "ping":
            var alarms = testPing(config, source.ty_name, source, updateAlarms);
            break;
        case "seensysensors":
            var alarms = testSeensySensors(config, source.ty_name, source, updateAlarms);
            break;
        case "pingcheckin":
            var alarms = testPingCheckIn(config, source.ty_name, source, updateAlarms);
            break;
    }            
}

function updateAlarms(alarms, source) {
    var sql = "SELECT * FROM alarms WHERE al_sourceid = " + source.id + " ORDER BY id DESC";
    connection.query(sql, function (err, rows, fields) {
        if (err == null) {
            if ((rows.length != 0) && (rows[0].al_description == JSON.stringify(alarms))) {                                
                // do nothing
                console.log("No changes ...");
            } else {                
                sql = "INSERT INTO alarms (al_name, al_sourceid, al_description) VALUES ('" + source.so_name + "', " + source.id + ", '" + JSON.stringify(alarms) + "')";
                connection.query(sql, function (err, rows, fields) {
                    if (err) console.log(err);
                });                
            }
            // update source
            sql = "UPDATE source SET so_last = NOW() WHERE id = " + source.id;
            connection.query(sql, function (err, rows, fields) {
                if (err) console.log(err);
            });

            if (alarms == []) {
                console.log("Alarms cleared ...");
            }
        }
    });
}

function updateMasterPing() {
    var sql = "INSERT INTO ping (pi_source) VALUES (2) ON DUPLICATE KEY UPDATE ts = NOW()";
    connection.query(sql, function (err) {
        if (err) console.log(err);
    });
}

var stateI = 0;
var stateArray = ['-', '\\', '|', '/'];

var j = schedule.scheduleJob('*/5 * * * * *', function () {
    stateI++;
    process.stdout.write(stateArray[stateI % 4] + "\033[0G");
    updateMasterPing();

    var sql = "SELECT * FROM type, source WHERE so_typeid = type.id AND so_typeid != 3";
    connection.query(sql, function (err, rows, fields) {
        if (err == null) {
            // select first relevant source
            var source = selectFirstRelevantSource(rows, fields);
            // test the source
            if (source != null) {
                var alarms = testSourceUpdateAlarms(source);
                // update database with new alarm status
                // var update = updateAlarms(alarms, source);
                // trigger messaging if needed
            }

        } else {
            console.log(err);
        };
    });
});

// start webserver for ping update

var express = require('express');
var app = express();
var expressConfig = require('./config.json');

function updatePing(id) {
    var sql = "INSERT INTO ping (pi_source) VALUES (" + id + ") ON DUPLICATE KEY UPDATE ts = NOW()";
    connection.query(sql, function (err) {
        if (err) console.log(err);
    });
}

app.get('/ping', function (req, res) {
    var id = req.query.id;
    var secret = req.query.secret;
    var response = { "done": "ok" };
    
    var sql = "SELECT * FROM source WHERE id = ? AND so_secret = ?";
    connection.query(sql, [id, secret], function (err, rows) {
        if (err == null) {
            if (rows.length != 0) {
                // update
                console.log("Ping: " + rows[0]["so_name"]);
                updatePing(id);
            } else {
                response = { "error" : "Problem with ID and/or secret." };                
            }
        } else {
            console.log(err);
        }

        res.json(response);
    });        
});

app.listen(expressConfig["port"], function () {
    console.log('SWatchDog ping server listening at ' + expressConfig["port"] + '!');
});
