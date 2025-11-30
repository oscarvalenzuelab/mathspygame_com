export default {
    layout: [
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
    ]
};
