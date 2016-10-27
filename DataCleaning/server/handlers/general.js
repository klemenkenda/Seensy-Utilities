// general includes
var qm = require('qminer');
var logger = require('../../modules/logger/logger.js');

function GeneralHandler(app) {
    logger.debug('General handler - INIT');
    this.app = app;    
    this.namespace = '/general/';
}

// get router paths
GeneralHandler.prototype.handleGetRouterPaths = function (req, res) {
    var routerPaths = [];
    var test = this.app;
    this.app._router.stack.forEach(function (item) {
        if (item.route != undefined) {
            routerPaths.push({ "path": item.route.path, "methods": item.route.methods });
        }
    });
    res.type('json').status(200).json(routerPaths).end();
}

GeneralHandler.prototype.setupRoutes = function (app) {
    // custom handler setup
    app.get('/', this.handleGetRouterPaths.bind(this));    
}

module.exports = GeneralHandler;