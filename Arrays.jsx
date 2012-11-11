var Arrays = (function() {

	return methods(

		Array,

		null,

		// Instance methods
		{

			isArrayLike: function isArrayLike() {
				// This tests for a class of Array-like objects which we call Lists.
				// A List is an object with a length property which isn't a string.
				return 'length' in this && typeof this != 'string';
			},

			// The regular Array concat doesn't work because it doesn't perceive a Array-like object
			// as an iterable, and thus concats it as an object rather than an Array.
			// ex: [ 'blue' ].concat(arguments); where arguments = [ 'red' ]; produces [ 'blue', [ 'red' ] ].
			merge: (function() {
				var emptyArray = [ ];
				return function merge() {
					return Arrays.reduce(arguments, function(prev, cur) {
						if (!Array.isArray(cur) && Arrays.isList(cur))
							return prev.concat(Arrays.slice(cur));
						return prev.concat(cur);
					}, Arrays.slice(this));
				};
			})(),

			persuade: (function() {

				function persuade(/* [from], [to], types */) {
					/* array can be a array of strings, constructors, and/or param objects.
					 * type can be any string which matches a typeof result or any of the extended types.
					 * multiple types for a single argument can be separated by a "|".
					 * type can also be an object with a "type" property and a "required" property,
					 * or it can  be a string preceeded with a "!" to designate that it's required.
					 */

					var A, from, to, types,
						argNum = 1, curItem;

					if (typeof arguments[argNum] == 'number') from = arguments[argNum++];
					if (typeof arguments[argNum] == 'number') to = arguments[argNum++];
					types = Arrays.slice(arguments[argNum]);

					A = Arrays.slice(this, from, to);

					curItem = A.shift();

					return types.map(function(type) {

						var modifiers, required = false, test = false, ret;

						if (typeof type == 'object') {
							required = !!type.required;
							type = type.type;
						}

						if (typeof type == 'string') {
							test = type.split('|').some(function(u) {
								modifiers = /^\W*/.exec(u)[0];
								if (!required) required = /\!/.test(modifiers);
								u = u.substring(modifiers.length);
								return (persuade.extendedTypes[u] || typeMatches)(curItem, u);
							});
						} else test = curItem instanceof type;

						if (test) {
							ret = curItem;
							curItem = A.shift();
						}

						return ret;

					});

				}

				function typeMatches(value, type) { return typeof value == type; }

				persuade.extendedTypes = {
					'array':	function(value) { return Array.isArray(value); },
					'list':		function(value) { return Lists.isList(value); }
				};

				return persuade;

			})(),

			pushAll: function(list) {
				return Array.prototype.push.apply(this, list);
			},

			flatten: function flatten() {
				var flattened = [ ];
				Arrays.forEach(this, function(u) {
					if (Arrays.isList(u))
						Arrays.pushAll(flattened, Arrays.flatten(u));
					else flattened.push(u);
				});
				return flattened;
			},

			mapToObject: function mapToObject(f, context) {
				// TODO: Better name?
				var obj = Object.create(null);
				Arrays.forEach(this,
					function(key, i) { obj[key] = f.call(context, key, i, obj); });
				return obj;
			},

			createTruthTable: function createTruthTable() {
				// TODO: Better name?
				var obj = Object.create(null);
				Arrays.forEach(this,
					function(key) { obj[key] = true; });
				return obj;
			},

			search: function search(value) {
				// Similar to indexOf, but matches with egal when needed to keep with ES5 SameValue function.
				var index = -1;
				if (v !== v || v === 0) {
					// Use egal to test NaN and +0/-0 to keep with ES5 SameValue function.
					Arrays.some(this, function(u, i) {
						if (isSameValue(u, v)) {
							index = i;
							return true;
						}
					});
					return index;
				} else {
					// Use indexOf when possible, for speed.
					return Arrays.indexOf(this, value);
				}
			},

			// Provides a stable sort, which doesn't alter the original array.
			sort: (function() {
				var nativeIsStable = (function() {
						return testStability(32, 2) && testStability(512, 16);
						function testStability(size, resolution) {
							var res = createRange(resolution),
								r = createRange(size).map(function(u) {
									return Objects.mixin(res.map(function() {
										return Math.random > .5 ? 0 : 1;
									}), { i: u });
								});
							return res.every(function(i) {
								r.sort(function(a, b) {
									return a[i] - b[i];
								});
								return r.every(function(u, j) {
									var next = r[j + 1];
									if (!next) return true;
									for (var k = 0; k <= i; k++) {
										if (u[k] < next[k]) return true;
									}
									return u.i < next.i;
								});
							});
						}
					})();
				return nativeIsStable
					? Array.prototype.sort
					: function stableSort(f) {
						return Lists.map(this, function(u, i) {
							return { value: u, index: i };
						}).sort(function(a, b) {
							return (f ? f(a.value, b.value) : a.value - b.value) || a.index - b.index;
						}).map(function(u) {
							return u.value;
						});
					};
				function createRange(total) {
					var r = [ ];
					for (var i = 0; i < total; i++)
						r.push(i);
					return r;
				}
			})(),

			mapPartial: function mapPartial(f) {
				return Arrays.filterUndefined(Arrays.map(this, f));
			},

			without: function without(/* ...values */) {
				// TODO: Whether we should continue to use contains depends on whether contains ends up using SameValue or ===.
				var args = Arrays.slice(arguments);
				return Arrays.filter(this, function(u) {
						return !Arrays.contains(args, u);
					});
			},

			// Filters null and undefined.
			withoutEmpty: Functions.preload(Array.prototype.filter,
				function(u) { return u != null; }),

			withoutFalsy: Functions.preload(Array.prototype.filter,
				function(u) { return !!u; })

		}

	);

})();

// Create lazyTie method by calling it.
Functions.instance.lazyTie();