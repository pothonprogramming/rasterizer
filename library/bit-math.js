const BitMath = (() => {
    return {
        approximateSquareRoot(value) {
            let approximateValue = (value >> 1) + 1;
            approximateValue = (approximateValue + value / approximateValue) >> 1;
            return (approximateValue + value / approximateValue) >> 1;
        },
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
        toInteger(value) {
            return value | 0;
        }
    };
})();