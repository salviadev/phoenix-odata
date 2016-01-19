var assert = require("assert");
var parser = require("../../index").OdataParser;

describe('Odata $filter parser', function() {
	describe('#operators()', function() {
		it('Basic tests', function() {
			assert.equal(null, parser.parseNe(""));
			assert.equal(null, parser.parseNe("a eq '"));
			assert.notEqual(null, parser.parse('a eq 1'));
			assert.notEqual(null, parser.parse("Name eq 'Trip in US'"));
			assert.notEqual(null, parser.parse("OrderDate eq datetime'2014-03-11'"));
			
		});
		it('Arithmetic Operators', function() {
			assert.notEqual(null, parser.parseNe("(x add 4) eq 3"));
			assert.notEqual(null, parser.parseNe("(x add y) eq 3"));
			assert.notEqual(null, parser.parseNe("(x add y) eq z"));
			assert.notEqual(null, parser.parseNe("(x div y) eq z"));
			assert.notEqual(null, parser.parseNe("(x mul y) eq z"));
			assert.notEqual(null, parser.parseNe("(x mod y) eq z"));
			assert.notEqual(null, parser.parseNe("(x sub y) eq z"));
			assert.notEqual(null, parser.parseNe("x eq 4.5"));
		});
		it('Grouping', function() {
			assert.notEqual(null, parser.parse("Entry_No gt 610 and Entry_No le 600"));
			assert.notEqual(null, parser.parse("(Entry_No gt 610) and (Entry_No le 600)"));
		});
		it('Select a range of values', function() {
			var p = parser.parseNe("Entry_No gt 610 and Entry_No lt 615   ");
			assert.notEqual(null, p);
		});
		it('And', function() {
			assert.notEqual(null, parser.parseNe("Country_Region_Code eq 'ES' and Payment_Terms_Code eq '14 DAYS'"));
		});
		it('Or', function() {
			assert.notEqual(null, parser.parseNe("Country_Region_Code eq 'ES' or Country_Region_Code eq 'US'"));
		});
		it('Complex Or', function() {
			assert.notEqual(null, parser.parseNe("Country_Region_Code eq 'ES' or Country_Region_Code eq 'US' or Country_Region_Code eq 'FR'"));
		});
		
		
		it('Not equal', function() {
			assert.notEqual(null, parser.parseNe("VAT_Bus_Posting_Group ne 'EXPORT'"));
		});

		it('Less than', function() {
			assert.notEqual(null, parser.parseNe("Entry_No lt 610"));
		});

		it('Greater than', function() {
			assert.notEqual(null, parser.parseNe("Entry_No gt 610"));
		});

		it('Greater than or equal to', function() {
			assert.notEqual(null, parser.parseNe("Entry_No ge 610"));
		});

		it('Less than or equal to', function() {
			assert.notEqual(null, parser.parseNe("Entry_No le 610"));
		});
		
		it('endswith', function() {
			assert.notEqual(null, parser.parseNe("endswith(VAT_Bus_Posting_Group,'RT')"));
		});
		it('startswith', function() {
			assert.notEqual(null, parser.parseNe("startswith(Name, 'S')"));
		});

		it('contains', function() {
			assert.notEqual(null, parser.parse("contains(CompanyName,'Alfreds')"));
            assert.notEqual(null, parser.parse("contains(Location/Address, 'San Francisco')"));
		});
		it('length', function() {
			assert.notEqual(null, parser.parseNe("length(CompanyName) eq 19"));
		});
		it('indexof', function() {
			assert.notEqual(null, parser.parseNe("indexof(CompanyName,'lfreds') eq 1"));
		});
		it('substring', function() {
			assert.notEqual(null, parser.parseNe("substring(CompanyName,1,2) eq 'lf'"));
		});
		it('tolower', function() {
			assert.notEqual(null, parser.parseNe("tolower(CompanyName) eq 'alfreds futterkiste'"));
		});
		it('toupper', function() {
			assert.notEqual(null, parser.parseNe("toupper(CompanyName) eq 'ALFREDS FUTTERKISTE'"));
		});

		it('trim', function() {
			assert.notEqual(null, parser.parseNe("trim(CompanyName) eq CompanyName"));
		});


		//https://msdn.microsoft.com/en-us/library/hh169248(v=nav.80).aspx
	});

})
