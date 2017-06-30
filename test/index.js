'use strict';

// 2017-06-23 | It's been almost 18 months since I first wrote Dolza and its test suite. I think my JavaScript skills
// have come a long way since then. I'm going to rewrite some of the original test suite to make sure that Dolza
// functions as it should. I may update its functionality, too, if that seems warranted.

import chai, { expect } from 'chai';
import dirtyChai from 'dirty-chai';
import _ from 'lodash';

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
            };
            expect( dolza.register( 'db', dbFactory, [ 'dbServer', 'dbPort', 'dbName' ] ) )
                .to.deep.equal( expectedResult );
        } );

        it( 'throws an error if the `key` argument is not a string', function () {
            expect( function() {
                dolza.get( 99 );
            } ).to.throw( Error, dolzaFactory.messages.argKeyNotString( 99 ) );
        } );

        it( 'throws an error if the `key` argument is already registered' );
        it( 'throws an error if the `factory` argument is not a function' );
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

        it( 'throws an error if the `key` argument is not a string', function () {
            expect( function storeFirstArg() {
                dolza.store( 99, 'agent' )
            } ).to.throw( Error, dolzaFactory.messages.argKeyNotString( 99 ) );
        } );

        it( 'throws an error if the `key` argument is already registered' );

        it( 'throws an error if the second argument is null or undefined', function () {
            expect( function storeSecondArgNull() {
                dolza.store( 'null', null )
            } ).to.throw( Error, dolzaFactory.messages.fnStoreSecondArg );

            expect( function storeSecondArgUndef() {
                dolza.store( 'undef', undefined )
            } ).to.throw( Error, dolzaFactory.messages.fnStoreSecondArg );
        } );

        it( 'accepts null or undefined for the second argument if the optional third argument is `true`' );
    } );

    context( 'has a function `get` that accepts a key and', function() {
        const data = {
            dbServer: 'chumley',
            dbPort: 99,
            dbName: 'smart',
            salt: 'a19b27c36d48e50',
            uuid: 'jfe354356VDAasdnceqKNNFDOI4TNVM'
        };
        const factories = {
            db: {
                factory: dbFactory,
                args: [ 'dbName', 'dbServer', 'dbPort' ]
            },
            userRoutes: {
                factory: userRoutesFactory,
                args: [ 'userService', 'uuid' ]
            },
            userService: {
                factory: userServiceFactory,
                args: [ 'db', 'salt' ]
            }
        };

        beforeEach( function () {
            _.forEach( data, (value, key) => dolza.store( key, value ) );
            _.forEach( factories, (value, key) => dolza.register( key, value.factory, value.args ) );
        } );

        it( 'returns stored data when given a key for stored data', function () {
            expect( dolza.get( 'dbServer' ) ).to.equal( 'chumley' );
            expect( dolza.get( 'dbPort' ) ).to.equal( 99 );
            expect( dolza.get( 'dbName' ) ).to.equal( 'smart' );
        } );

        it( 'returns an object created from a factory when given a key for a factory function', function () {
            const db = dolza.get( 'db' );
            const expectedDbUrl = `${data.dbServer}:${data.dbPort}/${data.dbName}`;
            expect( db.getId() ).to.equal( expectedDbUrl );
        } );

        it( 'implements the singleton pattern for each key', function() {
            const db1 = dolza.get( 'db' );
            const db2 = dolza.get( 'db' );
            expect( db1 === db2 ).to.be.true();
            expect( db1 ).to.equal( db2 );
        } );

        it( 'throws an error if the factory doesn\'t create anything', function () {
            const badObjectId = 'bad-object';
            const badArrayId = 'badArray';
            dolza.register( badObjectId, function badObjectFactory() { return {}; } );
            expect( function getBadObject() {
                dolza.get( badObjectId );
            } ).to.throw( Error, dolzaFactory.messages.badFactoryProduction( badObjectId ) );

            dolza.register( badArrayId, function badArrayFactory() { return []; } );
            expect( function getBadArray() {
                dolza.get( badArrayId );
            } ).to.throw( Error, dolzaFactory.messages.badFactoryProduction( badArrayId ) );
        } );

        it( 'correctly instantiates a dependency graph as needed', function () {
            // In tests for v0.1.x, I referred to this type of test (with nested dependencies) as "async" but that is
            // obviously a misnomer.
            const expectedServiceId = `${data.dbServer}:${data.dbPort}/${data.dbName}$${data.salt}`;
            const expectedRoutesId = `routes ${data.uuid} :: ${expectedServiceId}`;
            const userRoutes = dolza.get( 'userRoutes' );
            expect( userRoutes.getId() ).to.equal( expectedRoutesId );

            const userService = dolza.get( 'userService' );
            expect( userService.getId() ).to.equal( expectedServiceId );
        } );

        it( 'throws an error if the `key` argument is not a string', function () {
            expect( function() {
                dolza.get( 99 );
            } ).to.throw( Error, dolzaFactory.messages.argKeyNotString( 99 ) );
        } );

        it( 'throws an error if the key is not registered', function () {
            expect( function() {
                dolza.get( 'no-such-key' )
            } ).to.throw( Error, dolzaFactory.messages.argKeyNotStored( 'no-such-key' ) );
        } );
    } );
} );
