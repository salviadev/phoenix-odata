"use strict";

import { TokenType, tokenize, Token}  from "./token";
import { Operator, operators, aggregationOperators} from "./operators";
import { odataFunctions, odataAggregationFunctions} from "./functions";


export class Expression {
    public children: Expression[];
    public type: string;
    public value: any;
    public svalue: string;
    public dataType: string;
    constructor(config: any) {
        var that = this;
        that.children = null;
        if (config.operator) {
            that.type = TokenType.operator;
            that.value = config.operator;
            that.children = [];
            if (config.expression1) {
                that.children.push(config.expression1);
            }
            if (config.expression2) {
                that.children.push(config.expression2);
            }
        } else if (config.expressionType) {
            that.type = config.expressionType;
            that.value = config.value;
            that.svalue = config.svalue;
            that.dataType = config.dataType;
            if (that.type === TokenType.func) {
                that.children = [];
            }
        }
    }
    public isPredicate(): boolean {
        switch (this.type) {
            case TokenType.operator:
                return this.value.isPredicate;
            case TokenType.identifier:
                return true; // don't know
            case TokenType.func:
                return true; // don't know -- will improve later
            case TokenType.literal:
                return false;
            default:
                throw new Error("Expression parser: invalid expression type: " + this.type);
        }
    }
    public toString(): string {
        let that = this;
        if (that.children == null) {
            return that.value.toString();
        }
        var sb = [];
        sb.push("[" + that.value.toString());
        that.children.forEach(child => { sb.push(" " + child.toString()) })

        sb.push("]");
        return sb.join('');
    }
}

const
    _maxPrecedence = 8;

function _parseArguments(tokens: Token[], tk: Token, tokenIndex: number[], args: any[], functions): void {
    if (tokenIndex[0] < tokens.length && tokens[tokenIndex[0]].matches(")")) {
        tokenIndex[0]++;
        return;
    }
    while (tokenIndex[0] < tokens.length) {
        let arg = _parseExpression(tokens, tokenIndex, _maxPrecedence, functions);
        args.push(arg);
        if (tokenIndex[0] < tokens.length && tokens[tokenIndex[0]].matches(")")) {
            tokenIndex[0]++;
            return;
        }
        if (tokenIndex[0] == tokens.length || !tokens[tokenIndex[0]].matches(",")) {
            throw new Error("Expression parser:invalid expression: expected ',' or ')' at " + tokens[tokenIndex[0]].getRemainingText());
        }
        tokenIndex[0]++;
    }
    throw new Error("Expression parser:invalid function call syntax: argument missing after " + tk.getRemainingText());
}



function _parseFunctionCall(tokens: Token[], tk: Token, tokenIndex: number[], functions): Expression {
    tokenIndex[0]++;
    var func = functions.byName(tk.value);

    if (!func)
        throw new Error("Expression parser:Invalid function name  " + tk.value);
    var exp = new Expression({
        expressionType: TokenType.func,
        value: func
    });
    _parseArguments(tokens, tk, tokenIndex, exp.children, functions);
    return exp;
}

function _parsePrefixOperator(tokens: Token[], op: Operator, tokenIndex: number[], functions): Expression {
    var arg1;
    switch (op.code) {
        case "-":
        case "not":
            arg1 = _parseExpression(tokens, tokenIndex, 1, functions);
            return new Expression({
                operator: op,
                expression1: arg1
            });
        case "(":
            arg1 = _parseExpression(tokens, tokenIndex, op.precedence, functions);
            if (tokenIndex[0] === tokens.length || !tokens[tokenIndex[0]].matches(")")) {
                throw new Error("Expression parser:invalid expression: expected ')' after " + tokens[tokenIndex[0] - 1].getRemainingText());
            }
            tokenIndex[0]++;
            return arg1;
        default:
            throw new Error("Expression parser:internal error: bad prefix operator " + op.code);
    }
}



function _parseTerm(tokens: Token[], tokenIndex: number[], functions): Expression {
    if (tokenIndex[0] == tokens.length) {
        throw new Error("Expression parser: premature end of expression");
    }
    var tk = tokens[tokenIndex[0]];
    switch (tk.type) {
        case TokenType.identifier:
            tokenIndex[0]++;
            if (tokenIndex[0] < tokens.length && tokens[tokenIndex[0]].matches("(")) {
                return _parseFunctionCall(tokens, tk, tokenIndex, functions);
            } else {
                return new Expression({
                    expressionType: TokenType.identifier,
                    value: tk.value
                });
            }
        case TokenType.literal:
            tokenIndex[0]++;
            return new Expression({
                expressionType: TokenType.literal,
                value: tk.value,
                svalue: tk.svalue,
                dataType: tk.dataType
            });
        case TokenType.operator:
            let op = <Operator>tk.value;
            if (!op.isPrefix) {
                throw new Error("Expression parser: invalid expression: expected beginning of term at " + tk.getRemainingText());
            }
            tokenIndex[0]++;
            return _parsePrefixOperator(tokens, op, tokenIndex, functions);
        default:
            throw new Error("Expression parser: internal error: bad token type " + tk.type);
    }
}



function _parseExpression(tokens, tokenIndex, precedence, functions): Expression {
    let exp = _parseTerm(tokens, tokenIndex, functions);
    while (tokenIndex[0] < tokens.length) {
        let tk = <Token>tokens[tokenIndex[0]];
        var op = <Operator>(tk.value && tk.value.isOperator ? tk.value : null);
        if (op === null || !op.isInfix || op.precedence > precedence) {
            break;
        }
        tokenIndex[0]++;

        let arg = _parseExpression(tokens, tokenIndex, op.precedence - 1, functions);
        exp = new Expression({
            operator: op,
            expression1: exp,
            expression2: arg
        });
        if (!op.isAssociative && op.precedence == precedence) {
            return exp;
        }
    }
    return exp;
}



export class Parser {
    private _functions: any;
    private _operators: any;
    constructor(functions: any, loperators: any) {
        this._functions = functions;
        this._operators = loperators;
    }
    parse(str: string, identifiers?: string[], onidentifier?:any) {

        str = str || '';
        str = str.trim();
        if (str.length == 0) {
            return null;
        }

        let tokens = tokenize(str, this._operators, identifiers, onidentifier);
        let tokenIndex = [];
        tokenIndex[0] = 0;
        let exp = _parseExpression(tokens, tokenIndex, _maxPrecedence, this._functions);
        if (tokenIndex[0] != tokens.length) {
            throw new Error("Expression parser: invalid expression: unexpected token at " + tokens[tokenIndex[0]].getRemainingText());
        }
        return exp;
    }
    parseNe(str: string, identifiers?: string[], onidentifier?:any) {
        let that = this;
        try {
            return that.parse(str, identifiers ,onidentifier);
        } catch (ex) {
            return null;
        }
    }
}


export var OdataParser = new Parser(odataFunctions, operators);
export var OdataAggergationParser = new Parser(odataAggregationFunctions, aggregationOperators);
