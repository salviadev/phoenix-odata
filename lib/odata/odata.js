"use strict";
const phoenix_utils_1 = require('phoenix-utils');
const pschema = require('phoenix-json-schema-tools');
function throwInvalidEntityId() {
    throw new phoenix_utils_1.http.HttpError("Invalid entityId.", 400);
}
function string2value(value, schema, propName) {
    let type = pschema.schema.typeOfProperty(propName, schema);
    switch (type) {
        case 'number':
            return parseFloat(value);
    }
    return value;
}
function checkAndParseEntityId(odataUri, schema) {
    let res = {};
    let pkFields = pschema.schema.pkFields(schema);
    if (typeof odataUri.entityId === "string") {
        if (pkFields.length !== 1)
            throwInvalidEntityId();
        res[pkFields[0]] = odataUri.entityId;
    }
    else if (Array.isArray(odataUri.entityId)) {
        if (pkFields.length !== odataUri.entityId.length)
            throwInvalidEntityId();
        pkFields.forEach((pn, index) => {
            res[pn] = string2value(odataUri.entityId[index], schema, pn);
        });
    }
    else {
        pkFields.forEach(pn => {
            if (odataUri.entityId[pn] === undefined)
                throwInvalidEntityId();
            res[pn] = string2value(odataUri.entityId[pn], schema, pn);
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
function _extractEntityIdValue(entityId) {
    if (entityId === '') {
        throw "entityId is empty.";
    }
    if (entityId.charAt(0) === '\'') {
        if (entityId[entityId.length - 1] !== '\'')
            throw "EntityId: unterminated string.";
        return { value: entityId.substring(1, entityId.length - 1), isString: true };
    }
    return { value: entityId, isString: false };
}
function _checkEntityId(oUri) {
    try {
        oUri.entityId = oUri.entityId + '';
        if (oUri.entityId === '')
            throw "entityId is empty.";
        let useArray = (oUri.entityId.charAt(0) === '\'' || (oUri.entityId.indexOf('=') < 0));
        let pkItems = oUri.entityId.split(',');
        if (useArray) {
            oUri.entityId = pkItems.map(function (segment) {
                return _extractEntityIdValue(segment).value;
            });
        }
        else {
            let pkMap = {};
            pkItems.forEach(function (segment) {
                segment = segment.trim();
                let m = segment.split('=');
                if (m.length !== 2) {
                    throw "Invalid entityId.";
                }
                else {
                    let v = _extractEntityIdValue(m[1]);
                    pkMap[m[0].trim()] = v.value;
                }
            });
            oUri.entityId = pkMap;
        }
    }
    catch (ex) {
        oUri.error = { message: ex.message, status: 400 };
    }
}
function _parseEntityId(oUri) {
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
function parseOdataUri(url, method) {
    const invalidUrl = 'Invalid odata url, excepted: "/odata/{application}/{entity}"', invalidUrlAppMissing = 'Invalid odata url, application is missing.', invalidUrlAppEntity = 'Invalid odata url, entity is missing.';
    let root, rootOdata = '/odata/', rootUpload = '/upload/';
    let res = {
        method: method,
        query: {}
    };
    let query, i = url.indexOf('?');
    if (i > 0) {
        query = url.substring(i + 1);
        url = url.substr(0, i);
        query.split('&').forEach(function (value) {
            var a = value.split('=');
            if (a.length === 2)
                res.query[a[0]] = decodeURIComponent(a[1]);
        });
    }
    if (res.query && res.query.tenantId)
        res.tenantId = parseInt(res.query.tenantId, 10);
    i = url.indexOf(rootOdata);
    if (i < 0) {
        i = url.indexOf(rootUpload);
        root = rootUpload;
    }
    else
        root = rootOdata;
    if (i < 0) {
        res.error = { message: invalidUrl, status: 400 };
        return res;
    }
    let before = url.substring(0, i);
    let bsegments = before.split('/');
    res.application = bsegments.pop() || '';
    let s = url.substring(i + root.length) || '';
    let segments = s.split('/');
    if (!res.application) {
        res.error = { message: invalidUrlAppMissing, status: 400 };
        return res;
    }
    res.entity = segments.shift() || '';
    if (!res.entity) {
        res.error = { message: invalidUrlAppEntity, status: 400 };
        return res;
    }
    _parseEntityId(res);
    if (!segments.length) {
        return res;
    }
    else {
        if (res.entity.charAt(0) === '$') {
            res.error = { message: "Not implemented yet", status: 501 };
            return res;
        }
        if (segments.length) {
            if (res.entityId)
                res.propertyName = segments.join('.');
            else
                res.functionName = segments.join('.');
        }
    }
    return res;
}
exports.parseOdataUri = parseOdataUri;
