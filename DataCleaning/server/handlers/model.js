// general includes
var qm = require('qminer');
var logger = require('../../modules/logger/logger.js');

function ModelHandler(app) {
    logger.debug('Model handler - INIT');
    this.app = app;
    this.namespace = '/model/';
}

// get router paths
ModelHandler.prototype.handleGetRouterPaths = function (req, res) {
    var routerPaths = [];
    var test = this.app;
    this.app._router.stack.forEach(function (item) {
        if (item.route != undefined) {
            routerPaths.push({ "path": item.route.path, "methods": item.route.methods });
        }
    });
    res.type('json').status(200).json(routerPaths).end();
}

ModelHandler.prototype.setupRoutes = function (app) {
    // custom handler setup
    app.get('/', this.handleGetRouterPaths.bind(this));

    // add-measurement - get data from JSON, save store and add aggregators
    app.get(this.namespace + 'test', this.handleTest.bind(this));
}


/**
 * Parse data from GET request and send it to test
 *
 * @param req  {model:express~Request}  Request
 * @param res  {model:express~Response}  Response
 */
ModelHandler.prototype.handleTest = function (req, res) {
    logger.debug('[Model test] Start request handling');
    logger.debug('[Model test] ' + req.query.data);
            
    res.status(200).json({ 'done' : 'well' }).end();
}

module.exports = ModelHandler;