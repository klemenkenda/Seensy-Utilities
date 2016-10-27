// general includes
var qm = require('qminer');
var logger = require('../../modules/logger/logger.js');
var http = require('http');
var fs = require('fs');

var Utils = {};
Utils.Sensor = require("../utils/sensor.js");
Utils.Push = require("../utils/push.js");

function DataHandler(app, base) {
    logger.debug('Cleaning handler - INIT');
    this.app = app;
    this.base = base;
    this.namespace = '/cleaning/';
    // configuration    
    this.hashPhenomenaBoundaries = new Array();
    this.hashSensorBoundaries = new Array();
    this.reloadConfig();

}


DataHandler.prototype.setupRoutes = function (app) {
    // custom handler setup
    // add-measurement - get data from JSON, save store and add aggregators
    app.get(this.namespace + 'reload', this.handleReloadConfig.bind(this));
    // add-measurement - get data from JSON, save store and add aggregators
    app.get(this.namespace + 'add-measurement', this.handleAddMeasurement.bind(this));
    // add-measurement - get data from JSON, save store and add aggregators
    app.post(this.namespace + 'add-measurement', this.handleAddMeasurementPost.bind(this));
    // add-measurement - get data from JSON, save store and update values
    app.get(this.namespace + 'add-measurement-update', this.handleAddMeasurementUpdate.bind(this));
    // add-measurement - get data from JSON, save store and update values
    app.post(this.namespace + 'add-measurement-update', this.handleAddMeasurementUpdatePost.bind(this));
    // add-measurement - get data from JSON, save store and add aggregators
    app.get(this.namespace + 'add-measurement-no-control', this.handleAddMeasurementNoControl.bind(this));    
}

DataHandler.prototype.setupRoutesTest = function (app) {
    // null - dummy function
    app.get(this.namespace + 'null', this.handleDummy.bind(this));
}

/**
 * Reload config
 *
 * @param req  {model:express~Request}  Request
 * @param res  {model:express~Response}  Response
 */
DataHandler.prototype.reloadConfig = function () {
    this.config = JSON.parse(fs.readFileSync('fixedBoundaries.json', 'utf8'));

    for (var i in this.config) {
        var list = this.config[i];        
        if (("type" in list) && ("list" in list)) {
            // create hash for Phenomena
            if (list.type == "Phenomena") {
                for (var j in list.list) {
                    var item = list.list[j];
                    var name = item["name"];
                    var min = item["min"];
                    var max = item["max"];
                    this.hashPhenomenaBoundaries[name] = new Object();
                    this.hashPhenomenaBoundaries[name].min = min;
                    this.hashPhenomenaBoundaries[name].max = max;
                }
            } else
            // create hash for Sensors    
            if (list.type == "Sensor") {
                // TODO
            }
        }
    }
}

/**
 * Reload config handler
 *
 * @param req  {model:express~Request}  Request
 * @param res  {model:express~Response}  Response
 */
DataHandler.prototype.handleReloadConfig = function (req, res) {
    this.reloadConfig();

    res.status(200).json({ 'done' : 'well' }).end();
}


/**
 * Parse data from GET request and send it to add measurements
 *
 * @param req  {model:express~Request}  Request
 * @param res  {model:express~Response}  Response
 */
DataHandler.prototype.handleAddMeasurement = function (req, res) {
    // logger.debug('[AddMeasurement] Start request handling');
    
    if (req.query.data == null || req.query.data == '') {
        res.status(200).send("No Data");
        return;
    }

    var data = JSON.parse(req.query.data);

    var newData = this.addMeasurement(data);
    res.status(200).json(newData).end();
}

/**
 * Parse data from POST request and send it to add measurements
 *
 * Accepts a POST request of the content/type application/json with JSON formatted data in body
 * 
 * @param req  {model:express~Request}  Request
 * @param res  {model:express~Response}  Response
 */
DataHandler.prototype.handleAddMeasurementPost = function (req, res) {
    // logger.debug('[AddMeasurement] Start request handling');
    
    if (req.body == null || req.body == '') {
        res.status(200).send("No Data");
        return;
    }
    
    var data = req.body;
    
    var newData = this.addMeasurement(data);
    res.status(200).json(newData).end();
}

/**
 * Parse data from request and send it to add measurements without adding the aggregates
 *
 * @param req  {model:express~Request}  Request
 * @param res  {model:express~Response}  Response
 */
DataHandler.prototype.handleAddMeasurementNoControl = function (req, res) {
    // logger.debug('[AddMeasurement] Start request handling');
    // logger.debug('[AddMeasurement] ' + req.query.data)
    
    if (req.query.data == null || req.query.data == '') {
        res.status(200).send("No Data");
        return;
    }
    
    var data = JSON.parse(req.query.data);
    
    var newData = this.addMeasurement(data, false);
    res.status(200).json(newData).end();
}

/**
 * Parse data from request and send it to add measurements updating values if new
 *
 * @param req  {model:express~Request}  Request
 * @param res  {model:express~Response}  Response
 */
DataHandler.prototype.handleAddMeasurementUpdate = function (req, res) {
    // logger.debug('[AddMeasurement] Start request handling');
    // logger.debug('[AddMeasurement] ' + req.query.data)
    
    if (req.query.data == null || req.query.data == '') {
        res.status(200).send("No Data");
        return;
    }
    
    var data = JSON.parse(req.query.data);
    
    var newData = this.addMeasurement(data, true, true);
    res.status(200).json(newData).end();
}

/**
 * Parse data from POST request and send it to add measurements updating values if new
 *
 * Accepts a POST request of the content/type application/json with JSON formatted data in body
 * 
 * @param req  {model:express~Request}  Request
 * @param res  {model:express~Response}  Response
 */
DataHandler.prototype.handleAddMeasurementUpdatePost = function (req, res) {
    // logger.debug('[AddMeasurement] Start request handling');
    // logger.debug('[AddMeasurement] ' + req.body["data"]);
    
    if (req.body == null || req.body == '') {
        res.status(200).send("No Data");
        return;
    }
    
    var data = JSON.parse(req.body["data"]);        
    var newData = this.addMeasurement(data, true, true);
    res.status(200).json(newData).end();
}

/**
 * Save node, type and measurements to the stores.
 * If measurement store does not exist create it, together with all aggregates.
 *
 * @param data  {model:express~Request}  data to be added to stores
 */
DataHandler.prototype.addMeasurement = function (data, control, update){
    // Check if we want to do control
    control = typeof control !== 'undefined' ? control : true;
    update = typeof update !== 'undefined' ? control : false;
    
    // Walk thru the data
    for (i = 0; i < data.length; i++) {
        // Parse and store node information
        var node = new Object();
        node.Name = data[i].node.name;
        node.Position = new Array();
        node.Position[0] = data[i].node.lat;
        node.Position[1] = data[i].node.lng;
                
        var measurements = data[i].node.measurements;
        for (j = 0; j < measurements.length; j++) {
            // Parse and store type information
            var type = new Object();
            type.Name = measurements[j].type.name;
            type.Phenomena = measurements[j].type.phenomenon;
            type.UoM = measurements[j].type.UoM;
            
            // Parse and store node information
            var sensor = new Object();
            sensor.Name = measurements[j].sensorid;            
            sensor.Node = node;
            sensor.Type = type;

            // Create names for additional stores
            var measurementStoreStr = "M" + Utils.Sensor.nameFriendly(sensor.Name);
            
            var measurementStore = this.base.store(measurementStoreStr);
            
            // Parse and store measurement
            var measurement = new Object();
            measurement.Val = Number(measurements[j].value);
            measurement.Time = measurements[j].timestamp;
            measurement.Date = measurements[j].timestamp.substr(0, 10);

            var alarmFix = this.checkFixedBoundaries(type, sensor, measurement);
            if (alarmFix == false) {
                logger.error("Wrong measurement - " + sensor.Name + ": " + measurement.Val + " not in valid interval.");
                delete measurements[j];
            }            
        }
    }

    return(data);
}



/**
 * Get last aggregates from specified aggregate store
 *
 * @param type          {model:seensy~Type}         Type
 * @param sensor        {model:seensy~Sensor}       Sensor
 * @param measurement   {model:seensy~Measurement}  Measurement
 */
DataHandler.prototype.checkFixedBoundaries = function (type, sensor, measurement) {
    var phenomena;
    var val;
    var sensorName;

    if ("Phenomena" in type) phenomena = type.Phenomena;
    if ("Val" in measurement) val = measurement.Val;
    if ("Name" in sensor) sensorName = sensor.Name;
    
    // make cleaning for Phenomena
    if (phenomena in this.hashPhenomenaBoundaries) {
        if (val > this.hashPhenomenaBoundaries[phenomena].max) return false;
        if (val < this.hashPhenomenaBoundaries[phenomena].min) return false;
    }

    return true;
}



/**
 * Get last aggregates from specified aggregate store
 *
 * @param req  {model:express~Request}   Request
 * @param res  {model:express~Response}  Response  
 */
DataHandler.prototype.handleGetCurrentAggregates = function (req, res) {
    var measurementStoreStr = "M" + Utils.Sensor.nameFriendly(req.query.sensorName);
    var measurementStore = this.base.store(measurementStoreStr);
    var data = this.getCurrentAggregates(measurementStore);
    res.status(200).json(data);
}

/**
 * Return last data point from specified aggregate store
 *
 * @param measurementStore {module:qm~Store}  Name of the aggregate store
 * @return                 {Object}           Data from aggregate store 
 */
DataHandler.prototype.getCurrentAggregates = function(measurementStore) {
    var data = {};
    
    data["Time"] = measurementStore.getStreamAggr("tick").val.Time;
    data["Date"] = data["Time"].substring(0, 10);
    
    // adding last measurement
    data["last-measurement"] = measurementStore.getStreamAggr("tick").val.Val;
    
    // adding tick-base aggregates
    tickTimes.forEach(function (time) {
        tickAggregates.forEach(function (aggregate) {
            aggrname = aggregate.name + time.name;
            aggrtype = aggregate.name;
            data[aggrname] = measurementStore.getStreamAggr(aggrname).val.Val;
        })
    });
    
    // adding tick-base aggregates
    bufTimes.forEach(function (time) {
        bufAggregates.forEach(function (aggregate) {
            aggrname = aggregate.name + time.name;
            aggrtype = aggregate.name;
            data[aggrname] = measurementStore.getStreamAggr(aggrname).val.Val;
        })
    });
    
    return data;
}

/**
 *  Get all the nodes and their information
 *
 * @param req  {model:express~Request}   Request
 * @param res  {model:express~Response}  Response  
 */
DataHandler.prototype.handleGetNodes = function (req, res) {
    var recSet = this.base.store('Node').allRecords;
    
    var dataObj = [];
    for (var i = 0; i < recSet.length; i++) {
        // Get all the sensors for this node        
        sensorSet = recSet[i].hasSensor;
        
        var sensorsObj = [];

        for (var j = 0; j < sensorSet.length; j++) {
            
            // Get measurement store
            var measurementStoreStr = "M" + Utils.Sensor.nameFriendly(String(sensorSet[j].Name));
            measurementStore = this.base.store(measurementStoreStr);
            
            // If store exists give data
            var startDate, endDate, val;
            if ((measurementStore != null) && (measurementStore.empty == false)) {
                startDate = measurementStore.first.Date;
                endDate = measurementStore.last.Date;
                val = measurementStore.last.Val;
                lastTs = measurementStore.last.Time;
            } else {
                startDate = "0000-00-00";
                endDate = "0000-00-00";
                val = -999.999;
                lastTs = 0
            }
            
            // Add sensor information
            sensorsObj.push({
                'Name': sensorSet[j].Name,
                'Phenomenon': sensorSet[j].Type.Phenomena,
                'UoM': sensorSet[j].Type.UoM,
                'StartDate': startDate,
                'EndDate': endDate,
                'Val': val,
                'LastTs': lastTs
            });
        }
        // Add node information
        dataObj.push({
            'Name': recSet[i].Name,
            'Position': recSet[i].Position,
            'Sensors': sensorsObj
        });
    }
    res.status(200).json(dataObj);
}

/**
 * Add dummy sensor measurement (to inser date into a common key vocabulary)
 *
 * @param startDateStr  {String}  Starting date
 * @param enddateStr    {String}  End date
 */
DataHandler.prototype.addDate = function (startDateStr, endDateStr) {
    var startDateRequest = '[{"node":{"id":"virtual-node","name":"virtual-node","lat":0,"lng":0, \
        "measurements":[{"sensorid":"virtual-node-request","value":1.0,"timestamp":"' + startDateStr +
        'T00:00:00.000","type":{"id":"0","name":"virtual-request","phenomenon":"request","UoM":"r"}}]}}]';
    var endDateRequest = '[{"node":{"id":"virtual-node","name":"virtual-node","lat":0,"lng":0, \
        "measurements":[{"sensorid":"virtual-node-request","value":1.0,"timestamp":"' + endDateStr +
        'T00:00:00.000","type":{"id":"0","name":"virtual-request","phenomenon":"request","UoM":"r"}}]}}]';
    logger.debug('[Add date]' + startDateRequest);
    logger.debug('[Add date]' + endDateRequest);
    this.addMeasurement(JSON.parse(startDateRequest), false);
    this.addMeasurement(JSON.parse(endDateRequest), false);
}

/**
 *  Get measurements for specified sensor in this timeframe
 *
 * @param sensorName   {string} Name of the sensor
 * @param startDate    {string}
 * @param endDate      {string}
 * @return             {object} Object with measurements from specified sensor
 */
DataHandler.prototype.getMeasurement = function (sensorName, startDate, endDate) {
    var measurementStoreStr = "M" + Utils.Sensor.nameFriendly(String(sensorName));
    
    // Create dummy records for dates
    this.addDate(startDate, endDate);
    
    // Query the store
    var measuredRSet = this.base.search({
        "$from": measurementStoreStr,
        "Date": [{ "$gt": String(startDate) }, { "$lt": String(endDate) }]
    });

    var dataObj = [];
    
    for (var i = 0; i < measuredRSet.length; i++) {
        dataObj.push({ 'Val': measuredRSet[i].Val, 'Timestamp': measuredRSet[i].Time.toISOString().replace(/Z/, '') });
    }

    return dataObj;
}

/**
 *  Get measurements from specified store
 *
 * @param req  {model:express~Request}   Request
 * @param res  {model:express~Response}  Response  
 */
DataHandler.prototype.handleGetMeasurement = function (req, res) {
    var sensorName = req.query.sensorName;
    var startDate = req.query.startDate;
    var endDate = req.query.endDate;

    var data = this.getMeasurement(sensorName, startDate, endDate);
    res.status(200).json(data);
}

/**
 *  Get measurements from multiple stores
 *
 * @param req  {model:express~Request}   Request
 * @param res  {model:express~Response}  Response  
 */
DataHandler.prototype.handleNGetMeasurement = function (req, res) {
    var sensorListStr = req.query.sensorNames;
    var sensorList = sensorListStr.split(",");
    var dataObj = [];
    logger.debug('[NGetMeasurement] ' + sensorList);

    // Dates
    var startDate = req.query.startDate;
    var endDate = req.query.endDate;

    for (var i = 0; i < sensorList.length; i++) {
        var sensorName = sensorList[i];
        var data = this.getMeasurement(sensorName, startDate, endDate)
        dataObj.push({ "name": sensorName, "data": data });
    }

    res.status(200).json(dataObj);
}

/**
 *  Get specified aggregate from store in this timeframe
 *
 * @param sensorName   {string} Name of the sensor
 * @param startDate    {string}
 * @param endDate      {string}
 * @param type         {string}
 * @param window       {string}
 * @return             {object} Object with aggregates from specified sensor
 */
DataHandler.prototype.getAggregate = function (sensorName, startDate, endDate, type, window) {
    // Store name
    var aggregateStoreStr = "A" + Utils.Sensor.nameFriendly(String(sensorName));
    
    // Add dummy date
    this.addDate(startDate, endDate);
    
    // Get aggregates
    var aggregateRecordSet = this.base.search({
        "$from": aggregateStoreStr,
        "Date": [{ "$gt": String(startDate) }, { "$lt": String(endDate) }]
    });
    
    var dataObj = [];

    for (var i = 0; i < aggregateRecordSet.length; i++) {
        dataObj.push({'Val': aggregateRecordSet[i][type+window], 'Timestamp': aggregateRecordSet[i].Time.toISOString().replace(/Z/, '') });
    }

    return dataObj;
}

/**
 *  Get aggregate
 *
 * @param req  {model:express~Request}   Request
 * @param res  {model:express~Response}  Response  
 */
DataHandler.prototype.handleGetAggregate = function (req, res) {
    var sensorName = req.query.sensorName;
    var startDate = req.query.startDate;
    var endDate = req.query.endDate;
    var type = req.query.type;
    var window = req.query.window;

    var data = this.getAggregate(sensorName, startDate, endDate, type, window);
    res.status(200).json(data);
}

/**
 *  Get aggregate from multiple sensors
 *
 * @param req  {model:express~Request}   Request
 * @param res  {model:express~Response}  Response  
 */
DataHandler.prototype.handleNGetAggregate = function (req, res) {
    var sensorNames = req.query.sensorNames;
    var startDate = req.query.startDate;
    var endDate = req.query.endDate;
    var type = req.query.type;
    var window = req.query.window;
    
    var sensorNamesList = sensorNames.split(',');
    
    var dataObj = [];

    for (var i = 0; i < sensorNamesList.length; i++) {
        var data = this.getAggregate(sensorNamesList[i], startDate, endDate, type, window);
        dataObj.push({ 'name': sensorNamesList[i], 'data': data });
    }
    
    res.status(200).json(dataObj);
}

/**
 *  Get specified aggregate from store in this timeframe
 *
 * @param sensorName   {string} Name of the sensor
 * @param startDate    {string}
 * @param endDate      {string}
 * @return             {object} Object with aggregates from specified sensor
 */
DataHandler.prototype.getAggregates = function (sensorName, startDate, endDate) {
    // Store name
    var aggregateStoreStr = "A" + Utils.Sensor.nameFriendly(String(sensorName));
    
    // Add dummy date
    this.addDate(startDate, endDate);
    
    // Get aggregates
    var aggregateRecordSet = this.base.search({
        "$from": aggregateStoreStr,
        "Date": [{ "$gt": String(startDate) }, { "$lt": String(endDate) }]
    });
    
    var dataObj = [];
    
    for (var i = 0; i < aggregateRecordSet.length; i++) {
        dataObj.push(aggregateRecordSet[i]);
    }

    return dataObj;
}

/**
 *  Get aggregates
 *
 * @param req  {model:express~Request}   Request
 * @param res  {model:express~Response}  Response  
 */
DataHandler.prototype.handleGetAggregates = function (req, res) {
    var sensorName = req.query.sensorName;
    var startDate = req.query.startDate;
    var endDate = req.query.endDate;
    
    var data = this.getAggregates(sensorName, startDate, endDate);
    res.status(200).json(data);
}

/**
 *  Get aggregates from multiple sensors
 *
 * @param req  {model:express~Request}   Request
 * @param res  {model:express~Response}  Response  
 */
DataHandler.prototype.handleNGetAggregates = function (req, res) {
    var sensorNames = req.query.sensorNames;
    var startDate = req.query.startDate;
    var endDate = req.query.endDate;
    
    var sensorNamesList = sensorNames.split(',')
    
    var dataObj = [];

    for (var i = 0; i < sensorNamesList.length; i++) {
        var data = this.getAggregates(sensorNamesList[i], startDate, endDate);
        dataObj.push({ 'name': sensorNamesList[i], 'data': data });
    }
   
    res.status(200).json(dataObj);
}

/**
 *  Get measurements from sensor for cleaning
 *
 * @param req  {model:express~Request}   Request
 * @param res  {model:express~Response}  Response  
 */
DataHandler.prototype.handleGetCleaningSample = function (req, res) {
    var sensorName = req.query.sensorName;
    var measurementStoreStr = "M" + Utils.Sensor.nameFriendly(String(sensorName));
    
    // Get measurement store
    var measuredRSet = this.base.store(measurementStoreStr);

    // Take a maximum of 500 samples
    samplelength = measuredRSet.length;
    if (samplelength > 500) samplelength = 500;
    
    // Create CSV response
    str = "";
    for (var i = 0; i < samplelength; i++) {
        str += measuredRSet[i].Time.toISOString().replace(/Z/, '') + ";" + measuredRSet[i].Val;
        str += '\n';
    }

    res.status(200).send(str);
}

/**
 * Prepare data and send it to required url
 *
 * @param req  {model:express~Request}  Request
 * @param res  {model:express~Response}  Response
 */
DataHandler.prototype.handlePushSyncStores = function (req, res) {
    // Get all the parameters
    var sensorListStr = req.query.sid;
    var sensorList = sensorListStr.split(",");
    var remoteURL = String(req.query.remoteURL);
    var lastTs = parseInt(req.query.lastTs);
    var prediction = 0;
    var maxitems = 1000;
    if (parseInt(req.query.prediction) == 1) prediction = 1;
    if (parseInt(req.query.maxitems) > 0) maxitems = parseInt(req.query.maxitems);

    // convert TS to QM date for query (-1 day)
    var timeFromEpoch = 0;
    if (lastTs - 24 * 60 * 60 > 0) {
        timeFromEpoch = (lastTs - 24 * 60 * 60) * 1000;
    }
    var lastTm = new Date(timeFromEpoch);    
    var startDateStr = lastTm.toISOString().replace(/Z/, '').substr(0, 10);
    logger.debug(startDateStr);

    // Add the dummy date for indexing
    this.addDate(startDateStr, startDateStr);
    
    // Prepare inStores
    var inStores = [];
    for (var i = 0; i < sensorList.length; i++) {
        var measurementStoreStr = "M" + Utils.Sensor.nameFriendly(sensorList[i]);
        var measurementStore = this.base.store(measurementStoreStr);

        inStores.push(measurementStore);
        if (prediction != 1) {
            var aggregateStoreStr = "A" + Utils.Sensor.nameFriendly(sensorList[i]);
            var aggregateStore = this.base.store(aggregateStoreStr);
            inStores.push(aggregateStore);
        }  
    }

    // Start the big push
    var lastTimeStamp = Utils.Push.pushData(this.base, inStores, startDateStr, remoteURL, lastTs, maxitems);


    res.status(200).json(lastTimeStamp);
}

/**
 * Get and add data
 *
 * @param req  {model:express~Request}  Request
 * @param res  {model:express~Response}  Response
 */
DataHandler.prototype.handleAdd = function (req, res) {
    var storeStr = String(req.query.store);
    var store = this.base.store(storeStr);
    
    // If the store doesn't exist
    if (store == null) {
        // M-sensorname --> measurements
        if (storeStr.substr(0, 1) == "M") {
            store = this.base.createStore([{
                    "name": storeStr,
                    "fields": [
                        { "name": "Time", "type": "datetime" },
                        { "name": "Date", "type": "string" },
                        { "name": "Val", "type": "float" }
                    ],
                    "joins": [],
                    "keys": [
                        { "field": "Date", "type": "value", "sort": "string", "vocabulary": "date_vocabulary" }
                    ]
                }]);
        } else if (storeStr.substr(0, 1) == "A") {
            var aggregateStoreDef = getAggregateStoreStructure(storeStr);
            store = this.base.createStore([aggregateStoreDef]);
        }
    };
    
    // Parse and add the record
    var record = JSON.parse(req.query.data);
    var responseStr;
    
    if ((store.empty) || (record.Time > store.last.Time.toISOString().replace(/Z/, '').substr(0, 19))) {
        store.push(record);
        logger.debug('[Push-Sync Add] OK');
    } else {
        logger.debug('[Push-Sync Add] Time problem: ' + record.Time + ' - store time: ' + store.last.Time.toISOString().replace(/Z/, '').substr(0, 19));
    }
    res.status(200).json('Done');
}

/**
 * Dummy function that does nothing - for testing purposes
 *
 * @param req  {model:express~Request}  Request
 * @param res  {model:express~Response}  Response
 */
DataHandler.prototype.handleDummy = function (req, res) {
    res.status(200).json({ 'done': 'well' }).end();
}

// Weird stuff
function sendMeasurementToCEP(data) {
    var post_data = JSON.stringify(data);
    var post_options = {
        host: 'atena.ijs.si',
        port: '9080',
        path: '/Esper-Services/api/QMinerJSONInputService',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(post_data)
        }
    };
    var post_request = http.request(post_options);
    post_request.write(post_data);
    post_request.end();
}

module.exports = DataHandler;
