// See comments in `./index.js`

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

describe( 'Dolza', () => {
    let config, delay;

    beforeEach( () => {
        dolza = dolzaFactory();

        config = {
            episode: 'IV',
            title: 'A New Hope',
            protagonist: {
                name: 'Luke',
                home: 'Tatooine'
            }
        };

        delay = () => {
            let delay = Object.create( null );
            console.log( '/// Running delay factory' );

            delay.foo = sinon.stub();

            delay.reset = () => {
                //reset all stubs
                delay.foo.reset();
            };

            return delay;
        };

        dolza.store( 'config', config );
        dolza.register( 'delay', delay );

    });

    it( 'will wait for a dependency to be instantiated before injecting it', () => {
        let appFactory = ( appConfig, appDelay ) => {
            let app = Object.create( null );
            if ( !appDelay ) {
                throw new Error( '+++ Delay is falsy' );
            }

            app.getEpisode = () => {
                return appConfig.episode;
            };

            app.getTitle = () => {
                return appConfig.title;
            };
        };
        dolza.register( 'app', appFactory );

        let app;
        expect( () => { app = dolza.get( 'app' ); } ).to.not.throw( Error );
    });
});
