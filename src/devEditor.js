const TILE_TYPES = ['floor', 'wall', 'door_locked', 'door_unlocked', 'obstacle'];

class DevEditor {
    constructor(game) {
        this.game = game;
        this.container = document.getElementById('map-editor');
        if (!this.container) return;
        this.gridEl = document.getElementById('map-editor-grid');
        this.tileSelect = document.getElementById('map-editor-type');
        this.exportBtn = document.getElementById('map-editor-export-btn');
        this.applyBtn = document.getElementById('map-editor-apply-btn');
        this.closeBtn = document.getElementById('map-editor-close-btn');
        this.outputArea = document.getElementById('map-editor-export-output');
        this.active = false;

        this.bindEvents();
    }

    bindEvents() {
        if (!this.container) return;
        this.gridEl.addEventListener('click', (e) => {
            const cell = e.target.closest('.editor-cell');
            if (!cell) return;
            const x = parseInt(cell.dataset.x, 10);
            const y = parseInt(cell.dataset.y, 10);
            const tileType = this.getSelectedTile();
            this.setTile(y, x, tileType);
        });

        this.exportBtn?.addEventListener('click', () => this.exportLayout());
        this.applyBtn?.addEventListener('click', () => this.applyChanges());
        this.closeBtn?.addEventListener('click', () => this.close());
    }

    getSelectedTile() {
        if (!this.tileSelect) return 'floor';
        return this.tileSelect.value;
    }

    setTile(y, x, type) {
        if (!this.tiles || !this.tiles[y]) return;
        this.tiles[y][x] = type;
        const cell = this.gridEl.querySelector(`[data-x="${x}"][data-y="${y}"]`);
        if (cell) {
            cell.textContent = this.getTileLabel(type);
            cell.dataset.type = type;
        }
    }

    getTileLabel(type) {
        switch (type) {
            case 'wall': return 'W';
            case 'door_locked': return 'D';
            case 'door_unlocked': return 'O';
            case 'obstacle': return 'X';
            default: return '';
        }
    }

    open() {
        if (!this.container) return;
        const tiles = this.game.gameState.mapSystem.tiles;
        this.tiles = tiles.map(row => [...row]);
        this.renderGrid();
        this.outputArea.value = '';
        this.container.classList.remove('hidden');
        this.active = true;
        this.wasPaused = this.game.gameState.isPaused;
        this.game.gameState.isPaused = true;
    }

    renderGrid() {
        this.gridEl.innerHTML = '';
        this.tiles.forEach((row, y) => {
            const rowEl = document.createElement('div');
            rowEl.className = 'editor-row';
            row.forEach((tile, x) => {
                const cell = document.createElement('button');
                cell.className = `editor-cell tile-${tile}`;
                cell.dataset.x = x;
                cell.dataset.y = y;
                cell.dataset.type = tile;
                cell.textContent = this.getTileLabel(tile);
                rowEl.appendChild(cell);
            });
            this.gridEl.appendChild(rowEl);
        });
    }

    applyChanges() {
        const mapSystem = this.game.gameState.mapSystem;
        mapSystem.tiles = this.tiles.map(row => [...row]);
        mapSystem.mapHeight = mapSystem.tiles.length;
        mapSystem.mapWidth = mapSystem.tiles[0] ? mapSystem.tiles[0].length : 0;
        this.game.gameState.notifyChange();
        this.game.showNotification('Map updated (dev)', 'info');
    }

    exportLayout() {
        if (!this.outputArea) return;
        const layout = [];
        this.tiles.forEach((row, y) => {
            row.forEach((tile, x) => {
                if (tile && tile !== 'floor') {
                    layout.push({ x, y, type: tile });
                }
            });
        });
        this.outputArea.value = JSON.stringify(layout, null, 2);
        this.outputArea.focus();
        this.outputArea.select();
    }

    close() {
        if (!this.container) return;
        this.container.classList.add('hidden');
        this.active = false;
        this.game.gameState.isPaused = this.wasPaused || false;
    }
}

export default DevEditor;
