import { LEVEL_LAYOUTS } from './levelLayouts/layoutLoader.js?v=20231130';

const TILE_TYPES = ['floor', 'wall', 'door_locked', 'door_unlocked', 'obstacle'];
const COLLECTIBLE_TYPES = ['key', 'secret', 'money', 'health'];
const INTERACTIVE_TYPES = ['bomb', 'loot'];

class DevEditor {
    constructor(game) {
        this.game = game;
        this.container = document.getElementById('map-editor');
        if (!this.container) return;
        this.gridEl = document.getElementById('map-editor-grid');
        this.tileSelect = document.getElementById('map-editor-type');
        this.objectSelect = document.getElementById('map-editor-object-mode');
        this.objectRequiresSelect = document.getElementById('map-editor-object-requires');
        this.objectDoorLocked = document.getElementById('map-editor-door-locked');
        this.objectList = document.getElementById('map-editor-object-list');
        this.exportBtn = document.getElementById('map-editor-export-btn');
        this.applyBtn = document.getElementById('map-editor-apply-btn');
        this.closeBtn = document.getElementById('map-editor-close-btn');
        this.outputArea = document.getElementById('map-editor-export-output');
        this.active = false;
        this.objects = {
            doors: [],
            collectibles: [],
            interactive: []
        };
        this.currentLevel = 1;
        this.tileSize = 40;
        this.levelBlueprint = null;

        this.bindEvents();
    }

    bindEvents() {
        if (!this.container) return;
        this.gridEl.addEventListener('click', (e) => {
            const cell = e.target.closest('.editor-cell');
            if (!cell) return;
            const x = parseInt(cell.dataset.x, 10);
            const y = parseInt(cell.dataset.y, 10);
            const mode = this.getObjectMode();
            if (mode === 'tiles') {
                const tileType = this.getSelectedTile();
                this.setTile(y, x, tileType);
            } else {
                this.toggleObject(y, x, mode);
            }
        });

        this.exportBtn?.addEventListener('click', () => this.exportLayout());
        this.applyBtn?.addEventListener('click', () => this.applyChanges());
        this.closeBtn?.addEventListener('click', () => this.close());
        this.objectSelect?.addEventListener('change', () => this.updateObjectControls());
    }

    getSelectedTile() {
        if (!this.tileSelect) return 'floor';
        return this.tileSelect.value;
    }

    getObjectMode() {
        if (!this.objectSelect) return 'tiles';
        return this.objectSelect.value;
    }

    getRequirementValue() {
        if (!this.objectRequiresSelect) return '';
        return this.objectRequiresSelect.value;
    }

    setTile(y, x, type) {
        if (!this.tiles || !this.tiles[y]) return;
        this.tiles[y][x] = type;
        this.updateCell(x, y);
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
        this.currentLevel = this.game.gameState.currentLevel || 1;
        const tiles = this.game.gameState.mapSystem.tiles;
        this.tileSize = this.game.gameState.mapSystem.tileSize;
        this.tiles = tiles.map(row => [...row]);
        this.levelBlueprint = this.game.levelManager.getLevel(this.currentLevel);
        this.loadObjects();
        this.renderGrid();
        this.renderObjectList();
        this.outputArea.value = '';
        this.container.classList.remove('hidden');
        this.active = true;
        this.wasPaused = this.game.gameState.isPaused;
        this.game.gameState.isPaused = true;
        this.updateObjectControls();
    }

    loadObjects() {
        const mission = LEVEL_LAYOUTS[this.currentLevel] || {};
        const existingDoors = Array.isArray(mission.doors) ? mission.doors : this.levelBlueprint?.doors || [];
        const existingInteractives = Array.isArray(mission.interactiveObjects) ? mission.interactiveObjects : this.levelBlueprint?.interactiveObjects || [];
        const existingCollectibles = Array.isArray(mission.collectibles) ? mission.collectibles : this.levelBlueprint?.collectibles || [];

        this.objects.doors = existingDoors.map(door => this.normalizeDoor(door));
        this.objects.interactive = existingInteractives.map(obj => this.normalizeInteractive(obj));
        this.objects.collectibles = existingCollectibles.map(item => this.normalizeCollectible(item));
    }

    normalizeDoor(door) {
        const gridWidth = typeof door.gridWidth === 'number' ? door.gridWidth : Math.max(1, Math.round((door.width || this.tileSize) / this.tileSize));
        const gridHeight = typeof door.gridHeight === 'number' ? door.gridHeight : Math.max(1, Math.round((door.height || this.tileSize) / this.tileSize));
        return {
            id: door.id,
            gridX: typeof door.gridX === 'number' ? door.gridX : Math.round((door.x || 0) / this.tileSize),
            gridY: typeof door.gridY === 'number' ? door.gridY : Math.round((door.y || 0) / this.tileSize),
            gridWidth,
            gridHeight,
            requires: door.requires ?? 'key',
            unlocked: !!door.unlocked
        };
    }

    normalizeInteractive(obj) {
        return {
            id: obj.id,
            type: obj.type || 'bomb',
            gridX: typeof obj.gridX === 'number' ? obj.gridX : Math.round((obj.x || 0) / this.tileSize),
            gridY: typeof obj.gridY === 'number' ? obj.gridY : Math.round((obj.y || 0) / this.tileSize),
            gridWidth: typeof obj.gridWidth === 'number' ? obj.gridWidth : Math.max(1, Math.round((obj.width || this.tileSize) / this.tileSize)),
            gridHeight: typeof obj.gridHeight === 'number' ? obj.gridHeight : Math.max(1, Math.round((obj.height || this.tileSize) / this.tileSize)),
            requires: obj.requires || (obj.type === 'bomb' ? 'intel' : null)
        };
    }

    normalizeCollectible(item) {
        return {
            id: item.id,
            type: item.type || 'key',
            gridX: typeof item.gridX === 'number' ? item.gridX : Math.round((item.x || 0) / this.tileSize),
            gridY: typeof item.gridY === 'number' ? item.gridY : Math.round((item.y || 0) / this.tileSize),
            gridWidth: typeof item.gridWidth === 'number' ? item.gridWidth : Math.max(1, Math.round((item.width || this.tileSize / 2) / this.tileSize)),
            gridHeight: typeof item.gridHeight === 'number' ? item.gridHeight : Math.max(1, Math.round((item.height || this.tileSize / 2) / this.tileSize))
        };
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
                cell.innerHTML = '';
                const tileLabel = document.createElement('span');
                tileLabel.className = 'tile-label';
                tileLabel.textContent = this.getTileLabel(tile);
                cell.appendChild(tileLabel);
                const objectLabel = this.getObjectLabelAt(x, y);
                if (objectLabel) {
                    const objectSpan = document.createElement('span');
                    objectSpan.className = 'object-label';
                    objectSpan.textContent = objectLabel;
                    cell.appendChild(objectSpan);
                }
                rowEl.appendChild(cell);
            });
            this.gridEl.appendChild(rowEl);
        });
    }

    updateCell(x, y) {
        const cell = this.gridEl.querySelector(`[data-x="${x}"][data-y="${y}"]`);
        if (!cell) return;
        const tile = this.tiles[y][x];
        cell.className = `editor-cell tile-${tile}`;
        cell.innerHTML = '';
        const tileLabel = document.createElement('span');
        tileLabel.className = 'tile-label';
        tileLabel.textContent = this.getTileLabel(tile);
        cell.appendChild(tileLabel);
        const objectLabel = this.getObjectLabelAt(x, y);
        if (objectLabel) {
            const objectSpan = document.createElement('span');
            objectSpan.className = 'object-label';
            objectSpan.textContent = objectLabel;
            cell.appendChild(objectSpan);
        }
    }

    getObjectLabelAt(gridX, gridY) {
        if (this.objects.doors.some(door => this.pointInArea(gridX, gridY, door))) {
            return 'D';
        }
        const collectible = this.objects.collectibles.find(item => this.pointInArea(gridX, gridY, item));
        if (collectible) {
            return collectible.type.toUpperCase().slice(0, 1);
        }
        const interactive = this.objects.interactive.find(obj => this.pointInArea(gridX, gridY, obj));
        if (interactive) {
            return interactive.type === 'loot' ? 'I' : 'B';
        }
        return '';
    }

    pointInArea(gridX, gridY, area) {
        const width = area.gridWidth || 1;
        const height = area.gridHeight || 1;
        return gridX >= area.gridX && gridX < area.gridX + width &&
               gridY >= area.gridY && gridY < area.gridY + height;
    }

    toggleObject(gridY, gridX, mode) {
        if (mode === 'door') {
            const idx = this.objects.doors.findIndex(door => this.pointInArea(gridX, gridY, door));
            if (idx >= 0) {
                this.objects.doors.splice(idx, 1);
            } else {
                const requires = this.getRequirementValue() || 'key';
                const isLocked = this.objectDoorLocked ? this.objectDoorLocked.checked : true;
                this.objects.doors.push({
                    gridX,
                    gridY,
                    gridWidth: 1,
                    gridHeight: 1,
                    requires: requires || null,
                    unlocked: !isLocked
                });
            }
        } else if (COLLECTIBLE_TYPES.includes(mode)) {
            const idx = this.objects.collectibles.findIndex(item => item.type === mode && this.pointInArea(gridX, gridY, item));
            if (idx >= 0) {
                this.objects.collectibles.splice(idx, 1);
            } else {
                this.objects.collectibles.push({ type: mode, gridX, gridY, gridWidth: 1, gridHeight: 1 });
            }
        } else if (INTERACTIVE_TYPES.includes(mode)) {
            const idx = this.objects.interactive.findIndex(obj => obj.type === mode && this.pointInArea(gridX, gridY, obj));
            if (idx >= 0) {
                this.objects.interactive.splice(idx, 1);
            } else {
                const requires = this.getRequirementValue();
                this.objects.interactive.push({ type: mode, gridX, gridY, gridWidth: 1, gridHeight: 1, requires: requires || (mode === 'bomb' ? 'intel' : null) });
            }
        }
        this.updateCell(gridX, gridY);
        this.renderObjectList();
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

        const payload = { layout };
        if (this.levelBlueprint?.playerStart) {
            payload.playerStart = { x: this.levelBlueprint.playerStart.x, y: this.levelBlueprint.playerStart.y };
        }
        const doors = this.serializeDoors();
        if (doors.length) payload.doors = doors;
        const collectibles = this.serializeCollectibles();
        if (collectibles.length) payload.collectibles = collectibles;
        const interactive = this.serializeInteractive();
        if (interactive.length) payload.interactiveObjects = interactive;

        this.outputArea.value = JSON.stringify(payload, null, 2);
        this.outputArea.focus();
        this.outputArea.select();
    }

    serializeDoors() {
        return this.objects.doors.map(door => {
            const entry = {
                gridX: door.gridX,
                gridY: door.gridY,
                gridWidth: door.gridWidth || 1,
                gridHeight: door.gridHeight || 1,
                requires: door.requires || null
            };
            if (door.unlocked) {
                entry.unlocked = true;
            }
            return entry;
        });
    }

    serializeCollectibles() {
        return this.objects.collectibles.map(item => ({
            type: item.type,
            gridX: item.gridX,
            gridY: item.gridY,
            gridWidth: item.gridWidth || 1,
            gridHeight: item.gridHeight || 1
        }));
    }

    serializeInteractive() {
        return this.objects.interactive.map(obj => {
            const entry = {
                type: obj.type,
                gridX: obj.gridX,
                gridY: obj.gridY,
                gridWidth: obj.gridWidth || 1,
                gridHeight: obj.gridHeight || 1
            };
            if (obj.requires) {
                entry.requires = obj.requires;
            }
            return entry;
        });
    }

    renderObjectList() {
        if (!this.objectList) return;
        const lines = [];
        if (this.objects.doors.length) {
            lines.push('<strong>Doors</strong>');
            this.objects.doors.forEach((door, idx) => {
                const req = door.requires ? `requires ${door.requires}` : 'no requirement';
                const lockStatus = door.unlocked ? 'unlocked' : 'locked';
                lines.push(`Door ${idx + 1}: (${door.gridX}, ${door.gridY}) ${req} (${lockStatus})`);
            });
        }
        if (this.objects.collectibles.length) {
            lines.push('<strong>Collectibles</strong>');
            this.objects.collectibles.forEach((item, idx) => {
                lines.push(`${item.type} ${idx + 1}: (${item.gridX}, ${item.gridY})`);
            });
        }
        if (this.objects.interactive.length) {
            lines.push('<strong>Interactive Objects</strong>');
            this.objects.interactive.forEach((obj, idx) => {
                const req = obj.requires ? `requires ${obj.requires}` : 'no requirement';
                lines.push(`${obj.type} ${idx + 1}: (${obj.gridX}, ${obj.gridY}) ${req}`);
            });
        }
        if (!lines.length) {
            this.objectList.innerHTML = '<em>No mission objects placed yet.</em>';
        } else {
            this.objectList.innerHTML = lines.map(line => `<div>${line}</div>`).join('');
        }
    }

    updateObjectControls() {
        if (!this.objectSelect) return;
        const mode = this.getObjectMode();
        const requiresWrapper = document.getElementById('map-editor-object-requires-wrapper');
        const doorLockWrapper = document.getElementById('map-editor-door-lock-wrapper');
        if (requiresWrapper) {
            const needsRequirement = mode === 'door' || mode === 'bomb';
            requiresWrapper.classList.toggle('hidden', !needsRequirement);
        }
        if (doorLockWrapper) {
            doorLockWrapper.classList.toggle('hidden', mode !== 'door');
        }
    }

    close() {
        if (!this.container) return;
        this.container.classList.add('hidden');
        this.active = false;
        this.game.gameState.isPaused = this.wasPaused || false;
    }
}

export default DevEditor;
