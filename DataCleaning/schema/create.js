var qm = require('qminer');
var path = require('path');
var logger = require('../modules/logger/logger.js');

// create base in clean create mode
function cleanCreateMode() {
    // initialise base in clean create mode   
    var base = new qm.Base({
        mode: 'createClean', 
        schemaPath: path.join(__dirname, './store.def'), // its more robust but, doesen't work from the console (doesent know __dirname)
        dbPath: path.join(__dirname, './db'),
    })
           
    return base;
}

// create base in open mode
function openMode() {
    var base = new qm.Base({
        mode: 'open',
        dbPath: path.join(__dirname, './db'),
    })
    return base;
}

// create base in read only mode
function readOnlyMode() {
    var base = new qm.Base({
        mode: 'openReadOnly',
        dbpath: path.join(__dirname, './db')
    })
    return base;
}

// create base in clean create mode and load init data
function cleanCreateLoadMode() {
    // Initialise base in clean create mode   
    var base = new qm.Base({
        mode: 'createClean', 
        //schemaPath: path.join(__dirname, './store.def'), // its more robust but, doesen't work from the console (doesent know __dirname)
        dbPath: path.join(__dirname, './db'),
    })
    
    
    // Import initial data
    // qm.load.jsonFile(base.store("sensorsStore"), path.join(__dirname, "./sandbox/sensors.json"))    
    return base;
}

// function that handles in which mode store should be opened
function createBase(mode) {
    var modes = {
        'cleanCreate': cleanCreateMode,
        'cleanCreateLoad': cleanCreateLoadMode,
        'open': openMode,
        'openReadOnly': readOnlyMode
    };
    
    // check if mode type is valid
    if (typeof modes[mode] === 'undefined') {
        throw new Error("Base mode '" + mode + "' does not exist!" + 
            "Use one of this: 'cleanCreate', 'cleanCreateLoad', 'open', 'openReadOnly'")
    }
    
    // run appropriate function
    var base = modes[mode]();
    base["mode"] = mode;
    
    logger.info("\x1b[32m[Data] Base opened in '%s' mode\n\x1b[0m", mode);
    
    return base;
}

exports.mode = createBase;