function isIterable(obj) {
	var O = Object(obj);
	return 'length' in O || typeof $$(O, 'iterator') == 'function';
}

function ToIterable(obj) {

	var O = Object(obj), S;

	if (typeof $$(O, 'iterator') == 'function')
		return O;

	if (!('length' in O))
		throw new TypeError('Cannot convert object to an iterator.');

	return _convertWrap(function() {
		// We copy ConvertedIteratorPrototype for now so that it can't be mucked with by external code.
		// This *could* be an important step for ensuring integrity, since much of this and other libraries
		// may depend on `forEach` with something like `arguments` (which will be converted using ToIterable)
		// working correctly.
		// TODO: Think more about whether ConvertedIteratorPrototype should be exposed. If so, the `copy` below can be changed to `create`.
		// Note: My current thought is that it should stay as-is.
		var iter = copy(ConvertedIteratorPrototype);
		$Iterable(iter).IterableObject = O;
		$Iterable(iter).IterableIndex = 0;
		return iter;
	});

};

function _convertWrap(iterator) {
	var obj = create(null);
	$$(obj, 'iterator', iterator);
	return obj;
}

function forEach(obj, f/*, thisArg */) {

	if (obj == null)
		throw new TypeError('forEach cannot be called on null or undefined.');

	var thisArg = arguments[2],

		O = Object(obj),
		iter = $$(O, 'iterator'),
		iterator, next;

	if (iter)
		iterator = call(iter, O);
	else if ('length' in O)
		iterator = call($$(ToIterable(O), 'iterator'), O);
	else
		throw new TypeError('Object cannot be iterated.');

	try {
		// TODO: What to do about the key/value pair vs value only problem?
		// TODO: ! Note that the signature of the callback function is different from Array#forEach because the key/index is not passed as an argument. This is potentially a big problem. THINK MUCH ABOUT THIS!
		while (true)
			call(f, thisArg, iterator.next(), O);
	} catch(x) {
		if (getTagOf(x) != 'StopIteration')
			throw x;
	}

}

function map(obj, f/*, thisArg */) {
	// If a `construct` function property is defined on the object, this function will be called
	// on the mapped array. 

	if (obj == null)
		throw new TypeError('map cannot be called on null or undefined.');

	var thisArg = arguments[2],
		mapped = [ ],
		O = Object(obj);

	forEach(O, function() {
		push(mapped, apply(f, thisArg, arguments));
	});

	return CallConstruct(O, mapped);

}

function filter(obj, f/*, thisArg */) {
	// See note on `map` regarding construct.

	if (obj == null)
		throw new TypeError('filter cannot be called on null or undefined.');

	var thisArg = arguments[2],
		filtered = [ ],
		O = Object(obj);

	forEach(O, function(v) {
		if (apply(f, thisArg, arguments))
			push(filtered, v);
	});

	return CallConstruct(O, filtered);

}

function some(obj, f/*, thisArg */) {

	if (obj == null)
		throw new TypeError('some cannot be called on null or undefined.');

	var thisArg = arguments[2],
		ret = false;

	forEach(obj, function() {
		if (apply(f, thisArg, arguments)) {
			ret = true;
			// Since forEach itself waits for stopIteration, this should work to break the forEach.
			throw StopIteration;
		}
	});

	return ret;

}

function every(obj, f/*, thisArg */) {

	if (obj == null)
		throw new TypeError('every cannot be called on null or undefined.');

	var thisArg = arguments[2],
		ret = true;

	forEach(obj, function() {
		if (!apply(f, thisArg, arguments)) {
			ret = false;
			throw StopIteration;
		}
	});

	return ret;

}

function reduce(obj, f/*, initialValue, thisArg */) {

	if (obj == null)
		throw new TypeError('reduce cannot be called on null or undefined.');

	var initialValue = arguments[2],
		thisArg = arguments[3],
		prev = initialValue,
		noInitial = arguments.length < 2;

	forEach(obj, function(v, i, obj) {
		if (i == 0 && noInitial) {
			prev = v;
			return;
		}
		prev = call(f, thisArg, prev, v, i, obj)
	});

	return prev;

}

var ConvertedIteratorPrototype = {

	next: function next() {

		if (this == null)
			throw new TypeError('next cannot be called on null or undefined.');

		var O = Object(this),
			object = $Iterable(O).IterableObject;

		if (!object)
			throw new TypeError('next can only be called on a ConvertedIterator.');

		var $I = $Iterable(O),
			index = $I.IterableIndex,
			L = object.length >>> 0;

		while (index < L) {
			if (index in object) {
				$I.IterableIndex = index + 1;
				// TODO: Whether a pair is returned should probably depend on what Array.prototype@iterator() ends up doing.
				// Keep up with the spec.
				return object[index];
				// return [ index, object[index] ];
			}
			index++;
		}

		$I.IterableIndex = index;
		throw StopIteration;

	}

};

$$(ConvertedIteratorPrototype, 'iterator', function $$iterator() {
	return this;
});

var Iterable = methods(

	null,

	{
		isIterable: isIterable,
		convert: ToIterable
	},

	{
		forEach: contextualize(forEach),
		map: contextualize(map),
		filter: contextualize(filter),
		some: contextualize(some),
		every: contextualize(every),
		reduce: contextualize(reduce)
		// reduceRight doesn't make sense with an iterable because you can't iterate in the reverse direction.
	}

);