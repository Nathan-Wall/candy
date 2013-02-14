var is = Object.is,
	create = Object.create,
	getPrototypeOf = Object.getPrototypeOf,
	isPrototypeOf = lazyBind(Object.prototype.isPrototypeOf),
	ToString = lazyBind(Object.prototype.toString),
	keys = Object.keys,
	getOwnPropretyNames = Object.getOwnPropretyNames,
	_getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor,
	_defineProperty = Object.defineProperty,
	isExtensible = Object.isExtensible,

	has = Reflect.has,
	hasOwn = Reflect.hasOwn,

	call = lazyBind(Function.prototype.call),
	apply = lazyBind(Function.prototype.apply),

	isArray = Array.isArray,
	ArraySlice = lazyBind(Array.prototype.slice),
	concat = lazyBind(Array.prototype.concat),
	ArrayForEach = lazyBind(Array.prototype.forEach),
	ArraySome = lazyBind(Array.prototype.some),
	ArrayEvery = lazyBind(Array.prototype.every),
	ArrayReduce = lazyBind(Array.prototype.reduce),
	join = lazyBind(Array.prototype.join),
	split = lazyBind(Array.prototype.split),
	push = lazyBind(Array.prototype.push),
	pop = lazyBind(Array.prototype.pop),
	shift = lazyBind(Array.prototype.shift),
	unshift = lazyBind(Array.prototype.unshift),
	sort = lazyBind(Array.prototype.sort),
	contains = lazyBind(Array.prototype.contains),
	reverse = lazyBind(Array.prototype.reverse),
	ArrayIterator = lazyBind(Array.prototype[$$iterator]),

	StringSlice = lazyBind(String.prototype.slice),
	split = lazyBind(String.prototype.split),

	random = Math.random,

	hasSymbol = Symbol.__hasSymbol__,
	deleteSymbol = Symbol.__deleteSymbol__,

	WeakMapGet = lazyBind(WeakMap.prototype.get),
	WeakMapSet = lazyBind(WeakMap.prototype.set),

	// TODO: has might change to contains in upcoming draft
	SetContains = lazyBind(Set.prototype.has),

	_setTimeout = typeof setTimeout == 'function' ? setTimeout : undefined,
	_clearTimeout = typeof clearTimeout == 'function' ? clearTimeout : undefined,

	$contextualized = new Symbol(),
	$lazyBound = new Symbol(),
	$consolidated = new Symbol(),
	$lazySpreed = new Symbol(); // We use "spreed" for past-tense, since there isn't an existing distinguishable term.

function slice(obj/*, from, to */) {
	var tag = getTagOf(obj);
	return apply(tag == 'String' || tag == '~String' ? StringSlice : ArraySlice, arguments);
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

			var desc = getOwnPropertyDescriptor(obj, name),
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

			var desc = getOwnPropertyDescriptor(staticO, name)
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