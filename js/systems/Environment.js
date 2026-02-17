import * as THREE from 'three';
import { DAY_LENGTH } from '../utils/Constants.js';

/**
 * Environment - Handles lighting, sky, and day/night cycle
 */
export class Environment {
    constructor(scene) {
        this.scene = scene;
        
        // Time of day (0-1, 0.5 = noon)
        this.timeOfDay = 0.25; // Start at 6:00 AM
        this.dayLength = DAY_LENGTH;
        
        // Lights
        this.setupLights();
        
        // Sky colors
        this.skyColors = {
            day: new THREE.Color(0x87CEEB),      // Sky blue
            sunset: new THREE.Color(0xFF7F50),   // Coral
            night: new THREE.Color(0x0a0a20),    // Dark blue
            sunrise: new THREE.Color(0xFFB6C1)   // Light pink
        };
        
        // Update initial state
        this.updateEnvironment();
    }
    
    setupLights() {
        // Ambient light (always present, varies with time)
        this.ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(this.ambientLight);
        
        // Directional light (sun)
        this.sunLight = new THREE.DirectionalLight(0xffffff, 1.0);
        this.sunLight.position.set(100, 100, 50);
        this.sunLight.castShadow = false; // Disable shadows for performance
        this.scene.add(this.sunLight);
        
        // Hemisphere light for more natural lighting
        this.hemisphereLight = new THREE.HemisphereLight(
            0x87CEEB, // Sky color
            0x8B6914, // Ground color
            0.3
        );
        this.scene.add(this.hemisphereLight);
        
        // Fog for distance effect
        this.scene.fog = new THREE.Fog(0x87CEEB, 50, 150);
    }
    
    /**
     * Update environment each frame
     */
    update(deltaTime) {
        // Advance time of day
        this.timeOfDay += deltaTime / this.dayLength;
        if (this.timeOfDay >= 1) {
            this.timeOfDay -= 1;
        }
        
        this.updateEnvironment();
    }
    
    /**
     * Update all environment elements based on time of day
     */
    updateEnvironment() {
        // Calculate sun angle (0 = midnight, 0.5 = noon)
        const sunAngle = this.timeOfDay * Math.PI * 2 - Math.PI / 2;
        
        // Update sun position
        const sunDistance = 200;
        this.sunLight.position.x = Math.cos(sunAngle) * sunDistance;
        this.sunLight.position.y = Math.sin(sunAngle) * sunDistance;
        this.sunLight.position.z = 50;
        
        // Calculate lighting intensity based on sun height
        const sunHeight = Math.sin(sunAngle);
        const dayIntensity = Math.max(0, sunHeight);
        
        // Update sun light
        this.sunLight.intensity = dayIntensity * 1.2;
        
        // Update ambient light (never goes completely dark)
        this.ambientLight.intensity = 0.1 + dayIntensity * 0.4;
        
        // Update sun color based on time
        const sunColor = this.getSunColor();
        this.sunLight.color.copy(sunColor);
        
        // Update sky color
        const skyColor = this.getSkyColor();
        this.scene.background = skyColor;
        this.scene.fog.color.copy(skyColor);
        
        // Update hemisphere light
        this.hemisphereLight.intensity = 0.1 + dayIntensity * 0.3;
        this.hemisphereLight.color.copy(skyColor);
    }
    
    /**
     * Get sky color based on time of day
     */
    getSkyColor() {
        const time = this.timeOfDay;
        
        // Time zones (approximate)
        // 0.00 - 0.20: Night
        // 0.20 - 0.30: Sunrise
        // 0.30 - 0.70: Day
        // 0.70 - 0.80: Sunset
        // 0.80 - 1.00: Night
        
        if (time < 0.20 || time >= 0.80) {
            // Night
            return this.skyColors.night.clone();
        } else if (time < 0.25) {
            // Sunrise transition
            const t = (time - 0.20) / 0.05;
            return this.lerpColor(this.skyColors.night, this.skyColors.sunrise, t);
        } else if (time < 0.30) {
            // Sunrise to day
            const t = (time - 0.25) / 0.05;
            return this.lerpColor(this.skyColors.sunrise, this.skyColors.day, t);
        } else if (time < 0.70) {
            // Day
            return this.skyColors.day.clone();
        } else if (time < 0.75) {
            // Day to sunset
            const t = (time - 0.70) / 0.05;
            return this.lerpColor(this.skyColors.day, this.skyColors.sunset, t);
        } else {
            // Sunset to night
            const t = (time - 0.75) / 0.05;
            return this.lerpColor(this.skyColors.sunset, this.skyColors.night, t);
        }
    }
    
    /**
     * Get sun color based on time
     */
    getSunColor() {
        const time = this.timeOfDay;
        
        if (time < 0.25 || time >= 0.75) {
            // Night/early morning - moonlight
            return new THREE.Color(0x4444ff);
        } else if (time < 0.30) {
            // Sunrise
            return new THREE.Color(0xFFB347);
        } else if (time < 0.70) {
            // Day
            return new THREE.Color(0xFFFFE0);
        } else {
            // Sunset
            return new THREE.Color(0xFF6B35);
        }
    }
    
    /**
     * Linear interpolation between two colors
     */
    lerpColor(color1, color2, t) {
        const result = color1.clone();
        result.lerp(color2, t);
        return result;
    }
    
    /**
     * Get formatted time string (HH:MM)
     */
    getTimeString() {
        const totalMinutes = Math.floor(this.timeOfDay * 24 * 60);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
    
    /**
     * Set time of day directly
     */
    setTimeOfDay(time) {
        this.timeOfDay = time % 1;
        this.updateEnvironment();
    }
    
    /**
     * Set day length in seconds
     */
    setDayLength(seconds) {
        this.dayLength = seconds;
    }
    
    /**
     * Check if it's currently night
     */
    isNight() {
        return this.timeOfDay < 0.25 || this.timeOfDay >= 0.75;
    }
    
    /**
     * Get current light level (0-1)
     */
    getLightLevel() {
        const sunAngle = this.timeOfDay * Math.PI * 2 - Math.PI / 2;
        const sunHeight = Math.sin(sunAngle);
        return Math.max(0.1, (sunHeight + 1) / 2);
    }
}

export default Environment;
