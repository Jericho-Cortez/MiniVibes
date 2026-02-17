import * as THREE from 'three';
import { BlockType, BlockColors } from './Constants.js';

/**
 * TextureAtlas - Generates and manages block textures
 */
export class TextureAtlas {
    constructor() {
        this.textureSize = 16; // Pixels per block texture
        this.atlasSize = 256; // Total atlas size
        this.blocksPerRow = this.atlasSize / this.textureSize;
        this.materials = {};
        this.texture = null;
        
        this.generateAtlas();
    }
    
    generateAtlas() {
        const canvas = document.createElement('canvas');
        canvas.width = this.atlasSize;
        canvas.height = this.atlasSize;
        const ctx = canvas.getContext('2d');
        
        // Fill with transparent background
        ctx.fillStyle = 'rgba(0,0,0,0)';
        ctx.fillRect(0, 0, this.atlasSize, this.atlasSize);
        
        // Generate textures for each block type
        let index = 0;
        for (const [blockTypeStr, colors] of Object.entries(BlockColors)) {
            const blockType = parseInt(blockTypeStr);
            
            // Calculate position in atlas for top, side, bottom
            const topIndex = index * 3;
            const sideIndex = index * 3 + 1;
            const bottomIndex = index * 3 + 2;
            
            // Draw top texture
            this.drawBlockTexture(ctx, topIndex, colors.top, blockType, 'top');
            
            // Draw side texture
            this.drawBlockTexture(ctx, sideIndex, colors.side, blockType, 'side', colors.sideTop);
            
            // Draw bottom texture
            this.drawBlockTexture(ctx, bottomIndex, colors.bottom, blockType, 'bottom');
            
            index++;
        }
        
        // Create Three.js texture
        this.texture = new THREE.CanvasTexture(canvas);
        this.texture.magFilter = THREE.NearestFilter;
        this.texture.minFilter = THREE.NearestFilter;
        this.texture.colorSpace = THREE.SRGBColorSpace;
        this.texture.needsUpdate = true;
        
        // Create material
        this.material = new THREE.MeshLambertMaterial({
            map: this.texture,
            vertexColors: true,
            side: THREE.FrontSide
        });
        
        // Transparent material for glass, leaves, etc.
        this.transparentMaterial = new THREE.MeshLambertMaterial({
            map: this.texture,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
        });
    }
    
    drawBlockTexture(ctx, index, color, blockType, face, topStripeColor = null) {
        const x = (index % this.blocksPerRow) * this.textureSize;
        const y = Math.floor(index / this.blocksPerRow) * this.textureSize;
        
        // Convert hex color to RGB
        const r = (color >> 16) & 255;
        const g = (color >> 8) & 255;
        const b = color & 255;
        
        // Fill base color
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.fillRect(x, y, this.textureSize, this.textureSize);
        
        // Add texture details based on block type
        this.addTextureDetails(ctx, x, y, blockType, face, r, g, b, topStripeColor);
    }
    
    addTextureDetails(ctx, x, y, blockType, face, r, g, b, topStripeColor) {
        const size = this.textureSize;
        
        switch (blockType) {
            case BlockType.GRASS:
                if (face === 'side') {
                    // Grass stripe on top of dirt
                    if (topStripeColor) {
                        const tr = (topStripeColor >> 16) & 255;
                        const tg = (topStripeColor >> 8) & 255;
                        const tb = topStripeColor & 255;
                        ctx.fillStyle = `rgb(${tr}, ${tg}, ${tb})`;
                        ctx.fillRect(x, y, size, 3);
                    }
                    // Add some noise
                    this.addNoise(ctx, x, y + 3, size, size - 3, r, g, b, 20);
                } else if (face === 'top') {
                    // Add grass texture
                    this.addNoise(ctx, x, y, size, size, r, g, b, 30);
                } else {
                    this.addNoise(ctx, x, y, size, size, r, g, b, 20);
                }
                break;
                
            case BlockType.STONE:
            case BlockType.COBBLESTONE:
                this.addNoise(ctx, x, y, size, size, r, g, b, 40);
                // Add cracks
                ctx.strokeStyle = `rgba(0,0,0,0.3)`;
                ctx.beginPath();
                ctx.moveTo(x + 3, y + 5);
                ctx.lineTo(x + 8, y + 7);
                ctx.lineTo(x + 12, y + 4);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(x + 5, y + 11);
                ctx.lineTo(x + 10, y + 13);
                ctx.stroke();
                break;
                
            case BlockType.DIRT:
                this.addNoise(ctx, x, y, size, size, r, g, b, 25);
                break;
                
            case BlockType.WOOD:
                // Add wood grain
                ctx.strokeStyle = `rgba(0,0,0,0.2)`;
                for (let i = 0; i < size; i += 3) {
                    ctx.beginPath();
                    ctx.moveTo(x, y + i);
                    ctx.lineTo(x + size, y + i);
                    ctx.stroke();
                }
                break;
                
            case BlockType.LEAVES:
                this.addNoise(ctx, x, y, size, size, r, g, b, 50);
                break;
                
            case BlockType.SAND:
                this.addNoise(ctx, x, y, size, size, r, g, b, 15);
                break;
                
            case BlockType.PLANKS:
                // Add plank lines
                ctx.strokeStyle = `rgba(0,0,0,0.2)`;
                ctx.beginPath();
                ctx.moveTo(x, y + 4);
                ctx.lineTo(x + size, y + 4);
                ctx.moveTo(x, y + 8);
                ctx.lineTo(x + size, y + 8);
                ctx.moveTo(x, y + 12);
                ctx.lineTo(x + size, y + 12);
                ctx.stroke();
                break;
                
            case BlockType.GLASS:
                // Add glass shine
                ctx.fillStyle = 'rgba(255,255,255,0.4)';
                ctx.fillRect(x + 2, y + 2, 4, 4);
                ctx.fillStyle = 'rgba(255,255,255,0.2)';
                ctx.fillRect(x + 8, y + 10, 3, 3);
                break;
                
            case BlockType.BEDROCK:
                this.addNoise(ctx, x, y, size, size, r, g, b, 30);
                break;
        }
    }
    
    addNoise(ctx, x, y, width, height, r, g, b, intensity) {
        for (let py = 0; py < height; py += 2) {
            for (let px = 0; px < width; px += 2) {
                const variation = (Math.random() - 0.5) * intensity;
                const nr = Math.max(0, Math.min(255, r + variation));
                const ng = Math.max(0, Math.min(255, g + variation));
                const nb = Math.max(0, Math.min(255, b + variation));
                ctx.fillStyle = `rgb(${nr}, ${ng}, ${nb})`;
                ctx.fillRect(x + px, y + py, 2, 2);
            }
        }
    }
    
    /**
     * Get UV coordinates for a block face
     */
    getUV(blockType, face) {
        const blockIndex = this.getBlockIndex(blockType);
        let textureIndex;
        
        switch (face) {
            case 'top': textureIndex = blockIndex * 3; break;
            case 'side': textureIndex = blockIndex * 3 + 1; break;
            case 'bottom': textureIndex = blockIndex * 3 + 2; break;
            default: textureIndex = blockIndex * 3 + 1;
        }
        
        const u = (textureIndex % this.blocksPerRow) / this.blocksPerRow;
        const v = 1 - (Math.floor(textureIndex / this.blocksPerRow) + 1) / this.blocksPerRow;
        const size = 1 / this.blocksPerRow;
        
        return { u, v, size };
    }
    
    getBlockIndex(blockType) {
        const blockTypes = Object.keys(BlockColors).map(k => parseInt(k));
        return blockTypes.indexOf(blockType);
    }
    
    getMaterial(transparent = false) {
        return transparent ? this.transparentMaterial : this.material;
    }
}

export default TextureAtlas;
