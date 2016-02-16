export declare class Func {
    name: string;
    argCount: number;
    isFunction: boolean;
    constructor(name: string, argCount: number);
}
export declare class FuncList {
    constructor();
    private _registerFunctions();
    byName(name: string): Func;
}
export declare class AggregationFuncList {
    constructor();
    private _registerFunctions();
    byName(name: string): Func;
}
export declare var odataFunctions: FuncList;
export declare var odataAggregationFunctions: AggregationFuncList;
