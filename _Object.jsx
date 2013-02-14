// TODO: Use Spawn.mixin?
function mixin(what/*, ...withs */) {

	if (Object(what) != what)
		throw new TypeError('Cannot call mixin on a non-object: ' + what);

	if (!isExtensible(what))
		throw new Error('Cannot call mixin on a non-exensible object');

	var withO;

	for (var i = 1; i < arguments.length; i++) {

		withO = Object(arguments[i]);

		// TODO: Where is getUncommonPropertyNames defined?
		forEach(getUncommonPropertyNames(withO, what), function(name) {

			var whatDesc = getPropertyDescriptor(what, name),
				withDesc = getPropertyDescriptor(withO, name);

			if (!whatDesc || whatDesc.configurable)
				// If what does not already have the property, or if what
				// has the property and it's configurable, add it as is.
				defineProperty(what, name, withDesc);

		});
	}

	return what;

}

function copy(what/*, ...withs */) {
	// Performs a simple shallow copy intended specifically for objects.
	// For a generic deep clone, use clone.

	if (Object(what) != what)
		throw new TypeError('Cannot copy a non-object:' + what);

	// This algorithm simply creates a new object with the same prototype and then mixes in the own properties.
	// It will also mixin any uncommon properties from other arguments.
	return apply(mixin, null, concat([ create(getPrototypeOf(what)), what ], slice(arguments, 1)));

}

// We only want to define with own properties of the descriptor.
function defineProperty(obj, name, desc) {
	return _defineProperty(obj, name, own(desc));
}

var _Object = (function() {

	return methods(

		Object,

		// Static methods
		null,

		// Instance methods
		{

			define: defineProperty,

			mixin: contextualize(mixin),
			copy: contextualize(copy),

			// DEPRECATED temporarily. TODO: evaluate whether to keep this algorithm and all the nuances of it.
			// clone: (function() {
			// 	// Performs a deep clone. For a shallow copy, use either the copy method or Object.create.
			// 	// In order to permit objects to define a self cloning method which is utilized by this clone function,
			// 	// there are two steps that must be taken: (1) Define clone.$selfClone with a property name or Symbol
			// 	// (if Symbols are available) which can be used to retrieve the clone method. (2) Define the self cloning
			// 	// method on each object which can self clone using the same property name or symbol.

			// 	var $selfClone,

			// 		clone = function clone() {
			// 			$selfClone = clone.$selfClone;
			// 			return structuredClone(this, [ ]);
			// 		},

			// 		structuredClone = function structuredClone(input, memory) {
			// 			// This algorithm is loosely based on the HTML5 internal structured cloning algorithm, but there are
			// 			// some slight deviations.
			// 			// http://www.w3.org/TR/html5/common-dom-interfaces.html#safe-passing-of-structured-data
			// 			// TODO: It may be worthwhile to reevaluate whether there should be deviations in the algorithm or not.

			// 			var pair, output, selfClone;

			// 			if (
			// 				memory.some(function(u) {
			// 					var pair = u;
			// 					return input === pair.source;
			// 				})
			// 			) return pair.destination;

			// 			if (typeof input != 'object' || input === null)
			// 				return input;

			// 			switch(Objects.getTagOf(input)) {

			// 				case 'Boolean':		output = new Boolean(input.valueOf()); break;
			// 				case 'Number':		output = new Number(input.valueOf()); break;
			// 				case 'String':		output = new String(input.toString()); break;
			// 				case 'Date':		output = new Date(input.getTime()); break;
			// 				case 'RegExp':		output = new RegExp(input.toString()); break;
			// 				// case File: break;
			// 				// case Blob: break;
			// 				// case FileList: break;
			// 				case 'Array':		output = new Array(input.length); break;
			// 				//case TypedArray: break;

			// 				case 'Function':
			// 					throw new DataCloneError('Functions cannot be cloned.');

			// 				case 'Object':
			// 				case 'Error':
			// 				case 'Math':
			// 				default:
			// 					// This currently deviates from the internal structured cloning algorithm specification.
			// 					// To follow the standard, it should just be: output = new Object(); break;

			// 					// An object can define its own clone method.
			// 					if ($selfClone && (selfClone = input[$selfClone]) && typeof selfClone == 'function') {
			// 						output = selfClone.call(input);
			// 						// If the object cloned itself, it should take care of copying over the correct own
			// 						// properties as well. We leave that up to the object to do internally.
			// 						return output;
			// 					}

			// 					// If input has a cloneNode method, use it.
			// 					// Unfortunately, this assumes anything with a "cloneNode" method (and other duck-type
			// 					// constraints, such as the "nodeType" property) wants to be cloned using that method,
			// 					// which may not be the case. For better integrity, the [[Class]] of input could be
			// 					// checked against known HTML/XML DOM Nodes. However, the list of possible [[Class]]
			// 					// values would be rather large and may not be able to be exhaustive. I'm unsure if
			// 					// there is a better approach. Checking instanceof Node is no good because we have to
			// 					// support nodes from other frames.
			// 					else if ('nodeType' in input
			// 							&& 'ownerDocument' in input
			// 							&& typeof input.cloneNode == 'function'
			// 						) output = input.cloneNode(true);

			// 					// Create an object with the same prototype as input.
			// 					else output = Object.create(Object.getPrototypeOf(input));

			// 					break;

			// 			}

			// 			memory.push({
			// 				source: input,
			// 				destination: output
			// 			});

			// 			Object.getOwnPropertyNames(input).forEach(function(key) {

			// 				var inputDesc = Object.getOwnPropertyDescriptor(input, key),
			// 					clonedPropertyValue;

			// 				if (inputDesc.value) {
			// 					// Clone the property value for a deep clone.
			// 					clonedPropertyValue = structuredClone(inputDesc.value, memory);
			// 					Object.defineProperty(output, key, {
			// 						value: clonedPropertyValue,
			// 						enumerable: inputDesc.enumerable,
			// 						writable: inputDesc.writable,
			// 						configurable: inputDesc.configurable
			// 					});
			// 				} else {
			// 					// For getters and setters we just copy over the descriptor. We expect getters and setters
			// 					// to be smart enough to work with their given context to produce reasonable values in the
			// 					// event that they are copied to other objects.
			// 					Object.defineProperty(output, key, inputDesc);
			// 				}

			// 			});

			// 			return output;

			// 		};

			// 	return clone;

			// })()

		}

	);

})();