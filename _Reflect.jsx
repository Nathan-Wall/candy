function isTagged(obj, tag) {
	var proto;
	return tag === getTagOf(obj)
		|| (Object(obj) === obj
			&& (proto = getPrototypeOf(obj))
			&& isTagged(proto, tag));
}

function isLike(obj, tag) {
	var proto,
		objTag = getTagOf(obj).replace(/^~+/, '');
	tag = tag.replace(/^~+/, '');
	return tag == objTag
		// We say that an arguments object is like an array.
		|| tag == 'Array' && objTag == 'Arguments'
		|| (Object(obj) === obj
			&& (proto = getPrototypeOf(obj))
			&& isTagged(proto, tag));
}

function getTypeOf(obj) {
	// Like typeof, except we add "null" and "array" returns.
	// Note that "array" is returned for objects tagged as "~Array", not only true arrays.

	if (obj === null)
		return 'null';

	// We only check isLike for Array it is already an object.
	// We don't check isLike('Boolean') and then return 'boolean' because if it's a
	// Boolean object we still want to return 'object'.
	// We don't check isLike('Function') because something can inherit from Function
	// but not be callable, and we want to maintain that getTypeOf(f) == 'function'
	// ensures that f is callable.
	if (isLike(obj, 'Array'))
		return 'array';

	return typeof obj;

}

function getTagOf(obj) {
	// TODO: Make functions like StringSlice available and secure candy code.
	return StringSlice(ToString(obj, 8, -1));
}

function own(obj) {

	var O = create(null);

	forEach(getOwnPropertyNames(obj), function(key) {
		defineProperty(O, key,
			getOwnPropertyDescriptor(obj, key));
	});

	return O;

}

function getUncommonPropertyNames(from, compareWith) {
	if (Object(from) !== from || Object(compareWith) !== compareWith)
		throw new TypeError('getUncommonPropertyNames called on non-object.');
	var namesMap = create(null);
	return filter(_concatUncommonNames(from, compareWith),
		function(u) {
			if (namesMap[u]) return false;
			return namesMap[u] = true;
		});
};

function _concatUncommonNames(from, compareWith) {
	if (Object(from) != from
		|| from === compareWith
		|| isPrototypeOf(from, compareWith)) return [ ];
	return concat(getOwnPropertyNames(from), 
		_concatUncommonNames(getPrototypeOf(from), compareWith));
}

// We want to make sure that only own properties of the descriptor are returned,
// so that we can't be tricked.
function getOwnPropertyDescriptor(obj) {
	return own(_getOwnPropertyDescriptor(obj));
}

function getPropertyDescriptor(obj, name) {
	var proto;
	if (Object(obj) !== obj)
		throw new TypeError('getPropertyDescriptor called on non-object.');
	if (hasOwn(obj, name))
		return getOwnPropertyDescriptor(obj, name);
	else if (proto = getPrototypeOf(obj))
		return getPropertyDescriptor(proto, name);
}

function _items(obj) {
	var items = [ ];
	forEach(keys(obj), function(key) {
			push(items, [ key, obj[key] ]);
		});
	return items;
}

function _values(obj) {
	var values = [ ];
	forEach(keys(obj), function(key) {
			push(values, obj[key]);
		});
	return values;
}

function ReflectGetItems(obj) {
	var I = obj.items;
	if (typeof I == 'function')
		return call(I, obj);
	return ArrayIterator(_items(obj));
}

function ReflectGetKeys(obj) {
	var K = obj.keys;
	if (typeof K == 'function')
		return call(K, obj);
	return ArrayIterator(keys(obj));
}

function ReflectGetValues(obj) {
	var V = obj.values;
	if (typeof V == 'function')
		return call(V, obj);
	return ArrayIterator(_values(obj));
}

var _Reflect = own({
	isPrototypeOf: isPrototypeOf,
	hasOwn: hasOwn,
	getTypeOf: getTypeOf,
	getTagOf: getTagOf,
	isTagged: isTagged,
	isLike: isLike,
	own: own,
	getUncommonPropertyNames: getUncommonPropertyNames,
	getOwnDescriptor: getOwnPropertyDescriptor,
	getDescriptor: getPropertyDescriptor,
	getItems: ReflectGetItems,
	getKeys: ReflectGetKeys,
	getValues: ReflectGetValues
});