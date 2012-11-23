var candy = (function() {

	var _inHarmony_forceShim = true;

	!!!includes('inHarmony', 'bootstrap.jsx', 'Functions.jsx', 'Objects.jsx');

	var $builtIn = new Symbol();

	return {

		$reconstructor: $reconstructor,

		Arrays: Arrays,
		Functions: Functions,
		Iterables: Iterables,
		Map: Map,
		Numbers: Numbers,
		Objects: Objects,
		Sets: Sets,
		Symbols: Symbols,
		WeakMap: WeakMap,

		coat: (function () {

			var $extended = new Symbol(),
// TODO: Iterables?
				coatings = {
					'Object': [ Objects ],
					'Array': [ Objects, Arrays ],
					'Function': [ Objects, Functions ],
					'Number': [ Objects, Numbers ],
					'Set': [ Objects, Sets ],
					'Symbol': [ Objects, Symbols ]
				};

			return function extend(obj/*, override */) {

				if (Object(obj) != obj)
					throw new TypeError('Cannot coat a non-object: ' + obj);

				var override = !!arguments[1];

				if (obj[$extended])
					return;

				if (!Object.isExtensible(obj))
					throw new Error('Object is not extensible.');

				obj[$extended] = true;



			};

		})(),

		coatBuiltIns: (function() {

			var extended = false,

			// TODO: Iterables?
				extensions = [
					Arrays, Functions, Numbers, Objects, Sets, Symbols
				];

			return function extendBuiltIns(/* override */) {

				if (extended)
					return;

				extended = true;

				var override = !!arguments[0];

				extensions.forEach(function(extension) {

					var builtIn = extension[$builtIn];

					Object.getOwnPropertyNames(extension).forEach(function(name) {
						// TODO: Check for non-configurable existing properties before trying to override
						if (name != 'instance' && (override || !(name in builtIn)))
							Object.defineProperty(builtIn,
								Object.getOwnPropertyDescriptor(extension, name));

					});

					Object.getOwnPropertyNames(extension.instance).forEach(function(name) {
						// TODO: Check for non-configurable existing properties before trying to override
						if (override || !(name in builtIn.prototype))
							Object.defineProperty(builtIn.prototype,
								Object.getOwnPropertyDescriptor(extension.instance, name));

					});

				});

			};

		})()

	};

})();