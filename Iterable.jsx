var $IterableObject = new Symbol(),
	$IterableIndex = new Symbol();

function isIterable(obj) {
	var O = Object(obj);
	return 'length' in O || has(O, $$iterator);
}

function ToIterable(obj) {

	var O = Object(obj),
		iterator, S;

	if (has(O, $$iterator))
		return O;

	if (!('length' in O))
		throw new TypeError('Cannot convert object to an iterator.');

	iterator = create(ConvertedIteratorPrototype);

	iterator[$IterableObject] = O;
	iterator[$IterableIndex] = 0;

	return _convertWrap(iterator);

};

function _convertWrap(iterator) {
	var obj = create(null);
	obj[$$iterator] = iterator;
	return obj;
}

function forEach(obj, f/*, thisArg */) {

	if (obj == null)
		throw new TypeError('forEach cannot be called on null or undefined.');

	var thisArg = arguments[2],

		O = Object(obj),
		iterator = O[$$iterator](),

		next;

	if (!iterator) {
		if ('length' in O)
			iterator = ToIterable(O)[$$iterator]();
		else
			throw new TypeError('Object cannot be iterated.');
	}

	try {
		// TODO: What to do about the key/value pair vs value only problem?
		while (true)
			call(f, thisArg, iterator.next(), O);
	} catch(x) {
		if (getTagOf(x) != 'StopIteration')
			throw x;
	}

}

function map(obj, f/*, thisArg */) {
	// An object can define a $reconstructor property if it wants the correct type of object to be
	// returned by map and filter. A $reconstructor should be a function which takes an array
	// and returns the correct type of object.
	// If the object does not have a $reconstructor property which is a function, an array will be
	// returned.

	if (obj == null)
		throw new TypeError('map cannot be called on null or undefined.');

	var thisArg = arguments[2],
		mapped = [ ],
		reconstructor = Object(obj)[$reconstructor];

	forEach(obj, function(v) {
		push(mapped, apply(f, thisArg, arguments));
	});

	if (typeof reconstructor == 'function')
		mapped = reconstructor(mapped);

	return mapped;

}

function filter(obj, f/*, thisArg */) {
	// An object can define a $reconstructor property if it wants the correct type of object to be
	// returned by map and filter. A $reconstructor should be a function which takes an array
	// and returns the correct type of object.
	// If the object does not have a $reconstructor property which is a function, an array will be
	// returned.

	if (obj == null)
		throw new TypeError('filter cannot be called on null or undefined.');

	var thisArg = arguments[2],
		filtered = [ ],
		reconstructor = Object(obj)[$reconstructor];

	forEach(obj, function(v) {
		if (apply(f, thisArg, arguments))
			push(filtered, v);
	});

	if (typeof reconstructor == 'function')
		filtered = reconstructor(filtered);

	return filtered;

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

	forEach(this, function() {
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
		ret = true,
		prev = initialValue,
		noInitial = arguments.length < 2;

	forEach(obj, function(v, i, obj) {
		if (i == 0 && noInitial) {
			prev = v;
			return;
		}
		prev = call(f, thisArg, prev, v, i, obj)
	});

	return ret;

}

var ConvertedIteratorPrototype = {

	next: function next() {

		if (object == null)
			throw new TypeError('next cannot be called on null or undefined.');

		var O = Object(this),
			object = O[$IterableObject];

		if (!object)
			throw new TypeError('next can only be called on a ConvertedIterator.');

		var index = O[$IterableIndex],
			L = object.length >>> 0;

		while (index < L) {
			if (index in object)
				return [ index, object[index] ];
			index++;
		}

		throw StopIteration;

	}

};

ConvertedIteratorPrototype[$$iterator] = function $$iterator() {
	return this;
};

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