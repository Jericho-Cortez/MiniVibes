import * as THREE from 'three';
import { CHUNK_SIZE, CHUNK_HEIGHT, BlockType, BlockProperties, FACES } from '../utils/Constants.js';

/**
 * Chunk - Represents a 16x128x16 section of the world
 */
export class Chunk {
    constructor(chunkX, chunkZ, blocks, textureAtlas, world) {
        this.chunkX = chunkX;
        this.chunkZ = chunkZ;
        this.blocks = blocks;
        this.textureAtlas = textureAtlas;
        this.world = world;
        
        this.mesh = null;
        this.transparentMesh = null;
        this.isDirty = true;
        
        // World position offset
        this.worldOffsetX = chunkX * CHUNK_SIZE;
        this.worldOffsetZ = chunkZ * CHUNK_SIZE;
    }
    
    /**
     * Get block at local chunk coordinates
     */
    getBlock(x, y, z) {
        if (x < 0 || x >= CHUNK_SIZE || y < 0 || y >= CHUNK_HEIGHT || z < 0 || z >= CHUNK_SIZE) {
            // Check neighboring chunks
            return this.getBlockFromWorld(
                this.worldOffsetX + x,
                y,
                this.worldOffsetZ + z
            );
        }
        return this.blocks[this.getIndex(x, y, z)];
    }
    
    /**
     * Get block from world coordinates (for neighboring chunks)
     */
    getBlockFromWorld(worldX, worldY, worldZ) {
        if (this.world) {
            return this.world.getBlock(worldX, worldY, worldZ);
        }
        return BlockType.AIR;
    }
    
    /**
     * Set block at local chunk coordinates
     */
    setBlock(x, y, z, blockType) {
        if (x < 0 || x >= CHUNK_SIZE || y < 0 || y >= CHUNK_HEIGHT || z < 0 || z >= CHUNK_SIZE) {
            return false;
        }
        this.blocks[this.getIndex(x, y, z)] = blockType;
        this.isDirty = true;
        return true;
    }
    
    /**
     * Convert coordinates to array index
     */
    getIndex(x, y, z) {
        return y * CHUNK_SIZE * CHUNK_SIZE + z * CHUNK_SIZE + x;
    }
    
    /**
     * Build the chunk mesh using BufferGeometry
     */
    buildMesh() {
        const positions = [];
        const normals = [];
        const uvs = [];
        const colors = [];
        const indices = [];
        
        const transparentPositions = [];
        const transparentNormals = [];
        const transparentUvs = [];
        const transparentColors = [];
        const transparentIndices = [];
        
        let vertexIndex = 0;
        let transparentVertexIndex = 0;
        
        for (let y = 0; y < CHUNK_HEIGHT; y++) {
            for (let z = 0; z < CHUNK_SIZE; z++) {
                for (let x = 0; x < CHUNK_SIZE; x++) {
                    const blockType = this.getBlock(x, y, z);
                    
                    if (blockType === BlockType.AIR) continue;
                    
                    const blockProps = BlockProperties[blockType];
                    const isTransparent = blockProps?.transparent || false;
                    
                    // Check each face
                    for (const [faceName, faceData] of Object.entries(FACES)) {
                        const [dx, dy, dz] = faceData.dir;
                        const neighborBlock = this.getBlock(x + dx, y + dy, z + dz);
                        const neighborProps = BlockProperties[neighborBlock];
                        
                        // Determine if face should be rendered
                        const shouldRenderFace = this.shouldRenderFace(
                            blockType, neighborBlock, blockProps, neighborProps
                        );
                        
                        if (!shouldRenderFace) continue;
                        
                        // Get UV coordinates
                        let faceType = 'side';
                        if (faceName === 'TOP') faceType = 'top';
                        else if (faceName === 'BOTTOM') faceType = 'bottom';
                        
                        const uv = this.textureAtlas.getUV(blockType, faceType);
                        
                        // Select which arrays to use
                        const targetPositions = isTransparent ? transparentPositions : positions;
                        const targetNormals = isTransparent ? transparentNormals : normals;
                        const targetUvs = isTransparent ? transparentUvs : uvs;
                        const targetColors = isTransparent ? transparentColors : colors;
                        const targetIndices = isTransparent ? transparentIndices : indices;
                        const targetVertexIndex = isTransparent ? transparentVertexIndex : vertexIndex;
                        
                        // Add vertices for this face
                        for (const corner of faceData.corners) {
                            const vx = x + corner[0] + this.worldOffsetX;
                            const vy = y + corner[1];
                            const vz = z + corner[2] + this.worldOffsetZ;
                            
                            targetPositions.push(vx, vy, vz);
                            targetNormals.push(dx, dy, dz);
                            targetColors.push(1, 1, 1); // White vertex color (texture provides color)
                        }
                        
                        // Add UVs
                        targetUvs.push(
                            uv.u, uv.v + uv.size,
                            uv.u + uv.size, uv.v + uv.size,
                            uv.u + uv.size, uv.v,
                            uv.u, uv.v
                        );
                        
                        // Add indices for two triangles
                        targetIndices.push(
                            targetVertexIndex, targetVertexIndex + 1, targetVertexIndex + 2,
                            targetVertexIndex, targetVertexIndex + 2, targetVertexIndex + 3
                        );
                        
                        if (isTransparent) {
                            transparentVertexIndex += 4;
                        } else {
                            vertexIndex += 4;
                        }
                    }
                }
            }
        }
        
        // Remove old meshes
        this.dispose();
        
        // Create opaque mesh
        if (positions.length > 0) {
            this.mesh = this.createMeshFromArrays(
                positions, normals, uvs, colors, indices, false
            );
        }
        
        // Create transparent mesh
        if (transparentPositions.length > 0) {
            this.transparentMesh = this.createMeshFromArrays(
                transparentPositions, transparentNormals, transparentUvs,
                transparentColors, transparentIndices, true
            );
        }
        
        this.isDirty = false;
    }
    
    /**
     * Determine if a face should be rendered
     */
    shouldRenderFace(blockType, neighborBlock, blockProps, neighborProps) {
        // Always render if neighbor is air
        if (neighborBlock === BlockType.AIR) return true;
        
        // Don't render if neighbor is solid and opaque
        if (neighborProps && neighborProps.solid && !neighborProps.transparent) {
            return false;
        }
        
        // Render if current block is not transparent but neighbor is
        if (!blockProps.transparent && neighborProps?.transparent) {
            return true;
        }
        
        // Don't render same-type transparent blocks facing each other
        if (blockProps.transparent && blockType === neighborBlock) {
            return false;
        }
        
        // Render transparent faces when neighbor is different transparent
        if (blockProps.transparent && neighborProps?.transparent) {
            return true;
        }
        
        return false;
    }
    
    /**
     * Create mesh from geometry arrays
     */
    createMeshFromArrays(positions, normals, uvs, colors, indices, transparent) {
        const geometry = new THREE.BufferGeometry();
        
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
        geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        geometry.setIndex(indices);
        
        const material = this.textureAtlas.getMaterial(transparent);
        const mesh = new THREE.Mesh(geometry, material);
        
        mesh.userData.chunkX = this.chunkX;
        mesh.userData.chunkZ = this.chunkZ;
        mesh.userData.isChunk = true;
        
        return mesh;
    }
    
    /**
     * Add mesh to scene
     */
    addToScene(scene) {
        if (this.mesh) {
            scene.add(this.mesh);
        }
        if (this.transparentMesh) {
            scene.add(this.transparentMesh);
        }
    }
    
    /**
     * Remove mesh from scene
     */
    removeFromScene(scene) {
        if (this.mesh) {
            scene.remove(this.mesh);
        }
        if (this.transparentMesh) {
            scene.remove(this.transparentMesh);
        }
    }
    
    /**
     * Dispose of geometry and remove from memory
     */
    dispose() {
        if (this.mesh) {
            this.mesh.geometry.dispose();
            this.mesh = null;
        }
        if (this.transparentMesh) {
            this.transparentMesh.geometry.dispose();
            this.transparentMesh = null;
        }
    }
    
    /**
     * Get chunk key for identification
     */
    getKey() {
        return `${this.chunkX},${this.chunkZ}`;
    }
    
    static getChunkKey(chunkX, chunkZ) {
        return `${chunkX},${chunkZ}`;
    }
}

export default Chunk;
