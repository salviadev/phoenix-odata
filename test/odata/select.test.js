var assert = require("assert");
var podata = require("../../index");

describe('Odata $select', function () {
    var src = {
        firstName: "John",
        lastName: "Smith",
        age: 42,
        address: {
            city: "New York",
            country: "USA"

        },
        logs: [
            { name: "x", title: "xxxx" },
            { name: "y", title: "yyyy" }
        ]
    }
    it('Basic tests', function () {
        var select = "lastName, age";
        var pselect = podata.parseSelect(select);
        var res = podata.applySelect(src, [])

        assert.deepEqual(res, src);
        res = podata.applySelect(src, pselect);

        var excepted = {
            lastName: "Smith",
            age: 42
        };
        assert.deepEqual(excepted, res);

        pselect = podata.parseSelect('firstName, address/country');
        res = podata.applySelect(src, pselect);
        excepted = {
            firstName: "John",
            address: {
                country: "USA"
            }
        };

        assert.deepEqual(excepted, res);
        pselect = podata.parseSelect('logs/name');
        res = podata.applySelect(src, pselect);
        excepted = {
            logs: [
                { name: "x" }, { name: "y" }
            ]
        };

        assert.deepEqual(excepted, res);

    });

})
