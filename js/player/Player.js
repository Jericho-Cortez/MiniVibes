import * as THREE from 'three';
import { Controls } from './Controls.js';
import { Physics } from './Physics.js';
import { PLAYER_EYE_HEIGHT, PLAYER_HEIGHT } from '../utils/Constants.js';

/**
 * Player - Main player controller combining camera, controls, and physics
 */
export class Player {
    constructor(camera, domElement, world) {
        this.camera = camera;
        this.world = world;
        
        // Position (at feet level)
        this.position = new THREE.Vector3(0, 60, 0);
        
        // Initialize subsystems
        this.controls = new Controls(camera, domElement);
        this.physics = new Physics(world);
        
        // Update camera position
        this.updateCamera();
    }
    
    /**
     * Set player spawn position
     */
    setPosition(position) {
        this.position.copy(position);
        this.position.y -= PLAYER_EYE_HEIGHT; // Adjust for eye height
        this.physics.reset();
        this.updateCamera();
    }
    
    /**
     * Update player each frame
     */
    update(deltaTime) {
        if (!this.controls.isLocked) return;
        
        // Get movement input
        const movement = this.controls.getMovementDirection();
        const isJumping = this.controls.isJumping();
        
        // Update physics
        this.position = this.physics.update(
            this.position,
            movement,
            deltaTime,
            isJumping
        );
        
        // Update camera position
        this.updateCamera();
        
        // Update world based on player position
        this.world.update(this.position);
    }
    
    /**
     * Update camera position to match player
     */
    updateCamera() {
        this.camera.position.set(
            this.position.x,
            this.position.y + PLAYER_EYE_HEIGHT,
            this.position.z
        );
    }
    
    /**
     * Get player eye position
     */
    getEyePosition() {
        return new THREE.Vector3(
            this.position.x,
            this.position.y + PLAYER_EYE_HEIGHT,
            this.position.z
        );
    }
    
    /**
     * Get player position (at feet)
     */
    getPosition() {
        return this.position.clone();
    }
    
    /**
     * Get look direction
     */
    getLookDirection() {
        return this.controls.getLookDirection();
    }
    
    /**
     * Check if player is on ground
     */
    isOnGround() {
        return this.physics.getIsOnGround();
    }
    
    /**
     * Get current velocity
     */
    getVelocity() {
        return this.physics.getVelocity();
    }
    
    /**
     * Lock controls (request pointer lock)
     */
    lock() {
        this.controls.lock();
    }
    
    /**
     * Check if controls are locked
     */
    isLocked() {
        return this.controls.isLocked;
    }
    
    /**
     * Get controls reference
     */
    getControls() {
        return this.controls;
    }
    
    /**
     * Clear just pressed states
     */
    clearJustPressed() {
        this.controls.clearJustPressed();
    }
    
    /**
     * Clean up
     */
    dispose() {
        this.controls.dispose();
    }
}

export default Player;
