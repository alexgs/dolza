'use strict';
// Adapted from _Node.js Design Patterns_, Ch. 5, by Mario Casciaro (ISBN 9781783287314)

import Immutable from 'immutable';

function dolzaFactory() {
    let container = Object.create( null )
        , dataStore = Immutable.Map()
        , factories = Immutable.Map()
        ;

    container.register = ( name, factory, dependencies ) => {
        // Standardize falsy values of `dependencies`
        if ( !dependencies ) {
            // TODO Log a warning unless `dependencies` comes in as undefined
            dependencies = null;
        }

        // Check for valid arguments
        if ( !name || !factory ) {
            throw new ReferenceError( 'Required arguments to `dolza.register` must not be falsy' );
        }
        if ( dependencies && !Array.isArray( dependencies ) ) {
            throw new ReferenceError( 'Argument `dependencies` of `dolza.register` must be an Array' );
        }
        if ( factories.has( name ) ) {
            throw new Error( `Attempt to re-register name ${name} is illegal` );
        }

        factories = factories.set( name, { fac: factory, dep: dependencies } );
    };

    container.get = ( name ) => {
        // If we don't have the requested item in the datastore, try to make it
        // from a registered factory
        if ( !dataStoreHas( name ) ) {
            let product = getFactoryProduct( name );
            container.store( name, product );
        }

       return dataStore.get( name );
    };

    container.store = ( name, data ) => {
        if ( !name || !data ) {
            throw new ReferenceError( 'Required arguments to `dolza.store` must not be falsy' );
        }
        dataStore = dataStore.set( name, data );
    };

    function inject( factory, depList ) {
        if ( depList !== null && !Array.isArray( depList ) ) {
            throw new TypeError( 'Expected parameter `depList` to be null or an array' );
        }

        if ( depList === null ) {
            // No dependencies, so just call the factory
            return factory();
        } else {
            // Retrieve the dependencies
            let depObjects = depList.map( ( value ) => {
                return container.get( value );
            });

            // Call the factory, providing its dependent objects
            return factory( ...depObjects );
        }
    }

    function dataStoreHas( name ) {
        return dataStore.has( name );
    }

    function getFactoryProduct( name ) {
        let record = factories.get( name );
        if ( !record ) {
            // record is falsy
            throw new ReferenceError( `Factory ${name} is not registered, `
                + `and no stored object ${name} was found` );
        }

        // Inject the dependencies & store the object produced by the factory
        let factoryProduct = inject( record.fac, record.dep );
        if ( !factoryProduct ) {
            // A simple error can make a factory that doesn't return anything,
            // so we should let the dev know that something isn't right.
            throw new Error( `${name} has a falsy product from its factory` );
        }
        return factoryProduct;
    }

    return container;
}

export default dolzaFactory();
export { dolzaFactory as _factory };
