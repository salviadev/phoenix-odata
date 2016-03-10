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



//excepted: /odata/{application}/entity?tenantId=value


function _extractEntityIdValue(entityId: string): { value: string, isString: boolean } {
    if (entityId === '') {
        throw "entityId is empty."
    }
    if (entityId.charAt(0) === '\'') {
        if (entityId[entityId.length - 1] !== '\'')
            throw "EntityId: unterminated string."
        return { value: entityId.substring(1, entityId.length - 1), isString: true };
    }
    return { value: entityId, isString: false };
}

function _checkEntityId(oUri: OdataParsedUri): void {
    try {
        oUri.entityId = oUri.entityId + '';
        if (oUri.entityId === '')
            throw "entityId is empty."
        let useArray = (oUri.entityId.charAt(0) === '\'' || (oUri.entityId.indexOf('=') < 0));
        let pkItems = oUri.entityId.split(',');
        if (useArray) {
            oUri.entityId = pkItems.map(function(segment: string) {
                return _extractEntityIdValue(segment).value;
            });
        } else {
            let pkMap = {};
            pkItems.forEach(function(segment: string) {
                segment = segment.trim();
                let m = segment.split('=');
                if (m.length !== 2) {
                    throw "Invalid entityId."
                } else {
                    let v = _extractEntityIdValue(m[1]);
                    pkMap[m[0].trim()] = v.value;
                }
            });
            oUri.entityId = pkMap;
        }

    } catch (ex) {
        oUri.error = { message: ex.message, status: 400 };
    }

}

//excepted: /odata/{application}/entity?tenantId=value

function _parseEntityId(oUri: OdataParsedUri): void {
    let ii = oUri.entity.indexOf('(');
    if (ii > 0) {
        if (oUri.entity[oUri.entity.length - 1] != ')') {
            oUri.error = { message: "Invalid odata entity Id.", status: 400 };
            return;
        }
        oUri.entityId = oUri.entity.substring(ii + 1, oUri.entity.length - 1);
        oUri.entity = oUri.entity.substring(0, ii);
        _checkEntityId(oUri);
    }
}


export function parseOdataUri(url: string, method: string): OdataParsedUri {
    const
        invalidUrl = 'Invalid odata url, excepted: "/odata/{application}/{entity}"',
        invalidUrlAppMissing = 'Invalid odata url, application is missing.',
        invalidUrlAppEntity = 'Invalid odata url, entity is missing.';

    let root, rootOdata = '/odata/', rootUpload = '/upload/';
    let res: any = {
        method: method,
        query: {}
    };
    let query, i = url.indexOf('?');

    if (i > 0) {
        query = url.substring(i + 1);
        url = url.substr(0, i);
        query.split('&').forEach(function(value) {
            var a = value.split('=');
            if (a.length === 2)
                res.query[a[0]] = decodeURIComponent(a[1]);

        });
    }

    i = url.indexOf(rootOdata);
    if (i < 0) {
        i = url.indexOf(rootUpload);
        root = rootUpload;
    } else
        root = rootOdata
    if (i < 0) {
        res.error = { message: invalidUrl, status: 400 };
        return res;

    }
    let s = url.substring(i + root.length) || '';
    let segments = s.split('/');

    res.application = segments.shift() || '';
    if (res.application.indexOf('$applications') === 0) {
        // list applications
        res.entity = res.application;
        res.application = '*';

    } else {
        if (!res.application) {
            res.error = { message: invalidUrlAppMissing, status: 400 };
            return res;
        }
        res.entity = segments.shift() || '';
    }
    if (!res.entity) {
        res.error = { message: invalidUrlAppEntity, status: 400 };
        return res;
    }
    _parseEntityId(res);

    if (!segments.length) {
        return res;
    } else {
        if (res.entity.charAt(0) === '$') {
            res.error = { message: "Not implemented yet", status: 501 };
            return res;
        }
        if (segments.length) {
            res.propertyName = segments.join('.');
        }
    }
    return res;

}
