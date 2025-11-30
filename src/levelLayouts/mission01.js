export default {
    layout: [
        ...Array.from({ length: 8 }, (_, i) => ({ x: 10, y: 5 + i, type: 'wall' })),
        ...Array.from({ length: 8 }, (_, i) => ({ x: 20, y: 5 + i, type: 'wall' })),
        ...Array.from({ length: 11 }, (_, i) => ({ x: 10 + i, y: 5, type: 'wall' })),
        ...Array.from({ length: 11 }, (_, i) => ({ x: 10 + i, y: 13, type: 'wall' })),
        ...Array.from({ length: 6 }, (_, i) => ({ x: 5 + i, y: 10, type: 'wall' })),
        { x: 15, y: 8, type: 'obstacle' },
        { x: 15, y: 10, type: 'obstacle' }
    ]
};
