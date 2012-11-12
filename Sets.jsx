var Sets = (function() {

	return methods(

		Set,

		// Constructor methods
		null,

		// Instance methods
		{

			addAll: function(iterable) {

				var O = Object(this),
					adder = O.add;

				if (typeof adder != 'function')
					throw new Error('this object has no add method.');

				if (!Iterables.isIterable(iterable))
					throw new TypeError('Iterable argument expected.');

				Iterables.forEach(iterable, function(value) {
					adder.call(O, value);
				});

			},

			intersect: function intersect(set) {
				// Although this method is intended for Sets and difficult to generalize, technically it only
				// requires that the objects be iterable.

				var A = Object(this), B = Object(set),
					checkIn, checkAgainst;

				if (!Iterables.isIterable(A))
					throw new TypeError('Iterable this expected.');

				if (!Iterables.isIterable(B))
					throw new TypeError('Iterable argument expected.');

				if (!(A instanceof Set))
					A = new Set(Iterables.convert(A));

				if (!(B instanceof Set))
					B = new Set(Iterables.convert(B));

				if (A.size >>> 0 < B.size >>> 0) {
					checkIn = A;
					checkAgainst = B;
				} else {
					checkIn = B;
					checkAgainst = A;
				}

				return Iterables.filter(checkIn, function(value) {
					// TODO: has might change to contains in upcoming draft
					return Set.prototype.has.call(checkAgainst, value);
				});

			},

			unite: function unite(set) {
				// Although this method is intended for Sets and difficult to generalize, technically it only
				// requires that the objects be iterable.

				var A = Object(this), B = Object(set),
					result = new Set();

				if (!Iterables.isIterable(A))
					throw new TypeError('Iterable this expected.');

				if (!Iterables.isIterable(B))
					throw new TypeError('Iterable argument expected.');

				if (!(A instanceof Set))
					A = new Set(Iterables.convert(A));

				if (!(B instanceof Set))
					B = new Set(Iterables.convert(B));

				Sets.addAll(result, A);
				Sets.addAll(result, B);

				return result;

			},

			subtract: function substract(set) {
				// Although this method is intended for Sets and difficult to generalize, technically it only
				// requires that the objects be iterable.

				var A = Object(this), B = Object(set);

				if (!Iterables.isIterable(A))
					throw new TypeError('Iterable this expected.');

				if (!Iterables.isIterable(B))
					throw new TypeError('Iterable argument expected.');

				if (!(A instanceof Set))
					A = new Set(Iterables.convert(A));

				if (!(B instanceof Set))
					B = new Set(Iterables.convert(B));

				return Iterables.filter(A, function(value) {
					// TODO: has might change to contains in upcoming draft
					return !Set.prototype.has.call(B, value);
				});

			},

			isSubsetOf: function(set) {

				var A = Object(this), B = Object(set);

				if (!Iterables.isIterable(A))
					throw new TypeError('Iterable this expected.');

				if (!Iterables.isIterable(B))
					throw new TypeError('Iterable argument expected.');

				if (!(A instanceof Set))
					A = new Set(Iterables.convert(A));

				if (!(B instanceof Set))
					B = new Set(Iterables.convert(B));

				return !Iterables.some(A, function(value) {
					// TODO: has might change to contains in upcoming draft
					return !Set.prototype.has.call(B, value);
				});

			}

		}

	);

})();