var assert = require("assert");
var $aggregation2mongoAggregation = require("../../lib/mongodb/odata-filter").$aggregation2mongoAggregation;

describe('Odata extentions groupby && aggregation', function () {
    it('Aggregation', function () {

        var p = $aggregation2mongoAggregation("$count() as count, $sum(Amount) as total");
        var excepted1 = {
            "_id": null,
            "count": { "$sum": 1 },
            "total": { "$sum": "$Amount" }
        };
        assert.deepEqual(p, excepted1);
        p = $aggregation2mongoAggregation("$count() as count, $sum($multiply(Amount, 2)) as total");
        var excepted2 = {
            "_id": null,
            "count": { "$sum": 1 },
            "total": { "$sum": { $multiply: ["$Amount", 2] } }
        };
        assert.deepEqual(p, excepted2);
        p = $aggregation2mongoAggregation("$count() as count, $sum($multiply(Amount, 2)) as total", "city, $year(date) as year");
        var excepted3 = {
            "_id": { city: '$city', year: { $year: '$date' } },
            "count": { "$sum": 1 },
            "total": { "$sum": { $multiply: ["$Amount", 2] } }
        };
        assert.deepEqual(p, excepted3);

    });

})
