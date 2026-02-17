import { BlockType } from '../utils/Constants.js';

/**
 * CraftingSystem - Manages crafting recipes and the crafting table UI
 */
export class CraftingSystem {
    constructor(world, player) {
        this.world = world;
        this.player = player;
        
        // Crafting state
        this.isOpen = false;
        this.grid = Array(9).fill(null); // 3x3 grid
        this.result = null;
        
        // Recipes (3x3 grid patterns)
        this.recipes = this.defineRecipes();
        
        // UI Elements
        this.createUI();
        this.setupEventListeners();
    }
    
    /**
     * Define crafting recipes
     * Grid is [0-8] mapping to:
     * [0][1][2]
     * [3][4][5]
     * [6][7][8]
     */
    defineRecipes() {
        return [
            {
                name: 'Planks (x4)',
                result: { type: BlockType.PLANKS, count: 4 },
                pattern: [
                    null, null, null,
                    null, BlockType.WOOD, null,
                    null, null, null
                ],
                shapeless: true // Any position works
            },
            {
                name: 'Crafting Table',
                result: { type: BlockType.CRAFTING_TABLE, count: 1 },
                pattern: [
                    null, null, null,
                    null, BlockType.PLANKS, BlockType.PLANKS,
                    null, BlockType.PLANKS, BlockType.PLANKS
                ],
                shapeless: false
            },
            {
                name: 'Cobblestone (x4)',
                result: { type: BlockType.COBBLESTONE, count: 4 },
                pattern: [
                    null, null, null,
                    null, BlockType.STONE, null,
                    null, null, null
                ],
                shapeless: true
            },
            {
                name: 'Glass (x1)',
                result: { type: BlockType.GLASS, count: 1 },
                pattern: [
                    null, null, null,
                    null, BlockType.SAND, null,
                    null, BlockType.SAND, null
                ],
                shapeless: false
            },
            {
                name: 'Stone Bricks (x4)',
                result: { type: BlockType.STONE, count: 4 },
                pattern: [
                    null, null, null,
                    null, BlockType.COBBLESTONE, BlockType.COBBLESTONE,
                    null, BlockType.COBBLESTONE, BlockType.COBBLESTONE
                ],
                shapeless: false
            },
            {
                name: 'Sand Block (x1)',
                result: { type: BlockType.SAND, count: 1 },
                pattern: [
                    null, null, null,
                    null, BlockType.DIRT, null,
                    null, null, null
                ],
                shapeless: true
            }
        ];
    }
    
    /**
     * Create the crafting UI HTML
     */
    createUI() {
        this.overlay = document.createElement('div');
        this.overlay.id = 'crafting-overlay';
        this.overlay.className = 'crafting-overlay hidden';
        
        this.overlay.innerHTML = `
            <div class="crafting-container">
                <h2>⚒️ Table de Craft</h2>
                <div class="crafting-layout">
                    <div class="crafting-grid">
                        ${Array(9).fill(0).map((_, i) => `
                            <div class="craft-slot" data-slot="${i}">
                                <div class="craft-slot-content"></div>
                            </div>
                        `).join('')}
                    </div>
                    <div class="crafting-arrow">→</div>
                    <div class="crafting-result">
                        <div class="craft-slot result-slot" data-result="true">
                            <div class="craft-slot-content"></div>
                        </div>
                    </div>
                </div>
                <div class="crafting-inventory">
                    <h3>Matériaux disponibles</h3>
                    <div class="material-grid">
                    </div>
                </div>
                <div class="recipe-book">
                    <h3>📖 Recettes</h3>
                    <div class="recipe-list"></div>
                </div>
                <button class="craft-close-btn">✕ Fermer (E)</button>
            </div>
        `;
        
        document.body.appendChild(this.overlay);
        
        // Cache elements
        this.gridSlots = this.overlay.querySelectorAll('.craft-slot:not(.result-slot)');
        this.resultSlot = this.overlay.querySelector('.result-slot');
        this.materialGrid = this.overlay.querySelector('.material-grid');
        this.recipeList = this.overlay.querySelector('.recipe-list');
        this.closeBtn = this.overlay.querySelector('.craft-close-btn');
        
        // Populate recipe book
        this.populateRecipeBook();
    }
    
    /**
     * Populate recipe book
     */
    populateRecipeBook() {
        this.recipeList.innerHTML = this.recipes.map((recipe, idx) => {
            const ingredients = [...new Set(recipe.pattern.filter(p => p !== null))];
            const ingredientNames = ingredients.map(i => this.getBlockName(i)).join(' + ');
            const resultName = this.getBlockName(recipe.result.type);
            
            return `<div class="recipe-entry" data-recipe="${idx}">
                <span class="recipe-result">${resultName} x${recipe.result.count}</span>
                <span class="recipe-ingredients">${ingredientNames}</span>
            </div>`;
        }).join('');
    }
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Close button
        this.closeBtn.addEventListener('click', () => this.close());
        
        // Open with 0, close with E or Escape
        this.keyHandler = (e) => {
            if (this.isOpen && (e.code === 'KeyE' || e.code === 'Escape')) {
                this.close();
                e.preventDefault();
            }
            // Open/close with Digit0 or Numpad0
            if ((e.code === 'Digit0' || e.code === 'Numpad0') && !this.isOpen) {
                this.open();
                e.preventDefault();
            }
        };
        document.addEventListener('keydown', this.keyHandler);
        
        // Grid slot clicks - place material
        this.gridSlots.forEach((slot, index) => {
            slot.addEventListener('click', () => this.onGridSlotClick(index));
            slot.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                this.clearSlot(index);
            });
        });
        
        // Result slot click - take result
        this.resultSlot.addEventListener('click', () => this.takeResult());
        
        // Recipe entries - auto fill
        this.recipeList.addEventListener('click', (e) => {
            const entry = e.target.closest('.recipe-entry');
            if (entry) {
                const idx = parseInt(entry.dataset.recipe);
                this.autoFillRecipe(idx);
            }
        });
    }
    
    // Available materials (infinite for sandbox)
    availableMaterials = [
        BlockType.WOOD,
        BlockType.PLANKS,
        BlockType.COBBLESTONE,
        BlockType.STONE,
        BlockType.DIRT,
        BlockType.SAND,
        BlockType.GRASS,
        BlockType.LEAVES,
        BlockType.GLASS
    ];
    
    /**
     * Selected material for placing in grid
     */
    selectedMaterial = null;
    
    /**
     * Open crafting table UI
     */
    open() {
        this.isOpen = true;
        this.overlay.classList.remove('hidden');
        
        // Exit pointer lock
        document.exitPointerLock();
        
        // Clear grid
        this.grid.fill(null);
        this.result = null;
        this.updateGridUI();
        this.updateMaterialsUI();
    }
    
    /**
     * Close crafting table UI
     */
    close() {
        this.isOpen = false;
        this.overlay.classList.add('hidden');
        this.selectedMaterial = null;
        
        // Re-lock pointer
        const canvas = document.getElementById('game-canvas');
        canvas.requestPointerLock();
    }
    
    /**
     * Toggle crafting table UI
     */
    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }
    
    /**
     * Update materials palette
     */
    updateMaterialsUI() {
        this.materialGrid.innerHTML = this.availableMaterials.map(blockType => {
            const name = this.getBlockName(blockType);
            const colorClass = this.getBlockColorClass(blockType);
            const selected = this.selectedMaterial === blockType ? 'selected' : '';
            return `<div class="material-item ${selected}" data-block="${blockType}">
                <div class="material-preview ${colorClass}"></div>
                <span>${name}</span>
            </div>`;
        }).join('');
        
        // Add click listeners
        this.materialGrid.querySelectorAll('.material-item').forEach(item => {
            item.addEventListener('click', () => {
                this.selectedMaterial = parseInt(item.dataset.block);
                this.updateMaterialsUI();
            });
        });
    }
    
    /**
     * Handle grid slot click
     */
    onGridSlotClick(index) {
        if (this.selectedMaterial !== null) {
            this.grid[index] = this.selectedMaterial;
        } else {
            this.grid[index] = null;
        }
        this.updateGridUI();
        this.checkRecipe();
    }
    
    /**
     * Clear a grid slot
     */
    clearSlot(index) {
        this.grid[index] = null;
        this.updateGridUI();
        this.checkRecipe();
    }
    
    /**
     * Auto fill grid with recipe pattern
     */
    autoFillRecipe(recipeIndex) {
        const recipe = this.recipes[recipeIndex];
        this.grid = [...recipe.pattern];
        this.updateGridUI();
        this.checkRecipe();
    }
    
    /**
     * Check if current grid matches any recipe
     */
    checkRecipe() {
        this.result = null;
        
        for (const recipe of this.recipes) {
            if (recipe.shapeless) {
                if (this.matchShapeless(recipe)) {
                    this.result = recipe.result;
                    break;
                }
            } else {
                if (this.matchShaped(recipe)) {
                    this.result = recipe.result;
                    break;
                }
            }
        }
        
        this.updateResultUI();
    }
    
    /**
     * Match shaped recipe (exact position)
     */
    matchShaped(recipe) {
        // Try all possible offsets
        for (let ox = -2; ox <= 2; ox++) {
            for (let oy = -2; oy <= 2; oy++) {
                if (this.matchPatternAt(recipe.pattern, ox, oy)) {
                    return true;
                }
            }
        }
        return false;
    }
    
    matchPatternAt(pattern, offsetX, offsetY) {
        // Get bounding box of pattern
        const patternItems = [];
        for (let i = 0; i < 9; i++) {
            if (pattern[i] !== null) {
                patternItems.push({
                    x: i % 3 + offsetX,
                    y: Math.floor(i / 3) + offsetY,
                    type: pattern[i]
                });
            }
        }
        
        // Check all pattern items are in grid
        const gridItems = [];
        for (let i = 0; i < 9; i++) {
            if (this.grid[i] !== null) {
                gridItems.push({
                    x: i % 3,
                    y: Math.floor(i / 3),
                    type: this.grid[i]
                });
            }
        }
        
        // Must have same number of items
        if (patternItems.length !== gridItems.length) return false;
        if (patternItems.length === 0) return false;
        
        // Check each pattern item matches
        for (const pi of patternItems) {
            const found = gridItems.find(gi => gi.x === pi.x && gi.y === pi.y && gi.type === pi.type);
            if (!found) return false;
        }
        
        return true;
    }
    
    /**
     * Match shapeless recipe (any position)
     */
    matchShapeless(recipe) {
        const requiredItems = recipe.pattern.filter(p => p !== null);
        const gridItems = this.grid.filter(g => g !== null);
        
        if (requiredItems.length !== gridItems.length) return false;
        if (requiredItems.length === 0) return false;
        
        // Sort and compare
        const sortedRequired = [...requiredItems].sort();
        const sortedGrid = [...gridItems].sort();
        
        for (let i = 0; i < sortedRequired.length; i++) {
            if (sortedRequired[i] !== sortedGrid[i]) return false;
        }
        
        return true;
    }
    
    /**
     * Take the crafting result
     */
    takeResult() {
        if (!this.result) return;
        
        // Clear grid
        this.grid.fill(null);
        this.updateGridUI();
        
        // The result block type is now available
        // In a full game, this would add to inventory
        // For now, select it as active block
        this.result = null;
        this.updateResultUI();
    }
    
    /**
     * Update grid UI
     */
    updateGridUI() {
        this.gridSlots.forEach((slot, index) => {
            const content = slot.querySelector('.craft-slot-content');
            const blockType = this.grid[index];
            
            if (blockType !== null) {
                const colorClass = this.getBlockColorClass(blockType);
                content.innerHTML = `<div class="block-mini ${colorClass}"></div>`;
                content.title = this.getBlockName(blockType);
            } else {
                content.innerHTML = '';
                content.title = 'Empty';
            }
        });
    }
    
    /**
     * Update result UI
     */
    updateResultUI() {
        const content = this.resultSlot.querySelector('.craft-slot-content');
        
        if (this.result) {
            const colorClass = this.getBlockColorClass(this.result.type);
            content.innerHTML = `
                <div class="block-mini ${colorClass}"></div>
                <span class="result-count">x${this.result.count}</span>
            `;
            this.resultSlot.classList.add('has-result');
        } else {
            content.innerHTML = '';
            this.resultSlot.classList.remove('has-result');
        }
    }
    
    /**
     * Get block name
     */
    getBlockName(blockType) {
        const names = {
            [BlockType.AIR]: 'Air',
            [BlockType.BEDROCK]: 'Bedrock',
            [BlockType.STONE]: 'Stone',
            [BlockType.DIRT]: 'Dirt',
            [BlockType.GRASS]: 'Grass',
            [BlockType.WOOD]: 'Wood',
            [BlockType.LEAVES]: 'Leaves',
            [BlockType.SAND]: 'Sand',
            [BlockType.COBBLESTONE]: 'Cobblestone',
            [BlockType.PLANKS]: 'Planks',
            [BlockType.GLASS]: 'Glass',
            [BlockType.CRAFTING_TABLE]: 'Crafting Table'
        };
        return names[blockType] || 'Unknown';
    }
    
    /**
     * Get CSS color class for block preview
     */
    getBlockColorClass(blockType) {
        const classes = {
            [BlockType.GRASS]: 'grass',
            [BlockType.DIRT]: 'dirt',
            [BlockType.STONE]: 'stone',
            [BlockType.WOOD]: 'wood',
            [BlockType.LEAVES]: 'leaves',
            [BlockType.SAND]: 'sand',
            [BlockType.COBBLESTONE]: 'cobblestone',
            [BlockType.PLANKS]: 'planks',
            [BlockType.GLASS]: 'glass',
            [BlockType.CRAFTING_TABLE]: 'crafting-table'
        };
        return classes[blockType] || 'stone';
    }
    
    /**
     * Check if crafting UI is open
     */
    getIsOpen() {
        return this.isOpen;
    }
    
    /**
     * Get result block type (for inventory integration)
     */
    getResult() {
        return this.result;
    }
    
    /**
     * Dispose
     */
    dispose() {
        document.removeEventListener('keydown', this.keyHandler);
        if (this.overlay && this.overlay.parentNode) {
            this.overlay.parentNode.removeChild(this.overlay);
        }
    }
}

export default CraftingSystem;
