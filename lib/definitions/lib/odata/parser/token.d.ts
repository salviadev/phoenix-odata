export declare const TokenType: {
    identifier: string;
    operator: string;
    literal: string;
    func: string;
};
export declare class Token {
    type: string;
    private _line;
    dataType: string;
    value: any;
    svalue: string;
    private _offset;
    constructor(type: string, value: any, line: string, offset: number, dataType: string);
    matches: (code: string) => boolean;
    getRemainingText: () => string;
}
export declare function tokenize(line: string, operators: any): Token[];
