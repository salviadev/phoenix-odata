"use strict"

import {$filter2mongoFilter, $aggregation2mongoAggregation} from  './lib/mongodb/odata-filter';
import {queryOptions, extractResult} from  './lib/mongodb/odata';


export var mongodb = {
    parseFilter: $filter2mongoFilter,
    parseAggregation: $aggregation2mongoAggregation,
    queryOptions: queryOptions,
    extractResult: extractResult

}

export {parseOdataUri, queryResult, parseSelect, checkAndParseEntityId, OdataParsedUri} from  './lib/odata/odata'; 