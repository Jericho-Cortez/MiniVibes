import * as THREE from 'three';
import { Chunk } from './Chunk.js';
import { TerrainGenerator } from './TerrainGenerator.js';
import { TextureAtlas } from '../utils/TextureAtlas.js';
import { CHUNK_SIZE, CHUNK_HEIGHT, RENDER_DISTANCE, BlockType, BlockProperties } from '../utils/Constants.js';

/**
 * World - Manages chunks and world state
 */
export class World {
    constructor(scene, seed = 12345) {
        this.scene = scene;
        this.seed = seed;
        
        this.chunks = new Map();
        this.textureAtlas = new TextureAtlas();
        this.terrainGenerator = new TerrainGenerator(seed);
        
        this.loadedChunks = new Set();
        this.chunkLoadQueue = [];
        this.isLoading = false;
        
        // Track player chunk position
        this.playerChunkX = 0;
        this.playerChunkZ = 0;
    }
    
    /**
     * Update world based on player position
     */
    update(playerPosition) {
        // Calculate player's current chunk
        const chunkX = Math.floor(playerPosition.x / CHUNK_SIZE);
        const chunkZ = Math.floor(playerPosition.z / CHUNK_SIZE);
        
        // Check if player moved to new chunk
        if (chunkX !== this.playerChunkX || chunkZ !== this.playerChunkZ) {
            this.playerChunkX = chunkX;
            this.playerChunkZ = chunkZ;
            this.updateLoadedChunks();
        }
        
        // Process chunk load queue
        this.processChunkQueue();
        
        // Update dirty chunks
        this.updateDirtyChunks();
    }
    
    /**
     * Update which chunks should be loaded
     */
    updateLoadedChunks() {
        const chunksToLoad = new Set();
        const chunksToUnload = new Set(this.loadedChunks);
        
        // Determine which chunks should be loaded
        for (let dx = -RENDER_DISTANCE; dx <= RENDER_DISTANCE; dx++) {
            for (let dz = -RENDER_DISTANCE; dz <= RENDER_DISTANCE; dz++) {
                const cx = this.playerChunkX + dx;
                const cz = this.playerChunkZ + dz;
                const key = Chunk.getChunkKey(cx, cz);
                
                // Check if within circular render distance
                if (dx * dx + dz * dz <= RENDER_DISTANCE * RENDER_DISTANCE) {
                    chunksToLoad.add(key);
                    chunksToUnload.delete(key);
                }
            }
        }
        
        // Unload distant chunks
        for (const key of chunksToUnload) {
            this.unloadChunk(key);
        }
        
        // Queue new chunks for loading
        for (const key of chunksToLoad) {
            if (!this.loadedChunks.has(key) && !this.chunkLoadQueue.includes(key)) {
                this.chunkLoadQueue.push(key);
            }
        }
        
        // Sort queue by distance from player
        this.chunkLoadQueue.sort((a, b) => {
            const [ax, az] = a.split(',').map(Number);
            const [bx, bz] = b.split(',').map(Number);
            const distA = (ax - this.playerChunkX) ** 2 + (az - this.playerChunkZ) ** 2;
            const distB = (bx - this.playerChunkX) ** 2 + (bz - this.playerChunkZ) ** 2;
            return distA - distB;
        });
    }
    
    /**
     * Process chunk loading queue
     */
    processChunkQueue() {
        const chunksPerFrame = 2; // Load up to 2 chunks per frame
        
        for (let i = 0; i < chunksPerFrame && this.chunkLoadQueue.length > 0; i++) {
            const key = this.chunkLoadQueue.shift();
            const [cx, cz] = key.split(',').map(Number);
            this.loadChunk(cx, cz);
        }
    }
    
    /**
     * Load a chunk
     */
    loadChunk(chunkX, chunkZ) {
        const key = Chunk.getChunkKey(chunkX, chunkZ);
        
        if (this.chunks.has(key)) {
            return this.chunks.get(key);
        }
        
        // Generate chunk data
        const blocks = this.terrainGenerator.generateChunk(chunkX, chunkZ);
        
        // Create chunk object
        const chunk = new Chunk(chunkX, chunkZ, blocks, this.textureAtlas, this);
        
        // Build mesh
        chunk.buildMesh();
        
        // Add to scene
        chunk.addToScene(this.scene);
        
        // Store chunk
        this.chunks.set(key, chunk);
        this.loadedChunks.add(key);
        
        // Update neighboring chunks (for proper face culling at borders)
        this.updateNeighborChunks(chunkX, chunkZ);
        
        return chunk;
    }
    
    /**
     * Unload a chunk
     */
    unloadChunk(key) {
        const chunk = this.chunks.get(key);
        if (chunk) {
            chunk.removeFromScene(this.scene);
            chunk.dispose();
            this.chunks.delete(key);
            this.loadedChunks.delete(key);
        }
    }
    
    /**
     * Update neighboring chunks when a chunk is loaded or modified
     */
    updateNeighborChunks(chunkX, chunkZ) {
        const neighbors = [
            [chunkX - 1, chunkZ],
            [chunkX + 1, chunkZ],
            [chunkX, chunkZ - 1],
            [chunkX, chunkZ + 1]
        ];
        
        for (const [nx, nz] of neighbors) {
            const key = Chunk.getChunkKey(nx, nz);
            const chunk = this.chunks.get(key);
            if (chunk) {
                chunk.isDirty = true;
            }
        }
    }
    
    /**
     * Update dirty chunks
     */
    updateDirtyChunks() {
        for (const chunk of this.chunks.values()) {
            if (chunk.isDirty) {
                chunk.removeFromScene(this.scene);
                chunk.buildMesh();
                chunk.addToScene(this.scene);
            }
        }
    }
    
    /**
     * Get block at world coordinates
     */
    getBlock(worldX, worldY, worldZ) {
        if (worldY < 0 || worldY >= CHUNK_HEIGHT) {
            return BlockType.AIR;
        }
        
        const chunkX = Math.floor(worldX / CHUNK_SIZE);
        const chunkZ = Math.floor(worldZ / CHUNK_SIZE);
        const key = Chunk.getChunkKey(chunkX, chunkZ);
        
        const chunk = this.chunks.get(key);
        if (!chunk) {
            return BlockType.AIR;
        }
        
        // Convert to local coordinates
        let localX = worldX - chunkX * CHUNK_SIZE;
        let localZ = worldZ - chunkZ * CHUNK_SIZE;
        
        // Handle negative coordinates
        if (localX < 0) localX += CHUNK_SIZE;
        if (localZ < 0) localZ += CHUNK_SIZE;
        
        return chunk.getBlock(localX, worldY, localZ);
    }
    
    /**
     * Set block at world coordinates
     */
    setBlock(worldX, worldY, worldZ, blockType) {
        if (worldY < 0 || worldY >= CHUNK_HEIGHT) {
            return false;
        }
        
        const chunkX = Math.floor(worldX / CHUNK_SIZE);
        const chunkZ = Math.floor(worldZ / CHUNK_SIZE);
        const key = Chunk.getChunkKey(chunkX, chunkZ);
        
        const chunk = this.chunks.get(key);
        if (!chunk) {
            return false;
        }
        
        // Convert to local coordinates
        let localX = worldX - chunkX * CHUNK_SIZE;
        let localZ = worldZ - chunkZ * CHUNK_SIZE;
        
        // Handle negative coordinates
        if (localX < 0) localX += CHUNK_SIZE;
        if (localZ < 0) localZ += CHUNK_SIZE;
        
        const success = chunk.setBlock(localX, worldY, localZ, blockType);
        
        if (success) {
            // Check if we need to update neighboring chunks
            if (localX === 0) {
                const neighborKey = Chunk.getChunkKey(chunkX - 1, chunkZ);
                const neighbor = this.chunks.get(neighborKey);
                if (neighbor) neighbor.isDirty = true;
            }
            if (localX === CHUNK_SIZE - 1) {
                const neighborKey = Chunk.getChunkKey(chunkX + 1, chunkZ);
                const neighbor = this.chunks.get(neighborKey);
                if (neighbor) neighbor.isDirty = true;
            }
            if (localZ === 0) {
                const neighborKey = Chunk.getChunkKey(chunkX, chunkZ - 1);
                const neighbor = this.chunks.get(neighborKey);
                if (neighbor) neighbor.isDirty = true;
            }
            if (localZ === CHUNK_SIZE - 1) {
                const neighborKey = Chunk.getChunkKey(chunkX, chunkZ + 1);
                const neighbor = this.chunks.get(neighborKey);
                if (neighbor) neighbor.isDirty = true;
            }
        }
        
        return success;
    }
    
    /**
     * Check if block is solid at world coordinates
     */
    isBlockSolid(worldX, worldY, worldZ) {
        const blockType = this.getBlock(worldX, worldY, worldZ);
        const props = BlockProperties[blockType];
        return props ? props.solid : false;
    }
    
    /**
     * Get spawn position (highest point at origin)
     */
    getSpawnPosition() {
        const x = 0;
        const z = 0;
        
        // Find the highest block at spawn
        for (let y = CHUNK_HEIGHT - 1; y >= 0; y--) {
            if (this.isBlockSolid(x, y, z)) {
                return new THREE.Vector3(x + 0.5, y + 2, z + 0.5);
            }
        }
        
        return new THREE.Vector3(x + 0.5, 60, z + 0.5);
    }
    
    /**
     * Get number of loaded chunks
     */
    getLoadedChunkCount() {
        return this.chunks.size;
    }
    
    /**
     * Initialize world around spawn
     */
    async initialize() {
        // Load initial chunks around spawn
        const initialRadius = 3;
        
        for (let dx = -initialRadius; dx <= initialRadius; dx++) {
            for (let dz = -initialRadius; dz <= initialRadius; dz++) {
                if (dx * dx + dz * dz <= initialRadius * initialRadius) {
                    this.loadChunk(dx, dz);
                }
            }
        }
        
        return this.getSpawnPosition();
    }
}

export default World;
