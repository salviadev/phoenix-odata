export declare function checkAndParseEntityId(odataUri: OdataParsedUri, schema: any): any;
export declare function queryResult(payload: any[], count?: number): any;
export declare function parseSelect(select?: string): string[];
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
export declare function parseOdataUri(url: string, method: string): OdataParsedUri;
