function isTagged(obj, tag) {
	var proto;
	return tag === getTagOf(obj)
		|| (Object(obj) === obj
			&& (proto = getPrototypeOf(obj))
			&& isTagged(proto, tag));
}

function isLike(obj, tag) {
	var proto,
		O = Object(obj),
		objTag = replace(getTagOf(O), /^~+/, '');
	tag = replace(tag, /^~+/, '');
	return !!(tag == objTag
		// We say that an arguments object is like an array.
		|| tag == 'Array' && objTag == 'Arguments'
		|| (O === obj
			&& (proto = getPrototypeOf(obj))
			&& isTagged(proto, tag)));
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
	return StringSlice(ToString(obj), 8, -1);
}

// TODO: Rename `dict`? Is this identical to ES6 `dict`?
function own(obj) {

	var O = Object(obj),
		ret = create(null),
		names = getOwnPropertyNames(O);

	// TODO: Will setting properties on Object.prototype break this? Since you could set a
	// `get` property on the prototype, making a `get` property on a DataProperty...
	for (var i = 0, name = names[0]; name = names[i], i < names.length; i++)
		defineProperty(ret, name, _getOwnPropertyDescriptor(O, name));

	return ret;

}

function getUncommonPropertyNames(from, compareWith) {
	if (Object(from) !== from || Object(compareWith) !== compareWith)
		throw new TypeError('getUncommonPropertyNames called on non-object.');
	var namesMap = create(null);
	return _filter(_concatUncommonNames(from, compareWith),
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
// TODO: Rename to indicate that this is slightly different from `Object.getOwnPropertyDescriptor`.
function getOwnPropertyDescriptor(obj, name) {
	return safeDescriptor(_getOwnPropertyDescriptor(obj, name));
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
	var items = create(null);
	items.length = 0;
	for (var key in obj)
		push(items, [ key, obj[key] ]);
	return ArrayFrom(items);
}

function _values(obj) {
	var values = create(null);
	values.length = 0;
	_forEach(keys(obj), function(key) {
			push(values, obj[key]);
		});
	return ArrayFrom(values);
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
	// TODO: Is getOwnPropertyDescriptor going to de in ES6 Reflect? If so this needs to be renamed. (It should maybe be renamed any way.)
	getOwnDescriptor: getOwnPropertyDescriptor,
	getDescriptor: getPropertyDescriptor,
	getItems: ReflectGetItems,
	getKeys: ReflectGetKeys,
	getValues: ReflectGetValues
});