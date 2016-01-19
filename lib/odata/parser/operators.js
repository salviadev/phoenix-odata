"use strict";
class Operator {
    constructor(code, text, precedence, isPrefix, isInfix, isAssociative, isPredicate) {
        let that = this;
        that.code = code;
        that.text = text;
        that.precedence = precedence;
        that.isPrefix = isPrefix;
        that.isInfix = isInfix;
        that.isAssociative = isAssociative;
        that.isPredicate = isPredicate;
        that.isFunction = false;
        that.isOperator = true;
    }
    toString() {
        return this.text;
    }
}
exports.Operator = Operator;
function _createOperator(operators, code, text, precedence, isPrefix, isInfix, isAssociative, isPredicate) {
    operators[text] = new Operator(code || text, text, precedence, isPrefix, isInfix, isAssociative, isPredicate);
}
class Operators {
    constructor() {
        this._registerOperators();
    }
    byName(opName) {
        return this[opName];
    }
    _registerOperators() {
        let operators = this;
        _createOperator(operators, null, ".", 1, false, true, true, false);
        _createOperator(operators, null, "not", 2, true, false, false, false);
        _createOperator(operators, "*", "mul", 3, false, true, true, false);
        _createOperator(operators, "/", "div", 3, false, true, true, false);
        _createOperator(operators, "%", "mod", 3, false, true, true, false);
        _createOperator(operators, "+", "add", 4, false, true, true, false);
        _createOperator(operators, "-", "sub", 4, true, true, true, false);
        _createOperator(operators, "=", "eq", 5, false, true, false, true);
        _createOperator(operators, "<>", "ne", 5, false, true, false, true);
        _createOperator(operators, "<", "lt", 5, false, true, false, true);
        _createOperator(operators, "<=", "le", 5, false, true, false, true);
        _createOperator(operators, ">", "gt", 5, false, true, false, true);
        _createOperator(operators, ">=", "ge", 5, false, true, false, true);
        _createOperator(operators, null, "in", 5, false, true, false, true);
        _createOperator(operators, null, "and", 6, false, true, true, true);
        _createOperator(operators, null, "or", 7, false, true, true, true);
        _createOperator(operators, null, "(", 8, true, false, false, false);
        _createOperator(operators, null, ")", 8, false, false, false, false);
        _createOperator(operators, null, ",", 8, false, false, false, false);
    }
}
exports.Operators = Operators;
exports.operators = new Operators();
