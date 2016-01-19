"use strict";
class Func {
    constructor(name, argCount) {
        let that = this;
        that.name = name;
        that.argCount = argCount;
        that.isFunction = true;
    }
}
exports.Func = Func;
class FuncList {
    constructor() {
        let that = this;
        that._registerFunctions();
    }
    _registerFunctions() {
        let functions = this;
        var _createFunction = function (code, argCount) {
            functions[code] = new Func(code, argCount);
        };
        _createFunction('contains', 2);
        _createFunction('endswith', 2);
        _createFunction('startswith', 2);
        _createFunction('indexof', 2);
        _createFunction('concat', 2);
        _createFunction('substring', 3);
        _createFunction('length', 1);
        _createFunction('tolower', 1);
        _createFunction('toupper', 1);
        _createFunction('trim', 1);
    }
    byName(name) {
        return this[name];
    }
}
exports.FuncList = FuncList;
exports.odataFunctions = new FuncList();
