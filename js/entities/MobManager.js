import * as THREE from 'three';
import { Mob } from './Mob.js';
import { MobType, MobProperties, MAX_MOBS, MOB_SPAWN_RADIUS, MOB_DESPAWN_RADIUS, MOB_SPAWN_INTERVAL, CHUNK_HEIGHT } from '../utils/Constants.js';

/**
 * MobManager - Manages mob spawning, updating, and despawning
 */
export class MobManager {
    constructor(world, scene) {
        this.world = world;
        this.scene = scene;
        
        this.mobs = [];
        this.spawnTimer = 0;
        
        // Passive mobs that can spawn
        this.passiveMobs = [
            MobType.PIG,
            MobType.COW,
            MobType.SHEEP,
            MobType.CHICKEN,
            MobType.VILLAGER
        ];
        
        // Hostile mobs that spawn at night
        this.hostileMobs = [
            MobType.ZOMBIE,
            MobType.SKELETON,
            MobType.CREEPER,
            MobType.SPIDER
        ];
    }
    
    /**
     * Update all mobs
     */
    update(deltaTime, playerPosition, isNight) {
        // Update spawn timer
        this.spawnTimer -= deltaTime;
        
        if (this.spawnTimer <= 0 && this.mobs.length < MAX_MOBS) {
            this.spawnTimer = MOB_SPAWN_INTERVAL;
            this.trySpawnMob(playerPosition, isNight);
        }
        
        // Update each mob
        for (let i = this.mobs.length - 1; i >= 0; i--) {
            const mob = this.mobs[i];
            
            mob.update(deltaTime, playerPosition);
            
            // Remove dead mobs (after death animation)
            if (!mob.isAlive) {
                mob.removeFromScene(this.scene);
                mob.dispose();
                this.mobs.splice(i, 1);
                continue;
            }
            
            // Despawn far mobs
            const dist = mob.position.distanceTo(playerPosition);
            if (dist > MOB_DESPAWN_RADIUS) {
                mob.removeFromScene(this.scene);
                mob.dispose();
                this.mobs.splice(i, 1);
            }
        }
    }
    
    /**
     * Try to spawn a mob near the player
     */
    trySpawnMob(playerPosition, isNight) {
        // Choose mob type based on time
        let mobPool;
        if (isNight) {
            // Night: mostly hostile, some passive
            mobPool = Math.random() < 0.7 ? this.hostileMobs : this.passiveMobs;
        } else {
            // Day: mostly passive, rarely hostile
            mobPool = Math.random() < 0.9 ? this.passiveMobs : this.hostileMobs;
        }
        
        const mobType = mobPool[Math.floor(Math.random() * mobPool.length)];
        
        // Find spawn position
        const spawnPos = this.findSpawnPosition(playerPosition);
        if (!spawnPos) return;
        
        // Create mob
        const mob = new Mob(mobType, spawnPos, this.world);
        mob.addToScene(this.scene);
        this.mobs.push(mob);
    }
    
    /**
     * Find a valid spawn position near the player
     */
    findSpawnPosition(playerPosition) {
        const maxAttempts = 10;
        
        for (let i = 0; i < maxAttempts; i++) {
            // Random angle and distance
            const angle = Math.random() * Math.PI * 2;
            const distance = 15 + Math.random() * (MOB_SPAWN_RADIUS - 15);
            
            const x = Math.floor(playerPosition.x + Math.cos(angle) * distance);
            const z = Math.floor(playerPosition.z + Math.sin(angle) * distance);
            
            // Find surface Y
            const surfaceY = this.findSurface(x, z);
            
            if (surfaceY > 0 && surfaceY < CHUNK_HEIGHT - 5) {
                // Check that there's room for the mob (2 blocks of air)
                if (!this.world.isBlockSolid(x, surfaceY + 1, z) && 
                    !this.world.isBlockSolid(x, surfaceY + 2, z)) {
                    return new THREE.Vector3(x + 0.5, surfaceY + 1, z + 0.5);
                }
            }
        }
        
        return null;
    }
    
    /**
     * Find the surface Y at world position
     */
    findSurface(x, z) {
        for (let y = CHUNK_HEIGHT - 1; y >= 0; y--) {
            if (this.world.isBlockSolid(x, y, z)) {
                return y;
            }
        }
        return -1;
    }
    
    /**
     * Get mob at position (for hitting)
     */
    getMobAtRay(origin, direction, maxDist = 5) {
        let closestMob = null;
        let closestDist = maxDist;
        
        for (const mob of this.mobs) {
            if (!mob.isAlive) continue;
            
            // Simple sphere-ray intersection
            const toMob = new THREE.Vector3().subVectors(mob.position, origin);
            toMob.y += mob.height / 2; // Center of mob
            
            const projection = toMob.dot(direction);
            if (projection < 0 || projection > maxDist) continue;
            
            const closestPoint = origin.clone().add(direction.clone().multiplyScalar(projection));
            const dist = closestPoint.distanceTo(
                new THREE.Vector3(mob.position.x, mob.position.y + mob.height / 2, mob.position.z)
            );
            
            // Hit radius
            const hitRadius = 0.6;
            if (dist < hitRadius && projection < closestDist) {
                closestMob = mob;
                closestDist = projection;
            }
        }
        
        return closestMob;
    }
    
    /**
     * Get number of mobs
     */
    getMobCount() {
        return this.mobs.length;
    }
    
    /**
     * Spawn initial mobs around player
     */
    spawnInitialMobs(playerPosition) {
        for (let i = 0; i < 8; i++) {
            this.trySpawnMob(playerPosition, false);
        }
    }
    
    /**
     * Clean up all mobs
     */
    dispose() {
        for (const mob of this.mobs) {
            mob.removeFromScene(this.scene);
            mob.dispose();
        }
        this.mobs = [];
    }
}

export default MobManager;
