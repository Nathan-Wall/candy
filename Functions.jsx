var Functions = (function() {

	var // $contextualized = Defined in bootstrap,
		// $lazyBound = Defined in bootstrap,
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

			lazyBind: lazyBind,

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

			lazyTie: function lazyTie(/* preArgs */) {

				var f = this,
					preArgs = typeof arguments[1] != 'undefined' ? arguments[1] : [ ],
					lazySpreed;

				if (typeof f != 'function')
					throw new TypeError('Function expected: ' + f);

				if (!Arrays.isArrayLike(preArgs))
					throw new TypeError('preArgs argument must be an array-like object: ' + preArgs);

				return Functions.lazyBind(Functions.lazySpread(f, preArgs));

			},

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
					return f.apply(this, Arrays.merge(preArgs, arguments));
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
					return f.apply(this, Arrays.merge(arguments, postArgs));
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

			createWrapper: createWrapper

		}
	);

	function createChoke(f, preArgs, interval, debounce, immediate) {
		var context = this, args, immediateCalled, tm, endTime;
		if (interval == undefined) interval = 50;
		return Functions.createWrapper(f, f.length - preArgs.length, function chokedWrapper() {
			var time = new Date().getTime(),
				nInterval = typeof interval == 'function' ? interval() : interval;
			args = Arrays.merge(preArgs, arguments);
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