import { PerlinNoise } from '../utils/PerlinNoise.js';
import { BlockType, CHUNK_SIZE, CHUNK_HEIGHT } from '../utils/Constants.js';

/**
 * TerrainGenerator - Generates procedural terrain using Perlin noise
 */
export class TerrainGenerator {
    constructor(seed = 12345) {
        this.seed = seed;
        this.noise = new PerlinNoise(seed);
        this.treeNoise = new PerlinNoise(seed + 1);
        
        // Terrain parameters
        this.seaLevel = 40;
        this.baseHeight = 50;
        this.heightVariation = 30;
    }
    
    /**
     * Generate a chunk at the given chunk coordinates
     */
    generateChunk(chunkX, chunkZ) {
        const blocks = new Uint8Array(CHUNK_SIZE * CHUNK_HEIGHT * CHUNK_SIZE);
        
        for (let x = 0; x < CHUNK_SIZE; x++) {
            for (let z = 0; z < CHUNK_SIZE; z++) {
                const worldX = chunkX * CHUNK_SIZE + x;
                const worldZ = chunkZ * CHUNK_SIZE + z;
                
                // Get terrain height
                const height = this.getHeight(worldX, worldZ);
                
                // Fill column with blocks
                for (let y = 0; y < CHUNK_HEIGHT; y++) {
                    const blockType = this.getBlockType(worldX, y, worldZ, height);
                    const index = this.getIndex(x, y, z);
                    blocks[index] = blockType;
                }
            }
        }
        
        // Generate trees
        this.generateTrees(blocks, chunkX, chunkZ);
        
        return blocks;
    }
    
    /**
     * Get terrain height at world position
     */
    getHeight(worldX, worldZ) {
        // Base terrain using multiple octaves
        const scale1 = 0.01;
        const scale2 = 0.03;
        const scale3 = 0.08;
        
        // Large scale hills
        let height = this.noise.fbm(worldX * scale1, worldZ * scale1, 4, 2, 0.5);
        
        // Medium details
        height += this.noise.fbm(worldX * scale2, worldZ * scale2, 3, 2, 0.5) * 0.5;
        
        // Small details
        height += this.noise.fbm(worldX * scale3, worldZ * scale3, 2, 2, 0.5) * 0.2;
        
        // Normalize and scale
        height = (height + 1.7) / 3.4; // Normalize to 0-1
        height = Math.max(0, Math.min(1, height));
        
        return Math.floor(this.baseHeight + height * this.heightVariation);
    }
    
    /**
     * Determine block type based on position and height
     */
    getBlockType(worldX, y, worldZ, surfaceHeight) {
        // Air above surface
        if (y > surfaceHeight) {
            return BlockType.AIR;
        }
        
        // Bedrock layer (y = 0)
        if (y === 0) {
            return BlockType.BEDROCK;
        }
        
        // Random bedrock in lower layers
        if (y <= 3 && Math.random() < 0.5) {
            return BlockType.BEDROCK;
        }
        
        // Stone layer (below dirt)
        if (y < surfaceHeight - 4) {
            return BlockType.STONE;
        }
        
        // Dirt layer (just below surface)
        if (y < surfaceHeight) {
            return BlockType.DIRT;
        }
        
        // Surface block
        if (y === surfaceHeight) {
            // Sand near sea level
            if (surfaceHeight <= this.seaLevel + 2) {
                return BlockType.SAND;
            }
            return BlockType.GRASS;
        }
        
        return BlockType.AIR;
    }
    
    /**
     * Generate trees in the chunk
     */
    generateTrees(blocks, chunkX, chunkZ) {
        // Simple tree generation
        for (let x = 2; x < CHUNK_SIZE - 2; x++) {
            for (let z = 2; z < CHUNK_SIZE - 2; z++) {
                const worldX = chunkX * CHUNK_SIZE + x;
                const worldZ = chunkZ * CHUNK_SIZE + z;
                
                // Use noise to determine if tree should spawn
                const treeValue = this.treeNoise.noise2D(worldX * 0.5, worldZ * 0.5);
                
                if (treeValue > 0.7) {
                    // Find surface height
                    const surfaceY = this.findSurface(blocks, x, z);
                    
                    if (surfaceY > 0 && surfaceY < CHUNK_HEIGHT - 10) {
                        const surfaceBlock = blocks[this.getIndex(x, surfaceY, z)];
                        
                        // Only place trees on grass
                        if (surfaceBlock === BlockType.GRASS) {
                            this.placeTree(blocks, x, surfaceY + 1, z);
                        }
                    }
                }
            }
        }
    }
    
    /**
     * Find surface Y level at position in chunk
     */
    findSurface(blocks, x, z) {
        for (let y = CHUNK_HEIGHT - 1; y >= 0; y--) {
            const block = blocks[this.getIndex(x, y, z)];
            if (block !== BlockType.AIR) {
                return y;
            }
        }
        return -1;
    }
    
    /**
     * Place a tree at position
     */
    placeTree(blocks, x, y, z) {
        const treeHeight = 4 + Math.floor(Math.random() * 3);
        
        // Trunk
        for (let h = 0; h < treeHeight; h++) {
            const idx = this.getIndex(x, y + h, z);
            if (idx >= 0 && idx < blocks.length) {
                blocks[idx] = BlockType.WOOD;
            }
        }
        
        // Leaves (simple sphere pattern)
        const leafStart = y + treeHeight - 2;
        const leafEnd = y + treeHeight + 1;
        
        for (let ly = leafStart; ly <= leafEnd; ly++) {
            const radius = ly === leafEnd ? 1 : 2;
            
            for (let lx = -radius; lx <= radius; lx++) {
                for (let lz = -radius; lz <= radius; lz++) {
                    // Skip corners for rounder look
                    if (Math.abs(lx) === radius && Math.abs(lz) === radius) continue;
                    
                    const nx = x + lx;
                    const nz = z + lz;
                    
                    if (nx >= 0 && nx < CHUNK_SIZE && nz >= 0 && nz < CHUNK_SIZE) {
                        const idx = this.getIndex(nx, ly, nz);
                        if (idx >= 0 && idx < blocks.length && blocks[idx] === BlockType.AIR) {
                            blocks[idx] = BlockType.LEAVES;
                        }
                    }
                }
            }
        }
    }
    
    /**
     * Convert local coordinates to array index
     */
    getIndex(x, y, z) {
        if (x < 0 || x >= CHUNK_SIZE || y < 0 || y >= CHUNK_HEIGHT || z < 0 || z >= CHUNK_SIZE) {
            return -1;
        }
        return y * CHUNK_SIZE * CHUNK_SIZE + z * CHUNK_SIZE + x;
    }
}

export default TerrainGenerator;
