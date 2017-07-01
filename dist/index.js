'use strict';
// Adapted from _Node.js Design Patterns_, Ch. 5, by Mario Casciaro (ISBN 9781783287314)

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _immutable = require('immutable');

var _immutable2 = _interopRequireDefault(_immutable);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * A simple dependency injection container
 * @typedef {Object} Dolza
 * @property {Function} get Retrieves a stored value
 */

/**
 * @returns {Object} Dolza
 */
function dolzaFactory() {
    const container = Object.create(null);
    let datastore = _immutable2.default.Map(),
        registry = _immutable2.default.Map();

    /**
     *
     * @param key
     * @returns {V}
     */
    container.get = function (key) {
        // Key must be a string
        if (typeof key !== 'string') {
            throw new Error(dolzaFactory.messages.argKeyNotString(key));
        }

        // Verify that the key is registered in the datastore or the factory registry
        if (!datastoreHas(key) && !registryHas(key)) {
            throw new Error(dolzaFactory.messages.argKeyNotStored(key));
        }

        // If we don't have the requested item in the datastore, try to make it from a registered factory
        if (!datastoreHas(key)) {
            const product = getFactoryProduct(key);
            container.store(key, product);
        }

        return datastore.get(key);
    };

    container.register = function (key, factory, dependencies) {
        // Standardize falsy values of `dependencies`
        if (!dependencies) {
            // TODO Log a warning unless `dependencies` comes in as undefined
            dependencies = null;
        }

        // Check for valid arguments
        if (!key || typeof key !== 'string') {
            throw new Error(dolzaFactory.messages.argKeyNotString(key));
        }
        if (!key || !factory) {
            throw new ReferenceError('Required arguments to `dolza.register` must not be falsy');
        }
        if (dependencies && !Array.isArray(dependencies)) {
            throw new ReferenceError('Argument `dependencies` of `dolza.register` must be an Array');
        }
        if (registryHas(key)) {
            throw new Error(`Attempt to re-register name ${key} is illegal`);
        }

        registry = registry.set(key, { factory, dependencies });
        return { key, dependencies };
    };

    container.store = function (key, data) {
        if (!key || typeof key !== 'string') {
            throw new Error(dolzaFactory.messages.argKeyNotString(key));
        }
        if (data === null || data === undefined) {
            throw new Error(dolzaFactory.messages.fnStoreSecondArg);
        }
        datastore = datastore.set(key, data);
        return {
            key: key,
            type: typeof data
        };
    };

    function datastoreHas(name) {
        return datastore.has(name);
    }

    function getFactoryProduct(name) {
        // This should have already been checked, but double-check anyway
        if (!registryHas(name)) {
            throw new Error(dolzaFactory.messages.argKeyNotStored(name));
        }

        const record = registry.get(name);

        // Inject the dependencies & store the object produced by the factory
        const factoryProduct = inject(record.factory, record.dependencies);

        // The factory should return something; minimal values include:
        //   - a truthy primitive (although, technically, a factory should **NOT** return a primitive)
        //   - an object with its own property
        //   - an array with one value
        if (!factoryProduct || _lodash2.default.keys(factoryProduct).length < 1) {
            throw new Error(dolzaFactory.messages.badFactoryProduction(name));
        }
        return factoryProduct;
    }

    function inject(factory, dependencyList) {
        if (dependencyList !== null && !Array.isArray(dependencyList)) {
            throw new TypeError('Expected parameter `dependencyList` to be null or an array');
        }

        if (dependencyList === null) {
            // No dependencies, so just call the factory
            return factory();
        } else {
            // Retrieve the dependencies
            const argumentList = _lodash2.default.map(dependencyList, value => {
                return container.get(value);
            });

            // Call the factory, providing its dependent objects
            return factory(...argumentList);
        }
    }

    function registryHas(key) {
        return registry.has(key);
    }

    return container;
}

dolzaFactory.messages = {
    argKeyAlreadyStored: function (key) {
        return `Factory ${key} is already registered as a key for a factory or data`;
    },
    argKeyNotStored: function (key) {
        return `Factory ${key} is not registered, and no stored object ${key} was found`;
    },
    argKeyNotString: function (key) {
        return `Argument \`key\` must be a string, but ${key} is a ${typeof key}`;
    },
    badFactoryProduction: function (key) {
        return `Factory ${key} failed to create a minimal object`;
    },
    fnStoreFirstArg: 'The first argument to method `store` must be a string',
    fnStoreSecondArg: 'The second argument to method `store` may not be null or undefined'
};

exports.default = dolzaFactory;