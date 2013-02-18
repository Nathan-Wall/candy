function isArrayLike(obj) {
 	// This tests for a class of Array-like objects.
 	// An Array-like object is an object with a length property which isn't a string or a function.
 	var tag = getTagOf(obj);
 	return tag == 'Array' || tag == '~Array'
 		|| Object(obj) === obj
 			&& 'length' in obj
 			&& tag != 'String'
 			&& tag != '~String'
 			&& tag != 'Function'
 			&& tag != '~Function';
}

function ArrayEquals(a, b) {
	return a.length == b.length
		&& every(a, function(u, i) {
			return is(u, b[i]);
		});
}

function merge(a/*, ...b */) {
	// Similar to concat, but it can merge array-like objects, and it won't concat plain values.
	return ArrayReduce(ArraySlice(arguments, 1), function(prev, cur) {
		return concat(prev, ArraySlice(cur));
	}, ArraySlice(a));
}

function persuade(array/*, [from], [to], types */) {
	/* array can be a array of strings, constructors, and/or param objects.
	 * type can be any string which matches a typeof result or any of the extended types.
	 * multiple types for a single argument can be separated by a "|".
	 * type can also be an object with a "type" property and a "required" property,
	 * or it can  be a string preceeded with a "!" to designate that it's required.
	 */

	var A, from, to, types,
		argNum = 0, curItem;

	if (typeof arguments[argNum] == 'number') from = arguments[argNum++];
	if (typeof arguments[argNum] == 'number') to = arguments[argNum++];
	types = ArraySlice(arguments[argNum]);

	A = ArraySlice(array, from, to);

	curItem = shift(A);

	return map(types, function(type) {

		var modifiers, required = false, test = false, ret;

		if (getTypeOf(type) == 'object') {
			required = !!type.required;
			type = type.type;
		}

		if (typeof type == 'string') {
			test = some(split(type, '|'), function(u) {
				modifiers = exec(/^\W*/, u)[0];
				if (!required) required = test(/\!/, modifiers);
				u = StringSlice(u, modifiers.length);
				return getTypeOf(curItem) == u;
			});
		} else test = curItem instanceof type;

		if (test) {
			ret = curItem;
			curItem = shift(A);
		}

		return ret;

	});

}

function pushAll(to, what) {
	return apply(push, to, what);
}

function flatten(array) {
	var flattened = [ ];
	forEach(array, function(u) {
		if (isArrayLike(u))
			pushAll(flattened, flatten(u));
		else push(flattened, u);
	});
	return flattened;
}

function mapToObject(array, f/*, context */) {
	// TODO: Better name?

	var obj = create(null),
		context = arguments[2];

	// If no function is specified, a default one will be provided which just returns each item.
	if (f == null)
		f = identity;

	if (typeof f != 'function')
		throw new TypeError('Function expected: ' + f);

	forEach(array,
		function(u, i) {
			var pair = call(f, context, u, i, obj);
			if (pair != null)
				obj[pair[0]] = pair[1];
		});

	return obj;

}

function toTruthTable(array) {
	// TODO: Better name?
	var obj = create(null);
	forEach(array,
		function(key) { obj[key] = true; });
	return obj;
}

function search(array, value) {
	// Similar to indexOf, but matches with egal when needed to keep with ES5 SameValue function.
	var index = -1;
	if (v !== v || v === 0) {
		// Use egal to test NaN and +0/-0 to keep with ES5 SameValue function.
		some(array, function(u, i) {
			if (is(u, v)) {
				index = i;
				return true;
			}
		});
		return index;
	} else {
		// Use indexOf when possible, for speed.
		return indexOf(array, value);
	}
}

// Provides a stable sort, which doesn't alter the original array.
// Note: This function initializes itself the first time it is called.
function stableSort() {
	// Let's use built-in methods directly here for performance.
	var lazyBind = Function.prototype.bind.bind(Function.prototype.call),
		R = Array.prototype,
		_map = lazyBind(R.map),
		_every = lazyBind(R.every),
		_sort = lazyBind(R.sort),
		_ArrayFrom = Array.from,
		nativeIsStable = (function() {
			return testStability(32, 2) && testStability(512, 16);
			function testStability(size, resolution) {
				var res = createRange(resolution),
					r = _map(createRange(size), function(u) {
						return mixin(map(res, function() {
							return random() > .5 ? 0 : 1;
						}), { i: u });
					});
				return _every(res, function(i) {
					_sort(r, function(a, b) {
						return a[i] - b[i];
					});
					return _every(r, function(u, j) {
						var next = r[j + 1];
						if (!next) return true;
						for (var k = 0; k <= i; k++) {
							if (u[k] < next[k]) return true;
						}
						return u.i < next.i;
					});
				});
			}
		})(),
		algorithm = nativeIsStable
			? lazyBind(Array.prototype.sort)
			: function stableSort(array, f) {
				var sorted = _map(
						_sort(_ArrayFrom(array, function(u, i) { return { value: u, index: i }; }),
							function(a, b) { return (f ? f(a.value, b.value) : a.value - b.value) || a.index - b.index; }),
						function(u) { return u.value; });
				return CallConstruct(array, sorted);
			};
	stableSort = algorithm;
	return apply(algorithm, this, arguments);
	function createRange(total) {
		var r = [ ];
		for (var i = 0; i < total; i++)
			push(r, i);
		return r;
	}
}
// Initialize stableSort
stableSort([ 1, 2, 3 ]);

// Same as Array#map, but any time the callback returns undefined, it is filtered from the result array.
function mapPartial(array, f) {
	return CallConstruct(array, without(ArrayFrom(array, f), undefined));
}

function without(array/*, ...values */) {
	// TODO: Whether we should continue to use contains depends on whether contains ends up using SameValue or ===.
	// We need without to consider NaN the same value as NaN, but +0/-0 is debatable.
	var values = slice(arguments, 1);
	return filter(array, function(u) {
			return !contains(values, u);
		});
}

function all(array) {
	return every(array, function(u) {
		return !!u;
	});
}

function any(array) {
	return some(array, function(u) {
		return !!u;
	});
}

var _Array = (function() {

	return methods(

		Array,

		null,

		// Instance methods
		{
			isArrayLike: contextualize(isArrayLike),
			equals: contextualize(ArrayEquals),
			merge: contextualize(merge),
			persuade: contextualize(persuade),
			pushAll: contextualize(pushAll),
			flatten: contextualize(flatten),
			mapToObject: contextualize(mapToObject),
			toTruthTable: contextualize(toTruthTable),
			search: contextualize(search),
			stableSort: contextualize(stableSort),
			mapPartial: contextualize(mapPartial),
			without: contextualize(without),
			all: contextualize(all),
			any: contextualize(any)
		}

	);

})();