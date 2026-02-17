import { BlockType } from '../utils/Constants.js';

/**
 * Inventory - Simple hotbar inventory system
 */
export class Inventory {
    constructor(blockInteraction) {
        this.blockInteraction = blockInteraction;
        
        // Hotbar slots (1-9)
        this.hotbar = [
            BlockType.GRASS,           // Slot 1
            BlockType.DIRT,            // Slot 2
            BlockType.STONE,           // Slot 3
            BlockType.WOOD,            // Slot 4
            BlockType.LEAVES,          // Slot 5
            BlockType.SAND,            // Slot 6
            BlockType.COBBLESTONE,     // Slot 7
            BlockType.PLANKS,          // Slot 8
            BlockType.CRAFTING_TABLE   // Slot 9
        ];
        
        // Currently selected slot (0-8)
        this.selectedSlot = 0;
        
        // DOM elements
        this.hotbarElement = document.getElementById('hotbar');
        this.slots = this.hotbarElement.querySelectorAll('.hotbar-slot');

        // Inventory overlay elements (full inventory)
        this.inventoryOverlay = document.getElementById('inventory-overlay');
        this.inventoryGrid = document.getElementById('inventory-grid');
        this.inventoryHotbar = document.getElementById('inventory-hotbar');
        this.closeButton = document.getElementById('close-inventory');
        this.isOpen = false;
        
        // Bind event handler
        this.onKeyDown = this.onKeyDown.bind(this);
        this.onWheel = this.onWheel.bind(this);
        this.onCloseClick = this.onCloseClick.bind(this);
        
        // Setup listeners
        this.setupEventListeners();
        
        // Initialize UI
        this.updateUI();
        
        // Set initial block type
        this.updateBlockInteraction();

        // Build inventory UI slots
        this.buildInventoryUI();
    }
    
    setupEventListeners() {
        document.addEventListener('keydown', this.onKeyDown);
        document.addEventListener('wheel', this.onWheel);
        if (this.closeButton) this.closeButton.addEventListener('click', this.onCloseClick);
    }
    
    onKeyDown(event) {
        // Number keys 1-9 select hotbar slots
        const key = event.code;

        // Toggle inventory with E
        if (key === 'KeyE') {
            // Prevent default if pointer is locked
            if (document.pointerLockElement) event.preventDefault();
            this.toggle();
            return;
        }
        
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
        if (this.closeButton) this.closeButton.removeEventListener('click', this.onCloseClick);
    }

    /**
     * Build inventory UI grid and hotbar copies
     */
    buildInventoryUI() {
        if (!this.inventoryGrid) return;

        // Ensure 27 slots exist
        this.inventoryGrid.innerHTML = '';
        for (let i = 0; i < 27; i++) {
            const slot = document.createElement('div');
            slot.className = 'inventory-slot';
            slot.dataset.index = i;
            this.inventoryGrid.appendChild(slot);
        }

        // Populate inventory hotbar area (use same structure as main hotbar)
        if (this.inventoryHotbar) {
            this.inventoryHotbar.innerHTML = '';
            for (let i = 0; i < 9; i++) {
                const slot = document.createElement('div');
                slot.className = 'hotbar-slot';
                slot.dataset.slot = (i + 1).toString();
                const preview = document.createElement('div');
                preview.className = 'block-preview';
                slot.appendChild(preview);
                const num = document.createElement('span');
                num.className = 'slot-number';
                num.textContent = (i + 1).toString();
                slot.appendChild(num);
                this.inventoryHotbar.appendChild(slot);
            }
        }
    }

    onCloseClick() {
        this.close();
    }

    /**
     * Open inventory: release pointer lock and show overlay
     */
    open() {
        if (this.isOpen) return;
        this.isOpen = true;
        if (this.inventoryOverlay) this.inventoryOverlay.classList.remove('hidden');

        // Release pointer lock so user can use mouse to click UI
        try {
            const player = window.game && window.game.player;
            if (player && player.getControls) player.getControls().unlock();
            else if (document.exitPointerLock) document.exitPointerLock();
        } catch (e) {}
    }

    /**
     * Close inventory: request pointer lock and hide overlay
     */
    close() {
        if (!this.isOpen) return;
        this.isOpen = false;
        if (this.inventoryOverlay) this.inventoryOverlay.classList.add('hidden');

        // Re-lock pointer to resume playing
        try {
            const player = window.game && window.game.player;
            if (player && player.lock) player.lock();
        } catch (e) {}
    }

    toggle() {
        if (this.isOpen) this.close(); else this.open();
    }

    getIsOpen() {
        return !!this.isOpen;
    }
}

export default Inventory;
