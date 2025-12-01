// Sprite Manager for loading and using pixel art sprites
class SpriteManager {
    constructor() {
        this.sprites = new Map();
        this.spriteCache = new Map();
        this.loadSprites();
    }

    loadSprites() {
        if (typeof window === 'undefined' || !window.localStorage) return;

        const spriteTypes = ['player', 'enemy', 'bomb', 'loot', 'key', 'money', 'secret', 'door', 'projectile'];
        
        spriteTypes.forEach(type => {
            try {
                const key = `pixel_sprite_${type}`;
                const data = window.localStorage.getItem(key);
                
                if (data) {
                    const spriteData = JSON.parse(data);
                    this.sprites.set(type, spriteData);
                }
            } catch (error) {
                console.warn(`Failed to load sprite for ${type}`, error);
            }
        });
    }

    getSprite(type) {
        return this.sprites.get(type) || null;
    }

    renderSprite(ctx, type, x, y, size, rotation = 0) {
        const sprite = this.getSprite(type);
        if (!sprite || !sprite.pixels) {
            return false; // No custom sprite, use default
        }

        const pixelSize = size / 16; // 16x16 grid
        const pixels = sprite.pixels;

        for (let py = 0; py < 16; py++) {
            for (let px = 0; px < 16; px++) {
                const color = pixels[py] && pixels[py][px];
                if (color) {
                    ctx.fillStyle = color;
                    ctx.fillRect(
                        x + px * pixelSize,
                        y + py * pixelSize,
                        pixelSize,
                        pixelSize
                    );
                }
            }
        }

        return true; // Sprite rendered
    }

    exportSpriteAsImage(type) {
        const sprite = this.getSprite(type);
        if (!sprite) return null;

        const canvas = document.createElement('canvas');
        canvas.width = 16;
        canvas.height = 16;
        const ctx = canvas.getContext('2d');

        for (let y = 0; y < 16; y++) {
            for (let x = 0; x < 16; x++) {
                const color = sprite.pixels[y] && sprite.pixels[y][x];
                if (color) {
                    ctx.fillStyle = color;
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }

        return canvas;
    }
}

export default SpriteManager;

