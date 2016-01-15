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

chai.use( require( 'dirty-chai' ) );
chai.use( require( 'sinon-chai' ) );

describe( 'Dolza (a lightweight dependency injection framework)', () => {
    context( 'when registering a module factory', () => {
        context( 'with the two-argument form', () => {
            let name, factory;

            beforeEach( () => {
                dolza = dolzaFactory();
                name = 'hayes';
                factory = () => {
                    let value = 8;
                    let math = Object.create( null );

                    math.double = () => {
                        return value * 2;
                    };

                    math.square = () => {
                        return value * value;
                    };

                    return math;
                };
            });

            afterEach( () => {
                dolza = null;
                name = null;
                factory = null;
            });

            it( 'will accept arguments `(name, factory)`', () => {
                sinon.spy( dolza, 'register' );
                dolza.register( name, factory );

                expect( dolza.register ).to.have.been.calledOnce();
                expect( dolza.register ).to.have.been.calledWithExactly( name, factory );

                dolza.register.restore();
            });

            it( 'will return an instantiated object from the factory', () => {
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

            it( 'will throw an error if an unnamed factory is requested', () => {
                let noName = 'hunter';
                expect( noName ).to.not.equal( name );

                dolza.register( name, factory );
                expect( () => { dolza.get( noName ) } ).to.throw( ReferenceError );
            });

            it( 'will throw an error if `name` or `factory` is falsy', () => {
                expect( () => { dolza.register( '', factory ) } ).to.throw( ReferenceError );
                expect( () => { dolza.register( undefined, factory ) } ).to.throw( ReferenceError );
                expect( () => { dolza.register( null, factory ) } ).to.throw( ReferenceError );
                expect( () => { dolza.register( 0, factory ) } ).to.throw( ReferenceError );
                expect( () => { dolza.register( NaN, factory ) } ).to.throw( ReferenceError );
                expect( () => { dolza.register( name, '' ) } ).to.throw( ReferenceError );
                expect( () => { dolza.register( name, undefined ) } ).to.throw( ReferenceError );
                expect( () => { dolza.register( name, null ) } ).to.throw( ReferenceError );
                expect( () => { dolza.register( name, 0 ) } ).to.throw( ReferenceError );
                expect( () => { dolza.register( name, NaN ) } ).to.throw( ReferenceError );
            });

            it( 'will throw an error if `name` is already registered', () => {
                dolza.register( name, factory );
                expect( () => {
                    dolza.register( name, () => { return 5 } )
                }).to.throw( Error );
            });

        });

        context( 'with the three-argument form', () => {
            let fibonacciFactory, fibonacciGenFactory
                , primeFactory, primesGenFactory
                , fancyFactory
                , namePgf = 'prime-generator-factory'
                , namePf = 'prime-factory'
                , nameFgf = 'fibonacci-generator-factory'
                , nameFf = 'fibonacci-factory'
                , nameTop = 'fancy-factory'
                ;

            beforeEach( () => {
                dolza = dolzaFactory();
                primesGenFactory = () => {
                    let container = Object.create( null );
                    let primes = [ 2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37,
                        41, 43, 47, 53, 59, 61, 67, 71 ];
                    let index = primes.length;

                    container.next = () => {
                        index++;
                        if ( index >= container.limit() ) {
                            index = 0;
                        }
                        return primes[ index ];
                    };

                    container.limit = () => {
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

                    container.getGenerator = () => {
                        return primeGen;
                    };

                    return container;
                };
                fibonacciGenFactory = () => {
                    let container = Object.create( null );
                    let fib = [ 1, 1 ];
                    let index = -1;

                    container.next = () => {
                        index++;
                        if ( index >= container.limit() ) {
                            index = 0;
                        }
                        while ( index >= fib.length ) {
                            fib.push( fib[ index - 2 ] + fib[ index -1 ] );
                        }
                        return fib[ index ];
                    };

                    container.limit = () => { return 100 };

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

                    container.getGenerator = () => {
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

                    container.getPrimeList = () => {
                        return primeList;
                    };

                    container.getFibonacciList = () => {
                        return fibList;
                    };

                    return container;
                };
            });

            afterEach( () => {
                dolza = null;
                primesGenFactory = null;
                primeFactory = null;
                fibonacciGenFactory = null;
                fibonacciFactory = null;
                fancyFactory = null;
            });

            it( 'will accept arguments `(name, factory, dependencies)`', () => {
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

            it( 'will instantiate each standalone dependency', () => {
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

            it( 'will instantiate each dependency in an acyclic dependency graph', () => {
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

            it( 'will inject each dependency into the factory', () => {
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

            it( 'will return an instantiated object from the factory', () => {
                dolza.register( nameFf, fibonacciFactory, [ nameFgf ] );
                dolza.register( nameFgf, fibonacciGenFactory );
                let dolzaFibs = dolza.get( nameFf );
                expect( dolzaFibs ).to.exist();
            });

            it( 'will throw an error if an unnamed factory is requested', () => {
                let noName = 'hunter';
                dolza.register( nameFf, fibonacciFactory, [ nameFgf ] );
                dolza.register( nameFgf, fibonacciGenFactory );
                let dolzaFibs = dolza.get( nameFf );
                expect( dolzaFibs ).to.exist();
                expect( () => { dolza.get( noName ) } ).to.throw( ReferenceError );
            });

            it( 'will throw an error if `name` or `factory` is falsy', () => {
                let factory = primesGenFactory
                    , name = 'prime-factory'
                    , dep = [ 'prime-generator-factory' ]
                    ;

                expect( () => { dolza.register( '', factory, dep ) } ).to.throw( ReferenceError );
                expect( () => { dolza.register( undefined, factory, dep ) } ).to.throw( ReferenceError );
                expect( () => { dolza.register( null, factory, dep ) } ).to.throw( ReferenceError );
                expect( () => { dolza.register( 0, factory, dep ) } ).to.throw( ReferenceError );
                expect( () => { dolza.register( NaN, factory, dep ) } ).to.throw( ReferenceError );
                expect( () => { dolza.register( name, '', dep ) } ).to.throw( ReferenceError );
                expect( () => { dolza.register( name, undefined, dep ) } ).to.throw( ReferenceError );
                expect( () => { dolza.register( name, null, dep ) } ).to.throw( ReferenceError );
                expect( () => { dolza.register( name, 0, dep ) } ).to.throw( ReferenceError );
                expect( () => { dolza.register( name, NaN, dep ) } ).to.throw( ReferenceError );
            });

            it( 'will throw an error if `dependencies` is not an Array', () => {
                let factory = primesGenFactory
                    , name = 'prime-factory'
                    , dep = [ 'prime-generator-factory' ]
                    ;

                // Falsy values are fine, but they are treated as the 2-arg form
                expect( () => { dolza.register( name, factory, 0) } ).to.not.throw( ReferenceError );
                expect( () => { dolza.register( name, factory, null) } ).to.not.throw( ReferenceError );
                expect( () => { dolza.register( name, factory, '') } ).to.not.throw( ReferenceError );
                expect( () => { dolza.register( name, factory, NaN) } ).to.not.throw( ReferenceError );

                // Truthy, non-array values throw an error
                expect( () => { dolza.register( name, factory, 'prime-generator-factory' ) } )
                    .to.throw( ReferenceError );
                expect( () => { dolza.register( name, factory, 1 ) } ).to.throw( ReferenceError );
                expect( () => { dolza.register( name, factory, () => { return 0; } ) } )
                    .to.throw( ReferenceError );
                expect( () => { dolza.register( name, factory, { dep: name } ) } )
                    .to.throw( ReferenceError );
            });

            it( 'will throw an error if `name` is already registered', () => {
                let name = 'myFactory';
                dolza.register( name, fibonacciFactory, [ 'fib-gen' ] );
                expect( () => {
                    dolza.register( name, fancyFactory, [ 'fib-gen', 'prime-gen' ] );
                }).to.throw( Error );
            });

        });
    });

    context( 'when storing data, an object, or a function, ', () => {
        let nameF = 'myfunc'
            , myFunction
            ;

        beforeEach( () => {
            dolza = dolzaFactory();
            myFunction = ( a, b ) => {
                return a + b;
            }
        });

        afterEach( () => {
            dolza = null;
            myFunction = null;
        });

        it( 'will accept arguments `(name, data)`', () => {
            sinon.spy( dolza, 'store' );
            dolza.store( nameF, myFunction );
            expect( dolza.store ).to.be.calledOnce();
            expect( dolza.store ).to.be.calledWithExactly( nameF, myFunction );
        });

        it( 'will return the stored data', () => {
            dolza.store( nameF, myFunction );
            expect( dolza.get( nameF ) ).to.equal( myFunction );
        });

        it( 'will throw an error if unnamed data is requested', () => {
            let noName = 'hunter';
            dolza.register( nameF, myFunction );
            expect( () => { dolza.get( noName ) } ).to.throw( ReferenceError );
        });

        it( 'will throw an error if `name` or `data` is falsy', () => {
            expect( () => { dolza.store( '', myFunction ) } ).to.throw( ReferenceError );
            expect( () => { dolza.store( undefined, myFunction ) } ).to.throw( ReferenceError );
            expect( () => { dolza.store( null, myFunction ) } ).to.throw( ReferenceError );
            expect( () => { dolza.store( 0, myFunction ) } ).to.throw( ReferenceError );
            expect( () => { dolza.store( NaN, myFunction ) } ).to.throw( ReferenceError );
            expect( () => { dolza.store( nameF, '' ) } ).to.throw( ReferenceError );
            expect( () => { dolza.store( nameF, undefined ) } ).to.throw( ReferenceError );
            expect( () => { dolza.store( nameF, null ) } ).to.throw( ReferenceError );
            expect( () => { dolza.store( nameF, 0 ) } ).to.throw( ReferenceError );
            expect( () => { dolza.store( nameF, NaN ) } ).to.throw( ReferenceError );
        });

        it( 'will update the stored data if `name` is already registered', () => {
            let myData = [ 0, 1, 2, 3, 4, 5 ];
            dolza.store( nameF, myFunction );
            dolza.store( nameF, myData );
            expect( dolza.get( nameF ) ).to.equal( myData );
        });
    });

});
