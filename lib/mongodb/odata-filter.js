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
function _embeddedId(id) {
    return id.split('/').join('.');
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
        res.left.value = _embeddedId(res.left.value);
        if (c2.type === index_1.TokenType.literal) {
            res.right = c2;
            res.right.value = _value(res.left.value, schema, res.right.value, false);
        }
    }
    else if (c2.type === index_1.TokenType.identifier) {
        res.left = c2;
        res.left.value = _embeddedId(res.left.value);
        if (c1.type === index_1.TokenType.literal) {
            res.right = c1;
            res.right.value = _value(res.left.value, schema, res.right.value, false);
        }
    }
    else if (c1.type === index_1.TokenType.literal && c2.type === index_1.TokenType.literal)
        throw new Error('Invalid filter (literal == literal).');
    return res;
}
function _exec(exp, match, orList, andList, js, checkJs, schema) {
    if (!match && !orList && !andList)
        return match;
    let d;
    if (exp.type === index_1.TokenType.identifier) {
        exp.value = _embeddedId(exp.value);
        if (checkJs)
            return false;
        if (js.length) {
            js.push("this." + exp.value);
        }
    }
    else if (exp.type === index_1.TokenType.literal) {
        if (checkJs)
            return false;
        if (js.length) {
            js.push(JSON.stringify(exp.value));
        }
    }
    else if (exp.type === index_1.TokenType.operator) {
        if (checkJs) {
            let len = exp.children.length;
            while (len--) {
                let cjs = _exec(exp.children[len], match, null, null, js, true, schema);
                if (cjs)
                    return true;
            }
            return false;
        }
        switch (exp.value.code) {
            case "and":
                let alist = andList;
                if (!alist) {
                    match.$and = match.$and || [];
                    alist = match.$and;
                }
                exp.children.forEach(function (child, index) {
                    if (js.length && index > 0)
                        js.push(' && ');
                    if (child.type === index_1.TokenType.operator && child.value.code === "and")
                        _exec(child, null, null, alist, js, checkJs, schema);
                    else {
                        let am = {};
                        alist.push(am);
                        _exec(child, am, null, null, js, checkJs, schema);
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
                    if (js.length && index > 0)
                        js.push(' || ');
                    if (child.type === index_1.TokenType.operator && child.value.code === "or")
                        _exec(child, null, list, null, js, checkJs, schema);
                    else {
                        let oa = {};
                        list.push(oa);
                        _exec(child, oa, null, null, js, checkJs, schema);
                    }
                });
                if (js.length && match && match.$or)
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
        if (checkJs) {
            if (['trim', 'tolower', 'toupper'].indexOf(exp.value.name) >= 0)
                return true;
            let len = exp.children.length;
            while (len--) {
                let cjs = _exec(exp.children[len], match, null, null, js, true, schema);
                if (cjs)
                    return true;
            }
        }
        switch (exp.value.name) {
            case "contains":
            case "notcontains":
                if (checkJs) {
                    if (exp.children[0].type === index_1.TokenType.identifier && exp.children[0].type === index_1.TokenType.literal) {
                        return true;
                    }
                    return false;
                }
                let isContains = (exp.value.name === "contains");
                if (js.length) {
                    js.push('(');
                    _exec(exp.children[0], match, null, null, js, false, schema);
                    js.push('.indexOf(');
                    _exec(exp.children[1], match, null, null, js, false, schema);
                    if (isContains)
                        js.push(') >= 0)');
                    else
                        js.push(') < 0)');
                }
                else {
                    _exec(exp.children[0], match, null, null, js, false, schema);
                    _exec(exp.children[1], match, null, null, js, false, schema);
                    if (isContains)
                        match[exp.children[0].value] = { $regex: _escaperegex(exp.children[1].value), $options: "i" };
                    else
                        match[exp.children[0].value] = { $regex: '^((?!' + _escaperegex(exp.children[1].value) + ').)*$', $options: "i" };
                }
                break;
            case "startswith":
            case "notstartswith":
                if (checkJs) {
                    if (exp.children[0].type === index_1.TokenType.identifier && exp.children[0].type === index_1.TokenType.literal) {
                        return true;
                    }
                    return false;
                }
                let isStartswith = (exp.value.name === "startswith");
                if (js.length) {
                    js.push('(');
                    _exec(exp.children[0], match, null, null, js, false, schema);
                    js.push('.indexOf(');
                    _exec(exp.children[1], match, null, null, js, false, schema);
                    if (isStartswith)
                        js.push(') === 0)');
                    else
                        js.push(') < 0)');
                }
                else {
                    _exec(exp.children[0], match, null, null, js, false, schema);
                    _exec(exp.children[1], match, null, null, js, false, schema);
                    if (isStartswith)
                        match[exp.children[0].value] = { $regex: '^' + _escaperegex(exp.children[1].value), $options: "i" };
                    else
                        match[exp.children[0].value] = { $regex: '^((?!' + _escaperegex(exp.children[1].value) + ').)*$', $options: "i" };
                }
                break;
            case "endswith":
            case "notendswith":
                if (checkJs) {
                    if (exp.children[0].type === index_1.TokenType.identifier && exp.children[0].type === index_1.TokenType.literal) {
                        return true;
                    }
                    return false;
                }
                let isEndswith = (exp.value.name === "endswith");
                if (js.length) {
                    if (isEndswith)
                        js.push('');
                    else
                        js.push('!');
                    _exec(exp.children[0], match, null, null, js, false, schema);
                    js.push('.endswith(');
                    _exec(exp.children[1], match, null, null, js, false, schema);
                    js.push(')');
                }
                else {
                    _exec(exp.children[0], match, null, null, js, false, schema);
                    _exec(exp.children[1], match, null, null, js, false, schema);
                    match[exp.children[0].value] = { $regex: '^' + _escaperegex(exp.children[1].value) + '$', $options: "i" };
                }
                break;
            case "tolower":
                _exec(exp.children[0], match, null, null, js, false, schema);
                js.push('.toLowerCase()');
                break;
            case "toupper":
                _exec(exp.children[0], match, null, null, js, false, schema);
                js.push('.toUpperCase()');
                break;
            default:
                _NOI();
                break;
        }
        if (checkJs)
            return false;
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
    let value = {};
    res[_embeddedId(exp.children[1].value)] = value;
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
function $filter2mongoFilter(filter, schema) {
    let res = {};
    var p = index_1.OdataParser.parse(filter);
    if (p) {
        let js = [];
        let useJs = _exec(p, res, null, null, js, true, schema);
        res = {};
        if (useJs) {
            js.push('');
        }
        _exec(p, res, null, null, js, false, schema);
        if (js.length) {
            res.$where = js.join('');
        }
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
