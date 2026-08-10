/****************/
/* THINGS TO DO */
/****************/
// * Make sure that functions are clearly labeled to indicate whether they take int or float input.
// * Make sure that functions indicate whether they will yield an approximate or exact value.

////////////////////////
// ABOUT THIS UTILITY //
////////////////////////
// * The primary goal of this utility to to provide fast, branchless operations that solve math problems.
//// Most of these functions use bitwise tricks to get a result faster than pure mathematical logic would.
//// Note that these methods are primarily concerned with speed and not with exact mathematical accuracy.

////////////////////////////////////////////////////////////
// NOTE: FLOATS MAY BE TRUNCATED WHEN USING THESE METHODS //
////////////////////////////////////////////////////////////

////////////////////
// GLOBAL BUFFERS //
////////////////////

// This buffer and the views into it are used for type punning.
// These are intended for private library use only.
const BitMath_buffer32 = new ArrayBuffer(4); // 4 byte array buffer for 32 bits
const BitMath_float32View = new Float32Array(BitMath_buffer32);
const BitMath_uint32View = new Uint32Array(BitMath_buffer32);

const BitMath_buffer64 = new ArrayBuffer(8); // 8 byte array buffer for 64 bits
const BitMath_float64View = new Float64Array(BitMath_buffer64);
const BitMath_uint64View = new BigUint64Array(BitMath_buffer64);



// Removes the sign from the integer. Will truncate a float value.
function BitMath_absolute(value) {
    const mask = value >> 31;
    return (value ^ mask) - mask;
}
// Returns the approximate squate root of a number. This JS version uses array buffers to take advantage of bitwise logic.
function BitMath_approximateSquareRoot(value) {
    // This is the Quake III fast square root method
    BitMath_float32View[0] = value;
    let integer = BitMath_uint32View[0];
    integer = (integer + 0x3f76cf62) >>> 1; // I don't understand the magic number, but there it is.
    BitMath_uint32View[0] = integer;
    const float = BitMath_float32View[0];
    // Newton-Raphson refinement: y = 0.5 * (y + x / y)
    // Adding this refinement produces a result accurate to about 2 decimal places with some error after that.
    // To make it faster, but less accurate, just return float.
    // return float;
    return 0.5 * (float + value / float);
}

// Returns the ceiling of the float value, which returns the nearest whole integer that is closer to +infinity.
// This has a branch in it. It is not purely bit math.
function BitMath_ceiling(value) {
    const integer = value | 0;
    return integer + ((value > integer) & 1);
}
// Returns the value if it is less than the threshold, otherwise returns the threshold.
function BitMath_clampHigh(value, threshold) {
    const difference = value - threshold;
    return value - (difference & ~(difference >> 31));
}
// Returns the value if it is greater than 0, otherwise returns 0.
function BitMath_clampZero(value) {
    return value & ~(value >> 31);
}
// Returns the floor of the float value, which returns the nearest whole integer that is closer to -infinity.
// -1.1 returns -2
//  1.9 returns  1
// -1   returns -1
//  1   returns  1
function BitMath_floor(value) {
    const i = value | 0;
    return i - ((value < i) & 1);
}
// Returns true if the value is negative.
function BitMath_isNegativeInteger(value) {
    return (value >> 31) & 1;
}
function BitMath_isNegativeFloat(value) {   
        BitMath_float64View[0] = value;
        return Boolean((BitMath_uint64View[0] >> 63n) & 1n);
}
// Returns true if the value is not 0.
function BitMath_isNotZero(value) {
    return (value | -value) >> 31 & 1;
}
// maximum and minimum methods truncate float values
// Returns the maximum of the two values
function BitMath_maximum2(value1, value2) {
    return value1 ^ ((value1 ^ value2) & ((value1 - value2) >> 31));
}
// Returns the maximum of the three values
function BitMath_maximum3(value1, value2, value3) {
    const maximum2 = value1 ^ ((value1 ^ value2) & ((value1 - value2) >> 31));
    return value3 ^ ((value3 ^ maximum2) & ((value3 - maximum2) >> 31));
}
// Returns the minimum of the two values
function BitMath_minimum2(value1, value2) {
    return value2 ^ ((value1 ^ value2) & ((value1 - value2) >> 31));
}
// Returns the minimum of the three values
function BitMath_minimum3(value1, value2, value3) {
    const minimum2 = value2 ^ ((value1 ^ value2) & ((value1 - value2) >> 31))
    return value3 ^ ((minimum2 ^ value3) & ((minimum2 - value3) >> 31));
}
// Returns the truncated value after adding 0.5, essentially rounding to the nearest whole number.
function BitMath_round(value) {
    return (value + 0.5 - ((value >> 31) & 1)) | 0;
}
// Returns the value without the decimal part, essentially turning it into a whole integer.
function BitMath_truncate(value) {
    return value | 0;
}
