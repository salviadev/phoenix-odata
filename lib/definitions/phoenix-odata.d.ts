// Generated by dts-bundle v0.4.3

declare module 'phoenix-odata' {
    export var mongodb: {
        parseFilter: (filter: string, schema?: any, options?: any) => any;
        parseAggregation: (aggregation: string, groupby: string, schema?: any) => any;
        queryOptions: (query: any, schema: any) => any;
        extractResult: (payload: any, options: any) => any;
    };
    export { queryResult, parseSelect, OdataParsedUri } from 'phoenix-odata/lib/odata/odata';
}

declare module 'phoenix-odata/lib/odata/odata' {
    export function queryResult(payload: any[], count?: number): any;
    export function parseSelect(select?: string): string[];
    export interface OdataParsedUri {
        error?: {
            message: string;
            status: number;
        };
        query: any;
        entity?: string;
        propertyName?: string;
        entityId?: any;
        method: string;
        application: string;
    }
}

