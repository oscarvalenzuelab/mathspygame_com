// Map/Tile system for levels
class MapSystem {
    constructor(canvasWidth, canvasHeight, tileSize = 40) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.tileSize = tileSize;
        this.mapWidth = Math.floor(canvasWidth / tileSize);
        this.mapHeight = Math.floor(canvasHeight / tileSize);
        this.tiles = [];
    }

    loadMap(mapData) {
        // mapData is a 2D array of tile types
        this.tiles = mapData.map(row => [...row]);
        this.mapWidth = this.tiles[0] ? this.tiles[0].length : 0;
        this.mapHeight = this.tiles.length;
    }

    getTile(x, y) {
        const tileX = Math.floor(x / this.tileSize);
        const tileY = Math.floor(y / this.tileSize);
        
        if (tileX < 0 || tileX >= this.mapWidth || tileY < 0 || tileY >= this.mapHeight) {
            return 'wall'; // Out of bounds = wall
        }
        
        return this.tiles[tileY] ? this.tiles[tileY][tileX] : 'wall';
    }

    isWall(x, y) {
        const tile = this.getTile(x, y);
        // door_unlocked and floor are passable, door_locked is not
        return tile === 'wall' || tile === 'obstacle' || tile === 'door_locked';
    }

    setTilesInRect(x, y, width, height, tileType) {
        // Update the tile grid for a rectangle defined in pixel coordinates
        const startTileX = Math.floor(x / this.tileSize);
        const endTileX = Math.floor((x + width - 1) / this.tileSize);
        const startTileY = Math.floor(y / this.tileSize);
        const endTileY = Math.floor((y + height - 1) / this.tileSize);

        for (let tileY = startTileY; tileY <= endTileY; tileY++) {
            if (tileY < 0 || tileY >= this.mapHeight) continue;
            for (let tileX = startTileX; tileX <= endTileX; tileX++) {
                if (tileX < 0 || tileX >= this.mapWidth) continue;
                if (!this.tiles[tileY]) continue;
                this.tiles[tileY][tileX] = tileType;
            }
        }
    }

    hasLineOfSight(startX, startY, endX, endY) {
        const dx = endX - startX;
        const dy = endY - startY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance === 0) return true;

        const steps = Math.ceil(distance / (this.tileSize / 2));
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const checkX = startX + dx * t;
            const checkY = startY + dy * t;

            if (this.isWall(checkX, checkY)) {
                return false;
            }
        }

        return true;
    }

    checkCollision(rect) {
        // Check multiple points across the rectangle for better collision detection
        const stepX = Math.max(1, Math.floor(rect.width / 3));
        const stepY = Math.max(1, Math.floor(rect.height / 3));
        
        for (let x = rect.x; x <= rect.x + rect.width; x += stepX) {
            for (let y = rect.y; y <= rect.y + rect.height; y += stepY) {
                if (this.isWall(x, y)) {
                    return true;
                }
            }
        }
        
        // Also check corners
        if (this.isWall(rect.x, rect.y) ||
            this.isWall(rect.x + rect.width, rect.y) ||
            this.isWall(rect.x, rect.y + rect.height) ||
            this.isWall(rect.x + rect.width, rect.y + rect.height)) {
            return true;
        }
        
        return false;
    }

    getValidPosition(x, y, width, height) {
        // Try to find a valid position near the requested position
        let newX = x;
        let newY = y;
        
        // Check if current position is valid
        const testRect = { x: newX, y: newY, width, height };
        if (!this.checkCollision(testRect)) {
            return { x: newX, y: newY };
        }

        // Try nearby positions
        const offsets = [
            { dx: 0, dy: 0 },
            { dx: this.tileSize, dy: 0 },
            { dx: -this.tileSize, dy: 0 },
            { dx: 0, dy: this.tileSize },
            { dx: 0, dy: -this.tileSize },
            { dx: this.tileSize, dy: this.tileSize },
            { dx: -this.tileSize, dy: -this.tileSize }
        ];

        for (const offset of offsets) {
            testRect.x = newX + offset.dx;
            testRect.y = newY + offset.dy;
            if (!this.checkCollision(testRect)) {
                return { x: testRect.x, y: testRect.y };
            }
        }

        // Default to a safe position
        return { x: this.tileSize, y: this.tileSize };
    }
}

export default MapSystem;
