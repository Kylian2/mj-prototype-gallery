"use strict";

import * as THREE from 'three';
import { XRControllerModelFactory } from 'three/addons/webxr/XRControllerModelFactory.js';
import { XrMechanicalControllerInput } from './xrMechanicalControllerInput.js' ;
import { XrHead } from './xrHead.js' ;
import { Pointer } from './pointer.js';

const PointerActiveColor = new THREE.Color("gray") ;
const PointerPressedColor = new THREE.Color("yellow") ;

/**
 * Create the WebXR grip controllers and hand controllers and respond
 * to the event to manage the corresponding handler classes.
 */
export class XrInput {

    constructor(context)
    {
        this.context = context ;
        this._controllerModelFactory = new XRControllerModelFactory();
        this._leftHandController = undefined ;
        this._rightHandController = undefined ;
        this._head = new XrHead(this.context) ;
        
        const xr = context.renderer.xr 
        this.setupController(0, xr);
        this.setupController(1, xr);

        this._isFlying = false;

        this._leftPointer;
        this._rightPointer;

        this._origin = this.context.renderer.xr.getReferenceSpace();

        this._moveYOptions = {always: true, joystick: true};
        this._rotationIsDiscrete = false;
        this._jumpEnable = true;
        this._flyingModeEnable = true;

        
        this._leftColliderBuffer = [];
        this._rightColliderBuffer = [];

        this.onColliderEnterCallback = undefined;
        this.onColliderStayCallback = undefined;
        this.onColliderExitCallback = undefined;
        this.onPointingCallback = undefined;

        this._leftEvent = undefined;
        this._rightEvent = undefined;
    }

    onAnimate() { 
        this._head.update();
        this._leftHandController?.onAnimate();       
        this._rightHandController?.onAnimate();   
        this.addColliderTarget();
        
        if(this._leftPointer){
            this.updateDebugPointers(this._leftPointer, this._leftHandController);
        }
        if(this._rightPointer){
            this.updateDebugPointers(this._rightPointer, this._rightHandController);
        }

        this.movePlayer();
        this.jumpPlayer();
        this.updateJump();
        this.rotatePlayer(this._rotationIsDiscrete);
        this.movePlayerY(this._moveYOptions);
    }

    updateDebugPointers(pointer, controller) {
        if (!controller || !controller.pointerActive) {
            pointer.visible = false ;
            return ;
        }
        
        pointer.visible = true ;
        if(controller.select) {
            pointer.material.color = PointerPressedColor ;
        } else {
            pointer.material.color = PointerActiveColor ;
        }
        pointer.setFromDir(controller.pointerWOrigin, controller.pointerWDirection);
    }

    setupController(index, xr) {
        // Controller
        const controllerGrip = xr.getControllerGrip(index);
        const controllerModel = this._controllerModelFactory.createControllerModel(controllerGrip);
        controllerGrip.add(controllerModel);
        const axis = new THREE.AxesHelper(0.2)
        controllerModel.add(axis);
        this.context.scene.add(controllerGrip);
        
        // Events
        controllerGrip.addEventListener('connected', (event) => this.onControllerConnect(event, controllerGrip));
        controllerGrip.addEventListener('disconnected', (event) => this.onControllerDisconnect(event, controllerGrip));

    }

    onControllerConnect(event, controllerGrip){
        const data = event.data ;
        this.logData(data) ;
        let gamepad = event.data.gamepad ;
        if (data.handedness == "right") {
            if(!data.hand) {
                this._rightHandController = new XrMechanicalControllerInput(this.context, controllerGrip, gamepad, 'right');
                if(!this._rightPointer){
                    this._rightPointer = new Pointer() ;
                    this.context.scene.add(this._rightPointer) ;
                }
                this._rightEvent = event;
            }
            this.addEvents(controllerGrip, this._rightHandController);
            this._rightHandController?.onConnect();
            this._rightHandController?.setOnColliderEnter(this.onColliderEnterCallback);
            this._rightHandController?.setOnColliderStay(this.onColliderStayCallback);
            this._rightHandController?.setOnColliderExit(this.onColliderExitCallback);
            this._rightHandController?.setOnPointing(this.onPointingCallback);
        }
        if (data.handedness == "left") {
            if(!data.hand) {
                this._leftHandController = new XrMechanicalControllerInput(this.context, controllerGrip, gamepad, 'left');
                if(!this._leftPointer){
                    this._leftPointer = this._leftPointer ?? new Pointer() ;
                    this.context.scene.add(this._leftPointer) ;
                }
                this._leftEvent = event;
            }
            this.addEvents(controllerGrip, this._leftHandController);
            this._leftHandController?.onConnect();
            this._leftHandController?.setOnColliderEnter(this.onColliderEnterCallback);
            this._leftHandController?.setOnColliderStay(this.onColliderStayCallback);
            this._leftHandController?.setOnColliderExit(this.onColliderExitCallback);
            this._leftHandController?.setOnPointing(this.onPointingCallback);
        }
    }

    onControllerDisconnect(event, controllerGrip) {
        const data = event.data;
        this.logData(data);
        if (data.handedness == "right" && this._rightHandController) {
            controllerGrip.removeEventListener('selectstart', this._rightHandController.selectStartHandler);
            controllerGrip.removeEventListener('selectend', this._rightHandController.selectEndHandler);
            controllerGrip.removeEventListener('squeezestart', this._rightHandController.squeezeStartHandler);
            controllerGrip.removeEventListener('squeezeend', this._rightHandController.squeezeEndHandler);
            
            this._rightColliderBuffer.push(...this._rightHandController.collider.targets);
            this._rightHandController.onDisconnect();
            this._rightHandController = undefined;
        }
        if (data.handedness == "left" && this._leftHandController) {
            controllerGrip.removeEventListener('selectstart', this._leftHandController.selectStartHandler);
            controllerGrip.removeEventListener('selectend', this._leftHandController.selectEndHandler);
            controllerGrip.removeEventListener('squeezestart', this._leftHandController.squeezeStartHandler);
            controllerGrip.removeEventListener('squeezeend', this._leftHandController.squeezeEndHandler);
            
            this._leftColliderBuffer.push(...this._leftHandController.collider.targets);
            this._leftHandController.onDisconnect();
            this._leftHandController = undefined;
        }
    }

    logData(data) {
        console.info(`Controller ${data.handedness} connected gamepad${data.gamepad?"✔":"❌"} grip${data.gripSpace?"✔":"❌"}`)
    }
    
    addEvents(controller, hand)
    {

        if(!hand) return;

        hand.selectStartHandler = () => {
            hand.select = true;
        };
        hand.selectEndHandler = () => {
            hand.select = false;
        };
        hand.squeezeStartHandler = () => {
            hand.squeeze = true;
        };
        hand.squeezeEndHandler = () => {
            hand.squeeze = false;
        };
        
        controller.addEventListener('selectstart', hand.selectStartHandler);
        controller.addEventListener('selectend', hand.selectEndHandler);
        controller.addEventListener('squeezestart', hand.squeezeStartHandler);
        controller.addEventListener('squeezeend', hand.squeezeEndHandler);
    }

    /**
     * Make the player move (on x & z axes) by applying translation on referenceSpace. 
     * 
     * @returns void
     */
    movePlayer() {

        if (!this._leftHandController || !this._leftHandController.thumbStick) {
            return;
        }
        
        const referenceSpace = this.context.renderer.xr.getReferenceSpace();
        if (!referenceSpace) {
            return;
        }
        
        const moveX = this._leftHandController.thumbStick.x;
        const moveZ = this._leftHandController.thumbStick.y;
        
        const speed = 0.03; //meter or unite by frame
        
        const forward = new THREE.Vector3();
        forward.copy(this._head.forward);
        forward.y = 0;
        forward.normalize();
        
        const right = new THREE.Vector3();
        right.copy(this._head.right);
        right.y = 0;
        right.normalize();
        
        const moveDirection = new THREE.Vector3();
        moveDirection.addScaledVector(forward, -moveZ);
        moveDirection.addScaledVector(right, moveX);
        
        const offsetTransform = new XRRigidTransform(
            {
                x: - moveDirection.x * speed,
                y: 0,
                z: - moveDirection.z * speed
            },
            {x: 0, y: 0, z: 0, w: 1}
        );
        
        try {
            const newReferenceSpace = referenceSpace.getOffsetReferenceSpace(offsetTransform);
                        this.context.renderer.xr.setReferenceSpace(newReferenceSpace);
        } catch (e) {
            console.error("Error during referenceSpace modification", e);
        }
    }

    /**
     * Make the player move y axe by applying translation on referenceSpace. This function handle the flying mode. 
     * 
     * @param always true if flying mode is always on (jump should be disable)
     * 
     * @param {Object} options - Configuration settings
     * @param {boolean} options.always - (true) if flying mode is always on (jump should be disable)
     * @param {boolean} options.joystick - (true) if flying mode is controlled by y axe on right joystick, otherwise it controlled by A and B buttons
     * @returns void
     */
    movePlayerY(options = {always: true, joystick: true}) {
        if ( !this._flyingModeEnable || !(this._isFlying || options.always) || !this._rightHandController || !(this._rightHandController._gamePad.buttons.length > 5) 
            || !(this._rightHandController.buttonA || this._rightHandController.buttonB || this._rightHandController.thumbStick.y)) {
            return;
        }
        
        const referenceSpace = this.context.renderer.xr.getReferenceSpace();
        if (!referenceSpace) {
            return;
        }

        let speed = 0.03; //meter or unite by frame
        if(!options.joystick){
            if(this._rightHandController.buttonA){
                speed = -speed;
            }else if(!this._rightHandController.buttonB){
                return;
            }
        }else if(options.joystick && Math.abs(this._rightHandController.thumbStick.y) > 0.95){
            speed = speed*this._rightHandController.thumbStick.y;
        }else{
            return;
        }

        const offsetTransform = new XRRigidTransform(
            {
                x: 0,
                y: speed,
                z: 0
            },
            {x: 0, y: 0, z: 0, w: 1}
        );
        try {
            const newReferenceSpace = referenceSpace.getOffsetReferenceSpace(offsetTransform);
                        this.context.renderer.xr.setReferenceSpace(newReferenceSpace);
        } catch (e) {
            console.error("Error during referenceSpace modification", e);
        }
    }

    /**
     * Entry point of a a jump, this method init a jump which will be handle by updateJump()
     * If a double press on button A is detected, it toggle the flying mode.
     * @returns void
     */
    jumpPlayer() {
        if (!this._rightHandController || !(this._rightHandController._gamePad.buttons.length > 4) || !this._rightHandController.buttonA) {
            return;
        }
        
        if (this._jumpEnable && !this._isJumping && !this._isFlying ) {
            this._isJumping = true;
            this._jumpStartTime = Date.now();
            this._jumpHeight = 0.5; //in meter or unit
            this._jumpDuration = 0.8; // second
            this._currentJumpHeight = 0;
            this._isFlying = false;
        }else{
            if(!this._moveYOptions.always && this._lastButtonATrigger && 50 < (Date.now() - this._lastButtonATrigger) && (Date.now() - this._lastButtonATrigger) < 400){
                this._isFlying = !this._isFlying;
                this._isJumping = false;
            }
        }

        this._lastButtonATrigger = Date.now();
    }

    /**
     * Jump animation, it make a translation of referenceSpace with y axes if the player is jumping
     * 
     * @returns void
     */
    updateJump() {
        if (!this._isJumping || !this._jumpEnable) {
            return;
        }
        
        const referenceSpace = this.context.renderer.xr.getReferenceSpace();
        if (!referenceSpace) {
            this._isJumping = false;
            return;
        }
        
        // Compute jump progression
        const elapsedTime = (Date.now() - this._jumpStartTime) / 1000;
        const jumpProgress = Math.min(elapsedTime / this._jumpDuration, 1.0);
        
        // y = 4 * h * t * (1 - t) with h is max height, t is progress (0-1)
        // no clue why I need to put minus on everything
        const newHeight = -(this._jumpHeight * 4 * jumpProgress * (1 - jumpProgress));
        
        const deltaY = newHeight - this._currentJumpHeight;
        this._currentJumpHeight = newHeight;
        
        const offsetTransform = new XRRigidTransform(
            {
                x: 0,
                y: deltaY,
                z: 0
            },
            {x: 0, y: 0, z: 0, w: 1}
        );
        
        try {
            const newReferenceSpace = referenceSpace.getOffsetReferenceSpace(offsetTransform);
            this.context.renderer.xr.setReferenceSpace(newReferenceSpace);
            
            if (jumpProgress >= 1.0) {
                this._isJumping = false;
            }
        } catch (e) {
            console.error("Error while jumping", e);
            this._isJumping = false;
        }
    }
    
    /**
     * Make rotation when left or right joystick is pushed
     * 
     * @param discrete true if discrete rotation mode is enabled (30 degrees rotation)
     * 
     * @returns void
     */
    rotatePlayer(discrete = false) {
        if (!this._rightHandController || !this._rightHandController.thumbStick) {
            return;
        }
        
        const referenceSpace = this.context.renderer.xr.getReferenceSpace();
        if (!referenceSpace) {
            return;
        }
        
        const joystickX = this._rightHandController.thumbStick.x;
        
        if (!this._rotationState) {
            this._rotationState = {
                isLeftTriggered: false,
                isRightTriggered: false,
                lastRotationTime: 0,
                lastJoystickValue: 0,
                currentRotationSpeed: 0,
                targetRotationSpeed: 0,
                rotationDirection: 0,
                rotationInProgress: false
            };
        }
        let rotationAngle = 0;

        if (discrete) {
            const threshold = 0.7;
            rotationAngle = Math.PI / 6; // 30 degrees
            const rotationDelay = 250; // 250 ms
            
            const currentTime = Date.now();
            if (currentTime - this._rotationState.lastRotationTime < rotationDelay) {
                return;
            }
            
            if (Math.abs(joystickX) < threshold) {
                return;
            }

            rotationAngle = Math.sign(joystickX) * rotationAngle;

        }else{
            
            const accelerationFactor = 0.05;  // small = slow
            const decelerationFactor = 0.1;   // small = slow
            const maxRotationSpeed = Math.PI / 160;  
            
            if (Math.abs(joystickX) > 0.05) {
                this._rotationState.rotationDirection = Math.sign(joystickX);
                this._rotationState.targetRotationSpeed = Math.pow(Math.abs(joystickX), 2) * maxRotationSpeed;
                this._rotationState.rotationInProgress = true;
            } else {
                this._rotationState.targetRotationSpeed = 0;
            }
            
            if (this._rotationState.currentRotationSpeed < this._rotationState.targetRotationSpeed) {
                // acceleration
                this._rotationState.currentRotationSpeed += (this._rotationState.targetRotationSpeed - this._rotationState.currentRotationSpeed) * accelerationFactor;
            } else if (this._rotationState.currentRotationSpeed > this._rotationState.targetRotationSpeed) {
                // deceleration
                this._rotationState.currentRotationSpeed -= (this._rotationState.currentRotationSpeed - this._rotationState.targetRotationSpeed) * decelerationFactor;
            }
            
            rotationAngle = this._rotationState.currentRotationSpeed * this._rotationState.rotationDirection;
        }

        const viewerPose = this.context.renderer.xr.getFrame().getViewerPose(referenceSpace);
        const position = viewerPose.transform.position;

        const applyRotation = (angle) => {
            const rotationQuaternion = {
                x: 0,
                y: Math.sin(angle / 2),
                z: 0,
                w: Math.cos(angle / 2)
            };
            
            try {
                // Step 1: move to center
                const moveToOrigin = new XRRigidTransform(
                    { x: position.x, y: 0, z: position.z },
                    { x: 0, y: 0, z: 0, w: 1 }
                );
                let newReferenceSpace = referenceSpace.getOffsetReferenceSpace(moveToOrigin);
                
                // Step 2: apply rotation
                const rotate = new XRRigidTransform(
                    { x: 0, y: 0, z: 0 },
                    rotationQuaternion
                );
                newReferenceSpace = newReferenceSpace.getOffsetReferenceSpace(rotate);
                
                // Step 3: back to initial position
                const moveBack = new XRRigidTransform(
                    { x: -position.x, y: 0, z: -position.z },
                    { x: 0, y: 0, z: 0, w: 1 }
                );
                newReferenceSpace = newReferenceSpace.getOffsetReferenceSpace(moveBack);
                
                this.context.renderer.xr.setReferenceSpace(newReferenceSpace);
            } catch (e) {
                console.error("Error while rotating", e);
            }
        };
        
        applyRotation(rotationAngle);
        this._rotationState.lastRotationTime = Date.now();
        this._rotationState.lastJoystickValue = joystickX;
    }

    /**
     * Enable or disable flying mode
     * 
     * @param {boolean} status
     */
    setAlwaysOnFlyingMode(status){
        if(!(status === true || status === false)) return;
        this._moveYOptions.always = status;
    }

    /**
     * Set flying method 
     * 
     * @param {number} method 0 : joystick; 1 : buttons
     */
    setFlyingMethod(method){
        if(!(method === 0 || method === 1)) return;
        this._moveYOptions.joystick = method === 0;
    }

    /**
     * Enable or disable flying mode
     * 
     * @param {boolean} status
     */
    setFlyingMode(status){
        if(!(status === true || status === false)) return;
        this._flyingModeEnable = status;
    }

    /**
     * Enable or disable jump
     * 
     * @param {boolean} status
     */
    setJump(status){
        if(!(status === true || status === false)) return;
        this._jumpEnable = status;
    }

    /**
     * Enable or disable discrete rotation
     * 
     * @param {boolean} status
     */
    setDiscreteRotation(status){
        if(!(status === true || status === false)) return;
        this._rotationIsDiscrete = status;
    }

    /**
     * Add target to collider and pointer targets list of the choosen controller(s). If controller(s) are not
     * available, target is pushed in buffer. 
     * 
     * @param {*} target if target is undefined, we will try to empty the buffers
     * @param {'both' | 'left' | 'right' } collider
     * @returns 
     */
    addColliderTarget(target = undefined, collider = 'both') {
        //try to empty the buffers
        if(target === undefined) {
            if(this._leftHandController && this._leftHandController.collider) {
                for(const t of this._leftColliderBuffer) {
                    this._leftHandController.collider.addTargets(t);
                    this._leftHandController.addPointerTarget(t);
                }
                this._leftColliderBuffer = [];
            }
            if(this._rightHandController && this._rightHandController.collider) {
                for(const t of this._rightColliderBuffer) {
                    this._rightHandController.collider.addTargets(t);
                    this._rightHandController.addPointerTarget(t);
                }
                this._rightColliderBuffer = [];
            }
            return;
        }
    
        // If controller are not initialized, target is pushed in buffer
        if(!this._leftHandController && (collider === 'both' || collider === 'left')) {
            this._leftColliderBuffer.push(target);
            if(collider === 'left'){
                return;
            }
        }
        if(!this._rightHandController && (collider === 'both' || collider === 'right')) {
            this._rightColliderBuffer.push(target);
            if(collider === 'right'){
                return;
            }
        }
    
        if(collider === 'both' || collider === 'left') {
            if(this._leftHandController && this._leftHandController.collider) {
                this._leftHandController.collider.addTargets(target);
                this._leftHandController.addPointerTarget(target);
                for(const t of this._leftColliderBuffer) {
                    this._leftHandController.collider.addTargets(t);
                    this._leftHandController.addPointerTarget(t);
                }
                this._leftColliderBuffer = [];
            }
        }
        if(collider === 'both' || collider === 'right') {
            if(this._rightHandController && this._rightHandController.collider) {
                this._rightHandController.collider.addTargets(target);
                this._rightHandController.addPointerTarget(target);
                for(const t of this._rightColliderBuffer) {
                    this._rightHandController.collider.addTargets(t);
                    this._rightHandController.addPointerTarget(t);
                }
                this._rightColliderBuffer = [];
            }
        }
    }

    /**
     * Set enter callback
     * @param {function} callback 
     */
    setOnColliderEnter(callback){
        this.onColliderEnterCallback = callback;
    }

    /**
     * Set stay callback
     * @param {function} callback 
     */
    setOnColliderStay(callback){
        this.onColliderStayCallback = callback;
    }

    /**
     * Set exit callback
     * @param {function} callback 
     */
    setOnColliderExit(callback){
        this.onColliderExitCallback = callback;
    }

    /**
     * Set pointing callback
     * @param {function} callback 
     */
    setOnPointing(callback){
        this.onPointingCallback = callback;
    }

    /**
     * Get left controller
     * @returns {XrMechanicalControllerInput}
     */
    getLeftController(){
        return this._leftHandController;
    }

    /**
     * Get right controller
     * @returns {XrMechanicalControllerInput}
     */
    getRightController(){
        return this._rightHandController;
    }

    /**
     * Properly deconfigure and clean up the XrInput instance
     * Call this method when you're done with the XrInput object
     */
    dispose() {
        // Clean up controllers
        if (this._leftHandController) {
            // Remove event listeners from left controller grip
            const leftGrip = this._leftHandController.controllerGrip;
            leftGrip?.removeEventListener('selectstart', this._leftHandController.selectStartHandler);
            leftGrip?.removeEventListener('selectend', this._leftHandController.selectEndHandler);
            leftGrip?.removeEventListener('squeezestart', this._leftHandController.squeezeStartHandler);
            leftGrip?.removeEventListener('squeezeend', this._leftHandController.squeezeEndHandler);
            
            // Dispose of left hand controller
            this._leftHandController.onDisconnect();
            this._leftHandController.dispose();
            this._leftHandController = undefined;
        }
        
        if (this._rightHandController) {
            // Remove event listeners from right controller grip
            const rightGrip = this._rightHandController.controllerGrip;
            rightGrip?.removeEventListener('selectstart', this._rightHandController.selectStartHandler);
            rightGrip?.removeEventListener('selectend', this._rightHandController.selectEndHandler);
            rightGrip?.removeEventListener('squeezestart', this._rightHandController.squeezeStartHandler);
            rightGrip?.removeEventListener('squeezeend', this._rightHandController.squeezeEndHandler);
            
            // Dispose of right hand controller
            this._rightHandController.onDisconnect();
            this._rightHandController.dispose();
            this._rightHandController = undefined;
        }
        
        // Remove pointers from scene
        if (this._leftPointer) {
            this.context.scene.remove(this._leftPointer);
            this._leftPointer.dispose();
            this._leftPointer = undefined;
        }
        
        if (this._rightPointer) {
            this.context.scene.remove(this._rightPointer);
            this._rightPointer.dispose();
            this._rightPointer = undefined;
        }
        
        // Clean up head tracking
        if (this._head) {
            this._head.dispose();
            this._head = undefined;
        }
        
        // Clear callback references
        this.onColliderEnterCallback = undefined;
        this.onColliderStayCallback = undefined;
        this.onColliderExitCallback = undefined;
        this.onPointingCallback = undefined;
        
        // Clear collider buffers
        this._leftColliderBuffer = [];
        this._rightColliderBuffer = [];
        
        // Reset state variables
        this._isFlying = false;
        this._isJumping = false;
        this._rotationState = undefined;
        
        // Clear context reference
        this.context = undefined;
    }

    /**
     * Create new pointers, usefull when moving to a new scene
     */
    recreatePointers() {
        // remove existing pointers
        if (this._leftPointer) {
            this.context.scene.remove(this._leftPointer);
            this._leftPointer.dispose();
            this._leftPointer = null;
        }
        
        if (this._rightPointer) {
            this.context.scene.remove(this._rightPointer);
            this._rightPointer.dispose();
            this._rightPointer = null;
        }
        
        // create new pointers is controllers are availables
        if (this._leftHandController) {
            this._leftPointer = new Pointer();
            this.context.scene.add(this._leftPointer);
        }
        
        if (this._rightHandController) {
            this._rightPointer = new Pointer();
            this.context.scene.add(this._rightPointer);
        }
    }
}