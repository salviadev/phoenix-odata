"use strict";

export function queryResult(payload: any[], count?: number): any {
    let res = {
        value: payload || []
    }
    if (count !== undefined)
        res['@odata.count'] = count;
    return res;
}

export function queryOptions(query: any): any {
    let options: any = {};
    if (query.$skip)
        options.skip = parseInt(query.$skip, 10);
    if (query.$top)
        options.limit = parseInt(query.$top, 10);

    if (options.limit) options.limit++;

    if (query.$orderby) {
        options.sort = query.$orderby.split(',').map(value => {
            value = value.trim();
            let a = value.split(' ');
            return [a[0], (a.length > 1 && a[1] === 'desc') ? -1 : 1];

        });
    }
    options.count = query.$count === 'true';
    return options;
}


