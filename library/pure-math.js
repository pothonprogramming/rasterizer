// To ensure maximum portability of the application, no external libraries may be used.
// Dependency on a language or platform specific library or feature will hurt portability.
// PureMath is meant to be as accurate as possible and to be easily portable to other languages.

////////////////////////
// ABOUT THIS UTILITY //
////////////////////////
// * This is meant to be a logic based math utility.
//// It is still subject to rounding errors, but it is meant to be as accurate as the system will allow.
// * Why not use a built in library?
//// Because the application is designed for maximum portability and transpilation.
//// By writing ALL of the core logic used to run the application, there are less language and platform specific dependencies.
const PureMath = (() => {
    return {
        ///////////////
        // CONSTANTS //
        ///////////////
        PI: 3.141592653589793,
        PI2: 6.283185307179586,

        /////////////
        // METHODS //
        /////////////
        
        ceiling(value) {
            const integer = value | 0;
            return value < integer ? integer + 1 : integer;
        },
        floor(value) {
            const integer = value | 0;
            return value < integer ? integer - 1 : integer;
        },
        maximum2(value1, value2) {
            return value1 > value2 ? value1 : value2;
        },
        maximum3(value1, value2, value3) {
            return (value1 > value2) ? (value1 > value3 ? value1 : value3) : (value2 > value3 ? value2 : value3);
        },
        minimum2(value1, value2) {
            return value1 < value2 ? value1: value2;
        },
        minimum3(value1, value2, value3) {
            return (value1 < value2) ? (value1 < value3 ? value1 : value3) : (value2 < value3 ? value2 : value3);
        },
        // Rounds to the nearest whole number.
        round(value) {
            return (value + (value >= 0 ? 0.5 : - 0.5)) | 0;
        }
    };
})();