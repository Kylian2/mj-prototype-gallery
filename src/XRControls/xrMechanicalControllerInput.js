"use strict";

import * as THREE from 'three';
import { XrCollider } from './XrCollider.js';

// Working variables, prevents "new" allocations
const __rot = new THREE.Quaternion();
const __wristOffset = new THREE.Vector3();
const __euler = new THREE.Euler();
const __wristQuat = new THREE.Quaternion();

/**
 * Manages the standard WebXR mechanical "grip" controller.
 */
export class XrMechanicalControllerInput {
    constructor(context, grip, gamePad, handSide) {
        this.context = context ;
        this._grip = grip ;
        this._gamePad = gamePad ;
        this._handSide = handSide ;
        this._wristAxis = new THREE.AxesHelper(0.1)
        this._palmAxis = new THREE.AxesHelper(0.1)

        this.select = false ;
        this.squeeze = false ;
        
        this.touchPad = new THREE.Vector2();
        this.touchPadButton = false;
        this.thumbStick = new THREE.Vector2();
        this.thumbStickButton = false;
        this.buttonA = false;
        this.buttonB = false;
        this.hasHand = false ;
        this.trigger = false ;

        this._localPosition = new THREE.Vector3();
        this._localRotation = new THREE.Quaternion();
        this._worldPosition = new THREE.Vector3();
        this._worldRotation = new THREE.Quaternion();
        this.pointerActive = true ;
        this._pointerWOrigin = new THREE.Vector3();
        this._pointerWDirection = new THREE.Vector3();
        this._lastUpdate = -1;

        this._lastPosition = new THREE.Vector3();

        this.collider = undefined;
        this._colliderTargetBuffer = [];
        this._pointerTargets = [];
        this._onPointing = undefined;

        this._palmWorldPosition = new THREE.Vector3();
        this.setUpCollider();
    }

    /*
     * Position of the head tracker relative to the parent object.
     */
    get wristLPos() {
        this.refresh();
        return this._localPosition;
    }

    /*
     * Rotation of the head tracker relative to the parent object.
     */
    get wristLQuat() {
        this.refresh();
        return this._localRotation;
    }

    /*
     * position of head in world coordinates
     */
    get wristWPos() {
        this.refresh();
        return this._worldPosition;
    }

    /*
     * rotation of head in world orientation
     */
    get wristWQuat() {
        this.refresh();
        return this._worldRotation;
    }

    /*
     *  The position of the pointer that matches the controller
     */
    get pointerWOrigin() {
        this.refresh();
        return this._pointerWOrigin;
    }

    /*
     *  The direction of the pointer that matches the controller
     */
    get pointerWDirection() {
        this.refresh();
        return this._pointerWDirection;
    }   

    /**
     * Returns the world position of the palm
     */
    get PalmWPosition() {
        this.refresh();
        return this._pointerWDirection;
    }

    getSpeed(){

        const now = this.wristWPos;
        const last = new THREE.Vector3();
        last.copy(this._lastPosition);
        const distance = now.distanceTo(last)/this.context.deltaTime;
        this._lastPosition.copy(now);
        return distance;

    }

    /*
     * Apply haptic feedback to the controller (vibrate)
     */
    vibrate(intensity, timeMs) {
        if (this._gamePad.hapticActuators && this._gamePad.hapticActuators.length >= 1) {
            this._gamePad.hapticActuators[0].pulse(intensity || 1, timeMs || 100);
        }
    }

    /**
     * Called when the controller is connected
     */
    onConnect() {       
        this.context.scene.add(this._wristAxis); 
        this.context.scene.add(this._palmAxis);
    }

    /**
     * Called on each animation frame
     */
    onAnimate() {  
        this._wristAxis.position.copy(this.wristWPos);   
        this._wristAxis.quaternion.copy(this.wristWQuat);  
        this.collider.update(); 
        this.raycast(this._pointerTargets);
        
        this._palmAxis.position.copy(this._palmWorldPosition);
        this._palmAxis.quaternion.copy(this.wristWQuat);
    }

    /**
     * Called when the controller is disconnected
     */
    onDisconnect() {
        this._wristAxis?.removeFromParent(); 
        this._palmAxis?.removeFromParent();
    }

    /*
     * In order to keep the reference points like the wrist location and the 
     * pointer location abstracted from input (hand or controller) map
     * the wrist position and rotation to a [[[]]] and position the pointer
     * at the point in the controller that makes sense for the controller. 
     */
    refresh() {
        if (this._lastUpdate == this.context.frame)
            return; // already updated for this frame
        this._lastUpdate = this.context.frame;

        // Position, and determine local (to the parent) position
        this._grip.getWorldPosition(this._worldPosition);
        this._grip.getWorldQuaternion(this._worldRotation);

        // Offset the world position to find the wrist location
        const offset = (this._handSide == 'left') ? 
            { x : -0.02, y: 0.0, z: 0.09 } : // Left Wrist offset
            { x : 0.02, y: 0.0, z: 0.09 } ; // Right Wrist offset
        __wristOffset.set(offset.x, offset.y, offset.z) ;
        __wristOffset.applyQuaternion(this._worldRotation) ;
        this._worldPosition.add(__wristOffset);


        // Convert world position and rotation to relative to the parent object
        this._localPosition.copy(this._worldPosition);
        this._localPosition.sub(this._grip.parent.position);
        __rot.copy(this._grip.parent.quaternion).invert();
        this._localPosition.applyQuaternion(__rot);

        // Rotate the hand so that the fingers are forward, thumb up position
        if(this._handSide == 'left') {
            __wristQuat.setFromEuler(__euler.set(0.0, Math.PI/8.0 * 1.5, Math.PI/2.0, "ZYX"))
        } else {
            __wristQuat.setFromEuler(__euler.set(0.0, -Math.PI/8.0 * 1.5, -Math.PI/2.0, "ZYX"))
        }
        this._worldRotation.multiply(__wristQuat);

        // Rotation, and determine local (to the parent) rotation
        this._localRotation.copy(this._grip.parent.quaternion);
        this._localRotation.invert();
        this._localRotation.multiply(this._worldRotation);

        // Calculate palm position based on wrist position and rotation
        // We need to initialize this._palmWorldPosition in the constructor if not already there
        if (!this._palmWorldPosition) {
            this._palmWorldPosition = new THREE.Vector3();
        }
        
        // Create palm offset - different for each hand
        const palmOffset = new THREE.Vector3();
        if (this._handSide == 'left') {
            palmOffset.set(0.03, -0.02, -0.05); // Offset for left palm from wrist
        } else {
            palmOffset.set(-0.03, -0.02, -0.05); // Offset for right palm from wrist
        }
        
        // Apply world rotation to palm offset
        palmOffset.applyQuaternion(this._worldRotation);
        
        // Set palm position (wrist position + rotated offset)
        this._palmWorldPosition.copy(this._worldPosition).add(palmOffset);

        // Pointer 
        this._grip.getWorldPosition(this._pointerWOrigin.setScalar(0));
        this._pointerWDirection.set(0,-1,-1).normalize() ; // Forward
        this._grip.getWorldQuaternion(__rot);
        this._pointerWDirection.applyQuaternion(__rot);

        // update gamepad
        // https://www.w3.org/TR/webxr-gamepads-module-1/
        if (this._gamePad) {
            let axis = this._gamePad.axes;
            if (axis && axis.length > 3) {
                // Mixed Reality
                this.touchPad.set(axis[0], axis[1]);
                // Mixed Reality and Quest 2
                this.thumbStick.set(axis[2], axis[3]);
            }
            let buttons = this._gamePad.buttons;
            if (buttons) {
                // Mixed Reality and Quest 2
                this.touchPadButton = (buttons.length > 2) ? buttons[2].pressed : false;
                this.thumbStickButton = (buttons.length > 3) ? buttons[3].pressed : false;
                // Quest 2
                this.buttonA = (buttons.length > 4) ? buttons[4].pressed : false;
                this.buttonB = (buttons.length > 5) ? buttons[5].pressed : false;

                this.trigger = (buttons.length > 0) ? buttons[0].pressed : false;
            }
        }
    }

    setUpCollider(){
        this.collider = new XrCollider({
            object: this,
            targets: [],
            radius: 0.05,
            debug: false,
            scene: this.context.scene
        });
    }

    /**
     * Function executed when a collision start
     * @param {function} callback 
     */
    setOnColliderEnter(callback){
        this.collider.onCollisionEnter = callback;
    }

    /**
     * Function executed when a collision finish
     * @param {function} callback 
     */
    setOnColliderExit(callback){
        this.collider.onCollisionExit = callback;
    }

    /**
     * Function executed when during a collision
     * @param {function} callback 
     */
    setOnColliderStay(callback){
        this.collider.onCollisionStay = callback;
    }

    addColliderTarget(target){
        if(!this.collider){
            this._colliderTargetBuffer.push(target);
            return;
        }

        this.collider.addColliderTarget(target);
        for(const t of this._colliderTargetBuffer){
            this.collider.addColliderTarget(t);
        }
        this._colliderTargetBuffer = [];
    }

    addPointerTarget(target) {
        if(Array.isArray(target)) {
            for (const item of target) {
                this._pointerTargets.push(item);
            }
        }else{
            this._pointerTargets.push(target);
        }
    }

    /**
     * Function executed when a target is pointed
     * @param {function} callback 
     */
    setOnPointing(callback){
        this._onPointing = callback;
    }

    getWorldPosition(target, pos = ""){
        if(pos === 'palm'){
            return target.copy(this._palmWorldPosition)
        }
        return target.copy(this.pointerWOrigin);
    }

    /**
     * Check if an object is pointed by controller's rayon. Execute callback on the nearest object.
     * 
     * @param {Array} targets
     */
    raycast(targets) {
        const raycaster = new THREE.Raycaster();
        raycaster.set(
            this.pointerWOrigin,
            this.pointerWDirection
        );
        // test intersection with object in the scene
        targets.forEach(target => {
            if (target.isUI && !(target.currentState == 'on' || target.currentState == 'off')) {
                target.setState('idle');
            }
        });

        const intersects = raycaster.intersectObjects(targets, true);
        if (intersects.length > 0) {      
            if(this._onPointing){
                if(intersects[0].object.isMesh){
                    if(intersects[0].object.parent && intersects[0].object.parent.isText && intersects[0].object.parent.parent){
                        this._onPointing(intersects[0].object.parent.parent);
                    }else{
                        this._onPointing(intersects[0].object.parent);
                    }
                }else{
                    this._onPointing(intersects[0].object);
                }
            }
        }

    }

    /**
     * Properly dispose of the XrMechanicalControllerInput instance and free resources
     * Call this method when you're done with the XrMechanicalControllerInput object
     */
    dispose() {
        // Remove the wrist axis from the scene and dispose of its resources
        if (this._wristAxis) {
            // Remove from scene
            this._wristAxis.removeFromParent();
            
            // Dispose of geometry and material
            if (this._wristAxis.geometry) {
                this._wristAxis.geometry.dispose();
            }
            if (this._wristAxis.material) {
                // Handle array of materials
                if (Array.isArray(this._wristAxis.material)) {
                    this._wristAxis.material.forEach(material => material.dispose());
                } else {
                    this._wristAxis.material.dispose();
                }
            }
            
            this._wristAxis = null;
        }
        
        // Also dispose of _palmAxis
        if (this._palmAxis) {
            this._palmAxis.removeFromParent();
            
            if (this._palmAxis.geometry) {
                this._palmAxis.geometry.dispose();
            }
            if (this._palmAxis.material) {
                if (Array.isArray(this._palmAxis.material)) {
                    this._palmAxis.material.forEach(material => material.dispose());
                } else {
                    this._palmAxis.material.dispose();
                }
            }
            
            this._palmAxis = null;
        }
        
        // Dispose of the collider if it exists
        if (this.collider) {
            // Check if the collider has its own dispose method
            if (typeof this.collider.dispose === 'function') {
                this.collider.dispose();
            } else {
                // If no dispose method exists, attempt to clean up known properties
                if (this.collider.debugMesh) {
                    this.collider.debugMesh.removeFromParent();
                    if (this.collider.debugMesh.geometry) {
                        this.collider.debugMesh.geometry.dispose();
                    }
                    if (this.collider.debugMesh.material) {
                        this.collider.debugMesh.material.dispose();
                    }
                }
            }
            
            this.collider = null;
        }

        this._pointerTargets = [];
        this._onPointing = undefined;
        
        // Clear vector references
        this._localPosition = null;
        this._localRotation = null;
        this._worldPosition = null;
        this._worldRotation = null;
        this._pointerWOrigin = null;
        this._pointerWDirection = null;
        
        // Clear vector2 references
        this.touchPad = null;
        this.thumbStick = null;
        
        // Clear arrays
        this._colliderTargetBuffer = null;
        this._pointerTargets = null;
        
        // Clear callbacks
        this._onPointing = null;
        
        // Clear references to DOM/WebXR objects
        this._grip = null;
        this._gamePad = null;
        
        // Clear context reference
        this.context = null;
    }
}