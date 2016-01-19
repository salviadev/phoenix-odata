var assert = require("assert");
var $filter2mongoFilter = require("../../index").$filter2mongoFilter;
describe('Odata $filter to mongo Filter', function () {
    describe('#operators()', function () {
        it('Different from (not equal)', function () {
            var mf = $filter2mongoFilter("VAT_Bus_Posting_Group ne 'EXPORT'");
            assert.deepEqual(mf, { VAT_Bus_Posting_Group: { $ne: "EXPORT" } });

        });
        it('/', function () {
            var mf = $filter2mongoFilter("Address/city eq 'Paris'");
            assert.deepEqual(mf, { "Address.city": "Paris" });
        });
        it('And', function () {
            var mf = $filter2mongoFilter("Country_Region_Code eq 'ES' and Payment_Terms_Code eq '14 DAYS'");
            assert.deepEqual(mf, { $and: [{ Country_Region_Code: 'ES' }, { Payment_Terms_Code: '14 DAYS' }] });
            mf = $filter2mongoFilter("(Country_Region_Code eq 'ES' and Payment_Terms_Code eq '14 DAYS') and VAT_Bus_Posting_Group ne 'EXPORT'");
            assert.deepEqual(mf, { $and: [{ Country_Region_Code: 'ES' }, { Payment_Terms_Code: '14 DAYS' }, { VAT_Bus_Posting_Group: { $ne: "EXPORT" } }] });
            mf = $filter2mongoFilter("(Country_Region_Code eq 'ES' and Payment_Terms_Code eq '14 DAYS') and (VAT_Bus_Posting_Group ne 'EXPORT')");
            assert.deepEqual(mf, { $and: [{ Country_Region_Code: 'ES' }, { Payment_Terms_Code: '14 DAYS' }, { VAT_Bus_Posting_Group: { $ne: "EXPORT" } }] });
        });
        it('OR', function () {
            var mf = $filter2mongoFilter("Country_Region_Code eq 'ES' or Country_Region_Code eq 'US' or Country_Region_Code eq 'FR'");
            assert.deepEqual(mf, { $or: [{ Country_Region_Code: "ES" }, { Country_Region_Code: "US" }, { Country_Region_Code: "FR" }] })
            mf = $filter2mongoFilter("Country_Region_Code eq 'ES' or Payment_Terms_Code eq '14 DAYS' or VAT_Bus_Posting_Group ne 'EXPORT'");
            assert.deepEqual(mf, { $or: [{ Country_Region_Code: 'ES' }, { Payment_Terms_Code: '14 DAYS' }, { VAT_Bus_Posting_Group: { $ne: "EXPORT" } }] });
        });

        it('Less than', function () {
            var mf =$filter2mongoFilter("Entry_No lt 610");
            assert.deepEqual(mf, { Entry_No: { $lt: 610 } });
        });

        it('Greater than', function () {
            var mf = $filter2mongoFilter("Entry_No gt 610 and Entry_No lt 600");
            assert.deepEqual(mf, { $and: [{ Entry_No: { '$gt': 610 } }, { Entry_No: { '$lt': 600 } }] });
            mf = $filter2mongoFilter("(Entry_No gt 610) and (Entry_No lt 600)");
            assert.deepEqual(mf, { $and: [{ Entry_No: { '$gt': 610 } }, { Entry_No: { '$lt': 600 } }] });
        });

        it('Greater than or equal to', function () {
            var mf = $filter2mongoFilter("Entry_No ge 610");
            assert.deepEqual(mf, { Entry_No: { $gte: 610 } });
        });

        it('Less than or equal to', function () {
            var mf = $filter2mongoFilter("Entry_No le 610");
            assert.deepEqual(mf, { Entry_No: { $lte: 610 } });
        });
        it('contains', function () {
            var mf = $filter2mongoFilter("contains(CompanyName,'Alfreds')");
            assert.deepEqual(mf, { CompanyName: { $regex: "Alfreds", $options: "i" } });
            mf = $filter2mongoFilter("contains(Location/Address, 'San Francisco')");
            assert.deepEqual(mf, { "Location.Address": { $regex: "San Francisco", $options: "i" } });
        });
        it('Complex', function () {
            var mf = $filter2mongoFilter("(contains(tolower(commune), tolower('M')) or contains(tolower(idcommune), tolower('M'))  or contains(tolower(operation), tolower('M')))");
            assert.deepEqual(mf.$where, '(this.commune.toLowerCase().indexOf("M".toLowerCase()) >= 0) || (this.idcommune.toLowerCase().indexOf("M".toLowerCase()) >= 0) || (this.operation.toLowerCase().indexOf("M".toLowerCase()) >= 0)');
        });

    });

})
