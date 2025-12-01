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

        // Determine sprite dimensions (64x64 or fallback to 16x16 for old sprites)
        const spriteWidth = sprite.pixels.length || 64;
        const spriteHeight = sprite.pixels[0]?.length || 64;
        const pixelSize = size / spriteWidth;
        const pixels = sprite.pixels;

        for (let py = 0; py < spriteHeight; py++) {
            for (let px = 0; px < spriteWidth; px++) {
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

        // Determine sprite dimensions (64x64 or fallback to 16x16 for old sprites)
        const spriteWidth = sprite.pixels.length || 64;
        const spriteHeight = sprite.pixels[0]?.length || 64;
        
        const canvas = document.createElement('canvas');
        canvas.width = spriteWidth;
        canvas.height = spriteHeight;
        const ctx = canvas.getContext('2d');

        for (let y = 0; y < spriteHeight; y++) {
            for (let x = 0; x < spriteWidth; x++) {
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

