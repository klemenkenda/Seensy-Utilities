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

function testSeensySensors(config, type) {
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

    return alarms;
}

function IsJsonString(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}

function testPing(config, type) {
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

    return alarms;
}

function testSource(source) {
    var config = JSON.parse(source.so_config);
    
    switch (source.ty_name) {
        case "ping":
            var alarms = testPing(config, source.ty_name);
            break;
        case "seensysensors":
            var alarms = testSeensySensors(config, source.ty_name);
            break;
    }

    return alarms;
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
            sql = "UPDATE source SET so_last = NOW()";
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
                var alarms = testSource(source);
                // update database with new alarm status
                var update = updateAlarms(alarms, source);
                // trigger messaging if needed
            }

        } else {
            console.log(err);
        };
    });
});