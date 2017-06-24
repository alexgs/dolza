'use strict';

// 2017-06-23 | It's been almost 18 months since I first wrote Dolza and its test suite. I think my JavaScript skills
// have come a long way since then. I'm going to rewrite some of the original test suite to make sure that Dolza
// functions as it should. I may update its functionality, too, if that seems warranted.

import chai, { expect } from 'chai';
import dirtyChai from 'dirty-chai';

chai.use( dirtyChai );

describe( 'Dolza (a lightweight dependency injection container)', function() {
    it( 'passes a canary test', function() {
        expect( true ).to.be.true();
        expect( 1 + 1 ).to.equal( 2 );
    } );

    context( 'has a function `register` for registering a factory function that', function() {
        it( 'returns an object literal describing the factory function' );
        it( 'throws an error if the first argument is not a string' );
        it( 'throws an error if the second argument is not a function' );
        it( 'throws an error if the optional third argument is not a string or an array of strings' );
    } );

    context( 'has a function `store` for storing data that', function() {
        it( 'returns the key and type of data stored' );
        it( 'throws an error if the first argument is not a string' );
        it( 'throws an error if the second argument is null or undefined' );
        it( 'accepts null or undefined for the second argument if the optional third argument is `true`' );
    } );

    context( 'has a function `get` that accepts a key and', function() {
        it( 'returns stored data when given a key for stored data' );
        it( 'returns an object created from a factory when given a key for a factory function' );
        it( 'correctly instantiates a dependency graph as needed' );
        it( 'correctly waits for asynchronously dependencies to be instantiated' );
        it( 'throws an error if the key is not a string' );
        it( 'throws an error if the key is not registered' );
    } );

    // TODO Maybe? context( 'when listing registered modules', function() {} );
} );
