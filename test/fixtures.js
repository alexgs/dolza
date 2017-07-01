'use strict';

// This module needs to usable by Node.js v6.10 or higher

// Test fixtures adapted from _Node.js Design Patterns, Second Ed._, Ch. 7
function dbFactoryFunction( name, server, port ) {
    return {
        getId() {
            return this.getUrl();
        },

        getUrl() {
            return `${server}:${port}/${name}`;
        }
    };
}

function userRoutesFactoryFunction( userService, uuid ) {
    return {
        getId() {
            return `routes ${uuid} :: ${userService.getId()}`;
        }
    };
}

function userServiceFactoryFunction( db, salt ) {
    return {
        getId() {
            return `${db.getId()}$${salt}`;
        }
    };
}

module.exports = {
    data: {
        dbServer: 'chumley',
        dbPort: 99,
        dbName: 'smart',
        salt: 'a19b27c36d48e50',
        uuid: 'jfe354356VDAasdnceqKNNFDOI4TNVM'
    },

    dbFactory: dbFactoryFunction,

    factories: {
        db: {
            factory: dbFactoryFunction,
            args: [ 'dbName', 'dbServer', 'dbPort' ]
        },
        userRoutes: {
            factory: userRoutesFactoryFunction,
            args: [ 'userService', 'uuid' ]
        },
        userService: {
            factory: userServiceFactoryFunction,
            args: [ 'db', 'salt' ]
        }
    },

    userRoutesFactory: userRoutesFactoryFunction,

    userServiceFactory: userServiceFactoryFunction
};
