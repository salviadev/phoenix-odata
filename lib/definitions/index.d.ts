export declare var mongodb: {
    parseFilter: (filter: string, schema?: any, options?: any) => any;
    parseAggregation: (aggregation: string, groupby: string, schema?: any) => any;
    queryOptions: (query: any, schema: any) => any;
    extractResult: (payload: any, options: any) => any;
};
export { parseOdataUri, queryResult, parseSelect, checkAndParseEntityId, OdataParsedUri } from './lib/odata/odata';
