import { LEVEL_LAYOUTS } from './levelLayouts/layoutLoader.js?v=20231130';

const TILE_TYPES = ['floor', 'wall', 'door_locked', 'door_unlocked', 'obstacle'];
const COLLECTIBLE_TYPES = ['key', 'secret', 'money', 'health'];
const INTERACTIVE_TYPES = ['bomb', 'loot'];
const TOOL_BUTTONS = ['tiles', 'door', ...COLLECTIBLE_TYPES, ...INTERACTIVE_TYPES];

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
        this.objectList = document.getElementById('map-editor-object-list');
        this.objectButtons = Array.from(document.querySelectorAll('#map-editor-object-buttons .editor-tool-button'));
        this.activeTool = 'tiles';
        this.objects = { doors: [], collectibles: [], interactive: [] };
        this.tileSize = 40;
        this.currentLevel = 1;
        this.levelBlueprint = null;
        this.dragState = null;
        this.skipNextClick = false;
        this.wasPaused = false;

        this.objectModalEl = document.getElementById('editor-object-modal');
        this.objectModalTitle = document.getElementById('editor-object-modal-title');
        this.objectModalIdInput = document.getElementById('editor-object-id');
        this.objectModalTypeRow = document.getElementById('editor-object-type-row');
        this.objectModalTypeSelect = document.getElementById('editor-object-type');
        this.objectModalRequiresRow = document.getElementById('editor-object-requires-row');
        this.objectModalRequiresSelect = document.getElementById('editor-object-requires');
        this.objectModalLockRow = document.getElementById('editor-object-lock-row');
        this.objectModalLockedCheckbox = document.getElementById('editor-object-locked');
        this.objectModalLinkedInput = document.getElementById('editor-object-linked');
        this.objectModalSaveBtn = document.getElementById('editor-object-save-btn');
        this.objectModalDeleteBtn = document.getElementById('editor-object-delete-btn');
        this.objectModalCancelBtn = document.getElementById('editor-object-cancel-btn');
        this.modalContext = null;

        this.bindEvents();
        this.setActiveTool('tiles');
    }

    bindEvents() {
        if (!this.container) return;
        this.gridEl.addEventListener('click', (e) => this.onGridClick(e));
        this.gridEl.addEventListener('mousedown', (e) => this.onGridMouseDown(e));
        this.boundDragMove = (e) => this.onDragMove(e);
        this.boundDragEnd = (e) => this.onDragEnd(e);

        this.exportBtn?.addEventListener('click', () => this.exportLayout());
        this.applyBtn?.addEventListener('click', () => this.applyChanges());
        this.closeBtn?.addEventListener('click', () => this.close());

        this.objectButtons.forEach(btn => {
            btn.addEventListener('click', () => this.setActiveTool(btn.dataset.editorTool));
        });

        this.objectModalSaveBtn?.addEventListener('click', () => this.saveObjectModal());
        this.objectModalDeleteBtn?.addEventListener('click', () => this.deleteObjectFromModal());
        this.objectModalCancelBtn?.addEventListener('click', () => this.closeObjectModal());
    }

    setActiveTool(tool) {
        this.activeTool = tool;
        this.objectButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.editorTool === tool);
        });
    }

    getSelectedTile() {
        if (!this.tileSelect) return 'floor';
        return this.tileSelect.value;
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
        this.wasPaused = this.game.gameState.isPaused;
        this.game.gameState.isPaused = true;
        this.active = true;
    }

    loadObjects() {
        const mission = LEVEL_LAYOUTS[this.currentLevel] || {};
        const doors = Array.isArray(mission.doors) ? mission.doors : this.levelBlueprint?.doors || [];
        const interactive = Array.isArray(mission.interactiveObjects) ? mission.interactiveObjects : this.levelBlueprint?.interactiveObjects || [];
        const collectibles = Array.isArray(mission.collectibles) ? mission.collectibles : this.levelBlueprint?.collectibles || [];

        this.objects.doors = doors.map(door => this.normalizeDoor(door));
        this.objects.interactive = interactive.map(obj => this.normalizeInteractive(obj));
        this.objects.collectibles = collectibles.map(item => this.normalizeCollectible(item));
    }

    normalizeDoor(door) {
        return {
            id: door.id || '',
            gridX: typeof door.gridX === 'number' ? door.gridX : Math.round((door.x || 0) / this.tileSize),
            gridY: typeof door.gridY === 'number' ? door.gridY : Math.round((door.y || 0) / this.tileSize),
            gridWidth: typeof door.gridWidth === 'number' ? door.gridWidth : Math.max(1, Math.round((door.width || this.tileSize) / this.tileSize)),
            gridHeight: typeof door.gridHeight === 'number' ? door.gridHeight : Math.max(1, Math.round((door.height || this.tileSize) / this.tileSize)),
            requires: door.requires ?? 'key',
            unlocked: !!door.unlocked,
            linkedTo: door.linkedTo || ''
        };
    }

    normalizeInteractive(obj) {
        return {
            id: obj.id || '',
            type: obj.type || 'bomb',
            gridX: typeof obj.gridX === 'number' ? obj.gridX : Math.round((obj.x || 0) / this.tileSize),
            gridY: typeof obj.gridY === 'number' ? obj.gridY : Math.round((obj.y || 0) / this.tileSize),
            gridWidth: typeof obj.gridWidth === 'number' ? obj.gridWidth : Math.max(1, Math.round((obj.width || this.tileSize) / this.tileSize)),
            gridHeight: typeof obj.gridHeight === 'number' ? obj.gridHeight : Math.max(1, Math.round((obj.height || this.tileSize) / this.tileSize)),
            requires: obj.requires || (obj.type === 'bomb' ? 'intel' : null),
            linkedTo: obj.linkedTo || ''
        };
    }

    normalizeCollectible(item) {
        return {
            id: item.id || '',
            type: item.type || 'key',
            gridX: typeof item.gridX === 'number' ? item.gridX : Math.round((item.x || 0) / this.tileSize),
            gridY: typeof item.gridY === 'number' ? item.gridY : Math.round((item.y || 0) / this.tileSize),
            gridWidth: typeof item.gridWidth === 'number' ? item.gridWidth : Math.max(1, Math.round((item.width || this.tileSize / 2) / this.tileSize)),
            gridHeight: typeof item.gridHeight === 'number' ? item.gridHeight : Math.max(1, Math.round((item.height || this.tileSize / 2) / this.tileSize)),
            linkedTo: item.linkedTo || ''
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

    getTileLabel(type) {
        switch (type) {
            case 'wall': return 'W';
            case 'door_locked': return 'D';
            case 'door_unlocked': return 'O';
            case 'obstacle': return 'X';
            default: return '';
        }
    }

    getObjectLabelAt(gridX, gridY) {
        const door = this.objects.doors.find(item => this.pointInArea(gridX, gridY, item));
        if (door) return 'D';
        const interactive = this.objects.interactive.find(item => this.pointInArea(gridX, gridY, item));
        if (interactive) return interactive.type === 'loot' ? 'I' : 'B';
        const collectible = this.objects.collectibles.find(item => this.pointInArea(gridX, gridY, item));
        if (collectible) return collectible.type.toUpperCase().slice(0, 1);
        return '';
    }

    pointInArea(gridX, gridY, area) {
        const width = area.gridWidth || 1;
        const height = area.gridHeight || 1;
        return gridX >= area.gridX && gridX < area.gridX + width &&
            gridY >= area.gridY && gridY < area.gridY + height;
    }

    onGridClick(e) {
        if (this.skipNextClick) {
            this.skipNextClick = false;
            return;
        }
        const cell = e.target.closest('.editor-cell');
        if (!cell) return;
        const gridX = parseInt(cell.dataset.x, 10);
        const gridY = parseInt(cell.dataset.y, 10);
        const existing = this.findObjectAt(gridX, gridY);
        if (existing) {
            this.openObjectModal(existing.category, existing.index);
            return;
        }

        if (this.activeTool === 'tiles') {
            const tileType = this.getSelectedTile();
            this.setTile(gridY, gridX, tileType);
            return;
        }

        if (!TOOL_BUTTONS.includes(this.activeTool)) return;
        const created = this.createObjectForTool(this.activeTool, gridX, gridY);
        if (!created) return;
        const collection = this.getObjectCollection(created.category);
        collection.push(created.object);
        const index = collection.length - 1;
        this.renderGrid();
        this.renderObjectList();
        this.openObjectModal(created.category, index);
        this.skipNextClick = true;
    }

    onGridMouseDown(e) {
        const cell = e.target.closest('.editor-cell');
        if (!cell) return;
        const gridX = parseInt(cell.dataset.x, 10);
        const gridY = parseInt(cell.dataset.y, 10);
        const existing = this.findObjectAt(gridX, gridY);
        if (!existing) return;
        this.dragState = {
            category: existing.category,
            index: existing.index,
            startX: gridX,
            startY: gridY,
            lastX: gridX,
            lastY: gridY,
            dragging: false
        };
        document.addEventListener('mousemove', this.boundDragMove);
        document.addEventListener('mouseup', this.boundDragEnd);
    }

    onDragMove(e) {
        if (!this.dragState) return;
        const target = document.elementFromPoint(e.clientX, e.clientY);
        const cell = target?.closest('.editor-cell');
        if (!cell) return;
        const gridX = parseInt(cell.dataset.x, 10);
        const gridY = parseInt(cell.dataset.y, 10);
        if (gridX === this.dragState.lastX && gridY === this.dragState.lastY) return;
        this.dragState.dragging = true;
        this.updateObjectPosition(this.dragState.category, this.dragState.index, gridX, gridY);
        this.dragState.lastX = gridX;
        this.dragState.lastY = gridY;
        this.renderGrid();
    }

    onDragEnd() {
        if (!this.dragState) return;
        document.removeEventListener('mousemove', this.boundDragMove);
        document.removeEventListener('mouseup', this.boundDragEnd);
        const { dragging, category, index } = this.dragState;
        this.dragState = null;
        if (dragging) {
            this.renderObjectList();
            this.skipNextClick = true;
        } else {
            this.openObjectModal(category, index);
            this.skipNextClick = true;
        }
    }

    setTile(y, x, type) {
        if (!this.tiles || !this.tiles[y]) return;
        this.tiles[y][x] = type;
        this.updateCell(x, y);
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

    findObjectAt(gridX, gridY) {
        const doorIndex = this.objects.doors.findIndex(item => this.pointInArea(gridX, gridY, item));
        if (doorIndex >= 0) return { category: 'doors', index: doorIndex };
        const interactiveIndex = this.objects.interactive.findIndex(item => this.pointInArea(gridX, gridY, item));
        if (interactiveIndex >= 0) return { category: 'interactive', index: interactiveIndex };
        const collectibleIndex = this.objects.collectibles.findIndex(item => this.pointInArea(gridX, gridY, item));
        if (collectibleIndex >= 0) return { category: 'collectibles', index: collectibleIndex };
        return null;
    }

    createObjectForTool(tool, gridX, gridY) {
        if (tool === 'door') {
            return {
                category: 'doors',
                object: {
                    id: '',
                    gridX,
                    gridY,
                    gridWidth: 1,
                    gridHeight: 1,
                    requires: 'key',
                    unlocked: false,
                    linkedTo: ''
                }
            };
        }

        if (COLLECTIBLE_TYPES.includes(tool)) {
            return {
                category: 'collectibles',
                object: {
                    id: '',
                    type: tool,
                    gridX,
                    gridY,
                    gridWidth: 1,
                    gridHeight: 1,
                    linkedTo: ''
                }
            };
        }

        if (INTERACTIVE_TYPES.includes(tool)) {
            return {
                category: 'interactive',
                object: {
                    id: '',
                    type: tool,
                    gridX,
                    gridY,
                    gridWidth: 1,
                    gridHeight: 1,
                    requires: tool === 'bomb' ? 'intel' : null,
                    linkedTo: ''
                }
            };
        }
        return null;
    }

    getObjectCollection(category) {
        if (category === 'doors') return this.objects.doors;
        if (category === 'collectibles') return this.objects.collectibles;
        return this.objects.interactive;
    }

    updateObjectPosition(category, index, gridX, gridY) {
        const collection = this.getObjectCollection(category);
        const obj = collection[index];
        if (!obj) return;
        const maxX = Math.max(0, this.tiles[0].length - (obj.gridWidth || 1));
        const maxY = Math.max(0, this.tiles.length - (obj.gridHeight || 1));
        obj.gridX = Math.min(Math.max(0, gridX), maxX);
        obj.gridY = Math.min(Math.max(0, gridY), maxY);
    }

    openObjectModal(category, index) {
        if (!this.objectModalEl) return;
        this.modalContext = { category, index };
        const obj = this.getObjectCollection(category)[index];
        if (!obj) return;
        const titleType = category === 'doors' ? 'Door' : (category === 'collectibles' ? 'Collectible' : obj.type === 'loot' ? 'Intel Briefcase' : 'Bomb');
        this.objectModalTitle.textContent = `Edit ${titleType}`;
        this.objectModalIdInput.value = obj.id || '';
        this.objectModalLinkedInput.value = obj.linkedTo || '';

        // Type row
        if (category === 'collectibles') {
            this.populateTypeSelect(COLLECTIBLE_TYPES, obj.type);
            this.objectModalTypeRow.classList.remove('hidden');
        } else if (category === 'interactive') {
            this.populateTypeSelect(INTERACTIVE_TYPES, obj.type);
            this.objectModalTypeRow.classList.remove('hidden');
        } else {
            this.objectModalTypeRow.classList.add('hidden');
        }

        // Requirements and lock rows
        if (category === 'doors') {
            this.objectModalRequiresRow.classList.remove('hidden');
            this.objectModalRequiresSelect.value = obj.requires || '';
            this.objectModalLockRow.classList.remove('hidden');
            this.objectModalLockedCheckbox.checked = !obj.unlocked;
        } else if (category === 'interactive') {
            this.objectModalRequiresRow.classList.remove('hidden');
            this.objectModalRequiresSelect.value = obj.requires || '';
            this.objectModalLockRow.classList.add('hidden');
        } else {
            this.objectModalRequiresRow.classList.add('hidden');
            this.objectModalLockRow.classList.add('hidden');
        }

        this.objectModalEl.classList.remove('hidden');
    }

    closeObjectModal() {
        if (!this.objectModalEl) return;
        this.objectModalEl.classList.add('hidden');
        this.modalContext = null;
    }

    populateTypeSelect(options, value) {
        this.objectModalTypeSelect.innerHTML = '';
        options.forEach(opt => {
            const optionEl = document.createElement('option');
            optionEl.value = opt;
            optionEl.textContent = opt.charAt(0).toUpperCase() + opt.slice(1);
            if (opt === value) optionEl.selected = true;
            this.objectModalTypeSelect.appendChild(optionEl);
        });
    }

    saveObjectModal() {
        if (!this.modalContext) return;
        const { category, index } = this.modalContext;
        const collection = this.getObjectCollection(category);
        const obj = collection[index];
        if (!obj) return;
        obj.id = this.objectModalIdInput.value.trim();
        obj.linkedTo = this.objectModalLinkedInput.value.trim();

        if (category === 'collectibles') {
            obj.type = this.objectModalTypeSelect.value || obj.type;
        } else if (category === 'interactive') {
            obj.type = this.objectModalTypeSelect.value || obj.type;
            obj.requires = this.objectModalRequiresSelect.value || null;
        } else if (category === 'doors') {
            obj.requires = this.objectModalRequiresSelect.value || null;
            obj.unlocked = !this.objectModalLockedCheckbox.checked;
        }

        this.renderGrid();
        this.renderObjectList();
        this.closeObjectModal();
    }

    deleteObjectFromModal() {
        if (!this.modalContext) return;
        const { category, index } = this.modalContext;
        const collection = this.getObjectCollection(category);
        collection.splice(index, 1);
        this.renderGrid();
        this.renderObjectList();
        this.closeObjectModal();
    }

    renderObjectList() {
        if (!this.objectList) return;
        const entries = [];
        if (this.objects.doors.length) {
            entries.push('<strong>Doors</strong>');
            this.objects.doors.forEach((door, idx) => {
                const req = door.requires ? `requires ${door.requires}` : 'no requirement';
                const lockStatus = door.unlocked ? 'unlocked' : 'locked';
                const linked = door.linkedTo ? `linked to ${door.linkedTo}` : 'no link';
                entries.push(`Door ${idx + 1}: (${door.gridX}, ${door.gridY}) ${req} (${lockStatus}) - ${linked}`);
            });
        }
        if (this.objects.collectibles.length) {
            entries.push('<strong>Collectibles</strong>');
            this.objects.collectibles.forEach((item, idx) => {
                const linked = item.linkedTo ? `linked to ${item.linkedTo}` : 'no link';
                entries.push(`${item.type} ${idx + 1}: (${item.gridX}, ${item.gridY}) - ${linked}`);
            });
        }
        if (this.objects.interactive.length) {
            entries.push('<strong>Interactive Objects</strong>');
            this.objects.interactive.forEach((obj, idx) => {
                const req = obj.requires ? `requires ${obj.requires}` : 'no requirement';
                const linked = obj.linkedTo ? `linked to ${obj.linkedTo}` : 'no link';
                entries.push(`${obj.type} ${idx + 1}: (${obj.gridX}, ${obj.gridY}) ${req} - ${linked}`);
            });
        }
        this.objectList.innerHTML = entries.length ? entries.map(line => `<div>${line}</div>`).join('') : '<em>No mission objects placed yet.</em>';
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
                requires: door.requires || null,
                unlocked: !!door.unlocked
            };
            if (door.id) entry.id = door.id;
            if (door.linkedTo) entry.linkedTo = door.linkedTo;
            return entry;
        });
    }

    serializeCollectibles() {
        return this.objects.collectibles.map(item => {
            const entry = {
                type: item.type,
                gridX: item.gridX,
                gridY: item.gridY,
                gridWidth: item.gridWidth || 1,
                gridHeight: item.gridHeight || 1
            };
            if (item.id) entry.id = item.id;
            if (item.linkedTo) entry.linkedTo = item.linkedTo;
            return entry;
        });
    }

    serializeInteractive() {
        return this.objects.interactive.map(obj => {
            const entry = {
                type: obj.type,
                gridX: obj.gridX,
                gridY: obj.gridY,
                gridWidth: obj.gridWidth || 1,
                gridHeight: obj.gridHeight || 1,
                requires: obj.requires || null
            };
            if (obj.id) entry.id = obj.id;
            if (obj.linkedTo) entry.linkedTo = obj.linkedTo;
            return entry;
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

    close() {
        if (!this.container) return;
        this.container.classList.add('hidden');
        this.active = false;
        this.game.gameState.isPaused = this.wasPaused || false;
        this.closeObjectModal();
        this.setActiveTool('tiles');
    }
}

export default DevEditor;
