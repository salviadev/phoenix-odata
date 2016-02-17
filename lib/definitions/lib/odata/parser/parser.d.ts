export declare class Expression {
    children: Expression[];
    type: string;
    value: any;
    svalue: string;
    dataType: string;
    constructor(config: any);
    isPredicate(): boolean;
    toString(): string;
}
export declare class Parser {
    private _functions;
    private _operators;
    constructor(functions: any, loperators: any);
    parse(str: string, identifiers?: string[]): Expression;
    parseNe(str: string, identifiers?: string[], grpIdentifiers?: string[]): Expression;
}
export declare var OdataParser: Parser;
export declare var OdataAggergationParser: Parser;
