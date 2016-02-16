"use strict";

export const TokenType = {
    identifier: 'identifier',
    operator: 'operator',
    literal: 'literal',
    func: "function"
};


export class Token {
    public type: string;
    private _line: string;
    public dataType: string;
    public value: any;
    public svalue: string;
    private _offset: number;

    constructor(type: string, value: any, line: string, offset: number, dataType: string) {
        let that = this;
        that.type = type;
        that.value = value;
        that._line = line;
        that._offset = offset;
        that.dataType = dataType;
    }
    public matches = function(code: string): boolean {
        let that = this;
        return that.value && typeof that.value === "object" && that.value.isOperator && that.value.code === code;
    }

    public getRemainingText = function(): string {
        let that: Token = this;
        return that._line.substring(that._offset, that._line.length);
    }
}

const _digitRegex = new RegExp('[0-9]');
const _letterRegex = new RegExp('[a-zA-Z_\/\$]');
const _wordRegex = new RegExp('[a-zA-Z0-9_\.\/\$]');

function _skipSpaces(chars: string, i: number): number {
    while (i < chars.length && chars[i] === " ") {
        i++;
    }
    return i;
}

function _isDigit(str: string): boolean {
    return _digitRegex.test(str);
}

function _isLetter(str: string): boolean {
    return _letterRegex.test(str);
}

function _isWordChar(str: string): boolean {
    return _wordRegex.test(str);
}

function _parseNumber(line: string, chars: string, i: number, tokens: Token[]): number {
    let end = i + 1;
    let cdt: string;
    while (end < chars.length && _isDigit(chars[end])) {
        end++;
    }
    let val: number;
    if (end < chars.length && chars[end] === '.') {
        end++;
        while (end < chars.length && _isDigit(chars[end])) {
            end++;
        }
        val = parseFloat(line.substring(i, end));
        cdt = "float";

    } else {
        val = parseInt(line.substring(i, end), 10);
        cdt = "int";
    }
    let nt = new Token(TokenType.literal, val, line, i, cdt);
    tokens.push(nt);
    return end;
}

function _parseDateTime(line: string, chars: string, i: number, tokens: Token[]): number {
    let dt = "datetime'";
    i = i + dt.length;
    let end = i + 1,
        len = chars.length;
    while (end < len) {
        if (chars[end] == '\'') break;
        end++;
    }
    if (end === chars.length) {
        throw new Error('Expression parser: date constant not terminated:' + line.substring(i, line.length));
    }
    let str = chars.substr(i + 1, end - i - 1);
    let nt = new Token(TokenType.literal, new Date(str), line, i, "datetime");
    nt.svalue = str;
    tokens.push(nt);
    return end + 1;
}


function _parseWord(line: string, chars: string, i: number, tokens: Token[], operators): number {
    
    let end = i + 1;
    while (end < chars.length && _isWordChar(chars[end])) {
        end++;
    }
    var word = chars.substr(i, end - i);
    if (word == 'datetime' && end < chars.length && chars[end] == "'") {
        return _parseDateTime(line, chars, i, tokens);
    }
    let op = operators.byName(word.toLowerCase());
    
    if (op) {
        tokens.push(new Token(TokenType.operator, op, line, i, null));
    } else {
        if (word === 'true' || word === 'false' || word === 'null') {
            tokens.push(new Token(TokenType.literal, word, line, i, "bool"));
        } else {
            tokens.push(new Token(TokenType.identifier, word, line, i, "word"));
        }
    }
    return end;
}


function _parseQuotedString(line: string, chars: string, i: number, tokens: Token[]): number {
    let quote = chars[i];
    let end = i + 1;
    let res = "";
    while (end < chars.length) {
        if (chars[end] === quote) {
            end++;
            if (end === chars.length || chars[end] !== quote) {
                tokens.push(new Token(TokenType.literal, res, line, i, "string"));
                return end;
            }
        }
        res += chars[end++];
    }
    throw new Error('Expression parser: quoted string not terminated: ' + line.substring(i));
}

function _parseOperator(line: string, chars: string, i: number, tokens: Token[], operators): number {
    let op = operators.byName(chars);
    tokens.push(new Token(TokenType.operator, op, line, i, null));
    return i + 1;
}


export function tokenize(line: string, operators): Token[] {
    let tokens = [];
    let i = 0;
    while (i < line.length) {
        i = _skipSpaces(line, i);
        let ch = line[i];
        switch (ch) {
            case '"':
            case '\'':
                i = _parseQuotedString(line, line, i, tokens);
                break;
            //case '.':
            case '-':
            case '+':
            case '(':
            case ')':
            case ',':
                i = _parseOperator(line, ch, i, tokens, operators);
                break;
            default:
                if (_isLetter(ch)) {
                    i = _parseWord(line, line, i, tokens, operators);
                } else if (_isDigit(ch)) {
                    i = _parseNumber(line, line, i, tokens);
                } else {
                    throw new Error('Expression parser: invalid character: "' + ch + '"');
                }
                break;
        }
    }

    return tokens;
}

