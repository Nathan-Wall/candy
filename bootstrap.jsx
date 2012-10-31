function values(map) {

	var ret = { };

	Object.keys(map).forEach(function(name) {

		Object.defineProperty(ret, name, {
			value: map[name],
			enumerable: false,
			writable: true,
			configurable: true
		});

	});

	return ret;

}

function methods(native, staticO, instance) {

	staticO.instance = Object.create(null);

	// Lazy Bind native.prototype methods and instance methods
	[ native.prototype, instance ].forEach(function(obj) {
		Object.getOwnPropertyNames(obj).forEach(function(name) {

			var method = native.prototype[name];

			if (typeof method == 'function') {

				Object.defineProperty(staticO, name, {

					value: Functions.lazyBind(method),

					enumerable: false,
					writable: true,
					configurable: true

				});

				Object.defineProperty(staticO.instance, name, {

 					value: method,

					enumerable: false,
					writable: true,
					configurable: true

				});

			}

		});
	});

	return staticO;

}