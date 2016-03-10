var assert = require("assert");
var podata = require("../../index");

describe('Odata Uri parser', function() {


    it('Basic tests', function() {
        var p = podata.parseOdataUri('/odata/master/user(1)/photo', 'GET');
        var e = {
            method: 'GET',
            query: {},
            application: 'master',
            entity: 'user',
            entityId: ['1'],
            propertyName: 'photo'
        };
        assert.deepEqual(p, e);
        
        var p1 = podata.parseOdataUri('/odata/master/user(id=1)/photo', 'GET');
        var e1 = {
            method: 'GET',
            query: {},
            application: 'master',
            entity: 'user',
            entityId: {id: '1'},
            propertyName: 'photo'
        };
        assert.deepEqual(p1, e1);
        
    });
});