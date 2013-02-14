!!!standAlone((function() {
	var _Harmonize_forceShim = true;
	!!!include('../Harmonize/Harmonize.jsx');
})());

// Let's check to see if we have what appears to be a complete ES6 environment, along with
// access to $$iterator.
// TODO: Once ES6 environments appear that support @@iterator, check for the built-one as well.
if (typeof WeakMap != 'function'
	|| typeof Map != 'function'
	|| typeof Set != 'function'
	|| typeof $$iterator == 'undefined'
	|| !WeakMap.prototype
	|| !Map.prototype
	|| !Set.prototype
	|| typeof Map.prototype.get != 'function'
	|| typeof Map.prototype.set != 'function'
	|| typeof Set.prototype.has != 'function' // TODO: rename contains when ES6 draft matches
	|| typeof Object.is != 'function'
	|| typeof Reflect.has != 'function' // TODO: We expect Reflect to need to be imported as a module, but how this will work out is yet unknown.
	|| typeof Reflect.hasOwn != 'function')
	throw new Error('ES6 environment missing or incomplete. Harmonize.js (or compatible shim) is required to use candy.js.');

var candy = (function(Object, Array, Function, String, Number, TypeError, RangeError, Error, WeakMap, Map, Set, Reflect, $$iterator) {

	'use strict';

	!!!includes('bootstrap.jsx', 'Iterable.jsx');

	var modules = (function() {
			var _modules = [
					{
						name: 'Object',
						module: _Object,
							 // name: built-in
						coat: { Object: Object }
					},
					{
						name: 'Iterable',
						module: Iterable,
						coat: {
							Array: Array,
							Map: Map,
							Set: Set
							// ? String: String
						}
					},
					{
						name: 'Array',
						module: _Array,
						coat: { Array: Array }
					},
					{
						name: 'Function',
						module: _Function,
						coat: { Function: Function }
					},
					{
						name: 'Map',
						module: _Map,
						coat: { Map: Map }
					},
					{
						name: 'Number',
						module: _Number,
						coat: { Number: Number }
					},
					{
						name: 'Set',
						module: _Set,
						coat: { Set: Set }
					},
					{
						name: 'Symbol',
						module: _Symbol,
						coat: { Symbol: Symbol }
					},
					{
						name: 'WeakMap',
						module: _WeakMap,
						coat: { WeakMap: WeakMap }
					},
					{
						name: 'Reflect',
						module: _Reflect,
						coat: { Reflect: Reflect }
					}
				];
			return map(_modules,
				function(def) {
					var name = def.name,
						ret = create(null);
					ret.name = name;
					ret.module = def.module;
					// TODO: all and any functions
					ret.test = preload(all, map(keys(def.coat),
						function(name) { return postload(isLike, name); }));
					ret.builtIns = map(keys(def.coat),
						function(name) { return def.coat[name]; });
					return ret;
				}
			);
		})(),

		candy = {

			$reconstructor: $reconstructor,

			// We use a generic slice which can distinguish between strings and array-like objects.
			slice: slice,

			coat: (function () {

				var $coated = new Symbol();

				return function coat(obj/*, override, module */) {

					if (obj == null)
						throw new TypeError('Cannot coat null or undefined');

					var O = Object(obj),
						override = !!arguments[1],
						module = arguments[2];
						M = M !== undefined ? String(M) : undefined;

					if (!override && O[$coated])
						return;

					if (!isExtensible(O))
						throw new Error('Object is not extensible.');

					O[$coated] = true;

					var error;

					forEach(modules, function(info) {
						var name = info.name,
							module = info.module,
							test = info.test;
						if (M === name || test(O))
							forEach(getOwnPropertyNames(module.instance), function(name) {

								var oDesc = getPropertyDescriptor(O, name);

								if (override && !oDesc.configurable) {
									if (!error)
										error = new Error('Property is not configurable: ' + name);
									return;
								}

								if (!oDesc || override && oDesc.configurable)
									defineProperty(O, name,
										getOwnPropertyDescriptor(module.instance, name));

							});
					});

					if (error)
						throw error;

					return O;

				};

			})(),

			coatBuiltIns: (function() {

				var coated = false;

				return function coatBuiltIns(/* override */) {

					var override = !!arguments[0];

					if (!override && coated)
						return;

					coated = true;

					forEach(modules, function(info) {

						var name = info.name,
							module = info.module,
							builtIns = info.builtIns,
							error;

						forEach(
							[
								{ with: module, what: builtIns },
								{ with: module.instance, what: map(builtIns, function(builtIn) { return builtIn.prototype; } })
							],
							function(info) {

								var coatWith = info.with,
									coatWhat = info.what;

								getOwnPropertyNames(coatWith).forEach(function(name) {
									
									forEach(coatWhat, function(what) {

										if (!isExtensible(what)) {
											if (!error)
												error = new Error('Built-in is not extensible.');
											return;
										}

										if (name == 'instance')
											return;

										var bDesc = getPropertyDescriptor(what, name);

										if (override && !bDesc.configurable) {
											if (!error)
												error = new Error('Property is not configurable: ' + name);
											return;
										}

										if (!bDesc || override)
											defineProperty(what, name,
												getOwnPropertyDescriptor(coatWith, name));

									});

								});


							}
						);
	
						if (error)
							throw error;

					});

				};

			})()

		};

	forEach(modules, function(info) {
		var name = info.name,
			module = candy[name] = info.module;
		forEach(getOwnPropertyNames(module), function(name) {
			var desc = getOwnPropertyDescriptor(module, name);
			if (!hasOwn(candy, name))
				defineProperty(candy, name, desc);
		});
	});

	return candy;

})(Object, Array, Function, String, Number, TypeError, RangeError, Error, WeakMap, Map, Set, Reflect, $$iterator);