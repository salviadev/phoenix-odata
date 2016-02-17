"use strict";
var index_1 = require('../odata/index');
var pschema = require('phoenix-json-schema-tools');
var putils = require('phoenix-utils');
function _NOI() {
    throw new Error('Filter Not Implemented.');
}
function _IEXP() {
    throw new Error('Invalid $filter expression.');
}
function _escaperegex(value) {
    return value.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}
function _value(propName, schema, value, isJs) {
    let type = schema ? pschema.schema.typeOfProperty(propName, schema) : null;
    if (type === "date") {
        if (value) {
            if (isJs) {
                return 'ISODate("' + value + '")';
            }
            else {
                return putils.date.parseISODate(value);
            }
        }
    }
    return value;
}
function _extractIdVal(c1, c2, schema) {
    let res = { left: null, right: null, c1: c1, c2: c2 };
    if (c1.type === index_1.TokenType.identifier) {
        res.left = c1;
        if (c2.type === index_1.TokenType.literal) {
            res.right = c2;
            res.right.value = _value(res.left.value, schema, res.right.value, false);
        }
    }
    else if (c2.type === index_1.TokenType.identifier) {
        res.left = c2;
        if (c1.type === index_1.TokenType.literal) {
            res.right = c1;
            res.right.value = _value(res.left.value, schema, res.right.value, false);
        }
    }
    else if (c1.type === index_1.TokenType.literal && c2.type === index_1.TokenType.literal)
        throw new Error('Invalid filter (literal == literal).');
    return res;
}
function _exec(exp, match, orList, andList, js, schema) {
    if (!match && !orList && !andList)
        return match;
    let d;
    if (exp.type === index_1.TokenType.identifier) {
        if (js)
            js.push("this." + exp.value);
    }
    else if (exp.type === index_1.TokenType.literal) {
        if (js) {
            js.push(JSON.stringify(exp.value));
        }
    }
    else if (exp.type === index_1.TokenType.operator) {
        switch (exp.value.code) {
            case "and":
                let alist = andList;
                if (!alist) {
                    match.$and = match.$and || [];
                    alist = match.$and;
                }
                exp.children.forEach(function (child, index) {
                    if (js && index > 0)
                        js.push(' && ');
                    if (child.type === index_1.TokenType.operator && child.value.code === "and")
                        _exec(child, null, null, alist, js, schema);
                    else {
                        let am = {};
                        alist.push(am);
                        _exec(child, am, null, null, js, schema);
                    }
                });
                break;
            case "or":
                let list = orList;
                if (!list) {
                    match.$or = match.$or || [];
                    list = match.$or;
                }
                exp.children.forEach(function (child, index) {
                    if (js && index > 0)
                        js.push(' || ');
                    if (child.type === index_1.TokenType.operator && child.value.code === "or")
                        _exec(child, null, list, null, js, schema);
                    else {
                        let oa = {};
                        list.push(oa);
                        _exec(child, oa, null, null, js, schema);
                    }
                });
                if (js && match && match.$or)
                    delete match.$or;
                break;
            case "=":
                d = _extractIdVal(exp.children[0], exp.children[1], schema);
                if (d.left && d.right) {
                    match[d.left.value] = d.right.value;
                }
                else {
                    _NOI();
                }
                break;
            case "<>":
                d = _extractIdVal(exp.children[0], exp.children[1], schema);
                if (d.left && d.right) {
                    match[d.left.value] = { $ne: d.right.value };
                }
                else {
                    _NOI();
                }
                break;
            case ">":
                d = _extractIdVal(exp.children[0], exp.children[1], schema);
                if (d.left && d.right) {
                    match[d.left.value] = (d.c1 === d.left) ? { $gt: d.right.value } : { $lte: d.left.value };
                }
                else {
                    _NOI();
                }
                break;
            case "<":
                d = _extractIdVal(exp.children[0], exp.children[1], schema);
                if (d.left && d.right) {
                    match[d.left.value] = (d.c1 === d.left) ? { $lt: d.right.value } : { $gte: d.right.value };
                }
                else {
                    _NOI();
                }
                break;
            case ">=":
                d = _extractIdVal(exp.children[0], exp.children[1], schema);
                if (d.left && d.right) {
                    match[d.left.value] = (d.c1 === d.left) ? { $gte: d.right.value } : { $lt: d.right.value };
                }
                else {
                    _NOI();
                }
                break;
            case "<=":
                d = _extractIdVal(exp.children[0], exp.children[1], schema);
                if (d.left && d.right) {
                    match[d.left.value] = (d.c1 === d.left) ? { $lte: d.right.value } : { $gt: d.right.value };
                }
                else {
                    _NOI();
                }
                break;
            default:
                _NOI();
                break;
        }
    }
    else if (exp.type === index_1.TokenType.func) {
        switch (exp.value.name) {
            case "contains":
                let containsJsStarted = false;
                let containsJs = js;
                if (exp.children[0].type !== index_1.TokenType.identifier && !containsJs) {
                    containsJs = [];
                    containsJsStarted = true;
                }
                if (containsJs) {
                    containsJs.push('(');
                    _exec(exp.children[0], match, null, null, containsJs, schema);
                    containsJs.push('.indexOf(');
                    _exec(exp.children[1], match, null, null, containsJs, schema);
                    containsJs.push(') >= 0)');
                    if (containsJsStarted)
                        match.$where = containsJs.join('');
                }
                else {
                    _exec(exp.children[0], match, null, null, null, schema);
                    _exec(exp.children[1], match, null, null, null, schema);
                    match[exp.children[0].value] = { $regex: _escaperegex(exp.children[1].value), $options: "i" };
                }
                break;
            case "startswith":
                let startswithJsStarted = false;
                let startswithJs = js;
                if (exp.children[0].type === index_1.TokenType.identifier && exp.children[1].type === index_1.TokenType.literal && !startswithJs) {
                    startswithJs = [];
                    startswithJsStarted = true;
                }
                if (startswithJs) {
                    startswithJs.push('(');
                    _exec(exp.children[0], match, null, null, startswithJs, schema);
                    startswithJs.push('.indexOf(');
                    _exec(exp.children[1], match, null, null, startswithJs, schema);
                    startswithJs.push(') === 0)');
                    if (startswithJsStarted)
                        match.$where = startswithJs.join('');
                }
                else {
                    _exec(exp.children[0], match, null, null, null, schema);
                    _exec(exp.children[1], match, null, null, null, schema);
                    match[exp.children[0].value] = { $regex: '^' + _escaperegex(exp.children[1].value), $options: "i" };
                }
                break;
            case "endswith":
                let endswithJsStarted = false;
                let endswithJs = js;
                if (exp.children[0].type === index_1.TokenType.identifier && exp.children[1].type === index_1.TokenType.literal && !startswithJs) {
                    endswithJs = [];
                    endswithJsStarted = true;
                }
                if (startswithJs) {
                    endswithJs.push('(');
                    _exec(exp.children[0], match, null, null, endswithJs, schema);
                    endswithJs.push('.endswith(');
                    _exec(exp.children[1], match, null, null, endswithJs, schema);
                    endswithJs.push(')');
                    if (startswithJsStarted)
                        match.$where = endswithJs.join('');
                }
                else {
                    _exec(exp.children[0], match, null, null, null, schema);
                    _exec(exp.children[1], match, null, null, null, schema);
                    match[exp.children[0].value] = { $regex: '^' + _escaperegex(exp.children[1].value) + '$', $options: "i" };
                }
                break;
            case "tolower":
                let lowerJsStarted = !js;
                let lowerJs = js || [];
                _exec(exp.children[0], match, null, null, lowerJs, schema);
                lowerJs.push('.toLowerCase()');
                if (lowerJsStarted)
                    match.$where = lowerJs.join('');
                break;
            case "toupper":
                let upperJsStarted = !js;
                let upperJS = js || [];
                _exec(exp.children[0], match, null, null, upperJS, schema);
                js.push('.toUpperCase()');
                upperJS.push('.toLowerCase()');
                if (upperJsStarted)
                    match.$where = upperJS.join('');
                break;
            default:
                _NOI();
                break;
        }
    }
    return false;
}
function _execAggregation(exp, res) {
    if (exp.type === index_1.TokenType.operator) {
        if (exp.value.code === ",") {
            _execAggregation(exp.children[0], res);
            _execAggregation(exp.children[1], res);
            return;
        }
        else if (exp.value.code === "as") {
            return _execAggregationAs(exp, res);
        }
    }
    throw "Invalid aggregation expression.";
}
function _execGroupBy(exp, res) {
    if (exp.type === index_1.TokenType.operator) {
        if (exp.value.code === ",") {
            _execGroupBy(exp.children[0], res);
            _execGroupBy(exp.children[1], res);
            return;
        }
        else if (exp.value.code === "as") {
            return _execAggregationAs(exp, res);
        }
    }
    else if (exp.type === index_1.TokenType.identifier) {
        res[exp.value] = '$' + exp.value;
        return;
    }
    throw "Invalid aggregation expression.";
}
function _execAggregationAs(exp, res) {
    if (exp.children[1].type !== index_1.TokenType.identifier)
        throw "Aggregation: identifier excepted.";
    if (exp.children[0].type === index_1.TokenType.identifier) {
        res[exp.children[1].value] = '$' + exp.children[0].value;
        return;
    }
    if (exp.children[0].type === index_1.TokenType.literal) {
        res[exp.children[1].value] = exp.children[0].value;
        return;
    }
    let value = {};
    res[exp.children[1].value] = value;
    _execAggregationFunction(exp.children[0], value);
}
function _hasSubFunc(exp) {
    for (let i = 0, len = exp.children.length; i < len; i++) {
        if (exp.children[i].type === index_1.TokenType.func)
            return true;
    }
    return false;
}
function _execAggregationFunction(exp, res, parentName) {
    if (exp.type === index_1.TokenType.func) {
        if (Array.isArray(res)) {
            res = res.push({});
        }
        if (exp.value.name === "$count") {
            res.$sum = 1;
        }
        else {
            if (!exp.children.length)
                throw 'Invalid aggregation expression (no args)';
            if (exp.children[0].type === index_1.TokenType.func) {
                res[exp.value.name] = {};
                res = res[exp.value.name];
            }
            else if (exp.children[0].type === index_1.TokenType.operator && exp.children[0].value.code === ',') {
                res[exp.value.name] = [];
                res = res[exp.value.name];
            }
            exp.children.forEach(function (child) {
                _execAggregationFunction(child, res, exp.value.name);
            });
        }
    }
    else if (exp.type === index_1.TokenType.identifier || exp.type === index_1.TokenType.literal) {
        if (!parentName)
            throw 'Invalid aggregation expression (parent empty)';
        let cv;
        if (exp.type === index_1.TokenType.literal) {
            cv = exp.value;
        }
        else {
            cv = '$' + exp.value;
        }
        if (Array.isArray(res))
            res.push(cv);
        else
            res[parentName] = cv;
    }
    else if (exp.type === index_1.TokenType.operator && exp.value.code === ',') {
        if (!parentName)
            throw 'Invalid aggregation expression (parent empty)';
        exp.children.forEach(function (child) {
            _execAggregationFunction(child, res, parentName);
        });
    }
    else {
        throw 'Invalid aggregation expression (function args)';
    }
}
function $filter2mongoFilter(filter, schema, options) {
    let res = {};
    let identifiers = schema ? pschema.schema.fields(schema) : null;
    var p = index_1.OdataParser.parse(filter, identifiers);
    if (p) {
        res = {};
        _exec(p, res, null, null, null, schema);
    }
    return res;
}
exports.$filter2mongoFilter = $filter2mongoFilter;
function $aggregation2mongoAggregation(aggregation, groupby, schema) {
    let res = { _id: null };
    var p = index_1.OdataAggergationParser.parse(aggregation);
    _execAggregation(p, res);
    if (groupby) {
        res._id = {};
        p = index_1.OdataAggergationParser.parse(groupby);
        _execGroupBy(p, res._id);
    }
    return res;
}
exports.$aggregation2mongoAggregation = $aggregation2mongoAggregation;
