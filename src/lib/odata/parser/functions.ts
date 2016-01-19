"use strict";

export class Func {
    public name: string;
    public argCount: number;
    public isFunction: boolean;
    constructor(name: string, argCount: number) {
        let that = this;
        that.name = name;
        that.argCount = argCount;
        that.isFunction = true;
    }
}

export class FuncList {
    constructor() {
        let that = this;
        that._registerFunctions();
    }
    private _registerFunctions() {
        let functions = this;
        var _createFunction = function (code: string, argCount: number): void {
            functions[code]= new Func(code, argCount)
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
    public byName(name: string): Func {
        return <Func> this[name];
    }
}

export var odataFunctions = new FuncList();

		
