function isEven(number) {

	number = +number;

	// Return false if the number is not an integer.
	if (!Number.isInteger(number)
		|| !Number.isFinite(number))
		return false;

	return !(number % 2);

}

function isOdd(number) {

	number = +number;

	// Return false if the number is not an integer.
	if (!Number.isInteger(number)
		|| !Number.isFinite(number))
		return false;

	return !!(number % 2);

}

var _Number = (function() {

	return methods(

		Number,

		// Constructor methods
		null,

		// Instance methods
		{
			isEven: contextualize(isEven),
			isOdd: contextualize(isOdd)
		}

	);

})();