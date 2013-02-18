var $Candy = createSecret(),
	$Function = createSecret(),
	$Iterable = createSecret(),

	_eval = eval, // `eval` is reserved in strict mode.

	// The following are for internal use. They're needed to get lazyBind off the ground.
	_apply = Function.prototype.call.bind(Function.prototype.apply),
	_ArraySlice = Function.prototype.call.bind(Array.prototype.slice),
	_concat = Function.prototype.call.bind(Array.prototype.concat),
	_push = Function.prototype.call.bind(Array.prototype.push),
	_join = Function.prototype.call.bind(Array.prototype.join),
	_replace = Function.prototype.call.bind(String.prototype.replace),
	_forEach = Function.prototype.call.bind(Array.prototype.forEach),

	is = Object.is,
	create = Object.create,
	getPrototypeOf = Object.getPrototypeOf,
	isPrototypeOf = lazyBind(Object.prototype.isPrototypeOf),
	ToString = lazyBind(Object.prototype.toString),
	keys = Object.keys,
	getOwnPropertyNames = Object.getOwnPropertyNames,
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
	push = lazyBind(Array.prototype.push),
	pop = lazyBind(Array.prototype.pop),
	shift = lazyBind(Array.prototype.shift),
	unshift = lazyBind(Array.prototype.unshift),
	sort = lazyBind(Array.prototype.sort),
	contains = lazyBind(Array.prototype.contains),
	reverse = lazyBind(Array.prototype.reverse),
	ArrayIterator = lazyBind($$(Array.prototype, 'iterator')),

	StringSlice = lazyBind(String.prototype.slice),
	split = lazyBind(String.prototype.split),
	replace = lazyBind(String.prototype.replace),

	random = Math.random,

	WeakMapGet = lazyBind(WeakMap.prototype.get),
	WeakMapSet = lazyBind(WeakMap.prototype.set),

	// TODO: has might change to contains in upcoming draft
	SetContains = lazyBind(Set.prototype.has),

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

			var desc = getOwnPropertyDescriptor(staticO, name),
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