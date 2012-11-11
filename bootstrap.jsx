function values(map) {

	var ret = { };

	Object.keys(map).forEach(function(name) {

		var value = Object.getOwnPropertyDescriptor(staticO, name).value;

		if (typeof value != 'undefined')
			Object.defineProperty(ret, name, {
				value: value,
				enumerable: false,
				writable: true,
				configurable: true
			});

	});

	return ret;

}

var $contextualized = new Symbol(),
	$lazyBound = new Symbol(),
	lazyBind = (function() {
		var slice = Function.prototype.call.bind(Array.prototype.slice);
		return function lazyBind(/* ...preArgs */) {

			var f = this,
				preArgs = slice(arguments),
				lazyBound;

			if (typeof f != 'function')
				throw new TypeError('lazyBind cannot be called on a non-function: ' + f);

			lazyBound = f[$lazyBound];
			if (lazyBound) return lazyBound;

			lazyBound = createWrapper.call(this, this.length + 1 - preArgs.length,
				function lazyBound(context) {
					return f.apply(context, preArgs.concat(slice(arguments, 1)));
				}
			);

			lazyBound[$contextualized] = f;
			f[$lazyBound] = lazyBound;

			return lazyBound;

		};
	})();

// Creates a wrapper function with the same length as the original.
var createWrapper = (function() {

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
					+ 'var wrapper = eval("(function " + original.name + "_(' + args.join(',') + ') {'
						+ 'return wrapF.apply(this, arguments);'
					+ '});");'
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

})();

function methods(native, staticO, instance) {

	var O = Object.create(null);

	O.instance = Object.create(null);

	// Lazy Bind native.prototype methods and instance methods
	[ native && native.prototype, instance ].forEach(function(obj) {

		if (!obj) return;

		Object.getOwnPropertyNames(obj).forEach(function(name) {

			if (name == 'constructor') return;

			var method = Object.getOwnPropertyDescriptor(obj, name).value;

			if (typeof method == 'function') {

				Object.defineProperty(O, name, {

					value: lazyBind.call(method),

					enumerable: false,
					writable: true,
					configurable: true

				});

				Object.defineProperty(O.instance, name, {

 					value: method,

					enumerable: false,
					writable: true,
					configurable: true

				});

			}

		});

	});

	if (staticO != null)
		Object.keys(staticO).forEach(function(name) {

			if (name == 'constructor') return;

			var method = Object.getOwnPropertyDescriptor(staticO, name).value;

			if (typeof method == 'function')
				Object.defineProperty(O, name, {

					value: method,

					enumerable: false,
					writable: true,
					configurable: true

				});

		});

	return O;

}

function isSameValue(a, b) {
	// egal function. Exposes ES5 SameValue function.
	return a === b && (a !== 0 || 1 / a === 1 / b) // false for +0 vs -0
		|| a !== a && b !== b; // true for NaN vs NaN
}