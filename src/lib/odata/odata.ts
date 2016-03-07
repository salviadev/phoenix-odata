"use strict";

export function queryResult(payload: any[], count?: number): any {
    let res = {
        value: payload || []
    }
    if (count !== undefined)
        res['@odata.count'] = count;
    return res;
}

export function parseSelect(select?: string): string[] {
    if (!select) return [];
    return select.split(',').map(value => {
        return value.trim().replace(/\//g, '.');
    });
}


export interface OdataParsedUri {
    error?: {
        message: string,
        status: number
    },
    query: any,
    entity?: string,
    propertyName?: string,
    entityId?: any,
    method: string,
    application: string
}
