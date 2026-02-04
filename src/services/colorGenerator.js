// Auto-generated distinct colors for grants using HSL color space

const HUES = [0, 30, 60, 120, 180, 210, 240, 270, 300, 330];

class ColorGenerator {
    constructor() {
        this.currentIndex = 0;
        this.usedColors = new Map();
    }

    getColorForGrant(grantId, isDark = false) {
        if (this.usedColors.has(grantId)) {
            return this.usedColors.get(grantId);
        }

        const hue = HUES[this.currentIndex % HUES.length];
        this.currentIndex++;

        const saturation = isDark ? 70 : 65;
        const lightness = isDark ? 55 : 50;

        const color = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
        this.usedColors.set(grantId, color);

        return color;
    }

    getVariant(grantId, lightnessAdjust = 0) {
        const baseColor = this.usedColors.get(grantId);
        if (!baseColor) return null;

        const match = baseColor.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
        if (!match) return baseColor;

        const [, hue, saturation, lightness] = match;
        const newLightness = Math.max(0, Math.min(100, parseInt(lightness) + lightnessAdjust));

        return `hsl(${hue}, ${saturation}%, ${newLightness}%)`;
    }

    reset() {
        this.currentIndex = 0;
        this.usedColors.clear();
    }

    removeGrant(grantId) {
        this.usedColors.delete(grantId);
    }
}

export const colorGenerator = new ColorGenerator();
