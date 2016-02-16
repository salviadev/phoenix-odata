"use strict";

export class Operator {
    public code: string;
    public text: string;
    public precedence: number;
    public isPrefix: boolean;
    public isInfix: boolean;
    public isAssociative: boolean;
    public isPredicate: boolean;
    public isOperator: boolean;
    public isFunction: boolean;
    constructor(code: string, text: string, precedence: number, isPrefix: boolean, isInfix: boolean, isAssociative: boolean, isPredicate: boolean) {
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
    public toString(): string {
        return this.text;
    }
}

function _createOperator(operators: any, code: string, text: string, precedence: number, isPrefix: boolean, isInfix: boolean, isAssociative: boolean, isPredicate: boolean) {
    operators[text] = new Operator(code || text, text, precedence, isPrefix, isInfix, isAssociative, isPredicate);
}

export class Operators {
    constructor() {
        this._registerOperators();
    }
    public byName(opName: string): Operator {
        return <Operator>this[opName];
    }
    private _registerOperators(): void {
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


       _createOperator(operators, null, "and", 6, false, true, true, true);
        _createOperator(operators, null, "or", 7, false, true, true, true);
        _createOperator(operators, null, "(", 8, true, false, false, false);
        _createOperator(operators, null, ")", 8, false, false, false, false);
        _createOperator(operators, null, ",", 8, false, false, false, false);
    }

}

export class AggregationOperators {
    constructor() {
        this._registerOperators();
    }
    public byName(opName: string): Operator {
        return <Operator>this[opName];
    }
    private _registerOperators(): void {
        let operators = this;
        _createOperator(operators, null, ".", 1, false, true, true, false);
        _createOperator(operators, null, "as", 7, false, true, false, true);
        _createOperator(operators, null, "(", 8, true, false, false, false);
        _createOperator(operators, null, ")", 8, false, false, false, false);
        _createOperator(operators, null, ",", 8, false, true, false, true);
    }

}


export var  operators = new Operators();
export var  aggregationOperators = new AggregationOperators();

