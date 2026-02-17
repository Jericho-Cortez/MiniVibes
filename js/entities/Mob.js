import * as THREE from 'three';
import { MobType, MobProperties } from '../utils/Constants.js';
import { MobRenderer } from './MobRenderer.js';

/**
 * Mob - Individual mob entity with AI and physics
 */
export class Mob {
    constructor(mobType, position, world) {
        this.mobType = mobType;
        this.world = world;
        this.properties = MobProperties[mobType];
        
        // State
        this.health = this.properties.health;
        this.isAlive = true;
        this.isHurt = false;
        this.hurtTimer = 0;
        
        // Position and movement
        this.position = position.clone();
        this.velocity = new THREE.Vector3();
        this.rotation = Math.random() * Math.PI * 2;
        this.targetRotation = this.rotation;
        this.isOnGround = false;
        
        // AI state
        this.aiState = 'idle';    // idle, wander, chase, flee, trade
        this.aiTimer = 0;
        this.wanderTarget = null;
        this.chaseTarget = null;
        this.idleTime = 2 + Math.random() * 4;
        
        // Villager specific
        this.profession = this.randomProfession();
        
        // Animation
        this.walkCycle = 0;
        this.legAngle = 0;
        
        // Create 3D mesh
        this.mesh = MobRenderer.createMobMesh(mobType);
        this.mesh.position.copy(this.position);
        this.mesh.rotation.y = this.rotation;
        
        this.height = MobRenderer.getMobHeight(mobType);
    }
    
    randomProfession() {
        const professions = ['Farmer', 'Blacksmith', 'Librarian', 'Butcher', 'Cleric'];
        return professions[Math.floor(Math.random() * professions.length)];
    }
    
    /**
     * Update mob each frame
     */
    update(deltaTime, playerPosition) {
        if (!this.isAlive) return;
        
        // Update hurt timer
        if (this.isHurt) {
            this.hurtTimer -= deltaTime;
            if (this.hurtTimer <= 0) {
                this.isHurt = false;
                this.setMeshColor(null); // Reset color
            }
        }
        
        // Update AI
        this.updateAI(deltaTime, playerPosition);
        
        // Update physics
        this.updatePhysics(deltaTime);
        
        // Update animation
        this.updateAnimation(deltaTime);
        
        // Update mesh position
        this.mesh.position.copy(this.position);
        
        // Smooth rotation
        const rotDiff = this.targetRotation - this.rotation;
        this.rotation += rotDiff * Math.min(1, deltaTime * 5);
        this.mesh.rotation.y = this.rotation;
    }
    
    /**
     * Update AI behavior
     */
    updateAI(deltaTime, playerPosition) {
        this.aiTimer -= deltaTime;
        
        const distToPlayer = this.position.distanceTo(playerPosition);
        const isHostile = this.properties.hostile;
        
        // Hostile mob behavior
        if (isHostile) {
            if (distToPlayer < 15) {
                this.aiState = 'chase';
                this.chaseTarget = playerPosition;
            } else if (this.aiState === 'chase') {
                this.aiState = 'wander';
                this.aiTimer = 0;
            }
        }
        
        // Villager behavior: flee from hostiles (simplified)
        if (this.mobType === MobType.VILLAGER) {
            // Villagers look at player when nearby
            if (distToPlayer < 5) {
                this.aiState = 'idle';
                this.lookAt(playerPosition);
            }
        }
        
        switch (this.aiState) {
            case 'idle':
                this.handleIdle(deltaTime);
                break;
            case 'wander':
                this.handleWander(deltaTime);
                break;
            case 'chase':
                this.handleChase(deltaTime, playerPosition);
                break;
            case 'flee':
                this.handleFlee(deltaTime, playerPosition);
                break;
        }
    }
    
    handleIdle(deltaTime) {
        this.velocity.x = 0;
        this.velocity.z = 0;
        
        if (this.aiTimer <= 0) {
            this.aiState = 'wander';
            this.aiTimer = 3 + Math.random() * 5;
            this.pickWanderTarget();
        }
    }
    
    handleWander(deltaTime) {
        if (!this.wanderTarget || this.aiTimer <= 0) {
            this.aiState = 'idle';
            this.aiTimer = this.idleTime;
            this.velocity.x = 0;
            this.velocity.z = 0;
            return;
        }
        
        this.moveToward(this.wanderTarget, this.properties.speed * 0.5);
        
        // Check if reached target
        const dist = new THREE.Vector2(
            this.position.x - this.wanderTarget.x,
            this.position.z - this.wanderTarget.z
        ).length();
        
        if (dist < 0.5) {
            this.aiState = 'idle';
            this.aiTimer = this.idleTime;
            this.velocity.x = 0;
            this.velocity.z = 0;
        }
    }
    
    handleChase(deltaTime, playerPosition) {
        const dist = this.position.distanceTo(playerPosition);
        
        if (dist > 20) {
            this.aiState = 'wander';
            this.aiTimer = 0;
            return;
        }
        
        this.moveToward(playerPosition, this.properties.speed);
        
        // Jump if blocked
        if (this.isOnGround && this.isBlockedAhead()) {
            this.velocity.y = 6;
        }
    }
    
    handleFlee(deltaTime, playerPosition) {
        const dir = new THREE.Vector3().subVectors(this.position, playerPosition).normalize();
        const fleeTarget = this.position.clone().add(dir.multiplyScalar(10));
        this.moveToward(fleeTarget, this.properties.speed * 1.3);
        
        const dist = this.position.distanceTo(playerPosition);
        if (dist > 20) {
            this.aiState = 'idle';
            this.aiTimer = this.idleTime;
        }
    }
    
    /**
     * Pick random wander target near current position
     */
    pickWanderTarget() {
        const angle = Math.random() * Math.PI * 2;
        const distance = 3 + Math.random() * 6;
        this.wanderTarget = new THREE.Vector3(
            this.position.x + Math.cos(angle) * distance,
            this.position.y,
            this.position.z + Math.sin(angle) * distance
        );
    }
    
    /**
     * Move toward a target position
     */
    moveToward(target, speed) {
        const direction = new THREE.Vector3(
            target.x - this.position.x,
            0,
            target.z - this.position.z
        );
        
        if (direction.length() > 0.1) {
            direction.normalize();
            this.velocity.x = direction.x * speed;
            this.velocity.z = direction.z * speed;
            
            // Face movement direction
            this.targetRotation = Math.atan2(-direction.x, -direction.z);
        }
    }
    
    /**
     * Look at a target
     */
    lookAt(target) {
        const dx = target.x - this.position.x;
        const dz = target.z - this.position.z;
        this.targetRotation = Math.atan2(-dx, -dz);
    }
    
    /**
     * Check if blocked ahead
     */
    isBlockedAhead() {
        const forward = new THREE.Vector3(
            -Math.sin(this.rotation),
            0,
            -Math.cos(this.rotation)
        );
        const checkPos = this.position.clone().add(forward.multiplyScalar(0.5));
        const blockX = Math.floor(checkPos.x);
        const blockY = Math.floor(this.position.y);
        const blockZ = Math.floor(checkPos.z);
        return this.world.isBlockSolid(blockX, blockY, blockZ);
    }
    
    /**
     * Update physics (gravity, collision)
     */
    updatePhysics(deltaTime) {
        const dt = Math.min(deltaTime, 0.05);
        
        // Gravity
        this.velocity.y -= 20 * dt;
        this.velocity.y = Math.max(this.velocity.y, -30);
        
        // Move X
        this.position.x += this.velocity.x * dt;
        if (this.checkCollision()) {
            this.position.x -= this.velocity.x * dt;
            this.velocity.x = 0;
        }
        
        // Move Y
        this.position.y += this.velocity.y * dt;
        if (this.checkCollision()) {
            this.position.y -= this.velocity.y * dt;
            if (this.velocity.y < 0) {
                this.isOnGround = true;
            }
            this.velocity.y = 0;
        } else {
            this.isOnGround = false;
        }
        
        // Move Z
        this.position.z += this.velocity.z * dt;
        if (this.checkCollision()) {
            this.position.z -= this.velocity.z * dt;
            this.velocity.z = 0;
        }
        
        // Prevent falling through world
        if (this.position.y < 0) {
            this.position.y = 60;
        }
    }
    
    /**
     * Check collision with world
     */
    checkCollision() {
        const halfWidth = 0.25;
        const checkPoints = [
            [0, 0, 0],
            [halfWidth, 0, 0],
            [-halfWidth, 0, 0],
            [0, 0, halfWidth],
            [0, 0, -halfWidth],
            [0, this.height * 0.5, 0],
            [0, this.height - 0.1, 0]
        ];
        
        for (const [ox, oy, oz] of checkPoints) {
            const bx = Math.floor(this.position.x + ox);
            const by = Math.floor(this.position.y + oy);
            const bz = Math.floor(this.position.z + oz);
            if (this.world.isBlockSolid(bx, by, bz)) {
                return true;
            }
        }
        return false;
    }
    
    /**
     * Update walk animation
     */
    updateAnimation(deltaTime) {
        const speed = new THREE.Vector2(this.velocity.x, this.velocity.z).length();
        
        if (speed > 0.1) {
            this.walkCycle += deltaTime * speed * 5;
            this.legAngle = Math.sin(this.walkCycle) * 0.5;
        } else {
            this.legAngle *= 0.9; // Smoothly return to rest
        }
        
        // Animate legs if the mesh has leg children
        // Legs are typically children 3-6 for quadrupeds, varies per mob
        this.animateLegs();
    }
    
    /**
     * Simple leg animation
     */
    animateLegs() {
        const children = this.mesh.children;
        if (!children || children.length < 4) return;
        
        // Minimal bob animation on the whole group
        if (Math.abs(this.legAngle) > 0.01) {
            this.mesh.position.y = this.position.y + Math.abs(Math.sin(this.walkCycle * 2)) * 0.03;
        }
    }
    
    /**
     * Take damage
     */
    takeDamage(amount) {
        this.health -= amount;
        this.isHurt = true;
        this.hurtTimer = 0.3;
        this.setMeshColor(0xff0000); // Flash red
        
        if (this.health <= 0) {
            this.die();
        }
        
        // Non-hostile mobs flee when hit
        if (!this.properties.hostile) {
            this.aiState = 'flee';
        }
    }
    
    /**
     * Flash mesh color
     */
    setMeshColor(color) {
        this.mesh.traverse((child) => {
            if (child.isMesh) {
                if (color !== null) {
                    child.userData.originalColor = child.material.color.getHex();
                    child.material = child.material.clone();
                    child.material.color.setHex(color);
                } else if (child.userData.originalColor !== undefined) {
                    child.material.color.setHex(child.userData.originalColor);
                }
            }
        });
    }
    
    /**
     * Mob dies
     */
    die() {
        this.isAlive = false;
        this.velocity.set(0, 0, 0);
    }
    
    /**
     * Get mob position
     */
    getPosition() {
        return this.position.clone();
    }
    
    /**
     * Add to scene
     */
    addToScene(scene) {
        scene.add(this.mesh);
    }
    
    /**
     * Remove from scene
     */
    removeFromScene(scene) {
        scene.remove(this.mesh);
    }
    
    /**
     * Dispose of resources
     */
    dispose() {
        this.mesh.traverse((child) => {
            if (child.isMesh) {
                child.geometry.dispose();
                child.material.dispose();
            }
        });
    }
}

export default Mob;
