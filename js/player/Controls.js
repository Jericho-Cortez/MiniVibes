import * as THREE from 'three';
import { MOUSE_SENSITIVITY } from '../utils/Constants.js';

/**
 * Controls - Handles input and pointer lock for FPS controls
 */
export class Controls {
    constructor(camera, domElement) {
        this.camera = camera;
        this.domElement = domElement;
        
        // State
        this.isLocked = false;
        this.sensitivity = MOUSE_SENSITIVITY;
        
        // Camera rotation (Euler angles)
        this.pitch = 0; // Up/down
        this.yaw = 0;   // Left/right
        
        // Movement keys
        this.keys = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            jump: false
        };
        
        // Mouse buttons
        this.mouse = {
            left: false,
            right: false,
            leftJustPressed: false,
            rightJustPressed: false
        };
        
        // Bind event handlers
        this.onMouseMove = this.onMouseMove.bind(this);
        this.onKeyDown = this.onKeyDown.bind(this);
        this.onKeyUp = this.onKeyUp.bind(this);
        this.onMouseDown = this.onMouseDown.bind(this);
        this.onMouseUp = this.onMouseUp.bind(this);
        this.onPointerlockChange = this.onPointerlockChange.bind(this);
        this.onPointerlockError = this.onPointerlockError.bind(this);
        
        // Setup listeners
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Pointer lock events
        document.addEventListener('pointerlockchange', this.onPointerlockChange);
        document.addEventListener('pointerlockerror', this.onPointerlockError);
        
        // Keyboard events
        document.addEventListener('keydown', this.onKeyDown);
        document.addEventListener('keyup', this.onKeyUp);
        
        // Mouse events
        document.addEventListener('mousedown', this.onMouseDown);
        document.addEventListener('mouseup', this.onMouseUp);
    }
    
    /**
     * Request pointer lock
     */
    lock() {
        this.domElement.requestPointerLock();
    }
    
    /**
     * Release pointer lock
     */
    unlock() {
        document.exitPointerLock();
    }
    
    onPointerlockChange() {
        this.isLocked = document.pointerLockElement === this.domElement;
        
        if (this.isLocked) {
            document.addEventListener('mousemove', this.onMouseMove);
            document.getElementById('start-screen').classList.add('hidden');
        } else {
            document.removeEventListener('mousemove', this.onMouseMove);
        }
    }
    
    onPointerlockError() {
        console.error('Pointer lock error');
    }
    
    onMouseMove(event) {
        if (!this.isLocked) return;
        
        const movementX = event.movementX || 0;
        const movementY = event.movementY || 0;
        
        // Update yaw (left/right)
        this.yaw -= movementX * this.sensitivity;
        
        // Update pitch (up/down) with clamping
        this.pitch -= movementY * this.sensitivity;
        this.pitch = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, this.pitch));
        
        // Apply rotation to camera
        this.updateCameraRotation();
    }
    
    updateCameraRotation() {
        // Create rotation from Euler angles
        const euler = new THREE.Euler(this.pitch, this.yaw, 0, 'YXZ');
        this.camera.quaternion.setFromEuler(euler);
    }
    
    onKeyDown(event) {
        if (!this.isLocked) return;
        
        switch (event.code) {
            case 'KeyW':
            case 'ArrowUp':
                this.keys.forward = true;
                break;
            case 'KeyS':
            case 'ArrowDown':
                this.keys.backward = true;
                break;
            case 'KeyA':
            case 'ArrowLeft':
                this.keys.left = true;
                break;
            case 'KeyD':
            case 'ArrowRight':
                this.keys.right = true;
                break;
            case 'Space':
                this.keys.jump = true;
                event.preventDefault();
                break;
        }
    }
    
    onKeyUp(event) {
        switch (event.code) {
            case 'KeyW':
            case 'ArrowUp':
                this.keys.forward = false;
                break;
            case 'KeyS':
            case 'ArrowDown':
                this.keys.backward = false;
                break;
            case 'KeyA':
            case 'ArrowLeft':
                this.keys.left = false;
                break;
            case 'KeyD':
            case 'ArrowRight':
                this.keys.right = false;
                break;
            case 'Space':
                this.keys.jump = false;
                break;
        }
    }
    
    onMouseDown(event) {
        if (!this.isLocked) return;
        
        if (event.button === 0) {
            this.mouse.left = true;
            this.mouse.leftJustPressed = true;
        } else if (event.button === 2) {
            this.mouse.right = true;
            this.mouse.rightJustPressed = true;
        }
    }
    
    onMouseUp(event) {
        if (event.button === 0) {
            this.mouse.left = false;
        } else if (event.button === 2) {
            this.mouse.right = false;
        }
    }
    
    /**
     * Get movement direction vector
     */
    getMovementDirection() {
        const direction = new THREE.Vector3();
        
        // Forward/backward (Z axis in camera space)
        if (this.keys.forward) direction.z -= 1;
        if (this.keys.backward) direction.z += 1;
        
        // Left/right (X axis in camera space)
        if (this.keys.left) direction.x -= 1;
        if (this.keys.right) direction.x += 1;
        
        // Normalize if moving diagonally
        if (direction.length() > 0) {
            direction.normalize();
        }
        
        // Rotate direction by camera yaw (horizontal rotation only)
        const yawRotation = new THREE.Euler(0, this.yaw, 0);
        direction.applyEuler(yawRotation);
        
        return direction;
    }
    
    /**
     * Check if jump was requested
     */
    isJumping() {
        return this.keys.jump;
    }
    
    /**
     * Get look direction
     */
    getLookDirection() {
        const direction = new THREE.Vector3(0, 0, -1);
        direction.applyQuaternion(this.camera.quaternion);
        return direction;
    }
    
    /**
     * Get forward direction (without vertical component)
     */
    getForwardDirection() {
        const direction = new THREE.Vector3(0, 0, -1);
        const yawRotation = new THREE.Euler(0, this.yaw, 0);
        direction.applyEuler(yawRotation);
        return direction;
    }
    
    /**
     * Clear just pressed states (call at end of frame)
     */
    clearJustPressed() {
        this.mouse.leftJustPressed = false;
        this.mouse.rightJustPressed = false;
    }
    
    /**
     * Set mouse sensitivity
     */
    setSensitivity(value) {
        this.sensitivity = value;
    }
    
    /**
     * Clean up event listeners
     */
    dispose() {
        document.removeEventListener('pointerlockchange', this.onPointerlockChange);
        document.removeEventListener('pointerlockerror', this.onPointerlockError);
        document.removeEventListener('keydown', this.onKeyDown);
        document.removeEventListener('keyup', this.onKeyUp);
        document.removeEventListener('mousedown', this.onMouseDown);
        document.removeEventListener('mouseup', this.onMouseUp);
        document.removeEventListener('mousemove', this.onMouseMove);
    }
}

export default Controls;
