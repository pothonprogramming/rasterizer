function Bitwise_approximateSquareRoot(value) {
    let approximateValue = (value >> 1) + 1;
    approximateValue = (approximateValue + value / approximateValue) >> 1;
    return (approximateValue + value / approximateValue) >> 1;
}

function Bitwise_clampHigh(value, threshold) {
    const difference = value - threshold;
    return value - (difference & ~(difference >> 31));
}

function Bitwise_clampZero(value) {
    return value & ~(value >> 31);
}

function Bitwise_floor(value) {
    const i = value | 0;
    return i - ((value < i) & 1);
}

function Bitwise_isNegative(value) {
    return (value >> 31) & 1;
}

function Bitwise_isNotZero(value) {
    return (value | -value) >> 31 & 1;
}

function Bitwise_toInteger(value) {
    return value | 0;
}