'use strict';

// This module needs to usable by Node.js v6.10 or higher

const chai = require( 'chai' );
const dirtyChai = require( 'dirty-chai' );
const _ = require( 'lodash' );
const fixtures = require( './fixtures' );
const dolza = require( '../index' );

const expect = chai.expect;
chai.use( dirtyChai );

describe( 'In production, Dolza', function() {
    // The production library exports a "Dolza" singleton, and the "require" module system also enforces a singleton
    // pattern. There is no way to "reset" the DI container before each test; the same container is reused in every
    // test here. Each test must be mindful of this.
    before( function () {
        _.forEach( fixtures.data, (value, key) => dolza.store( key, value ) );
        _.forEach( fixtures.factories, (value, key) => dolza.register( key, value.factory, value.args ) );
    } );

    it( 'passes a canary test', function () {
        expect( true ).to.be.true();
        expect( 1 + 1 ).to.equal( 2 );
    } );

    it( 'stores and returns simple data', function () {
        expect( dolza.get( 'dbName' ) ).to.equal( 'smart' );
    } );

    it( 'implements the singleton pattern for each key', function () {
        const db1 = dolza.get( 'db' );
        const db2 = dolza.get( 'db' );
        expect( db1 === db2 ).to.be.true();
        expect( db1 ).to.equal( db2 );
    } );

    it( 'instantiates a dependency graph as needed', function () {
        const data = fixtures.data;
        const expectedServiceId = `${data.dbServer}:${data.dbPort}/${data.dbName}$${data.salt}`;
        const expectedRoutesId = `routes ${data.uuid} :: ${expectedServiceId}`;
        const userRoutes = dolza.get( 'userRoutes' );
        expect( userRoutes.getId() ).to.equal( expectedRoutesId );

        const userService = dolza.get( 'userService' );
        expect( userService.getId() ).to.equal( expectedServiceId );

        const db1 = dolza.get( 'db' );
        const db2 = dolza.get( 'db' );
        expect( db1 === db2 ).to.be.true();
        expect( db1 ).to.equal( db2 );
    } );
} );
