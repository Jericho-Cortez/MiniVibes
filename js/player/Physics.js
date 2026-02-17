import * as THREE from 'three';
import { 
    PLAYER_HEIGHT, 
    PLAYER_WIDTH, 
    PLAYER_EYE_HEIGHT, 
    PLAYER_SPEED, 
    PLAYER_JUMP_VELOCITY,
    PLAYER_FLY_SPEED,
    GRAVITY,
    TERMINAL_VELOCITY
} from '../utils/Constants.js';

/**
 * Physics - Handles player physics and collision detection
 */
export class Physics {
    constructor(world) {
        this.world = world;
        
        // Physics state
        this.velocity = new THREE.Vector3();
        this.acceleration = new THREE.Vector3(0, -GRAVITY, 0);
        
        // Flying state
        this.isFlying = false;

        this.isOnGround = false;
        this.wasOnGround = false;
    }
    
    /**
     * Update physics for the player
     */
    update(position, movement, deltaTime, isJumping, vertical = 0) {
        const dt = Math.min(deltaTime, 0.1); // Cap delta time to prevent tunneling
        
        // Store previous ground state
        this.wasOnGround = this.isOnGround;
        
        // Apply movement input
        this.velocity.x = movement.x * PLAYER_SPEED;
        this.velocity.z = movement.z * PLAYER_SPEED;

        // Flying mode: override vertical movement and ignore gravity
        if (this.isFlying) {
            this.velocity.y = vertical * PLAYER_FLY_SPEED;
        } else {
            // Apply gravity
            if (!this.isOnGround) {
                this.velocity.y += this.acceleration.y * dt;
                this.velocity.y = Math.max(this.velocity.y, -TERMINAL_VELOCITY);
            }

            // Handle jumping
            if (isJumping && this.isOnGround) {
                this.velocity.y = PLAYER_JUMP_VELOCITY;
                this.isOnGround = false;
            }
        }
        
        // Calculate new position
        const newPosition = position.clone();
        
        // Move in smaller steps for better collision detection
        const steps = 4;
        const stepDt = dt / steps;
        
        for (let i = 0; i < steps; i++) {
            // Move X
            newPosition.x += this.velocity.x * stepDt;
            if (this.checkCollision(newPosition)) {
                newPosition.x -= this.velocity.x * stepDt;
                this.velocity.x = 0;
            }
            
            // Move Y
            newPosition.y += this.velocity.y * stepDt;
            if (this.checkCollision(newPosition)) {
                newPosition.y -= this.velocity.y * stepDt;
                
                if (this.velocity.y < 0) {
                    this.isOnGround = true;
                }
                this.velocity.y = 0;
            } else {
                this.isOnGround = false;
            }
            
            // Move Z
            newPosition.z += this.velocity.z * stepDt;
            if (this.checkCollision(newPosition)) {
                newPosition.z -= this.velocity.z * stepDt;
                this.velocity.z = 0;
            }
        }
        
        // Double-check ground contact
        const groundCheckPos = newPosition.clone();
        groundCheckPos.y -= 0.05;
        if (this.checkCollision(groundCheckPos)) {
            this.isOnGround = true;
        }
        
        return newPosition;
    }

    /**
     * Enable or disable flying
     */
    setFlying(enabled) {
        this.isFlying = !!enabled;
        if (this.isFlying) {
            // prevent fall damage / velocity when entering fly
            this.velocity.y = 0;
        }
    }

    toggleFlying() {
        this.setFlying(!this.isFlying);
    }
    
    /**
     * Check if player collides with blocks at position
     */
    checkCollision(position) {
        const halfWidth = PLAYER_WIDTH / 2;
        const height = PLAYER_HEIGHT;
        
        // Check multiple points around the player hitbox
        const offsets = [
            // Bottom corners
            [-halfWidth, 0, -halfWidth],
            [halfWidth, 0, -halfWidth],
            [-halfWidth, 0, halfWidth],
            [halfWidth, 0, halfWidth],
            // Middle corners
            [-halfWidth, height / 2, -halfWidth],
            [halfWidth, height / 2, -halfWidth],
            [-halfWidth, height / 2, halfWidth],
            [halfWidth, height / 2, halfWidth],
            // Top corners
            [-halfWidth, height - 0.1, -halfWidth],
            [halfWidth, height - 0.1, -halfWidth],
            [-halfWidth, height - 0.1, halfWidth],
            [halfWidth, height - 0.1, halfWidth],
            // Center points
            [0, 0, 0],
            [0, height / 2, 0],
            [0, height - 0.1, 0]
        ];
        
        for (const [ox, oy, oz] of offsets) {
            const checkX = Math.floor(position.x + ox);
            const checkY = Math.floor(position.y + oy);
            const checkZ = Math.floor(position.z + oz);
            
            if (this.world.isBlockSolid(checkX, checkY, checkZ)) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Check AABB collision with a block
     */
    checkAABBCollision(position, blockX, blockY, blockZ) {
        const halfWidth = PLAYER_WIDTH / 2;
        
        const playerMin = {
            x: position.x - halfWidth,
            y: position.y,
            z: position.z - halfWidth
        };
        
        const playerMax = {
            x: position.x + halfWidth,
            y: position.y + PLAYER_HEIGHT,
            z: position.z + halfWidth
        };
        
        const blockMin = { x: blockX, y: blockY, z: blockZ };
        const blockMax = { x: blockX + 1, y: blockY + 1, z: blockZ + 1 };
        
        return (
            playerMin.x < blockMax.x && playerMax.x > blockMin.x &&
            playerMin.y < blockMax.y && playerMax.y > blockMin.y &&
            playerMin.z < blockMax.z && playerMax.z > blockMin.z
        );
    }
    
    /**
     * Reset physics state
     */
    reset() {
        this.velocity.set(0, 0, 0);
        this.isOnGround = false;
        this.wasOnGround = false;
    }
    
    /**
     * Get current velocity
     */
    getVelocity() {
        return this.velocity.clone();
    }
    
    /**
     * Check if player is on ground
     */
    getIsOnGround() {
        return this.isOnGround;
    }
}

export default Physics;
