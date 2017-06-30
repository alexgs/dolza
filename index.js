'use strict';
// Adapted from _Node.js Design Patterns_, Ch. 5, by Mario Casciaro (ISBN 9781783287314)

import Immutable from 'immutable';
import _ from 'lodash';

function dolzaFactory() {
    const container = Object.create( null );
      let datastore = Immutable.Map()
        , registry  = Immutable.Map()
        ;

    container.get = function( key ) {
        // Key must be a string
        if ( typeof key !== 'string' ) {
            throw new Error( dolzaFactory.messages.fnGetKeyNotString( key ) );
        }

        // Verify that the key is registered in the datastore or the factory registry
        if ( !datastoreHas( key ) && !registryHas( key ) ) {
            throw new Error( dolzaFactory.messages.fnGetNotValidKey( key ) );
        }

        // If we don't have the requested item in the datastore, try to make it from a registered factory
        if ( !datastoreHas( key ) ) {
            const product = getFactoryProduct( key );
            container.store( key, product );
        }

       return datastore.get( key );
    };

    container.register = function( key, factory, dependencies ) {
        // Standardize falsy values of `dependencies`
        if ( !dependencies ) {
            // TODO Log a warning unless `dependencies` comes in as undefined
            dependencies = null;
        }

        // Check for valid arguments
        if ( !key || !factory ) {
            throw new ReferenceError( 'Required arguments to `dolza.register` must not be falsy' );
        }
        if ( dependencies && !Array.isArray( dependencies ) ) {
            throw new ReferenceError( 'Argument `dependencies` of `dolza.register` must be an Array' );
        }
        if ( registryHas( key ) ) {
            throw new Error( `Attempt to re-register name ${key} is illegal` );
        }

        registry = registry.set( key, { factory, dependencies } );
        return { key, dependencies };
    };

    container.store = function( key, data ) {
        if ( !key || typeof key !== 'string' ) {
            throw new Error( dolzaFactory.messages.fnStoreFirstArg );
        }
        if ( data === null || data === undefined ) {
            throw new Error( dolzaFactory.messages.fnStoreSecondArg );
        }
        datastore = datastore.set( key, data );
        return {
            key: key,
            type: typeof data
        };
    };

    function datastoreHas( name ) {
        return datastore.has( name );
    }

    function getFactoryProduct( name ) {
        // This should have already been checked, but double-check anyway
        if ( !registryHas( name ) ) {
            throw new Error( dolzaFactory.messages.fnGetNotValidKey( name ) );
        }

        const record = registry.get( name );

        // Inject the dependencies & store the object produced by the factory
        const factoryProduct = inject( record.factory, record.dependencies );


        // The factory should return something; minimal values include:
        //   - a truthy primitive (although, technically, a factory should **NOT** return a primitive)
        //   - an object with its own property
        //   - an array with one value
        if ( !factoryProduct || _.keys( factoryProduct ).length < 1 ) {
            throw new Error( dolzaFactory.messages.badFactoryProduction( name ) );
        }
        return factoryProduct;
    }

    function inject( factory, dependencyList ) {
        if ( dependencyList !== null && !Array.isArray( dependencyList ) ) {
            throw new TypeError( 'Expected parameter `dependencyList` to be null or an array' );
        }

        if ( dependencyList === null ) {
            // No dependencies, so just call the factory
            return factory();
        } else {
            // Retrieve the dependencies
            const argumentList = dependencyList.map( ( value ) => {
                return container.get( value );
            });

            // Call the factory, providing its dependent objects
            return factory( ...argumentList );
        }
    }

    function registryHas( key ) {
        return registry.has( key );
    }

    return container;
}

dolzaFactory.messages = {
    badFactoryProduction: function( key ) { return `Factory ${key} failed to create a minimal object` },
    fnGetKeyNotString: function( key ) { return `Argument \`key\` must be a string, but ${key} is a ${typeof key}` },
    fnGetNotValidKey: function(key ) { return `Factory ${key} is not registered, and no stored object ${key} was found` },
    fnStoreFirstArg: 'The first argument to method `store` must be a string',
    fnStoreSecondArg: 'The second argument to method `store` may not be null or undefined'
};

export default dolzaFactory;
