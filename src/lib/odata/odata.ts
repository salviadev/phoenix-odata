"use strict";



import {http}  from 'phoenix-utils';
import * as pschema from 'phoenix-json-schema-tools';


function throwInvalidEntityId(): void {
    throw new http.HttpError("Invalid entityId.", 400);
}



export function checkAndParseEntityId(odataUri: OdataParsedUri, schema: any): any {
    let res: any = {};
    
    let pkFields = pschema.schema.pkFields(schema);
    if (typeof odataUri.entityId === "string") {
        if (pkFields.length !== 1)
            throwInvalidEntityId();
        res[pkFields[0]] = odataUri.entityId;
    } else {
        pkFields.forEach(pn => {
            if (odataUri.entityId[pn] === undefined)
                throwInvalidEntityId();
            res[pn] = odataUri.entityId[pn];
        });

    }
    
    
    return res;
}

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
