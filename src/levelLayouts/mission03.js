export default {
    layout: [
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
    ]
};
