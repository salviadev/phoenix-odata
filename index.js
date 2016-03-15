"use strict";
const odata_filter_1 = require('./lib/mongodb/odata-filter');
const odata_1 = require('./lib/mongodb/odata');
exports.mongodb = {
    parseFilter: odata_filter_1.$filter2mongoFilter,
    parseAggregation: odata_filter_1.$aggregation2mongoAggregation,
    queryOptions: odata_1.queryOptions,
    extractResult: odata_1.extractResult
};
var odata_2 = require('./lib/odata/odata');
exports.parseOdataUri = odata_2.parseOdataUri;
exports.queryResult = odata_2.queryResult;
exports.parseSelect = odata_2.parseSelect;
exports.checkAndParseEntityId = odata_2.checkAndParseEntityId;
