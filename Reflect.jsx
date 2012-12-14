extend(Reflect, {

	isPrototypeOf: Functions.lazyBind(Object.prototype.isPrototypeOf),
	hasOwn: Functions.lazyBind(Object.prototype.hasOwnProperty),

	getTagOf: function getTagOf(obj) {
		return Object.prototype.toString.call(obj).slice(8, -1);
	},

	getUncommonPropertyNames: (function() {

		return function getUncommonPropertyNames(from, compareWith) {
			var namesMap = Object.create(null);
			return concatUncommonNames(from, compareWith)
				.filter(function(u) {
					if (namesMap[u]) return false;
					namesMap[u] = true;
					return true;
				});
		};

		function concatUncommonNames(from, compareWith) {
			if (Object(from) != from
				|| from === compareWith
				|| Objects.isPrototype(from, compareWith)) return [ ];
			return Object.getOwnPropertyNames(from).concat(
				concatUncommonNames(Object.getPrototypeOf(from), compareWith));
		}

	})(),

	getPropertyDescriptor: function getPropertyDescriptor(obj, name) {
		if (Object(obj) !== obj) return undefined;
		return Object.getOwnPropertyDescriptor(obj, name)
			|| getPropertyDescriptor(Object.getPrototypeOf(obj), name);
	}

});