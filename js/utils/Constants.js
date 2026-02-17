// Constants for the voxel game

// Chunk dimensions
export const CHUNK_SIZE = 16;
export const CHUNK_HEIGHT = 128;

// World settings
export const RENDER_DISTANCE = 4; // Chunks in each direction
export const WORLD_HEIGHT = CHUNK_HEIGHT;

// Block types
export const BlockType = {
    AIR: 0,
    BEDROCK: 1,
    STONE: 2,
    DIRT: 3,
    GRASS: 4,
    WOOD: 5,
    LEAVES: 6,
    SAND: 7,
    COBBLESTONE: 8,
    PLANKS: 9,
    GLASS: 10,
    CRAFTING_TABLE: 11
};

// Mob types
export const MobType = {
    PIG: 'pig',
    COW: 'cow',
    SHEEP: 'sheep',
    CHICKEN: 'chicken',
    VILLAGER: 'villager',
    ZOMBIE: 'zombie',
    SKELETON: 'skeleton',
    CREEPER: 'creeper',
    SPIDER: 'spider'
};

// Mob properties
export const MobProperties = {
    [MobType.PIG]: { name: 'Pig', health: 10, speed: 1.5, hostile: false, color: 0xf0a0a0 },
    [MobType.COW]: { name: 'Cow', health: 10, speed: 1.2, hostile: false, color: 0x6b3a1f },
    [MobType.SHEEP]: { name: 'Sheep', health: 8, speed: 1.3, hostile: false, color: 0xe8e8e8 },
    [MobType.CHICKEN]: { name: 'Chicken', health: 4, speed: 1.5, hostile: false, color: 0xffffff },
    [MobType.VILLAGER]: { name: 'Villager', health: 20, speed: 1.0, hostile: false, color: 0x8b6914 },
    [MobType.ZOMBIE]: { name: 'Zombie', health: 20, speed: 1.8, hostile: true, color: 0x2d8a2d, damage: 3 },
    [MobType.SKELETON]: { name: 'Skeleton', health: 20, speed: 2.0, hostile: true, color: 0xc8c8c8, damage: 3 },
    [MobType.CREEPER]: { name: 'Creeper', health: 20, speed: 1.5, hostile: true, color: 0x3cb043, damage: 8 },
    [MobType.SPIDER]: { name: 'Spider', health: 16, speed: 2.2, hostile: true, color: 0x3a3a3a, damage: 2 }
};

// Block properties
export const BlockProperties = {
    [BlockType.AIR]: { name: 'Air', solid: false, transparent: true },
    [BlockType.BEDROCK]: { name: 'Bedrock', solid: true, transparent: false },
    [BlockType.STONE]: { name: 'Stone', solid: true, transparent: false },
    [BlockType.DIRT]: { name: 'Dirt', solid: true, transparent: false },
    [BlockType.GRASS]: { name: 'Grass', solid: true, transparent: false },
    [BlockType.WOOD]: { name: 'Wood', solid: true, transparent: false },
    [BlockType.LEAVES]: { name: 'Leaves', solid: true, transparent: true },
    [BlockType.SAND]: { name: 'Sand', solid: true, transparent: false },
    [BlockType.COBBLESTONE]: { name: 'Cobblestone', solid: true, transparent: false },
    [BlockType.PLANKS]: { name: 'Planks', solid: true, transparent: false },
    [BlockType.GLASS]: { name: 'Glass', solid: true, transparent: true },
    [BlockType.CRAFTING_TABLE]: { name: 'Crafting Table', solid: true, transparent: false, interactable: true }
};

// Block colors (RGB values for texture generation)
export const BlockColors = {
    [BlockType.BEDROCK]: { top: 0x1a1a1a, side: 0x1a1a1a, bottom: 0x1a1a1a },
    [BlockType.STONE]: { top: 0x7a7a7a, side: 0x7a7a7a, bottom: 0x7a7a7a },
    [BlockType.DIRT]: { top: 0x8b6914, side: 0x8b6914, bottom: 0x8b6914 },
    [BlockType.GRASS]: { top: 0x7cba3d, side: 0x8b6914, bottom: 0x8b6914, sideTop: 0x7cba3d },
    [BlockType.WOOD]: { top: 0x6b4423, side: 0x8b5a2b, bottom: 0x6b4423 },
    [BlockType.LEAVES]: { top: 0x2d8a2d, side: 0x2d8a2d, bottom: 0x2d8a2d },
    [BlockType.SAND]: { top: 0xe6d5a8, side: 0xe6d5a8, bottom: 0xe6d5a8 },
    [BlockType.COBBLESTONE]: { top: 0x6a6a6a, side: 0x6a6a6a, bottom: 0x6a6a6a },
    [BlockType.PLANKS]: { top: 0xc4a663, side: 0xc4a663, bottom: 0xc4a663 },
    [BlockType.GLASS]: { top: 0xc8e6ff, side: 0xc8e6ff, bottom: 0xc8e6ff },
    [BlockType.CRAFTING_TABLE]: { top: 0x8b6c3d, side: 0x9c7a4a, bottom: 0x6b4423 }
};

// Player settings
export const PLAYER_HEIGHT = 1.8;
export const PLAYER_WIDTH = 0.6;
export const PLAYER_EYE_HEIGHT = 1.62;
export const PLAYER_SPEED = 5;
export const PLAYER_JUMP_VELOCITY = 8;
export const GRAVITY = 25;
export const TERMINAL_VELOCITY = 50;

// Mouse settings
export const MOUSE_SENSITIVITY = 0.002;

// Mob settings
export const MOB_SPAWN_RADIUS = 30;
export const MOB_DESPAWN_RADIUS = 60;
export const MAX_MOBS = 20;
export const MOB_SPAWN_INTERVAL = 5; // Seconds between spawn attempts

// Day/Night cycle
export const DAY_LENGTH = 600; // Seconds for a full day cycle

// Face directions for mesh building
export const FACES = {
    TOP: { dir: [0, 1, 0], corners: [[0, 1, 1], [1, 1, 1], [1, 1, 0], [0, 1, 0]] },
    BOTTOM: { dir: [0, -1, 0], corners: [[1, 0, 1], [0, 0, 1], [0, 0, 0], [1, 0, 0]] },
    FRONT: { dir: [0, 0, 1], corners: [[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]] },
    BACK: { dir: [0, 0, -1], corners: [[1, 0, 0], [0, 0, 0], [0, 1, 0], [1, 1, 0]] },
    RIGHT: { dir: [1, 0, 0], corners: [[1, 0, 1], [1, 0, 0], [1, 1, 0], [1, 1, 1]] },
    LEFT: { dir: [-1, 0, 0], corners: [[0, 0, 0], [0, 0, 1], [0, 1, 1], [0, 1, 0]] }
};
