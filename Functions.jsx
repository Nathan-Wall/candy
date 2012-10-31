var Functions = (function() {

	var $contextualized = new Symbol(),
		$lazyBound = new Symbol(),
		$consolidated = new Symbol(),
		$lazySpreed = new Symbol();

	return methods(

		Function,

		null,

		// Instance methods
		{

			lazyBind: function lazyBind(/* ...preArgs */) {

				var f = this,
					preArgs = Arrays.slice(arguments),
					lazyBound;

				if (typeof f != 'function')
					throw new TypeError('lazyBind cannot be called on a non-function: ' + f);

				lazyBound = f[$lazyBound];
				if (lazyBound) return lazyBound;

				lazyBound = Functions.createWrapper(this, this.length + 1 - preArgs.length,
					function lazyBound(context) {
						return f.apply(context, preArgs.concat(Arrays.slice(arguments, 1)));
					}
				);

				lazyBound[$contextualized] = f;
				f[$lazyBound] = lazyBound;

				return lazyBound;

			},

			contextualize: function contextualize(/* ...preArgs */) {
				// The opposite of lazyBind, this function returns a wrapper which calls f, passing the wrapper's context as
				// the first argument to f.

				var f = this,
					contextualized;

				if (typeof f != 'function')
					throw new TypeError('Function expected: ' + f);

				contextualized = f[$contextualized];
				if (contextualized) return contextualized;

				var tiedF = Functions.lazyTie(f),
					preArgs = Functions.slice(arguments, 1);

				contextualized = Functions.createWrapper(f, f.length - 1 - preArgs.length,
					function contextualizedMethod() {
						return tiedF(null, [ this ].concat(preArgs, Arrays.slice(arguments)));
					}
				);

				contextualized[$lazyBound] = f;
				f[$contextualized] = contextualized;

				return contextualized;

			},

			spread: function spread(arrayLike) {

				var f = this;

				if (typeof f != 'function')
					throw new TypeError('Function expected: ' + f);

				if (!Arrays.isArrayLike(arrayLike))
					throw new TypeError('Argument is not array-like: ' + arrayLike);

				return f.apply(null, arrayLike);

			},

			lazySpread: function lazySpread(/* preArgs */) {

				var f = this,
					preArgs = typeof arguments[1] != 'undefined' ? arguments[1] : [ ],
					lazySpreed;

				if (typeof f != 'function')
					throw new TypeError('Function expected: ' + f);

				if (!Arrays.isArrayLike(preArgs))
					throw new TypeError('preArgs argument must be an array-like object: ' + preArgs);

				lazySpreed = Functions.createWrapper(f, 1, function lazySpreed(arrayLike) {

					if (!Arrays.isArrayLike(arrayLike))
						throw new TypeError('Argument is not array-like: ' + arrayLike);

					return f.apply(this, Arrays.merge(preArgs, arrayLike));

				});

				lazySpreed[$consolidated] = f;
				f[$lazySpreed] = lazySpreed;

				return lazySpreed;

			},

			lazyTie: Functions.lazyBind(Functions.lazySpread),

			invert: function invert(/* length */) {

				var f = this,
					length = arguments[1],
					args = [ f ];

				if (typeof f != 'function')
					throw new TypeError('Function expected: ' + f);

				if (typeof length != 'undefined')
					args.push(length);

				args.push(function inverted() {
					var args;
					if (length !== undefined) {
						args = slice(arguments, 0, length);
						args.length = length;
					} else {
						args = slice(arguments);
					}
					return f.apply(null, args.reverse());
				});

				return Functions.createWrapper.apply(null, args);

			},

			// Creates a wrapper function with the same length as the original.
			createWrapper: (function() {

				// Let's memoize wrapper generators to avoid using eval too often.
				var generators = { },

					numGenerators = 0,

					// Let's limit length to 512 for now. If someone wants to up it, they can.
					MAX_WRAPPER_LENGTH = 512,

					// Limit the number of generators which are cached to preserve memory in the unusual case that
					// someone creates many generators. We don't go to lengths to make the cache drop old, unused
					// values as there really shouldn't be a need for so many generators in the first place.
					MAX_CACHED_GENERATORS = 64;

				return function createWrapper(/* length, wrapF */$0, $1) {

					var original = this,
						length = typeof arguments[1] != 'undefined' ? arguments[0] : original.length,
						wrapF = typeof arguments[1] != 'undefined' ? arguments[1] : arguments[0],

						args = [ ],
						generator = generators[length];

					if (typeof original != 'function')
						throw new TypeError('Function expected: ' + original);

					if (length < 0) length = 0;
					length = length >>> 0;
					if (length > MAX_WRAPPER_LENGTH)
						throw new Error('Maximum length allowed is ' + MAX_WRAPPER_LENGTH + ': ' + length);

					if (typeof wrapF != 'function')
						throw new TypeError('Function expected: ' + wrapF);

					if (!generator) {

						for (var i = 0; i < length; i++)
							args.push('$' + i);

						generator = eval(
							'(function(wrapF, original) {'
								+ 'var wrapper = function ' + original.name + '(' + args.join(',') + ') {'
									+ 'return wrapF.apply(this, arguments);'
								+ '};'
								+ 'wrapper.original = original;'
								+ 'return wrapper;'
							+ '})'
						);

						if (numGenerators < MAX_CACHED_GENERATORS) {
							generators[length] = generator;
							numGenerators++;
						}

					}

					return generator(wrapF, original);

				};

			})()

		}
	);

})();