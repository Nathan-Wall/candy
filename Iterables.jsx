var Iterables = (function() {

	var convert,
		forEach,

		Iterables = methods(

			null,

			{

				isIterable: function isIterable(obj) {

					var O = Object(obj);

					return 'length' in O || _Symbol.isIn($$iterator, O);

				},

				convert: (function() {
					return function convert(obj) {

						var O = Object(obj),
							iterator, S;

						if (_Symbol.isIn($$iterator, O))
							return O;

						if (!('length' in O))
							throw new TypeError('Cannot convert object to an iterator.');

						iterator = Object.create(ConvertedIteratorPrototype);
						S = Secrets(iterator);

						S.set('ConvertedIterator:object', O);
						S.set('ConvertedIterator:index', 0);

						return wrap(iterator);

					};
					function wrap(iterator) {
						var obj = Object.create(null);
						obj[$$iterator] = iterator;
						return obj;
					}
				})()

			},

			{

				forEach: function forEach(f/*, thisArg */) {

					var thisArg = arguments[1],

						O = Object(this),
						iterator = O[$$iterator](),

						next;

					if (!iterator) {
						if ('length' in O)
							iterator = convert(O)[$$iterator]();
						else
							throw new TypeError('Object cannot be iterated.');
					}

					try {
						// TODO: What to do about the key/value pair vs value only problem?
						while (true)
							f.call(thisArg, iterator.next(), O);
					} catch(x) {
						if (Objects.getTagOf(x) != 'StopIteration')
							throw x;
					}

				},

				map: function map(f/*, thisArg */) {
					// An object can define a $reconstructor property if it wants the correct type of object to be
					// returned by map and filter. A $reconstructor should be a function which takes an array
					// and returns the correct type of object.
					// If the object does not have a $reconstructor property which is a function, an array will be
					// returned.

					var thisArg = arguments[1],
						mapped = [ ],
						reconstructor = Object(this)[$reconstructor];

					forEach(this, function(v) {
						mapped.push(f.apply(this, arguments));
					}, thisArg);

					if (typeof reconstructor == 'function')
						mapped = reconstructor(mapped);

					return mapped;

				},

				filter: function filter(f/*, thisArg */) {
					// An object can define a $reconstructor property if it wants the correct type of object to be
					// returned by map and filter. A $reconstructor should be a function which takes an array
					// and returns the correct type of object.
					// If the object does not have a $reconstructor property which is a function, an array will be
					// returned.

					var thisArg = arguments[1],
						filtered = [ ],
						reconstructor = Object(this)[$reconstructor];

					forEach(this, function(v) {
						if (f.apply(this, arguments))
							filtered.push(v);
					}, thisArg);

					if (typeof reconstructor == 'function')
						filtered = reconstructor(filtered);

					return filtered;

				},

				some: function some(f/*, thisArg */) {

					var thisArg = arguments[1],
						ret = false;

					try {
						forEach(this, function() {
							if (f.apply(this, arguments)) {
								ret = true;
								throw StopIteration;
							}
						}, thisArg);
					} catch(x) {
						if (Objects.getTagOf(x) != 'StopIteration')
							throw x;
					}

					return ret;

				},

				every: function every(f/*, thisArg */) {

					var thisArg = arguments[1],
						ret = true;

					try {
						forEach(this, function() {
							if (!f.apply(this, arguments)) {
								ret = false;
								throw StopIteration;
							}
						}, thisArg);
					} catch(x) {
						if (Objects.getTagOf(x) != 'StopIteration')
							throw x;
					}

					return ret;

				},

				reduce: function reduce(f/*, initialValue, thisArg */) {

					var initialValue = arguments[1],
						thisArg = arguments[2],
						ret = true,
						prev = initialValue,
						noInitial = arguments.length < 2;

					forEach(this, function(v, i, obj) {
						if (i == 0 && noInitial) {
							prev = v;
							return;
						}
						prev = f.call(this, prev, v, i, obj)
					}, thisArg);

					return ret;

				}

				// reduceRight doesn't make sense with an iterable because you can't iterate in the reverse direction.

			}

		),

		ConvertedIteratorPrototype = {

			next: function next() {

				var O = Object(this),
					S = Secrets(O),
					object = S.get('ConvertedIterator:object'),
					index = S.get('ConvertedIterator:index'),
					L = Object.length >>> 0;

				while (index < L) {
					if (index in object)
						return [ index, object[index] ];
					index++;
				}

				throw StopIteration;

			}

		};

	convert = Iterables.convert;
	forEach = Iterables.forEach;

	ConvertedIteratorPrototype[$$iterator] = function $$iterator() {
		return this;
	};

	return Iterables;

})();