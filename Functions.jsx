var Functions = (function() {

	var $contextualized = new Symbol(),
		$lazyBound = new Symbol(),
		$consolidated = new Symbol(),
		$lazySpreed = new Symbol(); // We use "spreed" for past-tense, since there isn't an existing distinguishable term.

	return methods(

		Function,

		// Constructor methods
		{

			echo: function(X) {
				return function() { return X; };
			}

		},

		// Instance methods
		{

			defer: (function() {
				// We use process.nextTick (Node) or the window.postMessage (Browser) hack when available for a closer
				// "next tick" approximation. We fall back to setTimeout otherwise. Note that none of these are defined
				// as part of the ES5 spec (and probably won't be defined in ES6). defer is not possible with pure ES.

				var nextTick;

				if (typeof process == 'object' && typeof process.nextTick == 'function')
					nextTick = process.nextTick;
				else if (typeof window == 'object'
					&& typeof window.postMessage == 'function'
					&& typeof window.addEventListener == 'function')
					nextTick = (function() {

						var messageId = '!nextTick:' + Math.random() + ',' + Math.random(),
							fs = [ ],
							pending = false

							// Let's copy the state of this function now, just in case it's modified, we should have
							// the copy that existed when we tested for its existence.
							postMessage = window.postMessage;

						window.addEventListener('message', handleMessage, true);

						return function nextTick(f) {
							fs.push(f);
							if (!pending) {
								pending = true;
								postMessage(messageId, '*');
							}
						};

						function handleMessage(v) {
							var f;
							if (v.source == window && v.data == messageId) {
								pending = false;
								v.stopPropagation();
								while (f = fs.shift())
									try {
										f();
									} catch(x) {
										// Ignore any errors and continue to the next function.
									}
							}
						}

					})();
				else if (typeof window == 'object' && typeof window.setTimeout == 'function')
					nextTick = function(f) {
						setTimeout(f, 0);
					};
				else
					nextTick = function() {
						throw new Error(
							'This environment doesn\'t support a known concurrency implementation.'
							+ 'Cannot call defer.'
						);
					};

				return function defer(context/*, arg1, arg2, ... */) {

					var f = this,
						args = Arrays.slice(arguments, 2);

					if (typeof f != 'function')
						throw new TypeError('defer cannot be called a non-function: ' + f);

					nextTick(function() {
						f.apply(context, args);
					});

					/* Currently no promise is returned due to performance considerations.
					 * defer is considered a pretty low-level function and will probably be used frequently.
					 */

				}
			})(),

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

			preload: function preload(/* ...args */) {
				// Similar to bind, but doesn't accept a context.

				var f = this;
					preArgs = arguments;

				if (typeof f != 'function')
					throw new TypeError('preload cannot be called on a non-function: ' + f);

				return Functions.createWrapper(f, f.length - preArgs.length, function preloadedFunction() {
					return f.apply(this, Arrays.concat(preArgs, arguments));
				});

			},

			postload: function postload(/* ...args */) {
				// Similar to bind, but doesn't accept a context, and appends specified
				// arguments, rather than prepending them.

				var f = this,
					postArgs = arguments;

				if (typeof f != 'function')
					throw new TypeError('postload cannot be called on a non-function: ' + f);

				return Functions.createWrapper(f, f.length - postArgs.length, function postloadedFunction() {
					return f.apply(this, Arrays.concat(arguments, postArgs));
				});

			},

			load: function load(/* ...args */) {
				// Same as preload and postload, except doesn't allow additional arguments to be passed in.
				// Creates a function which always calls another function with the same arguments.

				var f = this,
					args = arguments;

				if (typeof f != 'function')
					throw new TypeError('load cannot be called on a non-function: ' + f);

				return Functions.createWrapper(f, 0, function loadedFunction() {
					return f.apply(this, args);
				});


			},

			limit: function limit(max) {
				// max can be a number or a function which returns true or false.
				// As a function, the number of times the function has been called will be passed
				// in the first argument to the max function.
				// max defaults to 1.

				var f = this,
					count = 0,
					isFunction = typeof max == 'function';

				if (typeof f != 'function')
					throw new TypeError('limit cannot be called on a non-function: ' + f);

				if (max === undefined) max = 1;
				else if (!isFunction) max = max >>> 0;

				return Functions.createWrapper(f, function limitedFunction() {
					if (isFunction ? max(count) : (count >= max)) return;
					count++;
					return f.apply(this, arguments);
				});

			},

			throttle: function throttle(/* [args], [interval], [immediate] */) {

				var f = this;

				if (typeof f != 'function')
					throw new TypeError('throttle cannot be called on a non-function: ' + f);

				var args = Arrays.persuade(arguments, [ 'array', 'number|function', 'boolean' ]),
					callArgs = args[1], interval = args[2], immediate = args[3];

				return createChoke(f, callArgs, interval, false, immediate);

			},

			debounce: function debounce(/* [args], [interval], [immediate] */) {

				var f = this;

				if (typeof f != 'function')
					throw new TypeError('debounce cannot be called on a non-function: ' + f);

				var args = Arrays.persuade(arguments, [ 'array', 'number|function', 'boolean' ]),
					callArgs = args[1], interval = args[2], immediate = args[3];

				return createChoke(f, callArgs, interval, false, immediate);

			},

			repeat: function(count, start) {

				var f = this,
					ret = start;

				if (typeof f != 'function')
					throw new TypeError('repeat cannot be called on a non-function: ' + f);

				for (var i = 0; i < count; i++) {
					ret = f(ret);
				}

				return ret;

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

	function createChoke(f, preArgs, interval, debounce, immediate) {
		var context = this, args, immediateCalled, tm, endTime;
		if (interval == undefined) interval = 50;
		return Functions.createWrapper(f, f.length - preArgs.length, function chokedWrapper() {
			var time = new Date().getTime(),
				nInterval = typeof interval == 'function' ? interval() : interval;
			args = Lists.concat(preArgs, arguments);
			if (immediate && !immediateCalled) {
				f.apply(context, args);
				immediateCalled = true;
			}
			if (debounce && tm != null
				|| time + nInterval < endTime) {
				clearTimeout(tm);
				tm = null;
			}
			if (tm == null) {
				tm = setTimeout(function() {
					if (!immediate || !immediateCalled) f.apply(context, args);
					tm = null;
				}, nInterval);
				endTime = time + nInterval;
			}
		});
	}

})();