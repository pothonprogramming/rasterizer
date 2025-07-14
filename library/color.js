const Color = {
    inverse255: 0.00392156862745098, // 1/255

    // Expects color in the format aabbggrr
    premultiplyColor(color) {
        const alpha = (color >>> 24) & 0xff;
        if (alpha === 0) return 0;
        const red = (((color & 0xff) * alpha + 127) / 255) | 0;
        const green = ((((color >>> 8) & 0xff) * alpha + 127) / 255) | 0;
        const blue = ((((color >>> 16) & 0xff) * alpha + 127) / 255) | 0;

        return (alpha << 24) | (blue << 16) | (green << 8) | red;
    },

    blendOverOpaqueBase(color, baseColor) {
        const alpha = (color >>> 24) & 0xff;
        const red = color & 0xff;
        const green = (color >>> 8) & 0xff;
        const blue = (color >>> 16) & 0xff;
    
        const baseRed = baseColor & 0xff;
        const baseGreen = (baseColor >>> 8) & 0xff;
        const baseBlue = (baseColor >>> 16) & 0xff;
    
        const inverseAlpha = 255 - alpha;
    
        const r = red + ((baseRed * inverseAlpha + 127) / 255) | 0;
        const g = green + ((baseGreen * inverseAlpha + 127) / 255) | 0;
        const b = blue + ((baseBlue * inverseAlpha + 127) / 255) | 0;
    
        return (0xff << 24) | (b << 16) | (g << 8) | r;
    }
}