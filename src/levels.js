import { LEVEL_ITEM_CONFIG, LEVEL_SETTINGS } from './gameConfig.js';
import { LEVEL_LAYOUTS } from './levelLayouts/layoutLoader.js?v=20231130';

const PLAYER_STARTS = [
    { x: 120, y: 240 },
    { x: 240, y: 600 },
    { x: 920, y: 280 }
];

const TILE_SIZE = LEVEL_SETTINGS.tileSize || 40;
const DEFAULT_SIZES = {
    player: { width: 30, height: 30 },
    bomb: { width: 30, height: 30 },
    loot: { width: 25, height: 25 },
    collectible: { width: 20, height: 20 },
    door: { width: TILE_SIZE, height: TILE_SIZE }
};

function resolveRect(definition = {}, fallback = {}) {
    const pickCoord = (primary, secondary, gridValue, defaultValue) => {
        if (typeof primary === 'number') return primary;
        if (typeof secondary === 'number') return secondary;
        if (typeof gridValue === 'number') return gridValue * TILE_SIZE;
        return defaultValue;
    };
    const pickSize = (primary, gridValue, defaultValue) => {
        if (typeof primary === 'number') return primary;
        if (typeof gridValue === 'number') return gridValue * TILE_SIZE;
        return defaultValue;
    };

    return {
        x: pickCoord(definition.x, definition.pixelX, definition.gridX, fallback.x ?? 0),
        y: pickCoord(definition.y, definition.pixelY, definition.gridY, fallback.y ?? 0),
        width: pickSize(definition.width ?? definition.pixelWidth, definition.gridWidth, fallback.width ?? DEFAULT_SIZES.collectible.width),
        height: pickSize(definition.height ?? definition.pixelHeight, definition.gridHeight, fallback.height ?? DEFAULT_SIZES.collectible.height)
    };
}

function resolvePoint(definition = {}, fallback = {}) {
    const rect = resolveRect(definition, fallback);
    return { x: rect.x, y: rect.y };
}

const ENEMY_SPAWNS = [
    { x: 200, y: 150, axis: 'x', range: 160 },
    { x: 520, y: 150, axis: 'x', range: 140 },
    { x: 840, y: 150, axis: 'y', range: 120 },
    { x: 240, y: 340, axis: 'x', range: 120 },
    { x: 520, y: 360, axis: 'y', range: 140 },
    { x: 820, y: 360, axis: 'x', range: 150 },
    { x: 200, y: 560, axis: 'y', range: 140 },
    { x: 480, y: 560, axis: 'x', range: 160 },
    { x: 760, y: 560, axis: 'y', range: 120 },
    { x: 350, y: 250, axis: 'x', range: 100 },
    { x: 650, y: 250, axis: 'y', range: 120 },
    { x: 350, y: 450, axis: 'x', range: 110 }
];

const BOMB_SPAWNS = [
    { x: 600, y: 400 },
    { x: 360, y: 280 },
    { x: 760, y: 520 },
    { x: 280, y: 520 },
    { x: 880, y: 320 }
];

const BOMB_OVERRIDES = {
    2: [{ x: 520, y: 600 }]
};

const LOOT_SPAWNS = [
    { x: 840, y: 520 },
    { x: 700, y: 120 },
    { x: 320, y: 620 },
    { x: 540, y: 420 }
];

const COLLECTIBLE_SPOTS = {
    key: [
        { x: 240, y: 200 },
        { x: 760, y: 220 },
        { x: 360, y: 520 },
        { x: 640, y: 540 }
    ],
    secret: [
        { x: 400, y: 500 },
        { x: 900, y: 200 },
        { x: 320, y: 320 },
        { x: 720, y: 600 }
    ],
    money: [
        { x: 220, y: 360 },
        { x: 480, y: 200 },
        { x: 680, y: 520 },
        { x: 920, y: 360 },
        { x: 520, y: 640 },
        { x: 320, y: 140 }
    ],
    health: [
        { x: 520, y: 320 },
        { x: 200, y: 640 },
        { x: 820, y: 420 },
        { x: 640, y: 180 }
    ]
};

const DOOR_SPOTS = [
    { x: 400, y: 200, requires: 'key' },
    { x: 720, y: 400, requires: 'secret' },
    { x: 240, y: 520, requires: 'secret' }
];

const DOOR_OVERRIDES = {
    2: [{ x: 360, y: 720, requires: 'key' }]
};

class LevelManager {
    constructor() {
        this.levels = this.generateLevels();
    }

    generateLevels() {
        const levels = {};
        LEVEL_ITEM_CONFIG.forEach(spec => {
            levels[spec.level] = this.buildLevel(spec);
        });
        return levels;
    }

    buildLevel(spec) {
        const missionConfig = LEVEL_LAYOUTS[spec.level] || {};
        const layout = this.composeLayout(spec.level);
        const map = this.createMap(LEVEL_SETTINGS.width, LEVEL_SETTINGS.height, layout);
        const defaultStart = this.getPlayerStart(spec.level);
        const playerStart = missionConfig.playerStart ? resolvePoint(missionConfig.playerStart, defaultStart) : defaultStart;
        const missionType = missionConfig.missionType || spec.missionType || 'defuse_bombs';
        const enemies = this.generateEnemies(spec);
        let interactiveObjects = this.buildInteractiveObjects(spec, missionConfig, missionType);
        interactiveObjects = this.applyMissionType(interactiveObjects, missionType, missionConfig);
        const collectibles = this.buildCollectibles(spec, missionConfig);
        const doors = this.buildDoors(spec, missionConfig);

        return {
            name: `Mission ${spec.level}`,
            mathDifficulty: spec.mathDifficulty,
            timeLimit: spec.timeLimit,
            map,
            playerStart,
            enemies,
            interactiveObjects,
            collectibles,
            doors,
            missionType
        };
    }

    composeLayout(level) {
        const override = LEVEL_LAYOUTS[level];
        if (override && Array.isArray(override.layout)) {
            return override.layout.map(tile => ({ ...tile }));
        }
        const baseBuilders = [this.buildLayoutA, this.buildLayoutB, this.buildLayoutC];
        const layout = baseBuilders[(level - 1) % baseBuilders.length].call(this);
        return this.addDynamicObstacles(layout, level);
    }

    addDynamicObstacles(layout, level) {
        const additions = layout.map(tile => ({ ...tile }));
        const extra = Math.min(10, 2 + Math.floor(level / 4));
        for (let i = 0; i < extra; i++) {
            additions.push({
                x: 4 + ((i * 3 + level) % (LEVEL_SETTINGS.width - 8)),
                y: 4 + ((level + i * 2) % (LEVEL_SETTINGS.height - 8)),
                type: 'obstacle'
            });
        }
        return additions;
    }

    getPlayerStart(level) {
        const template = PLAYER_STARTS[(level - 1) % PLAYER_STARTS.length];
        return { ...template };
    }

    generateEnemies(spec) {
        const count = Math.min(spec.enemies, ENEMY_SPAWNS.length);
        const enemies = [];
        for (let i = 0; i < count; i++) {
            const spawn = ENEMY_SPAWNS[i];
            const speedBoost = Math.floor(spec.level / 5) * 5;
            enemies.push({
                id: `enemy-${spec.level}-${i + 1}`,
                x: spawn.x,
                y: spawn.y,
                width: 25,
                height: 25,
                speed: 50 + speedBoost,
                direction: 1,
                patrolAxis: spawn.axis,
                patrolStart: spawn.axis === 'x' ? Math.max(60, spawn.x - spawn.range) : Math.max(40, spawn.y - spawn.range),
                patrolEnd: spawn.axis === 'x' ? Math.min(1100, spawn.x + spawn.range) : Math.min(760, spawn.y + spawn.range)
            });
        }
        return enemies;
    }

    generateBombs(spec) {
        const bombs = [];
        const count = Math.min(spec.bombs, BOMB_SPAWNS.length);
        const overrides = BOMB_OVERRIDES[spec.level] || [];
        for (let i = 0; i < count; i++) {
            const spawn = overrides[i] || BOMB_SPAWNS[i % BOMB_SPAWNS.length];
            bombs.push({
                id: `bomb-${spec.level}-${i + 1}`,
                type: 'bomb',
                x: spawn.x,
                y: spawn.y,
                width: 30,
                height: 30,
                active: true,
                solved: false,
                requires: 'intel'
            });
        }
        return bombs;
    }

    generateLoot(spec) {
        const loot = [];
        const count = Math.min(spec.loot, LOOT_SPAWNS.length);
        for (let i = 0; i < count; i++) {
            const spawn = LOOT_SPAWNS[i];
            loot.push({
                id: `intel-${spec.level}-${i + 1}`,
                type: 'loot',
                x: spawn.x,
                y: spawn.y,
                width: 25,
                height: 25,
                active: true,
                collected: false
            });
        }
        return loot;
    }

    buildInteractiveObjects(spec, missionConfig, missionType) {
        if (missionConfig && Array.isArray(missionConfig.interactiveObjects)) {
            return missionConfig.interactiveObjects.map((definition, index) =>
                this.createInteractiveObjectFromDefinition(spec.level, definition, index)
            );
        }
        const objects = [];
        if (missionType !== 'steal_secrets') {
            objects.push(...this.generateBombs(spec));
        }
        objects.push(...this.generateLoot(spec));
        return objects;
    }

    createInteractiveObjectFromDefinition(level, definition, index) {
        const type = definition.type || 'bomb';
        const lootTypes = ['loot', 'secret_asset'];
        const defaults = lootTypes.includes(type) ? DEFAULT_SIZES.loot : DEFAULT_SIZES.bomb;
        const rect = resolveRect(definition, defaults);
        const requires = definition.requires !== undefined ? definition.requires : (type === 'bomb' ? 'intel' : null);
        return {
            id: definition.id || `${type}-${level}-${index + 1}`,
            type,
            x: rect.x,
            y: rect.y,
            width: rect.width ?? defaults.width,
            height: rect.height ?? defaults.height,
            active: definition.active !== false,
            solved: false,
            collected: false,
            requires,
            requirementMessage: definition.requirementMessage,
            consumeRequirement: Boolean(definition.consumeRequirement)
        };
    }

    applyMissionType(interactiveObjects, missionType, missionConfig) {
        if (missionType === 'steal_secrets') {
            let assetIndex = 0;
            const labels = Array.isArray(missionConfig?.assetLabels) ? missionConfig.assetLabels : [];
            return interactiveObjects.map(obj => {
                if (obj.type === 'loot') {
                    const label = labels[assetIndex] || `Steal secret file #${assetIndex + 1}`;
                    const updated = {
                        ...obj,
                        type: 'secret_asset',
                        missionCritical: true,
                        displayName: label
                    };
                    assetIndex += 1;
                    return updated;
                }
                return obj;
            });
        }
        return interactiveObjects;
    }

    buildCollectibles(spec, missionConfig) {
        if (missionConfig && Array.isArray(missionConfig.collectibles)) {
            return missionConfig.collectibles.map((definition, index) =>
                this.createCollectibleFromDefinition(spec.level, definition, index)
            );
        }
        return this.generateDefaultCollectibles(spec);
    }

    createCollectibleFromDefinition(level, definition, index) {
        const rect = resolveRect(definition, DEFAULT_SIZES.collectible);
        const type = definition.type || 'key';
        return {
            id: definition.id || `${type}-${level}-${index + 1}`,
            type,
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height,
            collected: false
        };
    }

    generateDefaultCollectibles(spec) {
        const items = [];
        const addItems = (type, count, spots) => {
            const max = spots.length;
            if (!max) return;
            for (let i = 0; i < count; i++) {
                const spot = spots[i % max];
                const wrap = Math.floor(i / max);
                items.push({
                    id: `${type}-${spec.level}-${i + 1}`,
                    type,
                    x: Math.min(1080, spot.x + wrap * 20),
                    y: Math.min(720, spot.y + wrap * 20),
                    width: 20,
                    height: 20,
                    collected: false
                });
            }
        };

        addItems('key', spec.keys, COLLECTIBLE_SPOTS.key);
        addItems('secret', spec.secrets, COLLECTIBLE_SPOTS.secret);
        addItems('money', spec.money, COLLECTIBLE_SPOTS.money);
        addItems('health', spec.health, COLLECTIBLE_SPOTS.health);
        return items;
    }

    buildDoors(spec, missionConfig) {
        if (missionConfig && Array.isArray(missionConfig.doors)) {
            return missionConfig.doors.map((definition, index) =>
                this.createDoorFromDefinition(spec.level, definition, index)
            );
        }
        return this.generateDefaultDoors(spec);
    }

    createDoorFromDefinition(level, definition, index) {
        const rect = resolveRect(definition, DEFAULT_SIZES.door);
        return {
            id: definition.id || `door-${level}-${index + 1}`,
            x: rect.x,
            y: rect.y,
            width: rect.width ?? DEFAULT_SIZES.door.width,
            height: rect.height ?? DEFAULT_SIZES.door.height,
            requires: definition.requires || 'key',
            unlocked: !!definition.unlocked
        };
    }

    generateDefaultDoors(spec) {
        const doors = [];
        const thresholds = [0, 10, 25];
        thresholds.forEach((threshold, index) => {
            if (spec.level > threshold && DOOR_SPOTS[index]) {
                const door = DOOR_SPOTS[index];
                doors.push({
                    id: `door-${spec.level}-${index + 1}`,
                    x: door.x,
                    y: door.y,
                    width: 40,
                    height: 40,
                    requires: door.requires,
                    unlocked: false
                });
            }
        });

        const overrides = DOOR_OVERRIDES[spec.level] || [];
        overrides.forEach((door, idx) => {
            doors.push({
                id: `door-${spec.level}-override-${idx + 1}`,
                x: door.x,
                y: door.y,
                width: 40,
                height: 40,
                requires: door.requires,
                unlocked: false
            });
        });
        return doors;
    }

    buildLayoutA() {
        return [
            ...Array.from({ length: 8 }, (_, i) => ({ x: 10, y: 5 + i, type: 'wall' })),
            ...Array.from({ length: 8 }, (_, i) => ({ x: 20, y: 5 + i, type: 'wall' })),
            ...Array.from({ length: 11 }, (_, i) => ({ x: 10 + i, y: 5, type: 'wall' })),
            ...Array.from({ length: 11 }, (_, i) => ({ x: 10 + i, y: 13, type: 'wall' })),
            ...Array.from({ length: 6 }, (_, i) => ({ x: 5 + i, y: 10, type: 'wall' })),
            { x: 15, y: 8, type: 'obstacle' },
            { x: 15, y: 10, type: 'obstacle' }
        ];
    }

    buildLayoutB() {
        return [
            ...Array.from({ length: 6 }, (_, i) => ({ x: 8, y: 3 + i, type: 'wall' })),
            ...Array.from({ length: 6 }, (_, i) => ({ x: 15, y: 3 + i, type: 'wall' })),
            ...Array.from({ length: 8 }, (_, i) => ({ x: 8 + i, y: 3, type: 'wall' })),
            ...Array.from({ length: 8 }, (_, i) => ({ x: 8 + i, y: 9, type: 'wall' })),
            ...Array.from({ length: 6 }, (_, i) => ({ x: 18, y: 10 + i, type: 'wall' })),
            ...Array.from({ length: 6 }, (_, i) => ({ x: 25, y: 10 + i, type: 'wall' })),
            ...Array.from({ length: 8 }, (_, i) => ({ x: 18 + i, y: 10, type: 'wall' })),
            ...Array.from({ length: 8 }, (_, i) => ({ x: 18 + i, y: 16, type: 'wall' })),
            { x: 12, y: 6, type: 'obstacle' },
            { x: 22, y: 13, type: 'obstacle' },
            { x: 22, y: 15, type: 'obstacle' }
        ];
    }

    buildLayoutC() {
        return [
            ...Array.from({ length: 8 }, (_, i) => ({ x: 5, y: 2 + i, type: 'wall' })),
            ...Array.from({ length: 8 }, (_, i) => ({ x: 12, y: 2 + i, type: 'wall' })),
            ...Array.from({ length: 8 }, (_, i) => ({ x: 5 + i, y: 2, type: 'wall' })),
            ...Array.from({ length: 8 }, (_, i) => ({ x: 5 + i, y: 10, type: 'wall' })),
            ...Array.from({ length: 6 }, (_, i) => ({ x: 15, y: 5 + i, type: 'wall' })),
            ...Array.from({ length: 6 }, (_, i) => ({ x: 22, y: 5 + i, type: 'wall' })),
            ...Array.from({ length: 8 }, (_, i) => ({ x: 15 + i, y: 5, type: 'wall' })),
            ...Array.from({ length: 8 }, (_, i) => ({ x: 15 + i, y: 11, type: 'wall' })),
            ...Array.from({ length: 6 }, (_, i) => ({ x: 8, y: 12 + i, type: 'wall' })),
            ...Array.from({ length: 6 }, (_, i) => ({ x: 18, y: 12 + i, type: 'wall' })),
            ...Array.from({ length: 11 }, (_, i) => ({ x: 8 + i, y: 12, type: 'wall' })),
            ...Array.from({ length: 11 }, (_, i) => ({ x: 8 + i, y: 18, type: 'wall' })),
            { x: 8, y: 5, type: 'obstacle' },
            { x: 10, y: 7, type: 'obstacle' },
            { x: 18, y: 8, type: 'obstacle' },
            { x: 20, y: 8, type: 'obstacle' },
            { x: 12, y: 15, type: 'obstacle' },
            { x: 15, y: 15, type: 'obstacle' }
        ];
    }

    createMap(width, height, layout) {
        const map = [];
        for (let y = 0; y < height; y++) {
            const row = [];
            for (let x = 0; x < width; x++) {
                if (y === 0 || y === height - 1 || x === 0 || x === width - 1) {
                    row.push('wall');
                } else {
                    row.push('floor');
                }
            }
            map.push(row);
        }

        if (layout) {
            layout.forEach(({ x, y, type }) => {
                if (y >= 0 && y < height && x >= 0 && x < width) {
                    map[y][x] = type;
                }
            });
        }

        return map;
    }

    getLevel(levelNumber) {
        const clamped = Math.min(Math.max(1, levelNumber), LEVEL_SETTINGS.totalLevels);
        const level = this.levels[clamped];
        return this.cloneLevel(level);
    }

    cloneLevel(level) {
        return {
            ...level,
            map: level.map.map(row => [...row]),
            playerStart: { ...level.playerStart },
            enemies: level.enemies.map(enemy => ({ ...enemy })),
            interactiveObjects: level.interactiveObjects.map(obj => ({ ...obj })),
            collectibles: level.collectibles.map(item => ({ ...item })),
            doors: level.doors.map(door => ({ ...door }))
        };
    }

    getTotalLevels() {
        return LEVEL_SETTINGS.totalLevels;
    }
}

export default LevelManager;
