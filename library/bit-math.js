// Note that these functions will only work with whole integers. Floats will be truncated.
const BitMath = (() => {
    return {
        absolute(value) {
            const mask = value >> 31;
            return (value ^ mask) - mask;
        },
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
                integer = (integer + 0x3f76cf62) >>> 1;
                uint32Buffer[0] = integer;
                const float = float32Buffer[0];

                // Newton-Raphson refinement: y = 0.5 * (y + x / y)
                // Adding this refinement produces a result accurate to about 2 decimal places with some error after that.
                // To make it faster, but less accurate, just return float.
                // return float;
                return 0.5 * (float + value / float);
            };
        })(),
        clampHigh(value, threshold) {
            const difference = value - threshold;
            return value - (difference & ~(difference >> 31));
        },
        clampZero(value) {
            return value & ~(value >> 31);
        },
        floor(value) {
            const i = value | 0;
            return i - ((value < i) & 1);
        },
        isNegative(value) {
            return (value >> 31) & 1;
        },
        isNotZero(value) {
            return (value | -value) >> 31 & 1;
        },
        maximum(value1, value2) {
            return value1 ^ ((value1 ^ value2) & ((value1 - value2) >> 31));
        },
        minimum(value1, value2) {
            return value2 ^ ((value1 ^ value2) & ((value1 - value2) >> 31));
        },
        truncate(value) {
            return value | 0;
        }
    };
})();