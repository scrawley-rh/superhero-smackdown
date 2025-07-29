// --- Hero Data ---
// To add more heroes, add an object to this array and place the image
// in your /assets/images/ folder.
const HEROES = [
    { id: 1, name: 'Captain Addition', imageUrl: 'assets/images/captain-addition.png' },
    { id: 2, name: 'Subtracto', imageUrl: 'assets/images/subtracto.png' },
    { id: 3, name: 'Multi-Plex', imageUrl: 'assets/images/multi-plex.png' },
    { id: 4, name: 'The Divisor', imageUrl: 'assets/images/the-divisor.png' },
    { id: 5, name: 'Equationer', imageUrl: 'assets/images/equationer.png' },
];

// --- Level Data ---
// To add more levels, add an object to this array.
const LEVELS = [
    { id: 1, name: 'Level 1: Addition', description: 'Addition facts up to 20', type: 'addition', heroId: 1 },
    { id: 2, name: 'Level 2: Subtraction', description: 'Subtraction facts up to 20', type: 'subtraction', heroId: 2 },
    { id: 3, name: 'Level 3: Multiplication', description: 'Multiplication facts to 12', type: 'multiplication', heroId: 3 },
    { id: 4, name: 'Level 4: Division', description: 'Division facts to 12', type: 'division', heroId: 4 },
    { id: 5, name: 'Level 5: Mixed Ops', description: 'Multiplication & Division', type: 'mixed', heroId: 5 },
];
