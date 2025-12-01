// Pixel Art Editor for creating custom sprites
class PixelArtEditor {
    constructor(game) {
        this.game = game;
        this.container = document.getElementById('pixel-art-editor');
        if (!this.container) return;
        
        this.canvas = document.getElementById('pixel-art-canvas');
        this.previewCanvas = document.getElementById('pixel-art-preview');
        this.gridSize = 64; // 64x64 pixel grid
        this.pixelSize = 5; // Size of each pixel on screen (5px * 64 = 320px canvas)
        this.currentColor = '#4a90e2';
        this.pixels = [];
        this.spriteType = 'player';
        this.isDrawing = false;
        this.tool = 'pencil'; // pencil, fill, eraser
        
        this.setupEditor();
        this.setupColorPalette();
        this.setupTools();
        this.initializePixels();
        this.templates = this.createTemplates();
    }

    createTemplates() {
        // Default pixel art templates for each sprite type
        return {
            player: this.createPlayerTemplate(),
            enemy: this.createEnemyTemplate(),
            bomb: this.createBombTemplate(),
            loot: this.createLootTemplate(),
            key: this.createKeyTemplate(),
            money: this.createMoneyTemplate(),
            secret: this.createSecretTemplate(),
            door: this.createDoorTemplate(),
            projectile: this.createProjectileTemplate()
        };
    }

    createPlayerTemplate() {
        // Simple player character (blue person) - 64x64
        const pixels = Array(64).fill(null).map(() => Array(64).fill(null));
        // Head (scaled up)
        for (let y = 8; y < 24; y++) {
            for (let x = 24; x < 40; x++) {
                pixels[y][x] = '#4a90e2';
            }
        }
        // Body
        for (let y = 24; y < 48; y++) {
            for (let x = 20; x < 44; x++) {
                pixels[y][x] = '#4a90e2';
            }
        }
        // Arms
        for (let y = 24; y < 40; y++) {
            for (let x = 12; x < 20; x++) {
                pixels[y][x] = '#4a90e2';
            }
            for (let x = 44; x < 52; x++) {
                pixels[y][x] = '#4a90e2';
            }
        }
        // Legs
        for (let y = 48; y < 64; y++) {
            for (let x = 24; x < 36; x++) {
                pixels[y][x] = '#4a90e2';
            }
            for (let x = 28; x < 40; x++) {
                pixels[y][x] = '#4a90e2';
            }
        }
        // Eyes
        for (let y = 12; y < 16; y++) {
            for (let x = 28; x < 32; x++) {
                pixels[y][x] = '#ffffff';
            }
            for (let x = 32; x < 36; x++) {
                pixels[y][x] = '#ffffff';
            }
        }
        // Eye pupils
        pixels[14][30] = '#000000';
        pixels[14][34] = '#000000';
        return pixels;
    }

    createEnemyTemplate() {
        // Simple enemy (red square with eyes) - 64x64
        const pixels = Array(64).fill(null).map(() => Array(64).fill(null));
        // Body
        for (let y = 12; y < 52; y++) {
            for (let x = 12; x < 52; x++) {
                pixels[y][x] = '#e74c3c';
            }
        }
        // Eyes
        for (let y = 20; y < 28; y++) {
            for (let x = 24; x < 28; x++) {
                pixels[y][x] = '#ffffff';
            }
            for (let x = 36; x < 40; x++) {
                pixels[y][x] = '#ffffff';
            }
        }
        // Eye pupils
        for (let y = 22; y < 26; y++) {
            for (let x = 26; x < 28; x++) {
                pixels[y][x] = '#000000';
            }
            for (let x = 38; x < 40; x++) {
                pixels[y][x] = '#000000';
            }
        }
        return pixels;
    }

    createBombTemplate() {
        // Bomb (black circle with fuse) - 64x64
        const pixels = Array(64).fill(null).map(() => Array(64).fill(null));
        // Fuse
        for (let y = 8; y < 16; y++) {
            for (let x = 30; x < 34; x++) {
                pixels[y][x] = '#8B4513';
            }
        }
        for (let y = 16; y < 20; y++) {
            for (let x = 28; x < 32; x++) {
                pixels[y][x] = '#8B4513';
            }
        }
        for (let x = 30; x < 34; x++) {
            pixels[20][x] = '#ff4444';
        }
        // Bomb body (circle approximation)
        const centerX = 32;
        const centerY = 40;
        const radius = 16;
        for (let y = 24; y < 56; y++) {
            for (let x = 16; x < 48; x++) {
                const dx = x - centerX;
                const dy = y - centerY;
                if (dx * dx + dy * dy < radius * radius) {
                    pixels[y][x] = '#1a1a1a';
                }
            }
        }
        // Highlight
        for (let y = 28; y < 36; y++) {
            for (let x = 28; x < 36; x++) {
                const dx = x - 32;
                const dy = y - 32;
                if (dx * dx + dy * dy < 16) {
                    pixels[y][x] = '#333';
                }
            }
        }
        return pixels;
    }

    createLootTemplate() {
        // Briefcase (brown rectangle with handle) - 64x64
        const pixels = Array(64).fill(null).map(() => Array(64).fill(null));
        // Handle
        for (let y = 12; y < 16; y++) {
            for (let x = 24; x < 40; x++) {
                pixels[y][x] = '#8B4513';
            }
        }
        // Body
        for (let y = 16; y < 48; y++) {
            for (let x = 16; x < 48; x++) {
                pixels[y][x] = '#f39c12';
            }
        }
        // Lock
        for (let y = 28; y < 36; y++) {
            for (let x = 28; x < 36; x++) {
                pixels[y][x] = '#ffd700';
            }
        }
        // Lock detail
        for (let x = 30; x < 34; x++) {
            pixels[32][x] = '#1a1a1a';
        }
        return pixels;
    }

    createKeyTemplate() {
        // Key (gold key shape) - 64x64
        const pixels = Array(64).fill(null).map(() => Array(64).fill(null));
        // Key head (circle)
        const headCenterX = 24;
        const headCenterY = 24;
        const headRadius = 12;
        for (let y = 12; y < 36; y++) {
            for (let x = 12; x < 36; x++) {
                const dx = x - headCenterX;
                const dy = y - headCenterY;
                if (dx * dx + dy * dy < headRadius * headRadius) {
                    pixels[y][x] = '#ffd700';
                }
            }
        }
        // Key head hole
        for (let y = 20; y < 28; y++) {
            for (let x = 20; x < 28; x++) {
                const dx = x - 24;
                const dy = y - 24;
                if (dx * dx + dy * dy < 9) {
                    pixels[y][x] = null;
                }
            }
        }
        // Key shaft
        for (let y = 24; y < 52; y++) {
            for (let x = 22; x < 26; x++) {
                pixels[y][x] = '#ffd700';
            }
        }
        // Key teeth
        for (let y = 40; y < 48; y++) {
            for (let x = 20; x < 24; x++) {
                pixels[y][x] = '#ffd700';
            }
        }
        for (let y = 48; y < 56; y++) {
            for (let x = 24; x < 28; x++) {
                pixels[y][x] = '#ffd700';
            }
        }
        return pixels;
    }

    createMoneyTemplate() {
        // Coin (green circle with $) - 64x64
        const pixels = Array(64).fill(null).map(() => Array(64).fill(null));
        // Coin body
        const centerX = 32;
        const centerY = 32;
        const radius = 24;
        for (let y = 8; y < 56; y++) {
            for (let x = 8; x < 56; x++) {
                const dx = x - centerX;
                const dy = y - centerY;
                if (dx * dx + dy * dy < radius * radius) {
                    pixels[y][x] = '#4CAF50';
                }
            }
        }
        // $ symbol (simplified)
        for (let y = 24; y < 40; y++) {
            for (let x = 28; x < 32; x++) {
                pixels[y][x] = '#ffffff';
            }
        }
        for (let x = 26; x < 34; x++) {
            pixels[26][x] = '#ffffff';
            pixels[30][x] = '#ffffff';
            pixels[38][x] = '#ffffff';
        }
        for (let y = 28; y < 36; y++) {
            pixels[y][30] = '#ffffff';
        }
        return pixels;
    }

    createSecretTemplate() {
        // Document (white paper with lines) - 64x64
        const pixels = Array(64).fill(null).map(() => Array(64).fill(null));
        // Paper
        for (let y = 8; y < 56; y++) {
            for (let x = 12; x < 52; x++) {
                pixels[y][x] = '#ffffff';
            }
        }
        // Text lines
        for (let x = 16; x < 48; x++) {
            for (let y = 20; y < 24; y++) {
                pixels[y][x] = '#000000';
            }
            for (let y = 28; y < 32; y++) {
                pixels[y][x] = '#000000';
            }
            for (let y = 36; y < 40; y++) {
                pixels[y][x] = '#000000';
            }
        }
        // Lock icon
        for (let y = 40; y < 48; y++) {
            for (let x = 28; x < 36; x++) {
                pixels[y][x] = '#9c27b0';
            }
        }
        // Lock detail
        for (let x = 30; x < 34; x++) {
            pixels[44][x] = '#1a1a1a';
        }
        return pixels;
    }

    createDoorTemplate() {
        // Door (brown rectangle with lock) - 64x64
        const pixels = Array(64).fill(null).map(() => Array(64).fill(null));
        // Door frame
        for (let y = 4; y < 60; y++) {
            for (let x = 8; x < 56; x++) {
                pixels[y][x] = '#8B4513';
            }
        }
        // Door panel
        for (let y = 8; y < 56; y++) {
            for (let x = 12; x < 52; x++) {
                pixels[y][x] = '#654321';
            }
        }
        // Door panels (wood grain effect)
        for (let y = 12; y < 52; y += 8) {
            for (let x = 16; x < 48; x++) {
                pixels[y][x] = '#543210';
            }
        }
        // Lock
        for (let y = 28; y < 36; y++) {
            for (let x = 28; x < 36; x++) {
                pixels[y][x] = '#ffd700';
            }
        }
        // Lock detail
        for (let x = 30; x < 34; x++) {
            pixels[36][x] = '#ffd700';
        }
        return pixels;
    }

    createProjectileTemplate() {
        // Projectile (yellow circle) - 64x64
        const pixels = Array(64).fill(null).map(() => Array(64).fill(null));
        // Bullet
        const centerX = 32;
        const centerY = 32;
        const radius = 12;
        for (let y = 20; y < 44; y++) {
            for (let x = 20; x < 44; x++) {
                const dx = x - centerX;
                const dy = y - centerY;
                if (dx * dx + dy * dy < radius * radius) {
                    pixels[y][x] = '#ffeb3b';
                }
            }
        }
        // Highlight
        for (let y = 24; y < 32; y++) {
            for (let x = 28; x < 36; x++) {
                const dx = x - 32;
                const dy = y - 28;
                if (dx * dx + dy * dy < 9) {
                    pixels[y][x] = '#fff59d';
                }
            }
        }
        return pixels;
    }

    setupEditor() {
        this.closeBtn = document.getElementById('pixel-art-close-btn');
        this.exportBtn = document.getElementById('pixel-art-export-btn');
        this.clearBtn = document.getElementById('pixel-art-clear-btn');
        this.spriteTypeSelect = document.getElementById('pixel-art-sprite-type');
        this.loadTemplateBtn = document.getElementById('pixel-art-load-template-btn');
        
        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', () => this.close());
        }
        if (this.exportBtn) {
            this.exportBtn.addEventListener('click', () => this.exportSprite());
        }
        if (this.clearBtn) {
            this.clearBtn.addEventListener('click', () => this.clearCanvas());
        }
        if (this.spriteTypeSelect) {
            this.spriteTypeSelect.addEventListener('change', (e) => {
                this.spriteType = e.target.value;
                // Auto-load saved sprite if available, otherwise start blank
                this.loadSprite();
            });
        }
        if (this.loadTemplateBtn) {
            this.loadTemplateBtn.addEventListener('click', () => this.loadTemplate());
        }

        // Canvas drawing
        if (this.canvas) {
            this.ctx = this.canvas.getContext('2d');
            this.canvas.width = this.gridSize * this.pixelSize;
            this.canvas.height = this.gridSize * this.pixelSize;
            // Don't set style width/height to avoid scaling issues - let CSS handle it
            // But ensure the canvas displays at the correct size
            this.canvas.style.width = this.canvas.width + 'px';
            this.canvas.style.height = this.canvas.height + 'px';
            this.canvas.style.imageRendering = 'pixelated';
            this.canvas.style.imageRendering = 'crisp-edges';
            
            this.canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
            this.canvas.addEventListener('mousemove', (e) => this.draw(e));
            this.canvas.addEventListener('mouseup', () => this.stopDrawing());
            this.canvas.addEventListener('mouseleave', () => this.stopDrawing());
        }

        if (this.previewCanvas) {
            this.previewCtx = this.previewCanvas.getContext('2d');
            this.previewCanvas.width = this.gridSize;
            this.previewCanvas.height = this.gridSize;
            // Scale preview to show at reasonable size
            this.previewCanvas.style.width = '128px';
            this.previewCanvas.style.height = '128px';
        }
    }

    setupColorPalette() {
        const palette = document.getElementById('pixel-art-palette');
        if (!palette) return;

        // Classic game color palette (Zelda-style)
        const colors = [
            '#000000', // Black
            '#ffffff', // White
            '#4a90e2', // Blue (player)
            '#e74c3c', // Red (enemy)
            '#f39c12', // Orange (gold)
            '#2ecc71', // Green
            '#9b59b6', // Purple
            '#1abc9c', // Teal
            '#e67e22', // Brown
            '#34495e', // Dark gray
            '#ecf0f1', // Light gray
            '#f1c40f', // Yellow
            '#e91e63', // Pink
            '#00bcd4', // Cyan
            '#8bc34a', // Light green
            '#ff9800', // Orange
        ];

        colors.forEach(color => {
            const swatch = document.createElement('div');
            swatch.className = 'color-swatch';
            swatch.style.backgroundColor = color;
            swatch.dataset.color = color;
            swatch.addEventListener('click', () => {
                this.currentColor = color;
                document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
                swatch.classList.add('active');
            });
            palette.appendChild(swatch);
        });

        // Set first color as active
        if (palette.firstChild) {
            palette.firstChild.classList.add('active');
            this.currentColor = colors[0];
        }
    }

    setupTools() {
        const toolButtons = document.querySelectorAll('[data-pixel-tool]');
        toolButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.tool = btn.dataset.pixelTool;
                toolButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });
    }

    initializePixels() {
        this.pixels = [];
        for (let y = 0; y < this.gridSize; y++) {
            const row = [];
            for (let x = 0; x < this.gridSize; x++) {
                row.push(null); // null = transparent
            }
            this.pixels.push(row);
        }
        this.drawGrid();
    }

    drawGrid() {
        if (!this.ctx) return;
        
        // Clear canvas
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw pixels
        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                const color = this.pixels[y][x];
                if (color) {
                    this.ctx.fillStyle = color;
                    this.ctx.fillRect(
                        x * this.pixelSize,
                        y * this.pixelSize,
                        this.pixelSize,
                        this.pixelSize
                    );
                }
            }
        }

        // Draw grid lines
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 1;
        for (let i = 0; i <= this.gridSize; i++) {
            const pos = i * this.pixelSize;
            // Vertical lines
            this.ctx.beginPath();
            this.ctx.moveTo(pos, 0);
            this.ctx.lineTo(pos, this.canvas.height);
            this.ctx.stroke();
            // Horizontal lines
            this.ctx.beginPath();
            this.ctx.moveTo(0, pos);
            this.ctx.lineTo(this.canvas.width, pos);
            this.ctx.stroke();
        }

        // Update preview
        this.updatePreview();
    }

    updatePreview() {
        if (!this.previewCtx) return;
        
        // Clear preview
        this.previewCtx.fillStyle = '#000';
        this.previewCtx.fillRect(0, 0, this.gridSize, this.gridSize);

        // Draw pixels at 1:1 scale
        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                const color = this.pixels[y][x];
                if (color) {
                    this.previewCtx.fillStyle = color;
                    this.previewCtx.fillRect(x, y, 1, 1);
                }
            }
        }
    }

    getPixelCoordinates(e) {
        const rect = this.canvas.getBoundingClientRect();
        // Calculate the scale factor between actual canvas size and displayed size
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        
        // Get mouse position relative to the canvas
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // Convert to canvas coordinates (accounting for scaling)
        const canvasX = mouseX * scaleX;
        const canvasY = mouseY * scaleY;
        
        // Convert to grid coordinates
        const x = Math.floor(canvasX / this.pixelSize);
        const y = Math.floor(canvasY / this.pixelSize);
        
        return { x, y };
    }

    startDrawing(e) {
        this.isDrawing = true;
        this.drawPixel(e);
    }

    draw(e) {
        if (!this.isDrawing) return;
        this.drawPixel(e);
    }

    drawPixel(e) {
        const { x, y } = this.getPixelCoordinates(e);
        if (x < 0 || x >= this.gridSize || y < 0 || y >= this.gridSize) return;

        if (this.tool === 'pencil') {
            this.pixels[y][x] = this.currentColor;
        } else if (this.tool === 'eraser') {
            this.pixels[y][x] = null;
        } else if (this.tool === 'fill') {
            this.fillArea(x, y, this.pixels[y][x], this.currentColor);
        }

        this.drawGrid();
    }

    fillArea(startX, startY, oldColor, newColor) {
        if (oldColor === newColor) return;
        
        const stack = [[startX, startY]];
        const visited = new Set();

        while (stack.length > 0) {
            const [x, y] = stack.pop();
            const key = `${x},${y}`;
            
            if (visited.has(key)) continue;
            if (x < 0 || x >= this.gridSize || y < 0 || y >= this.gridSize) continue;
            if (this.pixels[y][x] !== oldColor) continue;

            visited.add(key);
            this.pixels[y][x] = newColor;

            stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
        }
    }

    stopDrawing() {
        this.isDrawing = false;
    }

    clearCanvas() {
        if (confirm('Clear all pixels?')) {
            this.initializePixels();
        }
    }

    exportSprite() {
        // Create export canvas at actual size (64x64)
        const exportCanvas = document.createElement('canvas');
        exportCanvas.width = this.gridSize;
        exportCanvas.height = this.gridSize;
        const exportCtx = exportCanvas.getContext('2d');

        // Draw pixels
        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                const color = this.pixels[y][x];
                if (color) {
                    exportCtx.fillStyle = color;
                    exportCtx.fillRect(x, y, 1, 1);
                }
            }
        }

        // Convert to blob and download
        exportCanvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${this.spriteType}_sprite.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            // Also save to localStorage for game use
            this.saveSpriteToStorage();
            
            // Reload sprites in the game
            if (this.game && this.game.renderer && this.game.renderer.spriteManager) {
                this.game.renderer.spriteManager.loadSprites();
            }
            
            if (this.game) {
                this.game.showNotification(`Exported ${this.spriteType} sprite!`, 'info');
            }
        }, 'image/png');
    }

    saveSpriteToStorage() {
        if (typeof window === 'undefined' || !window.localStorage) return;
        
        try {
            const spriteData = {
                pixels: this.pixels,
                type: this.spriteType,
                timestamp: Date.now()
            };
            
            const key = `pixel_sprite_${this.spriteType}`;
            window.localStorage.setItem(key, JSON.stringify(spriteData));
        } catch (error) {
            console.warn('Failed to save sprite to storage', error);
        }
    }

    loadSprite() {
        if (typeof window === 'undefined' || !window.localStorage) {
            this.initializePixels();
            return;
        }

        try {
            const key = `pixel_sprite_${this.spriteType}`;
            const data = window.localStorage.getItem(key);
            
            if (data) {
                const spriteData = JSON.parse(data);
                this.pixels = spriteData.pixels || [];
                // Ensure correct size
                if (this.pixels.length !== this.gridSize) {
                    this.initializePixels();
                } else {
                    this.drawGrid();
                }
            } else {
                this.initializePixels();
            }
        } catch (error) {
            console.warn('Failed to load sprite', error);
            this.initializePixels();
        }
    }

    loadTemplate() {
        const template = this.templates[this.spriteType];
        if (template) {
            // Deep copy the template
            this.pixels = template.map(row => row.map(cell => cell));
            this.drawGrid();
            if (this.game) {
                this.game.showNotification(`Loaded ${this.spriteType} template`, 'info');
            }
        }
    }

    open(spriteType = 'player') {
        if (!this.container) return;
        
        this.spriteType = spriteType;
        if (this.spriteTypeSelect) {
            this.spriteTypeSelect.value = spriteType;
        }
        
        this.loadSprite();
        this.container.classList.remove('hidden');
        
        if (this.game) {
            this.game.gameState.isPaused = true;
        }
    }

    close() {
        if (!this.container) return;
        this.container.classList.add('hidden');
        
        if (this.game) {
            this.game.gameState.isPaused = false;
        }
    }
}

export default PixelArtEditor;

