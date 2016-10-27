// general includes
var logger = require('../modules/logger/logger.js');

// include handlers
var GeneralHandler = require('./handlers/general.js');
// var DataHandler = require('./handlers/data.js');
// var QMinerHandler = require('./handlers/qminer.js');
// var ModelHandler = require('./handlers/model.js');
var CleaningHandler = require('./handlers/cleaning.js');

function CleaningModule(app) {
    logger.debug('Data Module - INIT');
    this.generalHandler = new GeneralHandler(app);
    // this.qminerHandler = new QMinerHandler(app, base);
    // this.dataHandler = new DataHandler(app, base);
    this.cleaningHandler = new CleaningHandler(app);
    // this.modelHandler = new ModelHandler(app);
}

CleaningModule.prototype.setupRoutes = function (app) {
    // handler's setups
    this.generalHandler.setupRoutes(app);
    // this.dataHandler.setupRoutes(app);
    // this.qminerHandler.setupRoutes(app);
    this.cleaningHandler.setupRoutes(app);
    // this.modelHandler.setupRoutes(app);

    // custom handler setup
    // app.get('/t1', this.handleTest1.bind(this));
}

module.exports = CleaningModule;
