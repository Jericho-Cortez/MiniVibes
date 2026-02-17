import * as THREE from 'three';
import { BlockType, BlockProperties, PLAYER_HEIGHT, PLAYER_WIDTH } from '../utils/Constants.js';

/**
 * BlockInteraction - Handles block destruction and placement via raycasting
 */
export class BlockInteraction {
    constructor(world, player, scene) {
        this.world = world;
        this.player = player;
        this.scene = scene;
        
        this.raycaster = new THREE.Raycaster();
        this.maxDistance = 5; // Max reach distance
        
        // Block highlight
        this.highlightMesh = this.createHighlightMesh();
        this.scene.add(this.highlightMesh);
        
        // Cooldowns
        this.destroyCooldown = 0;
        this.placeCooldown = 0;
        this.cooldownTime = 0.2; // 200ms between actions
        
        // Current target
        this.targetBlock = null;
        this.targetFace = null;
    }
    
    /**
     * Create wireframe highlight for targeted block
     */
    createHighlightMesh() {
        const geometry = new THREE.BoxGeometry(1.01, 1.01, 1.01);
        const edges = new THREE.EdgesGeometry(geometry);
        const material = new THREE.LineBasicMaterial({ 
            color: 0x000000, 
            linewidth: 2,
            transparent: true,
            opacity: 0.8
        });
        
        const mesh = new THREE.LineSegments(edges, material);
        mesh.visible = false;
        
        return mesh;
    }
    
    /**
     * Update block interaction each frame
     */
    update(deltaTime) {
        // Update cooldowns
        this.destroyCooldown = Math.max(0, this.destroyCooldown - deltaTime);
        this.placeCooldown = Math.max(0, this.placeCooldown - deltaTime);
        
        // Cast ray from camera
        this.updateRaycast();
        
        // Handle input
        const controls = this.player.getControls();
        
        if (controls.mouse.leftJustPressed && this.destroyCooldown === 0) {
            this.destroyBlock();
        }
        
        if (controls.mouse.rightJustPressed && this.placeCooldown === 0) {
            this.placeBlock();
        }
    }
    
    /**
     * Update raycast target
     */
    updateRaycast() {
        const eyePosition = this.player.getEyePosition();
        const direction = this.player.getLookDirection();
        
        // Manual block raycasting (more accurate for voxels)
        const result = this.raycastBlocks(eyePosition, direction);
        
        if (result) {
            this.targetBlock = result.blockPos;
            this.targetFace = result.faceNormal;
            
            // Update highlight position
            this.highlightMesh.position.set(
                result.blockPos.x + 0.5,
                result.blockPos.y + 0.5,
                result.blockPos.z + 0.5
            );
            this.highlightMesh.visible = true;
        } else {
            this.targetBlock = null;
            this.targetFace = null;
            this.highlightMesh.visible = false;
        }
    }
    
    /**
     * Raycast through blocks using DDA algorithm
     */
    raycastBlocks(origin, direction) {
        const step = 0.05;
        const pos = origin.clone();
        
        for (let d = 0; d < this.maxDistance; d += step) {
            const blockX = Math.floor(pos.x);
            const blockY = Math.floor(pos.y);
            const blockZ = Math.floor(pos.z);
            
            const blockType = this.world.getBlock(blockX, blockY, blockZ);
            
            if (blockType !== BlockType.AIR && blockType !== undefined) {
                // Don't target bedrock
                if (blockType === BlockType.BEDROCK) {
                    return null;
                }
                
                // Calculate face normal based on entry direction
                const prevPos = pos.clone().sub(direction.clone().multiplyScalar(step));
                const faceNormal = this.calculateFaceNormal(prevPos, blockX, blockY, blockZ);
                
                return {
                    blockPos: new THREE.Vector3(blockX, blockY, blockZ),
                    faceNormal: faceNormal,
                    distance: d
                };
            }
            
            pos.add(direction.clone().multiplyScalar(step));
        }
        
        return null;
    }
    
    /**
     * Calculate which face of the block was hit
     */
    calculateFaceNormal(hitPoint, blockX, blockY, blockZ) {
        const blockCenter = new THREE.Vector3(blockX + 0.5, blockY + 0.5, blockZ + 0.5);
        const diff = hitPoint.clone().sub(blockCenter);
        
        // Find the axis with the greatest difference
        const absX = Math.abs(diff.x);
        const absY = Math.abs(diff.y);
        const absZ = Math.abs(diff.z);
        
        if (absX > absY && absX > absZ) {
            return new THREE.Vector3(Math.sign(diff.x), 0, 0);
        } else if (absY > absX && absY > absZ) {
            return new THREE.Vector3(0, Math.sign(diff.y), 0);
        } else {
            return new THREE.Vector3(0, 0, Math.sign(diff.z));
        }
    }
    
    /**
     * Destroy targeted block
     */
    destroyBlock() {
        if (!this.targetBlock) return;
        
        const { x, y, z } = this.targetBlock;
        
        // Set block to air
        const success = this.world.setBlock(x, y, z, BlockType.AIR);
        
        if (success) {
            this.destroyCooldown = this.cooldownTime;
        }
    }
    
    /**
     * Place block on targeted face
     */
    placeBlock(blockType) {
        if (!this.targetBlock || !this.targetFace) return;
        
        // Calculate placement position
        const placeX = this.targetBlock.x + this.targetFace.x;
        const placeY = this.targetBlock.y + this.targetFace.y;
        const placeZ = this.targetBlock.z + this.targetFace.z;
        
        // Check if placement would collide with player
        if (this.checkPlayerCollision(placeX, placeY, placeZ)) {
            return false;
        }
        
        // Get block type from inventory if not specified
        if (blockType === undefined) {
            // This will be set by inventory system
            blockType = this.selectedBlockType || BlockType.STONE;
        }
        
        // Place block
        const success = this.world.setBlock(placeX, placeY, placeZ, blockType);
        
        if (success) {
            this.placeCooldown = this.cooldownTime;
        }
        
        return success;
    }
    
    /**
     * Check if block placement would collide with player
     */
    checkPlayerCollision(blockX, blockY, blockZ) {
        const playerPos = this.player.getPosition();
        const halfWidth = PLAYER_WIDTH / 2;
        
        // Player bounding box
        const playerMinX = playerPos.x - halfWidth;
        const playerMaxX = playerPos.x + halfWidth;
        const playerMinY = playerPos.y;
        const playerMaxY = playerPos.y + PLAYER_HEIGHT;
        const playerMinZ = playerPos.z - halfWidth;
        const playerMaxZ = playerPos.z + halfWidth;
        
        // Block bounding box
        const blockMinX = blockX;
        const blockMaxX = blockX + 1;
        const blockMinY = blockY;
        const blockMaxY = blockY + 1;
        const blockMinZ = blockZ;
        const blockMaxZ = blockZ + 1;
        
        // Check for overlap
        return (
            playerMinX < blockMaxX && playerMaxX > blockMinX &&
            playerMinY < blockMaxY && playerMaxY > blockMinY &&
            playerMinZ < blockMaxZ && playerMaxZ > blockMinZ
        );
    }
    
    /**
     * Set selected block type (called by inventory)
     */
    setSelectedBlockType(blockType) {
        this.selectedBlockType = blockType;
    }
    
    /**
     * Get current target block
     */
    getTargetBlock() {
        return this.targetBlock;
    }
    
    /**
     * Clean up
     */
    dispose() {
        this.scene.remove(this.highlightMesh);
        this.highlightMesh.geometry.dispose();
        this.highlightMesh.material.dispose();
    }
}

export default BlockInteraction;
