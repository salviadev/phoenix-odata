"use strict";
var odata_filter_1 = require('./lib/mongodb/odata-filter');
var odata_1 = require('./lib/mongodb/odata');
exports.mongodb = {
    parseFilter: odata_filter_1.$filter2mongoFilter,
    parseAggregation: odata_filter_1.$aggregation2mongoAggregation,
    queryOptions: odata_1.queryOptions,
    extractResult: odata_1.extractResult
};
var odata_2 = require('./lib/odata/odata');
exports.queryResult = odata_2.queryResult;
exports.parseSelect = odata_2.parseSelect;
