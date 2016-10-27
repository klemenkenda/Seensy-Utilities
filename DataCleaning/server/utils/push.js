// ---------------------------------------------------------------------------
// FILE: pushData.js
// AUTHOR: Blaz Kazic (IJS), Klemen Kenda (IJS)
// DATE: 2014-09-01
// DESCRIPTION:
//   Pushing data from one QMiner instance to another.
// ---------------------------------------------------------------------------
// HISTORY:
//  2015-11-11 - Rok Mocnik
//               Finished modifications for newer version of qminer in seensy
// ---------------------------------------------------------------------------

var logger = require('../../modules/logger/logger.js');
var http = require('http');

exports.pushData = function (base, inStores, startDate, remoteURL, lastTs, maxitems) {
    var loadStores = inStores;
    var lastTimeStamp = lastTs;

    logger.debug("Ts: " + lastTs);
    logger.debug("Date: " + startDate);
    logger.debug("URL:" + remoteURL);
    logger.debug("Max items: " + maxitems);

    // Find and returns first datetime field from store
    getDateTimeFieldName = function (store) {
        var dateTimeFieldName = null;
        for (var ii = 0; ii < store.fields.length; ii++) {
            if (store.fields[ii].type == "datetime") {
                dateTimeFieldName = store.fields[ii].name;
                break;
            }
        }
        return dateTimeFieldName;
    };

    // Find and return all datetime fields in store
    getDateTimeFieldNames = function (stores) {
        var result = []
        for (var ii = 0; ii < stores.length; ii++) {
            var store = stores[ii];
            result.push(getDateTimeFieldName(store));
        }
        return result;
    };

    // Returns index with lowest timestamp value from currRecIdxs array
    findLowestRecIdx = function (currRecIdxs, loadRSets) {
        var min = Number.MAX_VALUE;
        var idx = -1;
        for (var ii = 0; ii < currRecIdxs.length; ii++) {
            var currRec = loadRSets[ii][currRecIdxs[ii]];
            // it only pushes until the first table is empty (?check!)
            // which is a feature, as data is loaded unsynchronously
            if (currRec == null) continue;
            if (currRec[dateTimeFields[ii]].getTime() / 1000 < min) {
                min = currRec[dateTimeFields[ii]].getTime() / 1000;
                idx = ii;
                lastTimeStamp = min;
            }
        }
        return idx;
    };

    // Prepare time-windowed RSet from the store
    prepareRSet = function (store, startDateStr, lastTs) {
        // get measurements
        var rs = base.search({
            "$from": store.name,
            "Date": [{ "$gt": String(startDateStr) }]
        });

        return rs;
    };

    // Prepare time-windowed RSets from the stores
    prepareRSets = function (stores, startDate, lastTs) {
        var loadRSets = [];

        for (var ii = 0; ii < stores.length; ii++) {
            var store = stores[ii];
            loadRSets.push(prepareRSet(store, startDate, lastTs));
        }

        return loadRSets;
    }

    // Index of current records in a recordset
    var currRecIdxs = [];
    for (var ii = 0; ii < loadStores.length; ii++) {
        currRecIdxs.push(0);
    }

    // Detect date-time fields
    var dateTimeFields = getDateTimeFieldNames(loadStores);
    // Prepare recordsets
    loadRSets = prepareRSets(inStores, startDate, lastTs);

    var i = 0;  // counter of insertions
    var n = 0;  // failsafe counter

    while ((i < maxitems) && (n < 10000000)) {
        n++;
        var lowestRecIdx = findLowestRecIdx(currRecIdxs, loadRSets);

        if (lowestRecIdx == -1) break;

        // Get next record
        var rec = loadRSets[lowestRecIdx][currRecIdxs[lowestRecIdx]];

        var val = rec.toJSON(true);
        delete val.$id;


        // Making request to remote instance of QMiner             
        if (lastTimeStamp > lastTs) {
            i++;
            var url = remoteURL + '?store=' + loadStores[lowestRecIdx].name + '&data=' + JSON.stringify(val);
            logger.debug('[Push-Sync] ' + url)
            http.get(url);
        }

        currRecIdxs[lowestRecIdx]++
    }

    return lastTimeStamp;
}