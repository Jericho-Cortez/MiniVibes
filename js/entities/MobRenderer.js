import * as THREE from 'three';
import { MobType, MobProperties } from '../utils/Constants.js';

/**
 * MobRenderer - Creates voxel-style 3D models for mobs
 */
export class MobRenderer {
    
    /**
     * Create a mob mesh based on type
     */
    static createMobMesh(mobType) {
        const props = MobProperties[mobType];
        const group = new THREE.Group();
        
        switch (mobType) {
            case MobType.PIG:
                MobRenderer.buildPig(group, props);
                break;
            case MobType.COW:
                MobRenderer.buildCow(group, props);
                break;
            case MobType.SHEEP:
                MobRenderer.buildSheep(group, props);
                break;
            case MobType.CHICKEN:
                MobRenderer.buildChicken(group, props);
                break;
            case MobType.VILLAGER:
                MobRenderer.buildVillager(group, props);
                break;
            case MobType.ZOMBIE:
                MobRenderer.buildZombie(group, props);
                break;
            case MobType.SKELETON:
                MobRenderer.buildSkeleton(group, props);
                break;
            case MobType.CREEPER:
                MobRenderer.buildCreeper(group, props);
                break;
            case MobType.SPIDER:
                MobRenderer.buildSpider(group, props);
                break;
        }
        
        return group;
    }
    
    static box(w, h, d, color, x = 0, y = 0, z = 0) {
        const geo = new THREE.BoxGeometry(w, h, d);
        const mat = new THREE.MeshLambertMaterial({ color });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        mesh.castShadow = false;
        return mesh;
    }
    
    // ─── PIG ──────────────────────────────────────────────
    static buildPig(group) {
        const pink = 0xf0a0a0;
        const darkPink = 0xd08888;
        // Body
        group.add(MobRenderer.box(0.7, 0.5, 0.45, pink, 0, 0.45, 0));
        // Head
        group.add(MobRenderer.box(0.4, 0.4, 0.4, pink, 0.45, 0.55, 0));
        // Snout
        group.add(MobRenderer.box(0.15, 0.12, 0.2, darkPink, 0.7, 0.48, 0));
        // Legs
        group.add(MobRenderer.box(0.12, 0.25, 0.12, pink, 0.2, 0.12, 0.12));
        group.add(MobRenderer.box(0.12, 0.25, 0.12, pink, 0.2, 0.12, -0.12));
        group.add(MobRenderer.box(0.12, 0.25, 0.12, pink, -0.2, 0.12, 0.12));
        group.add(MobRenderer.box(0.12, 0.25, 0.12, pink, -0.2, 0.12, -0.12));
        // Eyes
        group.add(MobRenderer.box(0.05, 0.05, 0.05, 0x000000, 0.62, 0.62, 0.12));
        group.add(MobRenderer.box(0.05, 0.05, 0.05, 0x000000, 0.62, 0.62, -0.12));
    }
    
    // ─── COW ──────────────────────────────────────────────
    static buildCow(group) {
        const brown = 0x6b3a1f;
        const white = 0xe8e0d4;
        // Body
        group.add(MobRenderer.box(0.85, 0.6, 0.5, brown, 0, 0.55, 0));
        // White patches
        group.add(MobRenderer.box(0.3, 0.3, 0.52, white, 0.1, 0.6, 0));
        // Head
        group.add(MobRenderer.box(0.4, 0.4, 0.4, brown, 0.55, 0.7, 0));
        // Horns
        group.add(MobRenderer.box(0.04, 0.15, 0.04, 0xc8c8b0, 0.6, 0.95, 0.15));
        group.add(MobRenderer.box(0.04, 0.15, 0.04, 0xc8c8b0, 0.6, 0.95, -0.15));
        // Legs
        group.add(MobRenderer.box(0.12, 0.3, 0.12, brown, 0.3, 0.15, 0.15));
        group.add(MobRenderer.box(0.12, 0.3, 0.12, brown, 0.3, 0.15, -0.15));
        group.add(MobRenderer.box(0.12, 0.3, 0.12, brown, -0.3, 0.15, 0.15));
        group.add(MobRenderer.box(0.12, 0.3, 0.12, brown, -0.3, 0.15, -0.15));
        // Eyes
        group.add(MobRenderer.box(0.05, 0.06, 0.06, 0x000000, 0.72, 0.76, 0.1));
        group.add(MobRenderer.box(0.05, 0.06, 0.06, 0x000000, 0.72, 0.76, -0.1));
    }
    
    // ─── SHEEP ────────────────────────────────────────────
    static buildSheep(group) {
        const wool = 0xe8e8e8;
        const skin = 0xb8b0a0;
        // Body (wool)
        group.add(MobRenderer.box(0.8, 0.6, 0.55, wool, 0, 0.55, 0));
        // Head
        group.add(MobRenderer.box(0.35, 0.35, 0.35, skin, 0.5, 0.65, 0));
        // Legs
        group.add(MobRenderer.box(0.1, 0.3, 0.1, skin, 0.25, 0.15, 0.15));
        group.add(MobRenderer.box(0.1, 0.3, 0.1, skin, 0.25, 0.15, -0.15));
        group.add(MobRenderer.box(0.1, 0.3, 0.1, skin, -0.25, 0.15, 0.15));
        group.add(MobRenderer.box(0.1, 0.3, 0.1, skin, -0.25, 0.15, -0.15));
        // Eyes
        group.add(MobRenderer.box(0.04, 0.04, 0.04, 0x000000, 0.65, 0.72, 0.1));
        group.add(MobRenderer.box(0.04, 0.04, 0.04, 0x000000, 0.65, 0.72, -0.1));
    }
    
    // ─── CHICKEN ──────────────────────────────────────────
    static buildChicken(group) {
        const white = 0xffffff;
        const red = 0xcc2222;
        const yellow = 0xffcc00;
        // Body
        group.add(MobRenderer.box(0.35, 0.35, 0.3, white, 0, 0.35, 0));
        // Head
        group.add(MobRenderer.box(0.2, 0.2, 0.2, white, 0.2, 0.6, 0));
        // Beak
        group.add(MobRenderer.box(0.1, 0.05, 0.1, yellow, 0.35, 0.58, 0));
        // Wattle (red)
        group.add(MobRenderer.box(0.06, 0.08, 0.06, red, 0.3, 0.5, 0));
        // Comb
        group.add(MobRenderer.box(0.04, 0.08, 0.12, red, 0.22, 0.72, 0));
        // Legs
        group.add(MobRenderer.box(0.04, 0.18, 0.04, yellow, 0.05, 0.09, 0.06));
        group.add(MobRenderer.box(0.04, 0.18, 0.04, yellow, 0.05, 0.09, -0.06));
        // Eyes
        group.add(MobRenderer.box(0.03, 0.03, 0.03, 0x000000, 0.3, 0.63, 0.07));
        group.add(MobRenderer.box(0.03, 0.03, 0.03, 0x000000, 0.3, 0.63, -0.07));
        // Tail feathers
        group.add(MobRenderer.box(0.08, 0.2, 0.12, white, -0.2, 0.5, 0));
    }
    
    // ─── VILLAGER ─────────────────────────────────────────
    static buildVillager(group) {
        const robe = 0x8b6914;
        const skin = 0xd4a574;
        const nose = 0xc49464;
        // Body (robe)
        group.add(MobRenderer.box(0.45, 0.7, 0.3, robe, 0, 0.6, 0));
        // Head
        group.add(MobRenderer.box(0.4, 0.4, 0.4, skin, 0, 1.2, 0));
        // Big nose (villager trademark)
        group.add(MobRenderer.box(0.1, 0.2, 0.12, nose, 0.22, 1.15, 0));
        // Eyes
        group.add(MobRenderer.box(0.06, 0.06, 0.06, 0x2d5a1e, 0.18, 1.28, 0.1));
        group.add(MobRenderer.box(0.06, 0.06, 0.06, 0x2d5a1e, 0.18, 1.28, -0.1));
        // Eyebrows
        group.add(MobRenderer.box(0.08, 0.03, 0.06, 0x3a2010, 0.18, 1.34, 0.1));
        group.add(MobRenderer.box(0.08, 0.03, 0.06, 0x3a2010, 0.18, 1.34, -0.1));
        // Unibrow
        group.add(MobRenderer.box(0.04, 0.03, 0.04, 0x3a2010, 0.18, 1.34, 0));
        // Arms (crossed)
        group.add(MobRenderer.box(0.15, 0.5, 0.15, robe, 0.05, 0.7, 0.22));
        group.add(MobRenderer.box(0.15, 0.5, 0.15, robe, 0.05, 0.7, -0.22));
        // Hands
        group.add(MobRenderer.box(0.1, 0.1, 0.3, skin, 0.08, 0.55, 0));
        // Legs
        group.add(MobRenderer.box(0.14, 0.25, 0.14, robe, 0, 0.12, 0.07));
        group.add(MobRenderer.box(0.14, 0.25, 0.14, robe, 0, 0.12, -0.07));
    }
    
    // ─── ZOMBIE ───────────────────────────────────────────
    static buildZombie(group) {
        const skin = 0x2d8a2d;
        const shirt = 0x2255aa;
        const pants = 0x3a2370;
        // Body
        group.add(MobRenderer.box(0.4, 0.6, 0.25, shirt, 0, 0.65, 0));
        // Head
        group.add(MobRenderer.box(0.4, 0.4, 0.4, skin, 0, 1.2, 0));
        // Eyes (red glowing)
        group.add(MobRenderer.box(0.06, 0.06, 0.06, 0xff0000, 0.18, 1.25, 0.1));
        group.add(MobRenderer.box(0.06, 0.06, 0.06, 0xff0000, 0.18, 1.25, -0.1));
        // Arms (stretched forward)
        group.add(MobRenderer.box(0.5, 0.14, 0.14, skin, 0.45, 0.9, 0.18));
        group.add(MobRenderer.box(0.5, 0.14, 0.14, skin, 0.45, 0.9, -0.18));
        // Legs
        group.add(MobRenderer.box(0.14, 0.35, 0.14, pants, 0, 0.17, 0.06));
        group.add(MobRenderer.box(0.14, 0.35, 0.14, pants, 0, 0.17, -0.06));
    }
    
    // ─── SKELETON ─────────────────────────────────────────
    static buildSkeleton(group) {
        const bone = 0xd8d8d0;
        const dark = 0x2a2a2a;
        // Body (ribcage-like)
        group.add(MobRenderer.box(0.35, 0.55, 0.18, bone, 0, 0.65, 0));
        // Ribs
        for (let i = 0; i < 4; i++) {
            group.add(MobRenderer.box(0.37, 0.03, 0.2, dark, 0, 0.5 + i * 0.12, 0));
        }
        // Head (skull)
        group.add(MobRenderer.box(0.38, 0.38, 0.38, bone, 0, 1.2, 0));
        // Eyes (dark hollow)
        group.add(MobRenderer.box(0.08, 0.08, 0.06, dark, 0.17, 1.26, 0.12));
        group.add(MobRenderer.box(0.08, 0.08, 0.06, dark, 0.17, 1.26, -0.12));
        // Mouth
        group.add(MobRenderer.box(0.12, 0.04, 0.04, dark, 0.17, 1.12, 0));
        // Arms (thin)
        group.add(MobRenderer.box(0.08, 0.5, 0.08, bone, 0, 0.65, 0.2));
        group.add(MobRenderer.box(0.08, 0.5, 0.08, bone, 0, 0.65, -0.2));
        // Bow (in right hand)
        group.add(MobRenderer.box(0.04, 0.5, 0.04, 0x6b4423, 0.15, 0.65, -0.24));
        // Legs (thin)
        group.add(MobRenderer.box(0.1, 0.35, 0.1, bone, 0, 0.17, 0.04));
        group.add(MobRenderer.box(0.1, 0.35, 0.1, bone, 0, 0.17, -0.04));
    }
    
    // ─── CREEPER ──────────────────────────────────────────
    static buildCreeper(group) {
        const green = 0x3cb043;
        const darkGreen = 0x2a8030;
        const black = 0x111111;
        // Body (tall)
        group.add(MobRenderer.box(0.4, 0.8, 0.25, green, 0, 0.7, 0));
        // Mottled pattern
        group.add(MobRenderer.box(0.2, 0.2, 0.26, darkGreen, 0.05, 0.8, 0));
        group.add(MobRenderer.box(0.15, 0.15, 0.26, darkGreen, -0.08, 0.55, 0));
        // Head
        group.add(MobRenderer.box(0.4, 0.4, 0.4, green, 0, 1.35, 0));
        group.add(MobRenderer.box(0.2, 0.2, 0.41, darkGreen, 0.05, 1.4, 0));
        // Face (sad creeper face)
        group.add(MobRenderer.box(0.08, 0.1, 0.08, black, 0.18, 1.42, 0.12));
        group.add(MobRenderer.box(0.08, 0.1, 0.08, black, 0.18, 1.42, -0.12));
        // Mouth (frown pattern)
        group.add(MobRenderer.box(0.04, 0.1, 0.04, black, 0.18, 1.25, 0));
        group.add(MobRenderer.box(0.04, 0.06, 0.06, black, 0.18, 1.22, 0.06));
        group.add(MobRenderer.box(0.04, 0.06, 0.06, black, 0.18, 1.22, -0.06));
        group.add(MobRenderer.box(0.04, 0.04, 0.04, black, 0.18, 1.18, 0.1));
        group.add(MobRenderer.box(0.04, 0.04, 0.04, black, 0.18, 1.18, -0.1));
        // 4 Legs (short)
        group.add(MobRenderer.box(0.14, 0.3, 0.14, green, 0.1, 0.15, 0.06));
        group.add(MobRenderer.box(0.14, 0.3, 0.14, green, 0.1, 0.15, -0.06));
        group.add(MobRenderer.box(0.14, 0.3, 0.14, green, -0.1, 0.15, 0.06));
        group.add(MobRenderer.box(0.14, 0.3, 0.14, green, -0.1, 0.15, -0.06));
    }
    
    // ─── SPIDER ───────────────────────────────────────────
    static buildSpider(group) {
        const dark = 0x3a3a3a;
        const red = 0xcc0000;
        // Body (abdomen)
        group.add(MobRenderer.box(0.6, 0.35, 0.45, dark, -0.2, 0.35, 0));
        // Head
        group.add(MobRenderer.box(0.35, 0.3, 0.35, dark, 0.3, 0.35, 0));
        // Eyes (8 eyes, red)
        group.add(MobRenderer.box(0.06, 0.06, 0.06, red, 0.46, 0.42, 0.08));
        group.add(MobRenderer.box(0.06, 0.06, 0.06, red, 0.46, 0.42, -0.08));
        group.add(MobRenderer.box(0.04, 0.04, 0.04, red, 0.47, 0.38, 0.13));
        group.add(MobRenderer.box(0.04, 0.04, 0.04, red, 0.47, 0.38, -0.13));
        // Legs (8)
        const legColor = 0x2a2a2a;
        for (let side = -1; side <= 1; side += 2) {
            for (let i = 0; i < 4; i++) {
                const xOff = -0.1 + i * 0.18;
                // Upper leg
                group.add(MobRenderer.box(0.04, 0.04, 0.3, legColor, xOff, 0.35, side * 0.35));
                // Lower leg (angled down)
                group.add(MobRenderer.box(0.04, 0.25, 0.04, legColor, xOff, 0.14, side * 0.48));
            }
        }
    }
    
    /**
     * Get the height of a mob for positioning
     */
    static getMobHeight(mobType) {
        switch (mobType) {
            case MobType.PIG: return 0.8;
            case MobType.COW: return 1.1;
            case MobType.SHEEP: return 0.9;
            case MobType.CHICKEN: return 0.7;
            case MobType.VILLAGER: return 1.6;
            case MobType.ZOMBIE: return 1.6;
            case MobType.SKELETON: return 1.6;
            case MobType.CREEPER: return 1.6;
            case MobType.SPIDER: return 0.6;
            default: return 1.0;
        }
    }
}

export default MobRenderer;
