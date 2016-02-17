"use strict";
var util = require('util');
exports.TokenType = {
    identifier: 'identifier',
    operator: 'operator',
    literal: 'literal',
    func: "function"
};
class Token {
    constructor(type, value, line, offset, dataType) {
        this.matches = function (code) {
            let that = this;
            return that.value && typeof that.value === "object" && that.value.isOperator && that.value.code === code;
        };
        this.getRemainingText = function () {
            let that = this;
            return that._line.substring(that._offset, that._line.length);
        };
        let that = this;
        that.type = type;
        that.value = value;
        that._line = line;
        that._offset = offset;
        that.dataType = dataType;
    }
}
exports.Token = Token;
const _digitRegex = new RegExp('[0-9]');
const _letterRegex = new RegExp('[a-zA-Z_\/\$]');
const _wordRegex = new RegExp('[a-zA-Z0-9_\.\/\$]');
function _skipSpaces(chars, i) {
    while (i < chars.length && chars[i] === " ") {
        i++;
    }
    return i;
}
function _isDigit(str) {
    return _digitRegex.test(str);
}
function _isLetter(str) {
    return _letterRegex.test(str);
}
function _isWordChar(str) {
    return _wordRegex.test(str);
}
function _parseNumber(line, chars, i, tokens) {
    let end = i + 1;
    let cdt;
    while (end < chars.length && _isDigit(chars[end])) {
        end++;
    }
    let val;
    if (end < chars.length && chars[end] === '.') {
        end++;
        while (end < chars.length && _isDigit(chars[end])) {
            end++;
        }
        val = parseFloat(line.substring(i, end));
        cdt = "float";
    }
    else {
        val = parseInt(line.substring(i, end), 10);
        cdt = "int";
    }
    let nt = new Token(exports.TokenType.literal, val, line, i, cdt);
    tokens.push(nt);
    return end;
}
function _parseDateTime(line, chars, i, tokens) {
    let dt = "datetime'";
    i = i + dt.length;
    let end = i + 1, len = chars.length;
    while (end < len) {
        if (chars[end] == '\'')
            break;
        end++;
    }
    if (end === chars.length) {
        throw new Error('Expression parser: date constant not terminated:' + line.substring(i, line.length));
    }
    let str = chars.substr(i + 1, end - i - 1);
    let nt = new Token(exports.TokenType.literal, new Date(str), line, i, "datetime");
    nt.svalue = str;
    tokens.push(nt);
    return end + 1;
}
function _parseWord(line, chars, i, tokens, operators) {
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
        tokens.push(new Token(exports.TokenType.operator, op, line, i, null));
    }
    else {
        if (word === 'true' || word === 'false' || word === 'null') {
            tokens.push(new Token(exports.TokenType.literal, word, line, i, "bool"));
        }
        else {
            tokens.push(new Token(exports.TokenType.identifier, word, line, i, "word"));
        }
    }
    return end;
}
function _parseQuotedString(line, chars, i, tokens) {
    let quote = chars[i];
    let end = i + 1;
    let res = "";
    while (end < chars.length) {
        if (chars[end] === quote) {
            end++;
            if (end === chars.length || chars[end] !== quote) {
                tokens.push(new Token(exports.TokenType.literal, res, line, i, "string"));
                return end;
            }
        }
        res += chars[end++];
    }
    throw new Error('Expression parser: quoted string not terminated: ' + line.substring(i));
}
function _parseOperator(line, chars, i, tokens, operators) {
    let op = operators.byName(chars);
    tokens.push(new Token(exports.TokenType.operator, op, line, i, null));
    return i + 1;
}
function tokenize(line, operators, identifiers, grpIdentifiers) {
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
                }
                else if (_isDigit(ch)) {
                    i = _parseNumber(line, line, i, tokens);
                }
                else {
                    throw new Error('Expression parser: invalid character: "' + ch + '"');
                }
                break;
        }
    }
    tokens.forEach(token => {
        if (token.type === exports.TokenType.identifier) {
            token.value = token.value.replace(/\//g, '.');
            if (identifiers) {
                let found = false;
                if (identifiers.indexOf(token.value) >= 0) {
                    found = true;
                }
                if (!found && grpIdentifiers) {
                    found = (grpIdentifiers.indexOf(token.value) >= 0);
                }
                if (!found)
                    throw util.format('Identifier not found. ("%s")', token.value);
            }
        }
    });
    return tokens;
}
exports.tokenize = tokenize;
