/****************/
/* THINGS TO DO */
/****************/
// * The approximateCosine, approximateSine, and approximateTangent methods are not as accurate as the standard library's methods.
//// These methods should be improved if possible. Currently, they are accurate to about 10 decimal places.

////////////////////////
// ABOUT THIS UTILITY //
////////////////////////
// * This is meant to be a logic based math utility.
//// It is still subject to rounding errors, but it is meant to be as accurate as the system will allow.
// * Why not use a built in library?
//// Because the application is designed for maximum portability and transpilation.
//// By writing ALL of the core logic used to run the application, there are less language and platform specific dependencies.
// * NOTE: Approximation must be used to represent irrational numbers, and some functions must return approximate results.
//// In these cases, the goal is to get as close to the real value as possible within the limitations of the system.
const PureMath = (() => {
    return {
        ///////////////
        // CONSTANTS //
        ///////////////

        // Approximations of PI
        HALF_PI: 1.5707963267948966,
        PI: 3.141592653589793,
        TWO_PI: 6.283185307179586,

        /////////////
        // METHODS //
        /////////////

        absolute(value) {
            return value < 0 ? -value : value;
        },
 
        approximateCosine(value) {
            const PI = PureMath.PI;
            const HALF_PI = PureMath.HALF_PI;
            const TWO_PI = PureMath.TWO_PI;
            const TWO_PI_LOW = 2.4492935982947064e-16; // Residual from splitting 2π

            // Compute k = nearest integer to value / (2π)
            const k = PureMath.round(value / (TWO_PI + TWO_PI_LOW));

            // High-precision range reduction: r = value - k*2π
            let r = (value - k * TWO_PI) - k * TWO_PI_LOW;

            // Reduce to [-PI, PI]
            if (r > PI) r -= TWO_PI;
            else if (r < -PI) r += TWO_PI;

            // Quadrant folding
            let sign = 1;
            if (r < -HALF_PI) {
                r = -PI - r;
                sign = -1;
            } else if (r > HALF_PI) {
                r = PI - r;
                sign = -1;
            }

            const x2 = r * r;

            // Degree-17 minimax polynomial for cosine on [-HALF_PI, HALF_PI]
            const c2 = -0.5;
            const c4 = 4.16666666666665929218e-2;
            const c6 = -1.38888888888730564116e-3;
            const c8 = 2.48015872894767294178e-5;
            const c10 = -2.75573143513906633035e-7;
            const c12 = 2.08757232129817482790e-9;
            const c14 = -1.13596475577881948265e-11;
            const c16 = 4.77947733238738529743e-14;

            const poly = 1 + x2 * (
                c2 + x2 * (
                    c4 + x2 * (
                        c6 + x2 * (
                            c8 + x2 * (
                                c10 + x2 * (
                                    c12 + x2 * (
                                        c14 + x2 * c16)))))));

            return sign * poly;
        },

        // This function starts to produce degraded results if the value is very large.
        // Keeping value between -2PI and 2PI produces the best results.
        approximateSine(value) {
            const PI = PureMath.PI;
            const HALF_PI = PureMath.HALF_PI;

            // Use improved range reduction
            const TWO_PI = PureMath.TWO_PI; // first 16 digits of 2PI
            const TWO_PI_low = 2.4492935982947064e-16; // Actual 2PI - TWO_PI, very small residual

            // Compute k = nearest integer to value / 2π
            const k = PureMath.round(value / (TWO_PI + TWO_PI_low));

            // Accurate remainder calculation: value - k * TWO_PI
            // Use double-double arithmetic for higher precision
            let r = (value - k * TWO_PI) - k * TWO_PI_low;

            // Reduce to [-PI, PI]
            if (r > PI) r -= TWO_PI;
            else if (r < -PI) r += TWO_PI;

            // Quadrant folding

            if (r < -HALF_PI) r = -PI - r;
            else if (r > HALF_PI) r = PI - r;

            const x2 = r * r;

            // Degree-17 minimax polynomial coefficients for sine on [-PI/2, PI/2]
            const c3 = -1.66666666666666657415e-1;
            const c5 = 8.33333333333333287074e-3;
            const c7 = -1.98412698412698412588e-4;
            const c9 = 2.75573192239858882532e-6;
            const c11 = -2.50521083854417116945e-8;
            const c13 = 1.60590438368216145994e-10;
            const c15 = -7.6471637318198164759e-13;
            const c17 = 2.8114572543455207632e-15;

            const poly = 1 + x2 * (
                c3 + x2 * (
                    c5 + x2 * (
                        c7 + x2 * (
                            c9 + x2 * (
                                c11 + x2 * (
                                    c13 + x2 * (
                                        c15 + x2 * c17)))))));

            return r * poly;
        },

        approximateTangent(value) {
            const PI = PureMath.PI;
            const HALF_PI = PureMath.HALF_PI;
            const TWO_PI = PureMath.TWO_PI;
            const TWO_PI_low = 2.4492935982947064e-16;
        
            // Range reduction: value mod 2π
            const k = PureMath.round(value / (TWO_PI + TWO_PI_low));
            let r = (value - k * TWO_PI) - k * TWO_PI_low;
        
            // Reduce to [-PI, PI]
            if (r > PI) r -= TWO_PI;
            else if (r < -PI) r += TWO_PI;
        
            // Fold to [-PI/2, PI/2] for better polynomial accuracy
            let sign = 1;
            if (r < -HALF_PI) {
                r = -PI - r;
                sign = -1;
            } else if (r > HALF_PI) {
                r = PI - r;
                sign = -1;
            }
        
            const x2 = r * r;
        
            // Degree-17 minimax for sine
            const s3 = -1.66666666666666657415e-1;
            const s5 = 8.33333333333333287074e-3;
            const s7 = -1.98412698412698412588e-4;
            const s9 = 2.75573192239858882532e-6;
            const s11 = -2.50521083854417116945e-8;
            const s13 = 1.60590438368216145994e-10;
            const s15 = -7.6471637318198164759e-13;
            const s17 = 2.8114572543455207632e-15;
        
            const sinPoly = 1 + x2 * (
                s3 + x2 * (
                    s5 + x2 * (
                        s7 + x2 * (
                            s9 + x2 * (
                                s11 + x2 * (
                                    s13 + x2 * (
                                        s15 + x2 * s17)))))));
        
            const sine = r * sinPoly;
        
            // Degree-16 minimax for cosine
            const c2 = -0.5;
            const c4 = 4.16666666666665929218e-2;
            const c6 = -1.38888888888730564116e-3;
            const c8 = 2.48015872888517045348e-5;
            const c10 = -2.75573141792967388112e-7;
            const c12 = 2.08757008419747316778e-9;
            const c14 = -1.13585365213876817300e-11;
            const c16 = 4.77947733238738529744e-14;
        
            const cosPoly = 1 + x2 * (
                c2 + x2 * (
                    c4 + x2 * (
                        c6 + x2 * (
                            c8 + x2 * (
                                c10 + x2 * (
                                    c12 + x2 * (
                                        c14 + x2 * c16)))))));
        
            const cosine = cosPoly;
        
            // Prevent division by near-zero
            if (PureMath.absolute(cosine) < 1e-12) {
                return; // or ±Infinity if you prefer, depending on your domain
            }
        
            return sign * (sine / cosine);
        },

        ceiling(value) {
            const integer = value | 0;
            return value > integer ? integer + 1 : integer;
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
            return value1 < value2 ? value1 : value2;
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