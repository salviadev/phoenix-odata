/// <reference path="../../../node_modules/phoenix-utils/lib/definitions/phoenix-utils.d.ts" />
/// <reference path="../../../node_modules/phoenix-json-schema-tools/lib/definitions/phoenix-json-schema-tools.d.ts" />

"use strict";
import {OdataParser, TokenType, Expression} from '../odata/index';
import * as pschema from 'phoenix-json-schema-tools';
import * as putils from 'phoenix-utils';

function _NOI() {
    throw new Error('Filter Not Implemented.');
}

function _IEXP() {
    throw new Error('Invalid $filter expression.');
}

function _embeddedId(id: string): string {
    return id.split('/').join('.');
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
        res.left.value = _embeddedId(res.left.value);
        if (c2.type === TokenType.literal) {
            res.right = c2;
            res.right.value = _value(res.left.value, schema, res.right.value, false);
        }
       
    } else if (c2.type === TokenType.identifier) {
        res.left = c2;
        res.left.value = _embeddedId(res.left.value);
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
        exp.value = _embeddedId(exp.value);
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

export function $filter2mongoFilter(filter: string, schema?: any): any {
    
    console.log("$filter2mongoFilter: schema = " + schema);
    let res: any = {};
    var p = OdataParser.parse(filter);
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
/*
function _extractResult(options, docs, schema, inlineCount, count, aggregation) {

    docs = docs || [];
    var res = {
        results: null
    };
    if (aggregation) {
        docs.forEach(function(e) {
            var cid = e._id;
            delete e._id;
            for (var p in cid) {
                e[p] = cid[p];
            }

        });

    } else {
        var props = Object.keys(schema.$properties);

        var dates = [];
        props.forEach(function(name) {
            var p = schema.$properties[name];
            if (p.$type == "date" || p.$type == "datetime") {
                dates.push(name);
            }

        });

        docs.forEach(function(e) {
            dates.forEach(function(name) {
                var d = e[name];
                if (d) e[name] = new Date(d).toISOString();

            });
            delete e._id;
        });
        if (options.limit && docs.length == options.limit) docs.pop();

        if (inlineCount) {
            res.__count = count;

        }
    }
    res.results = docs;
    return {
        d: res
    };
}

function _query2Options(schema, filter, query, aggregation) {
    var options = {};
    if (query) {
        if (query.$skip)
            options.skip = parseInt(query.$skip, 10);
        if (query.$top)
            options.limit = parseInt(query.$top, 10);
    }
    if (options.limit) options.limit++;

    var orderBy = (query && query.$orderby) ? query.$orderby : (aggregation ? null : schema.$meta.$defaultOrder);
    if (orderBy) {
        var sort = [];
        orderBy.split(',').forEach(function(value) {
            value = value.trim();
            var a = value.split(' ');
            sort.push([a[0], (a.length > 1 && a[1] == 'desc') ? -1 : 1]);

        });
        options.sort = sort;
    }
    return options;

}


module.exports = {
    filter2mongo: _execOdataFilter,
    docs2odata: _extractResult,
    query2options: _query2Options
};
*/


