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
    constructor();
    parse(str: string): Expression;
    parseNe(str: string): Expression;
}
export declare var OdataParser: Parser;
