function isEven(number) {

	number = +number;

	// Return false if the number is not an integer.
	// TODO: Make isInteger and isFinite available in scope.
	// TODO: Coerce to int instead of check below?
	if (!isInteger(number)
		|| !isFinite(number))
		return false;

	return !(number % 2);

}

function isOdd(number) {

	number = +number;

	// Return false if the number is not an integer.
	if (!isInteger(number)
		|| !isFinite(number))
		return false;

	return !!(number % 2);

}

function sign(number) {
	// TODO: NaN currently returns 1. Does this make sense? Should it return 0??
	number = +number;
	return number == 0 && (1 / number < 0 ? -1 : 1)
		|| (number < 0 ? -1 : 1);
}

var _Number = (function() {

	return methods(

		Number,

		// Constructor methods
		null,

		// Instance methods
		{
			isEven: contextualize(isEven),
			isOdd: contextualize(isOdd),
			sign: contextualize(sign)
		}

	);

})();