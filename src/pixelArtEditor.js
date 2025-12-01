// Pixel Art Editor for creating custom sprites
class PixelArtEditor {
    constructor(game) {
        this.game = game;
        this.container = document.getElementById('pixel-art-editor');
        if (!this.container) return;
        
        this.canvas = document.getElementById('pixel-art-canvas');
        this.previewCanvas = document.getElementById('pixel-art-preview');
        this.gridSize = 16; // 16x16 pixel grid
        this.pixelSize = 20; // Size of each pixel on screen
        this.currentColor = '#4a90e2';
        this.pixels = [];
        this.spriteType = 'player';
        this.isDrawing = false;
        this.tool = 'pencil'; // pencil, fill, eraser
        
        this.setupEditor();
        this.setupColorPalette();
        this.setupTools();
        this.initializePixels();
    }

    setupEditor() {
        this.closeBtn = document.getElementById('pixel-art-close-btn');
        this.exportBtn = document.getElementById('pixel-art-export-btn');
        this.clearBtn = document.getElementById('pixel-art-clear-btn');
        this.spriteTypeSelect = document.getElementById('pixel-art-sprite-type');
        this.loadBtn = document.getElementById('pixel-art-load-btn');
        
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
                this.loadSprite();
            });
        }
        if (this.loadBtn) {
            this.loadBtn.addEventListener('click', () => this.loadSprite());
        }

        // Canvas drawing
        if (this.canvas) {
            this.ctx = this.canvas.getContext('2d');
            this.canvas.width = this.gridSize * this.pixelSize;
            this.canvas.height = this.gridSize * this.pixelSize;
            this.canvas.style.width = this.canvas.width + 'px';
            this.canvas.style.height = this.canvas.height + 'px';
            
            this.canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
            this.canvas.addEventListener('mousemove', (e) => this.draw(e));
            this.canvas.addEventListener('mouseup', () => this.stopDrawing());
            this.canvas.addEventListener('mouseleave', () => this.stopDrawing());
        }

        if (this.previewCanvas) {
            this.previewCtx = this.previewCanvas.getContext('2d');
            this.previewCanvas.width = this.gridSize;
            this.previewCanvas.height = this.gridSize;
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
        const x = Math.floor((e.clientX - rect.left) / this.pixelSize);
        const y = Math.floor((e.clientY - rect.top) / this.pixelSize);
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
        // Create export canvas at actual size
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

