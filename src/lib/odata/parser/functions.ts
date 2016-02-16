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
        var _createFunction = function(code: string, argCount: number): void {
            functions[code] = new Func(code, argCount)
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
        return <Func>this[name];
    }
}

export class AggregationFuncList {
    constructor() {
        let that = this;
        that._registerFunctions();
    }
    private _registerFunctions() {
        let functions = this;
        var _createFunction = function(code: string, argCount: number): void {
            functions[code] = new Func(code, argCount)
        };
        _createFunction('$count', 0);
        _createFunction('$sum', 1);
        _createFunction('$avg', 1);
        _createFunction('$max', 1);
        _createFunction('$min', 1);
        _createFunction('$first', 1);
        _createFunction('$last', 1);
        
        
  
        _createFunction('$concat', 1);
        _createFunction('$substr', 1);
        _createFunction('$toLower', 1);
        _createFunction('$toUpper', 1);
        _createFunction('$strcasecmp', 1);
        
        _createFunction('$abs', 1);
        _createFunction('$add', 1);
        _createFunction('$ceil', 1);
        _createFunction('$divide', 1);
        _createFunction('$exp', 1);
        _createFunction('$floor', 1);
        _createFunction('$ln', 1);
        _createFunction('$log', 1);
        _createFunction('$log10', 1);
        _createFunction('$mod', 1);
        _createFunction('$multiply', 1);
        _createFunction('$pow', 1);
        _createFunction('$sqrt', 1);
        _createFunction('$subtract', 1);
        _createFunction('$trunc', 1);
        
        
        _createFunction('$dayOfYear', 1);
        _createFunction('$dayOfMonth', 1);
        _createFunction('$dayOfWeek', 1);
        _createFunction('$year', 1);
        _createFunction('$month', 1);
        _createFunction('$week', 1);
        _createFunction('$hour', 1);
        _createFunction('$minute', 1);
        _createFunction('$second', 1);
        _createFunction('$millisecond', 1);
        _createFunction('$dateToString', 1);
 
    }
    public byName(name: string): Func {
        return <Func>this[name];
    }
}

export var odataFunctions = new FuncList();
export var odataAggregationFunctions = new AggregationFuncList();
		
