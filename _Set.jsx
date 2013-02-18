function SetAddAll(set, iterable) {

	if (set == null)
		throw new TypeError('addAll cannot be called on null or undefined.');

	var O = Object(set),
		adder = O.add;

	if (typeof adder != 'function')
		throw new Error('Object has no add method.');

	if (!isIterable(iterable))
		throw new TypeError('Iterable argument expected.');

	forEach(iterable, function(value) {
		call(adder, O, value);
	});

}

// Although this method is intended for Sets and difficult to generalize, technically it only
// requires that the objects be iterable.
function intersect(a, b) {

	if (a == null || b == null)
		throw new TypeError('intersect cannot be called on null or undefined.');

	var A = Object(a), B = Object(b),
		checkIn, checkAgainst;

	if (!isIterable(A) || !isIterable(B))
		throw new TypeError('Iterable argument expected.');

	if (!(A instanceof Set))
		A = new Set(ToIterable(A));

	if (!(B instanceof Set))
		B = new Set(ToIterable(B));

	if (A.size < B.size) {
		checkIn = A;
		checkAgainst = B;
	} else {
		checkIn = B;
		checkAgainst = A;
	}

	return filter(checkIn, function(value) {
		return SetContains(checkAgainst, value);
	});

}

// Although this method is intended for Sets and difficult to generalize, technically it only
// requires that the objects be iterable.
function unite(a, b) {

	if (a == null || b == null)
		throw new TypeError('unite cannot be called on null or undefined.');

	var A = Object(a), B = Object(b),
		result = new Set();

	if (!isIterable(A) || !isIterable(B))
		throw new TypeError('Iterable argument expected.');

	if (!(A instanceof Set))
		A = new Set(ToIterable(A));

	if (!(B instanceof Set))
		B = new Set(ToIterable(B));

	SetAddAll(result, A);
	SetAddAll(result, B);

	return result;

}

// Although this method is intended for Sets and difficult to generalize, technically it only
// requires that the objects be iterable.
function subtract(a, b) {

	if (a == null || b == null)
		throw new TypeError('unite cannot be called on null or undefined.');

	var A = Object(a), B = Object(b);

	if (!isIterable(A) || !isIterable(B))
		throw new TypeError('Iterable argument expected.');

	if (!(A instanceof Set))
		A = new Set(ToIterable(A));

	if (!(B instanceof Set))
		B = new Set(ToIterable(B));

	return filter(A, function(value) {
		return !SetContains(B, value);
	});

}

function isSubsetOf(a, b) {

	if (a == null || b == null)
		throw new TypeError('unite cannot be called on null or undefined.');

	var A = Object(a), B = Object(b);

	if (!isIterable(A) || !isIterable(B))
		throw new TypeError('Iterable argument expected.');

	if (!(A instanceof Set))
		A = new Set(ToIterable(A));

	if (!(B instanceof Set))
		B = new Set(ToIterable(B));

	return !some(A, function(value) {
		return !SetContains(B, value);
	});

}

var _Set = methods(

	Set,

	// Static methods
	null,

	// Instance methods
	{
		addAll: contextualize(SetAddAll),
		intersect: contextualize(intersect),
		unite: contextualize(unite),
		subtract: contextualize(subtract),
		isSubsetOf: contextualize(isSubsetOf)
	}

);