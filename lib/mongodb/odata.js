"use strict";
var putils = require('phoenix-utils');
var odata_filter_1 = require('./odata-filter');
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
function _extractValue(src, dst, props) {
    let cp = props.shift(), last = props.length === 0;
    if (Array.isArray(src)) {
        src.forEach(function (srcItem, index) {
            if (Array.isArray(srcItem) || typeof srcItem !== 'object')
                throw new putils.http.HttpError("Invalid $select", 400);
            let dstItem = {};
            dst.push(dstItem);
            let v = srcItem[cp];
            if (last || !v || typeof v !== 'object') {
                dstItem[cp] = v;
            }
            else {
                if (Array.isArray(v))
                    dstItem[cp] = [];
                else
                    dstItem[cp] = {};
                _extractValue(v, dstItem[cp], props);
            }
        });
    }
    else {
        let v = src[cp];
        if (last || !v || typeof v !== 'object') {
            dst[cp] = v;
        }
        else {
            if (Array.isArray(v))
                dst[cp] = [];
            else
                dst[cp] = {};
            _extractValue(v, dst[cp], props);
        }
    }
}
function extractResult(payload, options) {
    delete payload._id;
    if (options.select && options.select.length) {
        let res = {};
        options.select.forEach(value => {
            _extractValue(payload, res, value.split('.'));
        });
        return res;
    }
    return payload;
}
exports.extractResult = extractResult;
function queryOptions(query, schema) {
    let options = {};
    if (query.$skip)
        options.skip = parseInt(query.$skip, 10);
    if (query.$top)
        options.limit = parseInt(query.$top, 10);
    if (options.limit)
        options.limit++;
    if (query.$search) {
        options.text = { $search: query.$search };
    }
    if (query.$orderby) {
        options.sort = query.$orderby.split(',').map(value => {
            value = value.trim();
            let a = value.split(' ');
            return [a[0].replace(/\//g, '.'), (a.length > 1 && a[1] === 'desc') ? -1 : 1];
        });
    }
    options.count = query.$count === 'true';
    if (query.aggregate) {
        options.group = odata_filter_1.$aggregation2mongoAggregation(query.aggregate, query.groupby, schema);
        if (query.having) {
            options.havingFilter = odata_filter_1.$filter2mongoFilter(query.having);
        }
    }
    return options;
}
exports.queryOptions = queryOptions;
