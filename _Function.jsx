function identity(X) {
	return X;
}

function echo(X) {
	return function echoer() { return X; };
}

// Let's memoize wrapper generators to avoid using eval too often.
var wrapGenerators = { },

	numWrapGenerators = 0,

	// Let's limit length to 512 for now. If someone wants to up it, they can.
	MAX_WRAPPER_LENGTH = 512,

	// Limit the number of generators which are cached to preserve memory in the unusual case that
	// someone creates many generators. We don't go to lengths to make the cache drop old, unused
	// values as there really shouldn't be a need for so many generators in the first place.
	MAX_CACHED_GENERATORS = 64;

// Creates a wrapper function with the same length as the original.
function createWrapper(f/*, length = f.length */, wrapF) {

	var original = f,
		length = arguments[2] !== undefined ? arguments[1] : original.length,
		args = [ ],
		generator = wrapGenerators && wrapGenerators[length];
	
	wrapF = arguments[2] !== undefined ? arguments[2] : arguments[1];

	if (typeof original != 'function')
		throw new TypeError('Function expected: ' + original);

	if (length < 0) //length = 0;
		// Let's throw an error temporarily, although long-term it may be better to >>> 0 like other ES functions.
		// TODO: Remove RangeError and put in something more temporary (either length = 0 or just let length >>>= 0)
		throw new RangeError('length cannot be less than 0.');

	length >>>= 0;
	if (length > MAX_WRAPPER_LENGTH)
		throw new Error('Maximum length allowed is ' + MAX_WRAPPER_LENGTH + ': ' + length);

	if (typeof wrapF != 'function')
		throw new TypeError('Function expected: ' + wrapF);

	if (!generator) {

		for (var i = 0; i < length; i++)
			_push(args, '$' + i);

			generator = _eval(
				'(function(wrapF, original, name, apply, _eval) {'
					+ '"use strict";'
					+ 'var wrapper = _eval("(function(wrapF, original, name, apply) {'
						+ 'return (function " + name + "_(' + _join(args, ',') + ') {'
							+ 'return apply(wrapF, this, arguments);'
						+ '});'
					+ '})");'
					+ 'wrapper.original = original;'
					+ 'return wrapper(wrapF, original, name, apply);'
				+ '})'
			);

		if (numWrapGenerators < MAX_CACHED_GENERATORS) {
			wrapGenerators[length] = generator;
			numWrapGenerators++;
		}

	}

	return generator(wrapF, original, _replace(original.name, /\W/g, '_'), _apply, _eval);

}

var defer = (function() {
	// We use process.nextTick (Node) or the window.postMessage (Browser) hack when available for a closer
	// "next tick" approximation. We fall back to setTimeout otherwise. Note that none of these are defined
	// as part of the ES5 spec (and probably won't be defined in ES6). defer is not possible with pure ES.

	var nextTick,
		_setImmediate = typeof setImmediate == 'function' ? setImmediate : null,
		_postMessage = typeof postMessage == 'function' ? postMessage : null,
		_addEventListener = typeof window == 'object' && typeof window.addEventListener == 'function'
			? window.addEventListener.bind(window) : null,
		_setTimeout = typeof setTimeout == 'function' ? setTimeout : null;

	if (typeof process == 'object' && typeof process.nextTick == 'function')
		nextTick = process.nextTick;
	else if (_setImmediate)
		nextTick = _setImmediate;
	else if (_postMessage && _addEventListener)
		nextTick = (function() {

			var messageId = '!nextTick:' + random() + ',' + random(),
				fs = [ ],
				pending = false;

			_addEventListener('message', handleMessage, true);

			return function nextTick(f) {
				push(fs, f);
				if (!pending) {
					pending = true;
					_postMessage(messageId, '*');
				}
			};

			function handleMessage(v) {
				// TODO: Should it wait 1 tick between each message? That's probably what the other
				// ways do (e.g. setImmediate/process.nextTick). Is there any testable difference between
				// calling them all immediately or waiting 1 tick between each one?
				var f, error;
				if (v.source == window && v.data == messageId) {
					pending = false;
					if (typeof v.stopPropagation == 'function')
						v.stopPropagation();
					while (f = shift(fs))
						try {
							f();
						} catch(x) {
							// Ignore any errors and continue to the next function.
							if (error === undefined)
								error = x;
						}
					// Rethrow if an error occurred.
					if (error !== undefined)
						throw error;
				}
			}

		})();
	else if (_setTimeout)
		nextTick = function(f) {
			_setTimeout(f, 0);
		};
	else
		nextTick = function() {
			throw new Error(
				'This environment doesn\'t support a known concurrency implementation.'
				+ 'Cannot call defer.'
			);
		};

	return function defer(f) {
		// TODO: context arg? relay args?

		if (typeof f != 'function')
			throw new TypeError('defer cannot be called a non-function: ' + f);

		nextTick(function() {
			apply(f, null);
		});

		/* Currently no promise is returned due to performance considerations.
		 * defer is considered a pretty low-level function and will probably be used frequently.
		 */

	}
})();

function lazyBind(f/*, ...preArgs */) {

	var preArgs = _ArraySlice(arguments, 1),
		lazyBound;

	if (typeof f != 'function')
		throw new TypeError('lazyBind cannot be called on a non-function: ' + f);

	lazyBound = $Function(f).lazyBound;
	if (lazyBound) return lazyBound;

	lazyBound = createWrapper(f, f.length + 1 - preArgs.length,
		function lazyBound(context) {
			return _apply(f, context, _concat(preArgs, _ArraySlice(arguments, 1)));
		}
	);

	$Function(lazyBound).contextualized = f;
	$Function(f).lazyBound = lazyBound;

	return lazyBound;

};

function contextualize(f/*, ...preArgs */) {
	// The opposite of lazyBind, this function returns a wrapper which calls f, passing the wrapper's context as
	// the first argument to f.

	var contextualized;

	if (typeof f != 'function')
		throw new TypeError('Function expected: ' + f);

	contextualized = $Function(f).contextualized;
	if (contextualized) return contextualized;

	var F = lazySpread(f),
		preArgs = ArraySlice(arguments, 1);

	contextualized = createWrapper(f, f.length - 1 - preArgs.length,
		function contextualizedMethod() {
			return F(concat([ this ], preArgs, slice(arguments)));
		}
	);

	$Function(contextualized).lazyBound = f;
	$Function(f).contextualized = contextualized;

	return contextualized;

}

function spread(f, arrayLike) {

	if (typeof f != 'function')
		throw new TypeError('Function expected: ' + f);

	if (!isArrayLike(arrayLike))
		throw new TypeError('Argument is not array-like: ' + arrayLike);

	return apply(f, this, arrayLike);

}

function lazySpread(f/*, preArgs */) {

	var preArgs = arguments[1] !== undefined ? arguments[1] : [ ],
		lazySpreed;

	if (typeof f != 'function')
		throw new TypeError('Function expected: ' + f);

	if (!isArrayLike(preArgs))
		throw new TypeError('preArgs argument must be an array-like object: ' + preArgs);

	lazySpreed = createWrapper(f, 1, function lazySpreed(arrayLike) {

		if (!isArrayLike(arrayLike))
			throw new TypeError('Argument is not array-like: ' + arrayLike);

		return apply(f, this, merge(preArgs, arrayLike));

	});

	$Function(lazySpreed).consolidated = f;
	$Function(f).lazySpreed = lazySpreed;

	return lazySpreed;

}

 function lazyTie(f/*, preArgs */) {

	var preArgs = arguments[1] !== undefined ? arguments[1] : [ ],
		lazySpreed;

	if (typeof f != 'function')
		throw new TypeError('Function expected: ' + f);

	if (!isArrayLike(preArgs))
		throw new TypeError('preArgs argument must be an array-like object: ' + preArgs);

	return lazyBind(lazySpread(f, preArgs));

}

function invert(f/*, length */) {

	var length = arguments[1],
		args = [ f ];

	if (typeof f != 'function')
		throw new TypeError('Function expected: ' + f);

	if (typeof length != 'undefined') {
		length >>>= 0;
		push(args, length);
	}

	push(args, function inverted() {
		var args;
		if (length !== undefined)
			args = slice(arguments, 0, length);
		else
			args = slice(arguments);
		return apply(f, null, reverse(args));
	});

	return spread(createWrapper, args);

}

function preload(f/*, ...args */) {
	// Similar to bind, but doesn't accept a context.

	var preArgs = ArraySlice(arguments, 1);

	if (typeof f != 'function')
		throw new TypeError('preload cannot be called on a non-function: ' + f);

	var L = f.length - preArgs.length;
	if (L < 0) L = 0;

	return createWrapper(f, L, function preloadedFunction() {
		return apply(f, this, merge(preArgs, arguments));
	});

}

function postload(f/*, ...args */) {
	// Similar to bind, but doesn't accept a context, and appends specified
	// arguments, rather than prepending them.

	var postArgs = arguments;

	if (typeof f != 'function')
		throw new TypeError('postload cannot be called on a non-function: ' + f);

	var L = f.length - postArgs.length;
	if (L < 0) L = 0;

	return createWrapper(f, L, function postloadedFunction() {
		return apply(f, this, merge(arguments, postArgs));
	});

}

function load(f/*, ...args */) {
	// Same as preload and postload, except doesn't allow additional arguments to be passed in.
	// Creates a function which always calls another function with the same arguments.

	var args = arguments;

	if (typeof f != 'function')
		throw new TypeError('load cannot be called on a non-function: ' + f);

	return createWrapper(f, 0, function loadedFunction() {
		return apply(f, this, args);
	});

}

function limit(f/*, max = 1 */) {
	// max can be a number or a function which returns true or false.
	// As a function, the number of times the function has been called will be passed
	// in the first argument to the max function.
	// max defaults to 1.

	var max = arguments[1],
		count = 0,
		isFunction = typeof max == 'function';

	if (typeof f != 'function')
		throw new TypeError('limit cannot be called on a non-function: ' + f);

	if (max === undefined) max = 1;
	else if (typeof max == 'number') max >>>= 0;
	else if (!isFunction) throw new TypeError('max must be a function or a number.');

	return createWrapper(f, function limitedFunction() {
		if (isFunction ? max(count) : (count >= max)) return;
		count++;
		return apply(f, this, arguments);
	});

}

function throttle(f/*, [arguments], [interval], [immediate], [contextual] */) {

	var args,
		fType = getTypeOf(f),
		F;

	if (fType == 'object') {
		args = [ ];
		if ('arguments' in f) args.push(f.arguments);
		if ('interval' in f) args.push(f.interval);
		if ('immediate' in f) args.push(f.immediate);
		if ('contextual' in f) args.push(f.contextual);
		if (!('function' in f)) throw new Error('function param expected in call to throttle.');
		F = f.function;
		if (typeof F != 'function') throw new TypeError('function param must be a function.');
		return apply(throttle, F, args);
	} else if (fType != 'function')
		throw new TypeError('throttle cannot be called on a non-function: ' + f);

	args = persuade(arguments, [ 'array', 'number|function', 'boolean', 'boolean' ]);
	var callArgs = args[1], interval = args[2], immediate = args[3], contextual = args[4];

	return _createChoke(f, callArgs, interval, false, immediate, contextual);

}

function debounce(f/*, [arguments], [interval], [immediate], [contextual] */) {

	var fType = getTypeOf(f),
		F;

	if (fType == 'object') {
		args = [ ];
		if ('arguments' in f) args.push(f.arguments);
		if ('interval' in f) args.push(f.interval);
		if ('immediate' in f) args.push(f.immediate);
		if ('contextual' in f) args.push(f.contextual);
		if (!('function' in f)) throw new Error('function param expected in call to debounce.');
		F = f.function;
		if (typeof F != 'function') throw new TypeError('function param must be a function.');
		return apply(debounce, F, args);
	} else if (typeof f != 'function')
		throw new TypeError('debounce cannot be called on a non-function: ' + f);

	var args = persuade(arguments, [ 'array', 'number|function', 'boolean', 'boolean' ]),
		callArgs = args[1], interval = args[2], immediate = args[3], contextual = args[4];

	return _createChoke(f, callArgs, interval, false, immediate, contextual);

}

function repeat(f, count/*, start */) {

	var start = arguments[2],
		ret = start;

	if (typeof f != 'function')
		throw new TypeError('repeat cannot be called on a non-function: ' + f);

	for (var i = 0; i < count; i++)
		ret = call(f, this, ret);

	return ret;

}

// contextual determines whether a function should be differentiated as a different call depending on the context
// in which it was called.
// Example:
//		var x = 0, f = debounce({ function: function() { console.log(x++); }, contextual: true }),
//			y = 0, g = debounce({ function: function() { console.log(x++); }, contextual: false }),
//			A = { f: f, g: g },
//			B = { f: f, g: g };
//		A.f(); B.f(); // Logs 1 and 2
//		A.g(); B.g(); // Logs only 1
function _createChoke(f, preArgs, interval, debounce, immediate, contextual) {

	var context = this, args, immediateCalled, tm, endTime, chokeMap;

	if (interval == null)
		interval = 0;

	var L = f.length - preArgs.length;
	if (L < 0) L = 0;

	return createWrapper(f, L,
		contextual
			? function chokedWrapper() {

				if (!chokeMap)
					chokeMap = new WeakMap();

				var F = WeakMapGet(chokeMap, this);

				if (!F)
					WeakMapSet(chokeMap, this, F = _createChoke(f, preArgs, interval, debounce, immediate, false));

				call(F, this, arguments);

			}
			: function chokedWrapper() {

				var time = +new Date(),
					nInterval = typeof interval == 'function' ? interval() : interval;

				nInterval >>>= 0;

				args = merge(preArgs, arguments);

				if (immediate && !immediateCalled) {
					apply(f, context, args);
					immediateCalled = true;
				}

				if (debounce && tm != null
					|| time + nInterval < endTime) {
					_clearTimeout(tm);
					tm = null;
				}

				if (tm == null) {
					tm = _setTimeout(function() {
						if (!immediate || !immediateCalled)
							apply(f, context, args);
						tm = null;
					}, nInterval);
					endTime = time + nInterval;
				}

			}
		);

}

var _Function = (function() {

	return methods(

		Function,

		// Static methods
		{
			identity: identity,
			echo: echo
		},

		// Instance methods
		{
			defer: contextualize(defer),
			lazyBind: contextualize(lazyBind),
			contextualize: contextualize(contextualize),
			spread: contextualize(spread),
			lazySpread: contextualize(lazySpread),
			lazyTie: contextualize(lazyTie),
			invert: contextualize(invert),
			preload: contextualize(preload),
			postload: contextualize(postload),
			load: contextualize(load),
			limit: contextualize(limit),
			throttle: contextualize(throttle),
			debounce: contextualize(debounce),
			repeat: contextualize(repeat),
			createWrapper: contextualize(createWrapper)
		}
	);

})();