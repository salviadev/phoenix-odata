"use strict";
var phoenix_utils_1 = require('phoenix-utils');
var pschema = require('phoenix-json-schema-tools');
function throwInvalidEntityId() {
    throw new phoenix_utils_1.http.HttpError("Invalid entityId.", 400);
}
function checkAndParseEntityId(odataUri, schema) {
    let res = {};
    let pkFields = pschema.schema.pkFields(schema);
    if (typeof odataUri.entityId === "string") {
        if (pkFields.length !== 1)
            throwInvalidEntityId();
        res[pkFields[0]] = odataUri.entityId;
    }
    else {
        pkFields.forEach(pn => {
            if (odataUri.entityId[pn] === undefined)
                throwInvalidEntityId();
            res[pn] = odataUri.entityId[pn];
        });
    }
    return res;
}
exports.checkAndParseEntityId = checkAndParseEntityId;
function queryResult(payload, count) {
    let res = {
        value: payload || []
    };
    if (count !== undefined)
        res['@odata.count'] = count;
    return res;
}
exports.queryResult = queryResult;
function parseSelect(select) {
    if (!select)
        return [];
    return select.split(',').map(value => {
        return value.trim().replace(/\//g, '.');
    });
}
exports.parseSelect = parseSelect;
