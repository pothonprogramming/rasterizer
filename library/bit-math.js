// Note that these functions will only work with whole integers. Floats will be truncated.
const BitMath = (() => {
    return {
        // Removes the sign from the integer. Will truncate a float value.
        absolute(value) {
            const mask = value >> 31;
            return (value ^ mask) - mask;
        },
        // Returns the approximate squate root of a number. This JS version uses array buffers to take advantage of bitwise logic.
        approximateSquareRoot: (() => {
            // These will live for the life of the program.
            // Defining these buffers here allows them to be reused so there is less overhead when calling the function.
            const buffer = new ArrayBuffer(4); // 4 byte array buffer for 32 bits
            const float32Buffer = new Float32Array(buffer);
            const uint32Buffer = new Uint32Array(buffer);

            // This is the Quake III fast square root method
            return (value) => {
                float32Buffer[0] = value;
                let integer = uint32Buffer[0];
                integer = (integer + 0x3f76cf62) >>> 1; // I don't understand the magic number, but there it is.
                uint32Buffer[0] = integer;
                const float = float32Buffer[0];

                // Newton-Raphson refinement: y = 0.5 * (y + x / y)
                // Adding this refinement produces a result accurate to about 2 decimal places with some error after that.
                // To make it faster, but less accurate, just return float.
                // return float;
                return 0.5 * (float + value / float);
            };
        })(),
        // Returns the ceiling of the float value, which returns the nearest whole integer that is closer to +infinity.
        ceiling(value) {
            const i = value | 0;
            return i + ((value > i) & 1);
        },
        // Returns the value if it is less than the threshold, otherwise returns the threshold.
        clampHigh(value, threshold) {
            const difference = value - threshold;
            return value - (difference & ~(difference >> 31));
        },
        // Returns the value if it is greater than 0, otherwise returns 0.
        clampZero(value) {
            return value & ~(value >> 31);
        },
        // Returns the floor of the float value, which returns the nearest whole integer that is closer to -infinity.
        // -1.1 returns -2
        //  1.9 returns  1
        // -1   returns -1
        //  1   returns  1
        floor(value) {
            const i = value | 0;
            return i - ((value < i) & 1);
        },
        // Returns true if the value is negative.
        isNegativeInteger(value) {
            return (value >> 31) & 1;
        },
        isNegativeFloat: (() => {
            const float64Array = new Float64Array(1);
            const uInt64Array = new BigUint64Array(float64Array.buffer);

            return (value) => {
                float64Array[0] = value;
                return Boolean((uInt64Array[0] >> 63n) & 1n);
            }
        })(),
        // Returns true if the value is not 0.
        isNotZero(value) {
            return (value | -value) >> 31 & 1;
        },
        // Returns the maximum of the two values
        maximum2(value1, value2) {
            return value1 ^ ((value1 ^ value2) & ((value1 - value2) >> 31));
        },
        // Returns the maximum of the three values
        maximum3(value1, value2, value3) {
            const maximum2 = value1 ^ ((value1 ^ value2) & ((value1 - value2) >> 31));
            return value3 ^ ((value3 ^ maximum2) & ((value3 - maximum2) >> 31));
        },
        // Returns the minimum of the two values
        minimum2(value1, value2) {
            return value2 ^ ((value1 ^ value2) & ((value1 - value2) >> 31));
        },
        // Returns the minimum of the three values
        minimum3(value1, value2, value3) {
            const minimum2 = value2 ^ ((value1 ^ value2) & ((value1 - value2) >> 31))
            return value3 ^ ((minimum2 ^ value3) & ((minimum2 - value3) >> 31));
        },
        // Rounding only needs to happen with floats. This function handles floating point numbers.
        round: (() => {
            const float64Array = new Float64Array(1);
            const uInt64Array = new BigUint64Array(float64Array.buffer);

            return (value) => {
                float64Array[0] = value;
                return (value + 0.5 - Number((uInt64Array[0] >> 63n) & 1n)) | 0;
            };
        })(),
        // Returns the truncated value after adding 0.5, essentially rounding to the nearest whole number.
        round(value) {
            return (value + 0.5 - ((value >> 31) & 1)) | 0;
        },
        // Returns the value without the decimal part, essentially turning it into a whole integer.
        truncate(value) {
            return value | 0;
        }
    };
})();