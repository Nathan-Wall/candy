var Symbols = (function() {

	return methods(

		null,

		null,

		{

			isIn: function(obj) {
				if (Symbol.__useIsIn__)
					return Symbol.prototype.isIn.call(this, obj);
				else
					return this in obj;
			}

		}

	);

})();