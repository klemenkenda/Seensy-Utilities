// general includes
var logger = require('../../modules/logger/logger.js');
var http = require('http');
var fs = require('fs');

var Utils = {};
Utils.Sensor = require("../utils/sensor.js");
Utils.Push = require("../utils/push.js");

function CleaningHandler(app) {
    logger.debug('Cleaning handler - INIT');
    this.app = app;
    this.namespace = '/cleaning/';
    // configuration
    this.hashPhenomenaBoundaries = new Array();
    this.hashSensorBoundaries = new Array();
    this.reloadConfig();
}


CleaningHandler.prototype.setupRoutes = function (app) {
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

CleaningHandler.prototype.setupRoutesTest = function (app) {
    // null - dummy function
    app.get(this.namespace + 'null', this.handleDummy.bind(this));
}

/**
 * Reload config
 *
 * @param req  {model:express~Request}  Request
 * @param res  {model:express~Response}  Response
 */
CleaningHandler.prototype.reloadConfig = function () {
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
CleaningHandler.prototype.handleReloadConfig = function (req, res) {
    this.reloadConfig();

    res.status(200).json({ 'done' : 'well' }).end();
}


/**
 * Parse data from GET request and send it to add measurements
 *
 * @param req  {model:express~Request}  Request
 * @param res  {model:express~Response}  Response
 */
CleaningHandler.prototype.handleAddMeasurement = function (req, res) {
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
CleaningHandler.prototype.handleAddMeasurementPost = function (req, res) {
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
CleaningHandler.prototype.handleAddMeasurementNoControl = function (req, res) {
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
CleaningHandler.prototype.handleAddMeasurementUpdate = function (req, res) {
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
CleaningHandler.prototype.handleAddMeasurementUpdatePost = function (req, res) {
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
CleaningHandler.prototype.addMeasurement = function (data, control, update){
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
CleaningHandler.prototype.checkFixedBoundaries = function (type, sensor, measurement) {
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

module.exports = CleaningHandler;
