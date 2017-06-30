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
    } )
} );
