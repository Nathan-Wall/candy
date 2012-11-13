var candy = (function() {

	var _inHarmony_forceShim = true;

	!!!includes('inHarmony', 'bootstrap.jsx', 'Functions.jsx', 'Objects.jsx');

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
		WeakMap: WeakMap

	};

})();