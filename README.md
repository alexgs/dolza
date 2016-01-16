# Dolza

Dolza is a lightweight dependency injection container for JavaScript and Node.js, based on Chapter 5 of _Node.js Design Patterns_ by Mario Casciaro (ISBN 9781783287314).

## Basic Usage

First, create some factories:

```js
let f1 = () => {
	let product = Object.create( null );

	// Define some methods for `product`

	return product;
}

let f2 = ( fac ) => {
	let product = Object.create( null );

	// Define some methods for `product` using `fac`

	return product;
}
```

Register the factories with Dolza:

```js

let dolza = require( 'dolza' );
dolza.register( 'f1', f1 );             // no dependencies
dolza.register( 'f2', f2, [ 'f1' ] );    // f2 depends on f1

```

Then ask Dolza for what you need. It will instantiate dependencies as needed and return the product of the factory.

```js
let f2product = dolza.get( 'f2' );
```

Dolza can also store things that aren't factories. Just use `store` instead of `register`.

```js
dolza.store( 'a1', [ 0, 1, 2, 3, 4 ] );
dolza.store( 'o2', { name: 'Weaver', rank: 'Colonel' } );
let myArray = dolza.get( 'a1' );
let fighter = dolza.get( 'o1' );
```

Key usage points:

+ The third argument to `register` (which is optional) **MUST** be an array, even if it only has one element.
+ Dependencies are passed to the factory in the same order that they appear in the array.
+ Dependencies aren't limited to factories. Data that passed to `store` can also be used as a dependency.
+ The order in which factories are `register`ed doesn't matter, as long as everything is in the container before `get` is called.

## Installation

Dolza is written in ES6 and uses spread operators. To use with Node.js ( > 5.x), you'll to run your app with the `--es_staging` flag, e.g., `node --es_staging index.js`.

Use in a browser probably requires transpiling or something. I haven't tried it yet.

## Yet Another DI Framework?

NPM is lousy with DI frameworks, some of which cause me a great deal of confusion and befuddlement. I wanted something lightweight and easy (for me) to grok. I also wanted a container that didn't require any changes to factories or modules and that would play well with minification.

Building a DI container also looked like a fun and interesting challenge. And it was!
