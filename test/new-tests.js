'use strict';

// 2017-06-23 | It's been almost 18 months since I first wrote Dolza and its test suite. I think my JavaScript skills
// have come a long way since then. I'm going to rewrite some of the original test suite to make sure that Dolza
// functions as it should. I may update its functionality, too, if that seems warranted.

import chai, { expect } from 'chai';
import dirtyChai from 'dirty-chai';
import dolzaFactory from '../index';

chai.use( dirtyChai );

// Test fixtures adapted from _Node.js Design Patterns, Second Ed._, Ch. 7
const dbFactory = function dbFactoryFunction( name, server, port ) {
    return {
        getId() {
            return this.getUrl();
        },

        getUrl() {
            return `${server}:${port}/${name}`;
        }
    };
};

const userRoutesFactory = function userRoutesFactoryFunction( userService, uuid ) {
    return {
        getId() {
            return `routes ${uuid} :: ${userService.getId()}`;
        }
    };
};

const userServiceFactory = function userServiceFactoryFunction( db, salt ) {
    return {
        getId() {
            return `${db.getId()}$${salt}`;
        }
    };
};

describe( 'Dolza (a lightweight dependency injection container)', function() {
    let dolza;

    beforeEach( function() {
        dolza = dolzaFactory();
    } );

    it( 'passes a canary test', function() {
        expect( true ).to.be.true();
        expect( 1 + 1 ).to.equal( 2 );
    } );

    context( 'has a function `register` for registering a factory function that', function() {
        it( 'returns an object literal describing the factory function', function() {

            let expectedResult = {
                key: 'db',
                dependencies: [ 'dbServer', 'dbPort', 'dbName' ]
                // dependencies: [ 'chumley', 99, 'smart' ]
            };
            expect( dolza.register( 'db', dbFactory, [ 'dbServer', 'dbPort', 'dbName' ] ) )
                .to.deep.equal( expectedResult );
        } );

        it( 'throws an error if the first argument is not a string' );
        it( 'throws an error if the second argument is not a function' );
        it( 'throws an error if the optional third argument is not a string or an array of strings' );
    } );

    context( 'has a function `store` for storing data that', function() {
        it( 'returns the key and type of data stored', function() {
            let expectedResult = {
                key: 'dbServer',
                type: 'string'
            };
            expect( dolza.store( 'dbServer', 'chumley' ) ).to.deep.equal( expectedResult );

            expectedResult = {
                key: 'dbPort',
                type: 'number'
            };
            expect( dolza.store( 'dbPort', 99 ) ).to.deep.equal( expectedResult );
        } );

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
