/* As of 2016-01-11 and Node.js v5.1.1, this needs to be run with the
 * `--es_staging` flag, e.g. `mocha --es_staging`.
 */

'use strict';

/* The `dolza` module exports the final DI container, which is cached in Node's
 * module system. It is effectively a singleton, so changes persist from one
 * test to the next, which is obviously something we don't want. In tests, we
 * import the "secret" factory directly, so each test can instantiate its own
 * DI container.
 */
let dolzaFactory = require( '../index' )._factory
    , dolza
    , chai = require( 'chai' )
    , expect = chai.expect
    , sinon = require( 'sinon' )
    ;

chai.use( require( 'sinon-chai' ) );
chai.use( require( 'dirty-chai' ) );

describe( 'Dolza (a lightweight dependency injection framework)', function() {
    context( 'when registering a module factory', function() {
        context( 'with the two-argument form', function() {
            let name, factory;

            beforeEach( function() {
                dolza = dolzaFactory();
                name = 'hayes';
                factory = function() {
                    let value = 8;
                    let math = Object.create( null );

                    math.double = function() {
                        return value * 2;
                    };

                    math.square = function() {
                        return value * value;
                    };

                    return math;
                };
            });

            afterEach( function() {
                dolza = null;
                name = null;
                factory = null;
            });

            it( 'will accept arguments `(name, factory)`', function() {
                sinon.spy( dolza, 'register' );
                dolza.register( name, factory );

                expect( dolza.register ).to.have.been.calledOnce();
                expect( dolza.register ).to.have.been.calledWithExactly( name, factory );

                dolza.register.restore();
            });

            it( 'will return an instantiated object from the factory', function() {
                let factorySpy = sinon.spy( factory );
                dolza.register( name, factorySpy );
                let obj = dolza.get( name );

                expect( obj.square() ).to.equal( 64 );
                expect( obj.double() ).to.equal( 16 );
                expect( factorySpy ).to.have.been.calledOnce();
                expect( factorySpy ).to.have.been.calledWithExactly();

                let o1 = dolza.get( name );
                let o2 = dolza.get( name );
                expect( factorySpy ).to.have.been.calledOnce();
                expect( o1 ).to.equal( o2 );
            });

            it( 'will throw an error if an unnamed factory is requested', function() {
                let noName = 'hunter';
                expect( noName ).to.not.equal( name );

                dolza.register( name, factory );
                expect( function() { dolza.get( noName ) } ).to.throw( ReferenceError );
            });

            it( 'will throw an error if `name` or `factory` is falsy', function() {
                expect( function() { dolza.register( '', factory ) } ).to.throw( ReferenceError );
                expect( function() { dolza.register( undefined, factory ) } ).to.throw( ReferenceError );
                expect( function() { dolza.register( null, factory ) } ).to.throw( ReferenceError );
                expect( function() { dolza.register( 0, factory ) } ).to.throw( ReferenceError );
                expect( function() { dolza.register( NaN, factory ) } ).to.throw( ReferenceError );
                expect( function() { dolza.register( name, '' ) } ).to.throw( ReferenceError );
                expect( function() { dolza.register( name, undefined ) } ).to.throw( ReferenceError );
                expect( function() { dolza.register( name, null ) } ).to.throw( ReferenceError );
                expect( function() { dolza.register( name, 0 ) } ).to.throw( ReferenceError );
                expect( function() { dolza.register( name, NaN ) } ).to.throw( ReferenceError );
            });

            it( 'will throw an error if `name` is already registered', function() {
                dolza.register( name, factory );
                expect( function() {
                    dolza.register( name, function() { return 5 } )
                }).to.throw( Error );
            });

        });

        context( 'with the three-argument form', function() {
            let fibonacciFactory, fibonacciGenFactory
                , primeFactory, primesGenFactory
                , fancyFactory
                , namePgf = 'prime-generator-factory'
                , namePf = 'prime-factory'
                , nameFgf = 'fibonacci-generator-factory'
                , nameFf = 'fibonacci-factory'
                , nameTop = 'fancy-factory'
                ;

            beforeEach( function() {
                dolza = dolzaFactory();
                primesGenFactory = function() {
                    let container = Object.create( null );
                    let primes = [ 2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37,
                        41, 43, 47, 53, 59, 61, 67, 71 ];
                    let index = primes.length;

                    container.next = function() {
                        index++;
                        if ( index >= container.limit() ) {
                            index = 0;
                        }
                        return primes[ index ];
                    };

                    container.limit = function() {
                        return primes.length;
                    };

                    return container;
                };
                primeFactory = ( primeGenerator ) => {
                    let primeGen = primeGenerator;
                    let container = Object.create( null );

                    container.getPrime = ( id ) => {
                        let index = id - 1;
                        //while ( index >= primeGen.limit() ) {
                        //    index = index - primeGen.limit();
                        //}
                        let result;
                        for (let i = 0; i <= index; i++) {
                            result = primeGen.next();
                        }
                        return result;
                    };

                    container.getGenerator = function() {
                        return primeGen;
                    };

                    return container;
                };
                fibonacciGenFactory = function() {
                    let container = Object.create( null );
                    let fib = [ 1, 1 ];
                    let index = -1;

                    container.next = function() {
                        index++;
                        if ( index >= container.limit() ) {
                            index = 0;
                        }
                        while ( index >= fib.length ) {
                            fib.push( fib[ index - 2 ] + fib[ index -1 ] );
                        }
                        return fib[ index ];
                    };

                    container.limit = function() { return 100 };

                    return container;
                };
                fibonacciFactory = ( fibonacciGenerator ) => {
                    let fibGen = fibonacciGenerator;
                    let container = Object.create( null );

                    container.getFibonacci = ( id ) => {
                        let result;
                        for ( let i = 0; i < id; i++) {
                            result = fibGen.next();
                        }
                        return result;
                    };

                    container.getGenerator = function() {
                        return fibGen;
                    };

                    return container;
                };
                fancyFactory = ( primes, fibonacci ) => {
                    let primeList = primes;
                    let fibList = fibonacci;
                    let container = Object.create( null );

                    container.product = ( id ) => {
                        return primeList.getPrime( id ) * fibList.getFibonacci( id );
                    };

                    container.getPrimeList = function() {
                        return primeList;
                    };

                    container.getFibonacciList = function() {
                        return fibList;
                    };

                    return container;
                };
            });

            afterEach( function() {
                dolza = null;
                primesGenFactory = null;
                primeFactory = null;
                fibonacciGenFactory = null;
                fibonacciFactory = null;
                fancyFactory = null;
            });

            it( 'will accept arguments `(name, factory, dependencies)`', function() {
                sinon.spy( dolza, 'register' );
                dolza.register( namePgf, primesGenFactory );
                dolza.register( namePf, primeFactory, [ namePgf ] );

                expect( dolza.register ).to.have.been.calledTwice();
                let call0 = dolza.register.getCall( 0 );
                let call1 = dolza.register.getCall( 1 );
                expect( call0.calledWithExactly( namePgf, primesGenFactory ) );
                expect( call1.calledWithExactly( namePf, primeFactory, [ namePgf ] ) );

                dolza.register.restore();
            });

            it( 'will instantiate each standalone dependency', function() {
                let pgfSpy = sinon.spy( primesGenFactory );
                let fgfSpy = sinon.spy( fibonacciGenFactory );

                dolza.register( namePgf, pgfSpy );
                dolza.register( nameFgf, fgfSpy );

                let pFactory = dolza.get( namePgf );
                let fFactory = dolza.get( nameFgf );

                expect( pgfSpy ).to.have.been.calledOnce();
                expect( pgfSpy ).to.have.been.calledWithExactly();
                expect( fgfSpy ).to.have.been.calledOnce();
                expect( fgfSpy ).to.have.been.calledWithExactly();
            });

            it( 'will instantiate each dependency in an acyclic dependency graph', function() {
                let pgfSpy = sinon.spy( primesGenFactory );
                let pfSpy  = sinon.spy( primeFactory );
                let fgfSpy = sinon.spy( fibonacciGenFactory );
                let ffSpy  = sinon.spy( fibonacciFactory );

                /* NOTE: We can register a factory *before* its dependencies,
                 * as long as the dependencies are registered before `get` is
                 * called.
                 */
                dolza.register( namePf, pfSpy, [ namePgf ] );
                dolza.register( nameFf, ffSpy, [ nameFgf ] );
                dolza.register( namePgf, pgfSpy );
                dolza.register( nameFgf, fgfSpy );

                let primes = dolza.get( namePf );
                expect( pgfSpy ).to.have.been.calledOnce();
                expect( pfSpy ).to.have.been.calledOnce();

                let fib = dolza.get( nameFf );
                expect( fgfSpy ).to.have.been.calledOnce();
                expect( ffSpy ).to.have.been.calledOnce();
            });

            it( 'will inject each dependency into the factory', function() {
                // Register dependencies and build the dep graph
                dolza.register( nameTop, fancyFactory, [ namePf, nameFf ]);
                dolza.register( namePf, primeFactory, [ namePgf ] );
                dolza.register( nameFf, fibonacciFactory, [ nameFgf ] );
                dolza.register( namePgf, primesGenFactory );
                dolza.register( nameFgf, fibonacciGenFactory );
                let top = dolza.get( nameTop );

                let dolzaPrimes = dolza.get( namePf );
                let dolzaPrimeGen = dolza.get( namePgf );
                let dolzaFibs = dolza.get( nameFf );
                let dolzaFibGen = dolza.get( nameFgf );
                expect( dolzaPrimes.getGenerator() ).to.equal( dolzaPrimeGen );
                expect( dolzaFibs.getGenerator() ).to.equal( dolzaFibGen );
                expect( top.getPrimeList() ).to.equal( dolzaPrimes );
                expect( top.getFibonacciList() ).to.equal( dolzaFibs );
            });

            it( 'will return an instantiated object from the factory', function() {
                dolza.register( nameFf, fibonacciFactory, [ nameFgf ] );
                dolza.register( nameFgf, fibonacciGenFactory );
                let dolzaFibs = dolza.get( nameFf );
                expect( dolzaFibs ).to.exist();
            });

            it( 'will throw an error if an unnamed factory is requested', function() {
                let noName = 'hunter';
                dolza.register( nameFf, fibonacciFactory, [ nameFgf ] );
                dolza.register( nameFgf, fibonacciGenFactory );
                let dolzaFibs = dolza.get( nameFf );
                expect( dolzaFibs ).to.exist();
                expect( function() { dolza.get( noName ) } ).to.throw( ReferenceError );
            });

            it( 'will throw an error if `name` or `factory` is falsy', function() {
                let factory = primesGenFactory
                    , name = 'prime-factory'
                    , dep = [ 'prime-generator-factory' ]
                    ;

                expect( function() { dolza.register( '', factory, dep ) } ).to.throw( ReferenceError );
                expect( function() { dolza.register( undefined, factory, dep ) } ).to.throw( ReferenceError );
                expect( function() { dolza.register( null, factory, dep ) } ).to.throw( ReferenceError );
                expect( function() { dolza.register( 0, factory, dep ) } ).to.throw( ReferenceError );
                expect( function() { dolza.register( NaN, factory, dep ) } ).to.throw( ReferenceError );
                expect( function() { dolza.register( name, '', dep ) } ).to.throw( ReferenceError );
                expect( function() { dolza.register( name, undefined, dep ) } ).to.throw( ReferenceError );
                expect( function() { dolza.register( name, null, dep ) } ).to.throw( ReferenceError );
                expect( function() { dolza.register( name, 0, dep ) } ).to.throw( ReferenceError );
                expect( function() { dolza.register( name, NaN, dep ) } ).to.throw( ReferenceError );
            });

            it( 'will throw an error if `dependencies` is not an Array', function() {
                let factory = primesGenFactory
                    , name = 'prime-factory'
                    , dep = [ 'prime-generator-factory' ]
                    ;

                // Falsy values are fine, but they are treated as the 2-arg form
                expect( function() { dolza.register( name, factory, 0) } ).to.not.throw( ReferenceError );
                expect( function() { dolza.register( name, factory, null) } ).to.not.throw( ReferenceError );
                expect( function() { dolza.register( name, factory, '') } ).to.not.throw( ReferenceError );
                expect( function() { dolza.register( name, factory, NaN) } ).to.not.throw( ReferenceError );

                // Truthy, non-array values throw an error
                expect( function() { dolza.register( name, factory, 'prime-generator-factory' ) } )
                    .to.throw( ReferenceError );
                expect( function() { dolza.register( name, factory, 1 ) } ).to.throw( ReferenceError );
                expect( function() { dolza.register( name, factory, function() { return 0; } ) } )
                    .to.throw( ReferenceError );
                expect( function() { dolza.register( name, factory, { dep: name } ) } )
                    .to.throw( ReferenceError );
            });

            it( 'will throw an error if `name` is already registered', function() {
                let name = 'myFactory';
                dolza.register( name, fibonacciFactory, [ 'fib-gen' ] );
                expect( function() {
                    dolza.register( name, fancyFactory, [ 'fib-gen', 'prime-gen' ] );
                }).to.throw( Error );
            });

        });
    });

    context( 'when storing data, an object, or a function', function() {
        let nameF = 'myfunc'
            , myFunction
            ;

        beforeEach( function() {
            dolza = dolzaFactory();
            myFunction = ( a, b ) => {
                return a + b;
            }
        });

        afterEach( function() {
            dolza = null;
            myFunction = null;
        });

        it( 'will accept arguments `(name, data)`', function() {
            sinon.spy( dolza, 'store' );
            dolza.store( nameF, myFunction );
            expect( dolza.store ).to.be.calledOnce();
            expect( dolza.store ).to.be.calledWithExactly( nameF, myFunction );
        });

        it( 'will return the stored data', function() {
            dolza.store( nameF, myFunction );
            expect( dolza.get( nameF ) ).to.equal( myFunction );
        });

        it( 'will throw an error if unnamed data is requested', function() {
            let noName = 'hunter';
            dolza.register( nameF, myFunction );
            expect( function() { dolza.get( noName ) } ).to.throw( ReferenceError );
        });

        it( 'will throw an error if `name` or `data` is falsy', function() {
            expect( function() { dolza.store( '', myFunction ) } ).to.throw( ReferenceError );
            expect( function() { dolza.store( undefined, myFunction ) } ).to.throw( ReferenceError );
            expect( function() { dolza.store( null, myFunction ) } ).to.throw( ReferenceError );
            expect( function() { dolza.store( 0, myFunction ) } ).to.throw( ReferenceError );
            expect( function() { dolza.store( NaN, myFunction ) } ).to.throw( ReferenceError );
            expect( function() { dolza.store( nameF, '' ) } ).to.throw( ReferenceError );
            expect( function() { dolza.store( nameF, undefined ) } ).to.throw( ReferenceError );
            expect( function() { dolza.store( nameF, null ) } ).to.throw( ReferenceError );
            expect( function() { dolza.store( nameF, 0 ) } ).to.throw( ReferenceError );
            expect( function() { dolza.store( nameF, NaN ) } ).to.throw( ReferenceError );
        });

        it( 'will update the stored data if `name` is already registered', function() {
            let myData = [ 0, 1, 2, 3, 4, 5 ];
            dolza.store( nameF, myFunction );
            dolza.store( nameF, myData );
            expect( dolza.get( nameF ) ).to.equal( myData );
        });
    });

});
