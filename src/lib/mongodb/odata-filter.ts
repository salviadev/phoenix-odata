"use strict";

import {OdataParser, OdataAggergationParser, TokenType, Expression} from '../odata/index';
import * as pschema from 'phoenix-json-schema-tools';
import * as putils from 'phoenix-utils';

function _NOI() {
    throw new Error('Filter Not Implemented.');
}

function _IEXP() {
    throw new Error('Invalid $filter expression.');
}


function _escaperegex(value: string): string {
    return value.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}


function _value(propName: string, schema: any, value: any, isJs: boolean) {
    let type = schema ? pschema.schema.typeOfProperty(propName, schema) : null;

    if (type === "date") {
        if (value) {
            if (isJs) {
                return 'ISODate("' + value + '")';
            } else {
                return putils.date.parseISODate(value);
            }
        }
    }
    return value;
}

function _extractIdVal(c1: Expression, c2: Expression, schema: any): { left: Expression, right: Expression, c1: Expression, c2: Expression } {
    let res = { left: null, right: null, c1: c1, c2: c2 };
    if (c1.type === TokenType.identifier) {
        res.left = c1;
        if (c2.type === TokenType.literal) {
            res.right = c2;
            res.right.value = _value(res.left.value, schema, res.right.value, false);
        }

    } else if (c2.type === TokenType.identifier) {
        res.left = c2;
        if (c1.type === TokenType.literal) {
            res.right = c1;
            res.right.value = _value(res.left.value, schema, res.right.value, false);
        }
    } else if (c1.type === TokenType.literal && c2.type === TokenType.literal)
        throw new Error('Invalid filter (literal == literal).');
    return res;
}



function _exec(exp: Expression, match: any, orList, andList: any[], js: string[], checkJs: boolean, schema: any): boolean {
    if (!match && !orList && !andList) return match;
    let d: { left: Expression, right: Expression, c1: Expression, c2: Expression };
    if (exp.type === TokenType.identifier) {
        if (checkJs) return false;
        if (js.length) {
            js.push("this." + exp.value);
        }
    } else if (exp.type === TokenType.literal) {
        if (checkJs) return false;
        if (js.length) {
            js.push(JSON.stringify(exp.value));
        }
    } else if (exp.type === TokenType.operator) {
        if (checkJs) {
            let len = exp.children.length;
            while (len--) {
                let cjs = _exec(exp.children[len], match, null, null, js, true, schema);
                if (cjs) return true;
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
                exp.children.forEach(function(child, index) {
                    if (js.length && index > 0)
                        js.push(' && ');
                    if (child.type === TokenType.operator && child.value.code === "and")
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
                exp.children.forEach(function(child, index) {
                    if (js.length && index > 0)
                        js.push(' || ');
                    if (child.type === TokenType.operator && child.value.code === "or")
                        _exec(child, null, list, null, js, checkJs, schema);
                    else {
                        let oa = {};
                        list.push(oa);
                        _exec(child, oa, null, null, js, checkJs, schema);
                    }

                });
                if (js.length && match && match.$or) delete match.$or;
                break;
            case "=":
                d = _extractIdVal(exp.children[0], exp.children[1], schema);
                if (d.left && d.right) {
                    match[d.left.value] = d.right.value;
                } else {
                    _NOI();
                }
                break;
            case "<>":
                d = _extractIdVal(exp.children[0], exp.children[1], schema);
                if (d.left && d.right) {
                    match[d.left.value] = { $ne: d.right.value };
                } else {
                    _NOI();
                }
                break;
            case ">":
                d = _extractIdVal(exp.children[0], exp.children[1], schema);
                if (d.left && d.right) {
                    match[d.left.value] = (d.c1 === d.left) ? { $gt: d.right.value } : { $lte: d.left.value };
                } else {
                    _NOI();
                }
                break;
            case "<":
                d = _extractIdVal(exp.children[0], exp.children[1], schema);
                if (d.left && d.right) {
                    match[d.left.value] = (d.c1 === d.left) ? { $lt: d.right.value } : { $gte: d.right.value };
                } else {
                    _NOI();
                }
                break;

            case ">=":
                d = _extractIdVal(exp.children[0], exp.children[1], schema);
                if (d.left && d.right) {
                    match[d.left.value] = (d.c1 === d.left) ? { $gte: d.right.value } : { $lt: d.right.value };
                } else {
                    _NOI();
                }
                break;
            case "<=":
                d = _extractIdVal(exp.children[0], exp.children[1], schema);
                if (d.left && d.right) {
                    match[d.left.value] = (d.c1 === d.left) ? { $lte: d.right.value } : { $gt: d.right.value };
                } else {
                    _NOI();
                }
                break;

            default:
                _NOI();
                break;
        }

    } else if (exp.type === TokenType.func) {
        if (checkJs) {
            if (['trim', 'tolower', 'toupper'].indexOf(exp.value.name) >= 0) return true;
            let len = exp.children.length;
            while (len--) {
                let cjs = _exec(exp.children[len], match, null, null, js, true, schema);
                if (cjs) return true;
            }

        }

        switch (exp.value.name) {
            case "contains":
            case "notcontains":
                if (checkJs) {
                    if (exp.children[0].type === TokenType.identifier && exp.children[0].type === TokenType.literal) {
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
                } else {
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
                    if (exp.children[0].type === TokenType.identifier && exp.children[0].type === TokenType.literal) {
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
                } else {
                    _exec(exp.children[0], match, null, null, js, false, schema);
                    _exec(exp.children[1], match, null, null, js, false, schema);
                    if (isStartswith)
                        match[exp.children[0].value] = { $regex: '^' + _escaperegex(exp.children[1].value), $options: "i" };
                    else
                        match[exp.children[0].value] = { $regex: '^((?!' + _escaperegex(exp.children[1].value) + ').)*$', $options: "i" };
                }
                break
            case "endswith":
            case "notendswith":

                if (checkJs) {
                    if (exp.children[0].type === TokenType.identifier && exp.children[0].type === TokenType.literal) {
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
                } else {
                    _exec(exp.children[0], match, null, null, js, false, schema);
                    _exec(exp.children[1], match, null, null, js, false, schema);
                    match[exp.children[0].value] = { $regex: '^' + _escaperegex(exp.children[1].value) + '$', $options: "i" };
                }
                break

            case "tolower":
                _exec(exp.children[0], match, null, null, js, false, schema);
                js.push('.toLowerCase()');
                break
            case "toupper":
                _exec(exp.children[0], match, null, null, js, false, schema);
                js.push('.toUpperCase()');
                break
            default:
                _NOI();
                break;
        }
        if (checkJs) return false;
    }
    return false;
}

function _execAggregation(exp: Expression, res: any) {
    if (exp.type === TokenType.operator) {
        if (exp.value.code === ",") {
            _execAggregation(exp.children[0], res);
            _execAggregation(exp.children[1], res);
            return;
        } else if (exp.value.code === "as") {
            return _execAggregationAs(exp, res)
        }
    }
    throw "Invalid aggregation expression.";
}

function _execGroupBy(exp: Expression, res: any) {
    if (exp.type === TokenType.operator) {
        if (exp.value.code === ",") {
            _execGroupBy(exp.children[0], res);
            _execGroupBy(exp.children[1], res);
            return;
        } else if (exp.value.code === "as") {
            return _execAggregationAs(exp, res)
        }
    } else if (exp.type === TokenType.identifier) {
        res[exp.value] = '$' + exp.value;
        return;
    }
    throw "Invalid aggregation expression.";
}


function _execAggregationAs(exp: Expression, res: any) {
    if (exp.children[1].type !== TokenType.identifier)
        throw "Aggregation: identifier excepted.";
    let value = {};
    res[exp.children[1].value] = value;
    _execAggregationFunction(exp.children[0], value);
}

function _hasSubFunc(exp: Expression) {
    for (let i = 0, len = exp.children.length; i < len; i++) {
        if (exp.children[i].type === TokenType.func)
            return true;
    }
    return false;
}

function _execAggregationFunction(exp: Expression, res: any, parentName?: string) {
    if (exp.type === TokenType.func) {
        if (Array.isArray(res)) {
            res = res.push({});
        }
        if (exp.value.name === "$count") {
            res.$sum = 1;
        } else {
            if (!exp.children.length)
                throw 'Invalid aggregation expression (no args)';
            if (exp.children[0].type === TokenType.func) {
                res[exp.value.name] = {};
                res = res[exp.value.name];
            } else if (exp.children[0].type === TokenType.operator && exp.children[0].value.code === ',') {
                res[exp.value.name] = [];
                res = res[exp.value.name];
            }
            exp.children.forEach(function(child) {
                _execAggregationFunction(child, res, exp.value.name);
            });
        }
    } else if (exp.type === TokenType.identifier || exp.type === TokenType.literal) {
        if (!parentName)
            throw 'Invalid aggregation expression (parent empty)';
        let cv;
        if (exp.type === TokenType.literal) {
            cv = exp.value;
        } else {
            cv = '$' + exp.value;
        }
        if (Array.isArray(res))
            res.push(cv);
        else
            res[parentName] = cv;
    } else if (exp.type === TokenType.operator && exp.value.code === ',') {
        if (!parentName)
            throw 'Invalid aggregation expression (parent empty)';
        exp.children.forEach(function(child) {
            _execAggregationFunction(child, res, parentName);
        });

    } else {
        throw 'Invalid aggregation expression (function args)';
    }
}


export function $filter2mongoFilter(filter: string, schema?: any, options?: any): any {

    let res: any = {};
    let identifiers = schema ? pschema.schema.fields(schema) : null;
    let grpIdentifiers: string[] = null;
    if (options && options.group) {
        grpIdentifiers = Object.keys(options.group);
        let ii = grpIdentifiers.indexOf('_id');
        if (ii > 0) grpIdentifiers.splice(ii, 1);
    }

    var p = OdataParser.parse(filter, identifiers);
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

export function $aggregation2mongoAggregation(aggregation: string, groupby: string, schema?: any): any {
    let res: any = { _id: null };
    var p = OdataAggergationParser.parse(aggregation);
    _execAggregation(p, res);
    if (groupby) {
        res._id = {};
        p = OdataAggergationParser.parse(groupby);
        _execGroupBy(p, res._id);
    }

    return res;
}



