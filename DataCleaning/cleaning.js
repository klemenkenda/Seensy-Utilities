// pretty errors
require("pretty-error").start();

﻿// imports
var logger = require('./modules/logger/logger.js')
var server = require('./server.js');
var env = process.env.NODE_ENV || 'cleaning';
var config = require('./config.json')[env];
var schedule = require('node-schedule');

// read input script argument for mode type. Default is "cleanCreate"
var scriptArgs = (process.argv[2] == null) ? "cleanCreate" : process.argv[2];
// read input script argument for instance type. Default is "data"
var scriptType = (process.argv[3] == null) ? "cleaning": process.argv[3];

// initiate the server
server.init();

// data module instance
if (scriptType == "cleaning") {
    var CleaningModule = require('./server/cleaningModule.js');
    var cleaningModule = new CleaningModule(server.app);
    cleaningModule.setupRoutes(server.app);
}

// start server
server.start(config.dataService.server.port);

// gracefulShutdown
var gracefulShutdown = function () {
    logger.info('Shutdown');
    server.close();    
}

// listen for TERM signal .e.g. kill
process.on('SIGTERM', gracefulShutdown);

// listen for INT signal e.g. Ctrl-C
process.on('SIGINT', gracefulShutdown);
