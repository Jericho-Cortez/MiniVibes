import { BlockType } from '../utils/Constants.js';

/**
 * Inventory - Simple hotbar inventory system
 */
export class Inventory {
    constructor(blockInteraction) {
        this.blockInteraction = blockInteraction;
        
        // Hotbar slots (1-9)
        this.hotbar = [
            BlockType.GRASS,       // Slot 1
            BlockType.DIRT,        // Slot 2
            BlockType.STONE,       // Slot 3
            BlockType.WOOD,        // Slot 4
            BlockType.LEAVES,      // Slot 5
            BlockType.SAND,        // Slot 6
            BlockType.COBBLESTONE, // Slot 7
            BlockType.PLANKS,      // Slot 8
            BlockType.GLASS        // Slot 9
        ];
        
        // Currently selected slot (0-8)
        this.selectedSlot = 0;
        
        // DOM elements
        this.hotbarElement = document.getElementById('hotbar');
        this.slots = this.hotbarElement.querySelectorAll('.hotbar-slot');
        
        // Bind event handler
        this.onKeyDown = this.onKeyDown.bind(this);
        this.onWheel = this.onWheel.bind(this);
        
        // Setup listeners
        this.setupEventListeners();
        
        // Initialize UI
        this.updateUI();
        
        // Set initial block type
        this.updateBlockInteraction();
    }
    
    setupEventListeners() {
        document.addEventListener('keydown', this.onKeyDown);
        document.addEventListener('wheel', this.onWheel);
    }
    
    onKeyDown(event) {
        // Number keys 1-9 select hotbar slots
        const key = event.code;
        
        if (key.startsWith('Digit')) {
            const digit = parseInt(key.replace('Digit', ''));
            if (digit >= 1 && digit <= 9) {
                this.selectSlot(digit - 1);
            }
        }
        
        // Also support numpad
        if (key.startsWith('Numpad')) {
            const digit = parseInt(key.replace('Numpad', ''));
            if (digit >= 1 && digit <= 9) {
                this.selectSlot(digit - 1);
            }
        }
    }
    
    onWheel(event) {
        // Scroll wheel cycles through hotbar
        if (event.deltaY > 0) {
            // Scroll down - next slot
            this.selectSlot((this.selectedSlot + 1) % 9);
        } else if (event.deltaY < 0) {
            // Scroll up - previous slot
            this.selectSlot((this.selectedSlot + 8) % 9);
        }
    }
    
    /**
     * Select a hotbar slot
     */
    selectSlot(index) {
        if (index < 0 || index > 8) return;
        
        this.selectedSlot = index;
        this.updateUI();
        this.updateBlockInteraction();
    }
    
    /**
     * Update UI to reflect current selection
     */
    updateUI() {
        this.slots.forEach((slot, index) => {
            if (index === this.selectedSlot) {
                slot.classList.add('selected');
            } else {
                slot.classList.remove('selected');
            }
        });
    }
    
    /**
     * Update block interaction with selected block type
     */
    updateBlockInteraction() {
        const blockType = this.hotbar[this.selectedSlot];
        this.blockInteraction.setSelectedBlockType(blockType);
    }
    
    /**
     * Get currently selected block type
     */
    getSelectedBlockType() {
        return this.hotbar[this.selectedSlot];
    }
    
    /**
     * Get selected slot index
     */
    getSelectedSlot() {
        return this.selectedSlot;
    }
    
    /**
     * Set block type in a slot
     */
    setSlot(index, blockType) {
        if (index >= 0 && index < 9) {
            this.hotbar[index] = blockType;
            
            if (index === this.selectedSlot) {
                this.updateBlockInteraction();
            }
        }
    }
    
    /**
     * Clean up
     */
    dispose() {
        document.removeEventListener('keydown', this.onKeyDown);
        document.removeEventListener('wheel', this.onWheel);
    }
}

export default Inventory;
