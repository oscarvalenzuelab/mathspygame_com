export const ICON_CONFIG = {
    player: 'bi-person-fill',
    enemy: 'bi-shield-fill-x',
    bomb: 'bi-radioactive',
    loot: 'bi-briefcase-fill',
    key: 'bi-key-fill',
    money: 'bi-cash-coin',
    secret: 'bi-file-earmark-lock-fill',
    health: 'bi-heart-pulse-fill',
    door: 'bi-lock-fill',
    projectile: 'bi-circle-fill'
};

const TOTAL_LEVELS = 50;

const createLevelSpecs = () => {
    const specs = [];
    for (let level = 1; level <= TOTAL_LEVELS; level++) {
        const mathDifficulty = level <= 15 ? 1 : level <= 35 ? 2 : 3;
        specs.push({
            level,
            mathDifficulty,
            timeLimit: Math.max(70, 130 - level),
            enemies: Math.min(12, 2 + Math.floor(level / 2)),
            bombs: Math.min(5, 1 + Math.floor(level / 8)),
            loot: 1,
            keys: Math.max(1, 1 + Math.floor(level / 12)),
            secrets: level === 1 ? 0 : Math.max(1, 1 + Math.floor(level / 10)),
            money: Math.min(6, 2 + Math.floor(level / 4)),
            health: Math.max(1, 2 - Math.floor(level / 25))
        });
    }
    return specs;
};

export const LEVEL_ITEM_CONFIG = createLevelSpecs();
export const LEVEL_SETTINGS = {
    width: 30,
    height: 20,
    totalLevels: TOTAL_LEVELS,
    tileSize: 32
};
