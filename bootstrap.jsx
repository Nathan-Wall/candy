var $Candy = createSecret(),
	$Function = createSecret(),
	$Iterable = createSecret(),

 	// `eval` is reserved in strict mode.
 	// Also, we want to use indirect eval so that implementations can take advantage
 	// of memory & performance enhancements which are possible without direct eval.
	_eval = eval,

	// An internal-use-only lazyBind for improved performance. Note: Do not use this function to lazyBind
	// functions which will be exposed externally, as it won't set the `length` of the lazyBound function
	// correctly. Instead use regular `lazyBind` (without the underscore prefix).
	_lazyBind = Function.prototype.bind.bind(Function.prototype.call),

	// The following are for internal use. They're needed to get lazyBind off the ground.
	_apply = _lazyBind(Function.prototype.apply),
	_ArraySlice = _lazyBind(Array.prototype.slice),
	_concat = _lazyBind(Array.prototype.concat),
	_push = _lazyBind(Array.prototype.push),
	_join = _lazyBind(Array.prototype.join),
	_replace = _lazyBind(String.prototype.replace),
	_forEach = _lazyBind(Array.prototype.forEach),
	_filter = _lazyBind(Array.prototype.filter),
	_map = _lazyBind(Array.prototype.map),

	protoIsMutable = (function() {
		// TODO: Keep up-to-date with whether ES6 goes with __proto__ or Reflect.setPrototypeOf.
		var A = Object.create(null),
			A2 = Object.create(null),
			B = Object.create(A);
		B.__proto__ = A2;
		return Object.getPrototypeOf(B) === A2;
	})(),

	// TODO: Use _lazyBind when possible.
	is = Object.is,
	create = Object.create,
	getPrototypeOf = Object.getPrototypeOf,
	isPrototypeOf = _lazyBind(Object.prototype.isPrototypeOf),
	ToString = _lazyBind(Object.prototype.toString),
	keys = Object.keys,
	getOwnPropertyNames = Object.getOwnPropertyNames,
	_getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor,
	_defineProperty = Object.defineProperty,
	isExtensible = Object.isExtensible,

	has = Reflect.has,
	hasOwn = Reflect.hasOwn,

	call = _lazyBind(Function.prototype.call),
	apply = _lazyBind(Function.prototype.apply),

	isArray = Array.isArray,
	ArraySlice = _lazyBind(Array.prototype.slice),
	concat = _lazyBind(Array.prototype.concat),
	// TODO: Many of these are duplicated in the underscore functions above (like _forEach). Remove this redundancy.
	ArrayForEach = _lazyBind(Array.prototype.forEach),
	ArraySome = _lazyBind(Array.prototype.some),
	ArrayEvery = _lazyBind(Array.prototype.every),
	ArrayReduce = _lazyBind(Array.prototype.reduce),
	join = _lazyBind(Array.prototype.join),
	push = _lazyBind(Array.prototype.push),
	pop = _lazyBind(Array.prototype.pop),
	shift = _lazyBind(Array.prototype.shift),
	unshift = _lazyBind(Array.prototype.unshift),
	sort = _lazyBind(Array.prototype.sort),
	contains = _lazyBind(Array.prototype.contains),
	reverse = _lazyBind(Array.prototype.reverse),
	ArrayIterator = _lazyBind($$(Array.prototype, 'iterator')),

	StringSlice = _lazyBind(String.prototype.slice),
	split = _lazyBind(String.prototype.split),
	replace = _lazyBind(String.prototype.replace),

	random = Math.random,

	WeakMapGet = _lazyBind(WeakMap.prototype.get),
	WeakMapSet = _lazyBind(WeakMap.prototype.set),

	// TODO: has might change to contains in upcoming draft
	SetContains = _lazyBind(Set.prototype.has),

	_setTimeout = typeof setTimeout == 'function' ? setTimeout : undefined,
	_clearTimeout = typeof clearTimeout == 'function' ? clearTimeout : undefined;

function slice(obj/*, from, to */) {
	var tag = getTagOf(obj);
	return apply(tag == 'String' || tag == '~String' ? StringSlice : ArraySlice, null, arguments);
}

function methods(builtIn, staticO, instance) {

	var O = create(null),
		instanceMethods = create(null);

	defineProperty(O, 'instance', {

		value: instanceMethods,

		enumerable: false,
		writable: true,
		configurable: true

	});

	// Lazy Bind builtIn.prototype methods and instance methods
	forEach([ builtIn && builtIn.prototype, instance ], function(obj) {

		if (!obj) return;

		forEach(getOwnPropertyNames(obj), function(name) {

			if (name == 'constructor') return;

			var desc = _getOwnPropertyDescriptor(obj, name),
				method = desc && desc.value;

			if (typeof method == 'function') {

				defineProperty(O, name, {

					value: lazyBind(method),

					enumerable: false,
					writable: true,
					configurable: true

				});

				defineProperty(instanceMethods, name, {

 					value: method,

					enumerable: false,
					writable: true,
					configurable: true

				});

			}

		});

	});

	if (staticO != null)
		forEach(keys(staticO), function(name) {

			if (name == 'constructor') return;

			var desc = _getOwnPropertyDescriptor(staticO, name),
				method = desc && desc.value;

			if (typeof method == 'function')
				defineProperty(O, name, {

					value: method,

					enumerable: false,
					writable: true,
					configurable: true

				});

		});

	return O;

}

function CallConstruct(withObj, onObj) {
	var construct = withObj.construct || $Candy(withObj).construct,
		constructed;
	if (typeof construct == 'function') {
		constructed = call(construct, onObj);
		if (constructed != null && typeof constructed == 'object')
			onObj = constructed;
	}
	return onObj;
}

function safeDescriptor(obj) {
	if (obj == null)
		throw new TypeError('Argument cannot be null or undefined.');
	obj = Object(obj);
	var O = create(null),
		k = keys(obj);
	for (var i = 0, key = k[i]; key = k[i], i < k.length; i++)
		O[key] = obj[key];
	return O;
}