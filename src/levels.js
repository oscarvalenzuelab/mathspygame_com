// Level definitions
class LevelManager {
    constructor() {
        this.levels = this.defineLevels();
    }

    // Helper to create map - 'w' = wall, 'f' = floor, 'o' = obstacle
    createMap(width, height, layout) {
        const map = [];
        for (let y = 0; y < height; y++) {
            const row = [];
            for (let x = 0; x < width; x++) {
                if (y === 0 || y === height - 1 || x === 0 || x === width - 1) {
                    row.push('wall'); // Border walls
                } else {
                    row.push('floor');
                }
            }
            map.push(row);
        }
        
        // Add doorways in perimeter walls (every 5 tiles, skip some for variety)
        // Top wall
        for (let x = 2; x < width - 2; x += 5) {
            if (x !== width / 2) map[0][x] = 'floor';
        }
        // Bottom wall
        for (let x = 2; x < width - 2; x += 5) {
            if (x !== width / 2) map[height - 1][x] = 'floor';
        }
        // Left wall
        for (let y = 2; y < height - 2; y += 5) {
            if (y !== height / 2) map[y][0] = 'floor';
        }
        // Right wall
        for (let y = 2; y < height - 2; y += 5) {
            if (y !== height / 2) map[y][width - 1] = 'floor';
        }
        
        // Apply layout pattern
        if (layout) {
            layout.forEach(({ x, y, type }) => {
                if (y >= 0 && y < height && x >= 0 && x < width) {
                    map[y][x] = type;
                }
            });
        }
        
        return map;
    }

    defineLevels() {
        // Level 1: Simple building with rooms
        const level1Map = this.createMap(30, 20, [
            // Room walls
            ...Array.from({ length: 8 }, (_, i) => ({ x: 10, y: 5 + i, type: 'wall' })),
            ...Array.from({ length: 8 }, (_, i) => ({ x: 20, y: 5 + i, type: 'wall' })),
            ...Array.from({ length: 11 }, (_, i) => ({ x: 10 + i, y: 5, type: 'wall' })),
            ...Array.from({ length: 11 }, (_, i) => ({ x: 10 + i, y: 13, type: 'wall' })),
            // Corridor
            ...Array.from({ length: 6 }, (_, i) => ({ x: 5 + i, y: 10, type: 'wall' })),
            // Obstacles
            { x: 15, y: 8, type: 'obstacle' },
            { x: 15, y: 10, type: 'obstacle' },
        ]);

        // Level 2: More complex base
        const level2Map = this.createMap(30, 20, [
            // Multiple rooms
            ...Array.from({ length: 6 }, (_, i) => ({ x: 8, y: 3 + i, type: 'wall' })),
            ...Array.from({ length: 6 }, (_, i) => ({ x: 15, y: 3 + i, type: 'wall' })),
            ...Array.from({ length: 8 }, (_, i) => ({ x: 8 + i, y: 3, type: 'wall' })),
            ...Array.from({ length: 8 }, (_, i) => ({ x: 8 + i, y: 9, type: 'wall' })),
            ...Array.from({ length: 6 }, (_, i) => ({ x: 18, y: 10 + i, type: 'wall' })),
            ...Array.from({ length: 6 }, (_, i) => ({ x: 25, y: 10 + i, type: 'wall' })),
            ...Array.from({ length: 8 }, (_, i) => ({ x: 18 + i, y: 10, type: 'wall' })),
            ...Array.from({ length: 8 }, (_, i) => ({ x: 18 + i, y: 16, type: 'wall' })),
            // Locked doors
            { x: 15, y: 6, type: 'door_locked' },
            { x: 25, y: 13, type: 'door_locked' },
            // Obstacles
            { x: 12, y: 6, type: 'obstacle' },
            { x: 22, y: 13, type: 'obstacle' },
            { x: 22, y: 15, type: 'obstacle' },
        ]);

        // Level 3: Complex final level
        const level3Map = this.createMap(30, 20, [
            // Multiple interconnected rooms
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
            // Locked doors
            { x: 12, y: 6, type: 'door_locked' },
            { x: 22, y: 8, type: 'door_locked' },
            { x: 18, y: 15, type: 'door_locked' },
            // Obstacles
            { x: 8, y: 5, type: 'obstacle' },
            { x: 10, y: 7, type: 'obstacle' },
            { x: 18, y: 8, type: 'obstacle' },
            { x: 20, y: 8, type: 'obstacle' },
            { x: 12, y: 15, type: 'obstacle' },
            { x: 15, y: 15, type: 'obstacle' },
        ]);

        return {
            1: {
                name: "Training Facility",
                map: level1Map,
                playerStart: { x: 120, y: 240 },
                enemies: [
                    {
                        id: "enemy-1",
                        x: 480,
                        y: 200,
                        width: 25,
                        height: 25,
                        speed: 50,
                        direction: 1,
                        patrolStart: 400,
                        patrolEnd: 600,
                        patrolAxis: "x"
                    },
                    {
                        id: "enemy-2",
                        x: 680,
                        y: 520,
                        width: 25,
                        height: 25,
                        speed: 60,
                        direction: 1,
                        patrolStart: 600,
                        patrolEnd: 800,
                        patrolAxis: "x"
                    }
                ],
                interactiveObjects: [
                    {
                        id: "bomb-1",
                        type: "bomb",
                        x: 600,
                        y: 400,
                        width: 30,
                        height: 30,
                        active: true,
                        solved: false
                    },
                    {
                        id: "intel-1",
                        type: "loot",
                        x: 840,
                        y: 520,
                        width: 25,
                        height: 25,
                        active: true,
                        collected: false
                    }
                ],
                collectibles: [
                    {
                        id: "key-1",
                        type: "key",
                        x: 240,
                        y: 200,
                        width: 20,
                        height: 20,
                        collected: false
                    },
                    {
                        id: "money-1",
                        type: "money",
                        x: 720,
                        y: 240,
                        width: 20,
                        height: 20,
                        collected: false
                    },
                    {
                        id: "medkit-1",
                        type: "health",
                        x: 520,
                        y: 360,
                        width: 22,
                        height: 22,
                        collected: false
                    }
                ],
                doors: [
                    {
                        id: "door-1",
                        x: 400,
                        y: 200,
                        width: 40,
                        height: 40,
                        requires: "key",
                        unlocked: false
                    }
                ]
            },
            2: {
                name: "Secret Base",
                map: level2Map,
                playerStart: { x: 200, y: 240 },
                enemies: [
                    {
                        id: "enemy-1",
                        x: 200,
                        y: 150,
                        width: 25,
                        height: 25,
                        speed: 55,
                        direction: 1,
                        patrolStart: 150,
                        patrolEnd: 350,
                        patrolAxis: "x"
                    },
                    {
                        id: "enemy-2",
                        x: 500,
                        y: 300,
                        width: 25,
                        height: 25,
                        speed: 45,
                        direction: -1,
                        patrolStart: 300,
                        patrolEnd: 600,
                        patrolAxis: "x"
                    },
                    {
                        id: "enemy-3",
                        x: 400,
                        y: 100,
                        width: 25,
                        height: 25,
                        speed: 40,
                        direction: 1,
                        patrolStart: 100,
                        patrolEnd: 500,
                        patrolAxis: "y"
                    }
                ],
                interactiveObjects: [
                    {
                        id: "bomb-1",
                        type: "bomb",
                        x: 350,
                        y: 250,
                        width: 30,
                        height: 30,
                        active: true,
                        solved: false
                    },
                    {
                        id: "bomb-2",
                        type: "bomb",
                        x: 650,
                        y: 400,
                        width: 30,
                        height: 30,
                        active: true,
                        solved: false
                    },
                    {
                        id: "intel-1",
                        type: "loot",
                        x: 700,
                        y: 100,
                        width: 25,
                        height: 25,
                        active: true,
                        collected: false
                    }
                ],
                collectibles: [
                    {
                        id: "key-1",
                        type: "key",
                        x: 250,
                        y: 400,
                        width: 20,
                        height: 20,
                        collected: false
                    },
                    {
                        id: "key-2",
                        type: "key",
                        x: 550,
                        y: 150,
                        width: 20,
                        height: 20,
                        collected: false
                    },
                    {
                        id: "money-1",
                        type: "money",
                        x: 100,
                        y: 300,
                        width: 20,
                        height: 20,
                        collected: false
                    },
                    {
                        id: "money-2",
                        type: "money",
                        x: 600,
                        y: 500,
                        width: 20,
                        height: 20,
                        collected: false
                    },
                    {
                        id: "secret-1",
                        type: "secret",
                        x: 400,
                        y: 500,
                        width: 20,
                        height: 20,
                        collected: false
                    },
                    {
                        id: "medkit-1",
                        type: "health",
                        x: 150,
                        y: 230,
                        width: 22,
                        height: 22,
                        collected: false
                    },
                    {
                        id: "medkit-2",
                        type: "health",
                        x: 600,
                        y: 320,
                        width: 22,
                        height: 22,
                        collected: false
                    }
                ],
                doors: [
                    {
                        id: "door-1",
                        x: 320,
                        y: 200,
                        width: 40,
                        height: 40,
                        requires: "key",
                        unlocked: false
                    },
                    {
                        id: "door-2",
                        x: 720,
                        y: 400,
                        width: 40,
                        height: 40,
                        requires: "secret",
                        unlocked: false
                    }
                ]
            },
            3: {
                name: "Final Mission",
                map: level3Map,
                playerStart: { x: 120, y: 600 },
                enemies: [
                    {
                        id: "enemy-1",
                        x: 200,
                        y: 100,
                        width: 25,
                        height: 25,
                        speed: 60,
                        direction: 1,
                        patrolStart: 100,
                        patrolEnd: 400,
                        patrolAxis: "x"
                    },
                    {
                        id: "enemy-2",
                        x: 600,
                        y: 200,
                        width: 25,
                        height: 25,
                        speed: 50,
                        direction: -1,
                        patrolStart: 200,
                        patrolEnd: 700,
                        patrolAxis: "x"
                    },
                    {
                        id: "enemy-3",
                        x: 300,
                        y: 400,
                        width: 25,
                        height: 25,
                        speed: 55,
                        direction: 1,
                        patrolStart: 200,
                        patrolEnd: 500,
                        patrolAxis: "y"
                    },
                    {
                        id: "enemy-4",
                        x: 500,
                        y: 500,
                        width: 25,
                        height: 25,
                        speed: 45,
                        direction: -1,
                        patrolStart: 300,
                        patrolEnd: 550,
                        patrolAxis: "y"
                    }
                ],
                interactiveObjects: [
                    {
                        id: "bomb-1",
                        type: "bomb",
                        x: 200,
                        y: 300,
                        width: 30,
                        height: 30,
                        active: true,
                        solved: false
                    },
                    {
                        id: "bomb-2",
                        type: "bomb",
                        x: 500,
                        y: 300,
                        width: 30,
                        height: 30,
                        active: true,
                        solved: false
                    },
                    {
                        id: "bomb-3",
                        type: "bomb",
                        x: 350,
                        y: 150,
                        width: 30,
                        height: 30,
                        active: true,
                        solved: false
                    },
                    {
                        id: "intel-1",
                        type: "loot",
                        x: 700,
                        y: 500,
                        width: 25,
                        height: 25,
                        active: true,
                        collected: false
                    }
                ],
                collectibles: [
                    {
                        id: "key-1",
                        type: "key",
                        x: 150,
                        y: 200,
                        width: 20,
                        height: 20,
                        collected: false
                    },
                    {
                        id: "key-2",
                        type: "key",
                        x: 650,
                        y: 300,
                        width: 20,
                        height: 20,
                        collected: false
                    },
                    {
                        id: "money-1",
                        type: "money",
                        x: 100,
                        y: 500,
                        width: 20,
                        height: 20,
                        collected: false
                    },
                    {
                        id: "money-2",
                        type: "money",
                        x: 400,
                        y: 100,
                        width: 20,
                        height: 20,
                        collected: false
                    },
                    {
                        id: "money-3",
                        type: "money",
                        x: 600,
                        y: 400,
                        width: 20,
                        height: 20,
                        collected: false
                    },
                    {
                        id: "secret-1",
                        type: "secret",
                        x: 300,
                        y: 250,
                        width: 20,
                        height: 20,
                        collected: false
                    },
                    {
                        id: "secret-2",
                        type: "secret",
                        x: 500,
                        y: 450,
                        width: 20,
                        height: 20,
                        collected: false
                    },
                    {
                        id: "medkit-1",
                        type: "health",
                        x: 220,
                        y: 360,
                        width: 22,
                        height: 22,
                        collected: false
                    },
                    {
                        id: "medkit-2",
                        type: "health",
                        x: 560,
                        y: 220,
                        width: 22,
                        height: 22,
                        collected: false
                    },
                    {
                        id: "medkit-3",
                        type: "health",
                        x: 640,
                        y: 520,
                        width: 22,
                        height: 22,
                        collected: false
                    }
                ],
                doors: [
                    {
                        id: "door-1",
                        x: 400,
                        y: 300,
                        width: 40,
                        height: 40,
                        requires: "key",
                        unlocked: false
                    },
                    {
                        id: "door-2",
                        x: 600,
                        y: 200,
                        width: 40,
                        height: 40,
                        requires: "secret",
                        unlocked: false
                    },
                    {
                        id: "door-3",
                        x: 200,
                        y: 500,
                        width: 40,
                        height: 40,
                        requires: "secret",
                        unlocked: false
                    }
                ]
            }
        };
    }

    getLevel(levelNumber) {
        return this.levels[levelNumber] || this.levels[1];
    }

    getTotalLevels() {
        return Object.keys(this.levels).length;
    }
}

export default LevelManager;
