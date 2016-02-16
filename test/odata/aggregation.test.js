var assert = require("assert");
var podata = require("../../index");

describe('Odata extentions groupby && aggregation', function () {
    it('Aggregation', function () {

        var p = podata.$aggregation2mongoAggregation("$count() as count, $sum(Amount) as total");
        var excepted = {
            "_id": null,
            "count": { "$sum": 1 },
            "total": { "$sum": "$Amount" }
        };
        assert.deepEqual(p, excepted);
        p = podata.$aggregation2mongoAggregation("$count() as count, $sum($multiply(Amount, 2)) as total");
        excepted = {
            "_id": null,
            "count": { "$sum": 1 },
            "total": { "$sum": { $multiply: ["$Amount", 2] } }
        };
        assert.deepEqual(p, excepted);
        p = podata.$aggregation2mongoAggregation("$count() as count, $sum($multiply(Amount, 2)) as total", "city, $year(date) as year");
        excepted = {
            "_id": { city: '$city', year: { $year: '$date' } },
            "count": { "$sum": 1 },
            "total": { "$sum": { $multiply: ["$Amount", 2] } }
        };
        assert.deepEqual(p, excepted);

    });

})
