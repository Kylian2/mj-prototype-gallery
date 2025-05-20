"use strict";
import * as THREE from 'three';

/**
 * XrCollider - Class for handling webxr collisions with threejs
 */
export class XrCollider {

		/**
		 * Create a new collider
		 * @param {Object} options - Configuration settings
		 * @param {THREE.Object3D} options.object - 3D object to look at
		 * @param {Array<THREE.Object3D>} options.targets - Objects to check collisions with
		 * @param {Number} options.radius - Collision radius (not the most precise)
		 * @param {Function} options.onCollisionEnter - Callback when collision is detected
		 * @param {Function} options.onCollisionExit - Callback when collision is finished
		 * @param {Function} options.onCollisionStay - Callback when collision is ongoing
		 * @param {Boolean} options.debug - Show debug informations
		 * @param {THREE.Scene} options.scene - 3D Scene
		 */
		constructor(options) {

			this.object = options.object;
			this.targets = options.targets || [];
			this.radius = options.radius || this._calculateRadius(this.object);
			this.onCollisionEnter = options.onCollisionEnter || (() => {});
			this.onCollisionExit = options.onCollisionExit || (() => {});
			this.onCollisionStay = options.onCollisionStay || (() => {});
			this.debug = options.debug || false;
			this.scene = options.scene;
			
			// Intern state
			this.collisions = new Map(); // Map to follow collisions state
			this.position = new THREE.Vector3();
			this.worldPosition = new THREE.Vector3();
			
		}
		
		/**
		 * Calculate radius for 3D object
		 * @private
		 * @param {THREE.Object3D} object
		 * @returns {Number}
		 */
		_calculateRadius(object) {

			const box = new THREE.Box3().setFromObject(object);
			if (box.isEmpty()) return 0.1; // default value
			
			const size = box.getSize(new THREE.Vector3());
			return Math.max(size.x, size.y, size.z) / 2;
		}
		
		/**
		 * Check collisions and update collider position
		 * 
		 * Must be call in all frames
		 */
		update() {
			this.object.getWorldPosition(this.worldPosition);
			
			this.targets.forEach(target => {
				const targetPosition = new THREE.Vector3();
				target.getWorldPosition(targetPosition);

				let isColliding = false;

				if (!target.colliderRadius) {
					target.colliderRadius = this._calculateRadius(target);
				}

				if (target.geometry instanceof THREE.BoxGeometry) {
					isColliding =
						Math.abs(target.position.x - this.worldPosition.x) <= target.colliderRadius &&
						Math.abs(target.position.y - this.worldPosition.y) <= target.colliderRadius &&
						Math.abs(target.position.z - this.worldPosition.z) <= target.colliderRadius;
				}else{
					const distance = this.worldPosition.distanceTo(targetPosition);
				
					const collisionDistance = this.radius + target.colliderRadius;
					isColliding = distance < collisionDistance;
				}
			
				const wasColliding = this.collisions.get(target) || false;

		if (isColliding !== wasColliding) {
						this.collisions.set(target, isColliding);
						if (isColliding) {
							// New collision
				if(this.onCollisionEnter){
					this.onCollisionEnter(target, this.object);
				}else{
					if (this.debug) {
						console.warn("onCollisionEnter callback is not defined");
					}
				}
							
			} else {
				// End of collision
				if(this.onCollisionExit){
					this.onCollisionExit(target, this.object);
				}else{
					if (this.debug) {
						console.warn("onCollisionExit callback is not defined");
					}
				}
			}
				} else if (isColliding) {
					// Remain in collider zone
					if(this.onCollisionStay){
						this.onCollisionStay(target, this.object);
					}else{
						if (this.debug) {
							console.warn("onCollisionExit callback is not defined");
						}
					}
				}
			});
		}
		
	/**
	 * Add target(s) to targets list
	 * @param {THREE.Object3D|Array<THREE.Object3D>} targets
	 */
	addTargets(targets) {
		if (Array.isArray(targets)) {
			this.targets = [...this.targets, ...targets];
		} else {
			this.targets.push(targets);
		}
	}
		
	/**
	 * Remove target(s) from targets list
	 * @param {THREE.Object3D|Array<THREE.Object3D>} targets
	 */
	removeTargets(targets) {
		if (Array.isArray(targets)) {
			this.targets = this.targets.filter(t => !targets.includes(t));
		} else {
			this.targets = this.targets.filter(t => t !== targets);
		}
		
		// Remove collisions states in map
		if (Array.isArray(targets)) {
			targets.forEach(t => this.collisions.delete(t));
		} else {
			this.collisions.delete(targets);
		}
	}
}