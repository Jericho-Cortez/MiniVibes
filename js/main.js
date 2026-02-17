import * as THREE from 'three';
import { World } from './world/World.js';
import { Player } from './player/Player.js';
import { BlockInteraction } from './systems/BlockInteraction.js';
import { Inventory } from './systems/Inventory.js';
import { Environment } from './systems/Environment.js';
import { MobManager } from './entities/MobManager.js';
import { CraftingSystem } from './systems/CraftingSystem.js';

/**
 * MiniVibes - Main game class
 */
class Game {
    constructor() {
        // DOM elements
        this.canvas = document.getElementById('game-canvas');
        this.startScreen = document.getElementById('start-screen');
        this.startButton = document.getElementById('start-button');
        
        // Debug UI elements
        this.fpsElement = document.getElementById('fps');
        this.positionElement = document.getElementById('position');
        this.chunksElement = document.getElementById('chunks');
        this.timeElement = document.getElementById('time');
        
        // Game state
        this.isRunning = false;
        this.lastTime = 0;
        this.frameCount = 0;
        this.fpsUpdateTime = 0;
        this.currentFps = 0;
        
        // Initialize Three.js
        this.initRenderer();
        this.initScene();
        this.initCamera();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Prevent context menu on right click
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }
    
    initRenderer() {
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            powerPreference: 'high-performance'
        });
        
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setClearColor(0x87CEEB);
    }
    
    initScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB);
    }
    
    initCamera() {
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 60, 0);
    }
    
    setupEventListeners() {
        // Window resize
        window.addEventListener('resize', () => this.onWindowResize());
        
        // Start button
        this.startButton.addEventListener('click', () => this.start());
    }
    
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    async start() {
        if (this.isRunning) return;
        
        console.log('Starting MiniVibes...');
        
        // Hide start screen
        this.startScreen.classList.add('hidden');
        
        // Initialize world
        const seed = Math.floor(Math.random() * 100000);
        console.log(`World seed: ${seed}`);
        
        this.world = new World(this.scene, seed);
        const spawnPosition = await this.world.initialize();
        
        console.log('World initialized');
        
        // Initialize player
        this.player = new Player(this.camera, this.canvas, this.world);
        this.player.setPosition(spawnPosition);
        
        // Lock controls
        this.player.lock();
        
        // Initialize block interaction
        this.blockInteraction = new BlockInteraction(this.world, this.player, this.scene);
        
        // Initialize inventory
        this.inventory = new Inventory(this.blockInteraction);
        
        // Initialize environment
        this.environment = new Environment(this.scene);
        
        // Initialize mob manager
        this.mobManager = new MobManager(this.world, this.scene);
        this.mobManager.spawnInitialMobs(spawnPosition);
        
        // Initialize crafting system
        this.craftingSystem = new CraftingSystem(this.world, this.player);
        
        // Connect systems
        this.blockInteraction.mobManager = this.mobManager;
        this.blockInteraction.craftingSystem = this.craftingSystem;
        
        // Start game loop
        this.isRunning = true;
        this.lastTime = performance.now();
        this.animate();
        
        console.log('Game started!');
    }
    
    animate() {
        if (!this.isRunning) return;
        
        requestAnimationFrame(() => this.animate());
        
        // Calculate delta time
        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        // Update game systems
        this.update(deltaTime);
        
        // Render
        this.renderer.render(this.scene, this.camera);
        
        // Update FPS
        this.updateFPS(deltaTime);
    }
    
    update(deltaTime) {
        // Skip updates if crafting UI or inventory UI is open
        const craftingOpen = this.craftingSystem && this.craftingSystem.getIsOpen();
        const inventoryOpen = this.inventory && this.inventory.getIsOpen && this.inventory.getIsOpen();

        // Update player
        if (!craftingOpen && !inventoryOpen) {
            this.player.update(deltaTime);
        }

        // Update block interaction
        if (!craftingOpen && !inventoryOpen) {
            this.blockInteraction.update(deltaTime);
        }
        
        // Update environment (day/night cycle)
        this.environment.update(deltaTime);
        
        // Update mobs
        if (this.mobManager) {
            this.mobManager.update(
                deltaTime,
                this.player.getPosition(),
                this.environment.isNight()
            );
        }
        
        // Clear just pressed states
        this.player.clearJustPressed();
        
        // Update debug UI
        this.updateDebugUI();
    }
    
    updateFPS(deltaTime) {
        this.frameCount++;
        this.fpsUpdateTime += deltaTime;
        
        if (this.fpsUpdateTime >= 0.5) {
            this.currentFps = Math.round(this.frameCount / this.fpsUpdateTime);
            this.frameCount = 0;
            this.fpsUpdateTime = 0;
        }
    }
    
    updateDebugUI() {
        // Update FPS
        this.fpsElement.textContent = `FPS: ${this.currentFps}`;
        
        // Update position
        const pos = this.player.getPosition();
        this.positionElement.textContent = `Pos: ${pos.x.toFixed(1)}, ${pos.y.toFixed(1)}, ${pos.z.toFixed(1)}`;
        
        // Update chunk count
        this.chunksElement.textContent = `Chunks: ${this.world.getLoadedChunkCount()}`;
        
        // Update time
        this.timeElement.textContent = `Time: ${this.environment.getTimeString()}`;
        
        // Update mob count
        const mobCount = this.mobManager ? this.mobManager.getMobCount() : 0;
        if (!this.mobsElement) {
            this.mobsElement = document.getElementById('mobs');
        }
        if (this.mobsElement) {
            this.mobsElement.textContent = `Mobs: ${mobCount}`;
        }

        // Fly indicator (shows when player is flying)
        let flyEl = document.getElementById('fly-indicator');
        if (!flyEl) {
            flyEl = document.createElement('div');
            flyEl.id = 'fly-indicator';
            flyEl.className = 'hidden';
            const debug = document.getElementById('debug-info') || document.getElementById('ui-overlay');
            if (debug) debug.appendChild(flyEl);
        }

        const isFlying = this.player && this.player.physics && this.player.physics.isFlying;
        if (isFlying) {
            flyEl.textContent = 'Fly: ON';
            flyEl.classList.remove('hidden');
        } else {
            flyEl.classList.add('hidden');
        }
    }
    
    /**
     * Stop the game
     */
    stop() {
        this.isRunning = false;
        
        if (this.player) {
            this.player.dispose();
        }
        
        if (this.blockInteraction) {
            this.blockInteraction.dispose();
        }
        
        if (this.inventory) {
            this.inventory.dispose();
        }
        
        if (this.mobManager) {
            this.mobManager.dispose();
        }
        
        if (this.craftingSystem) {
            this.craftingSystem.dispose();
        }
    }
}

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('MiniVibes - Voxel Sandbox Game');
    console.log('----------------------------');
    window.game = new Game();
});
