"use strict";

import * as THREE from 'three' ;

/**
 * Draw a "ray" from one 3D location to another in the world
 * (used at the pointer).
 * 
 * This code is taken from the VR ME UP repository https://github.com/vrmeup/threejs-webxr-hands-example. 
 * Many thanks to him for his work.
 */
export class Pointer extends THREE.Mesh {

    constructor(color,width) {
		super() ;

        this._origin = new THREE.Vector3() ;
        this._target = new THREE.Vector3() ;    
        this._zAxis = new THREE.Vector3() ;
        this._center = new THREE.Vector3() ;
        this.geometry = new THREE.PlaneGeometry(1, 0.01) ;
        this.geometry.rotateY(0.5 * Math.PI);
        this.material = new THREE.MeshBasicMaterial({
            //map: texture,
            blending: THREE.AdditiveBlending,
            color: color || new THREE.Color('blue'),
            side: THREE.DoubleSide,
            depthWrite: false,
            transparent: true
        })
    }

    setFromTo(from, to) {
        this._origin.copy(from);
        this._target.copy(to);
        this.reposition();
    }

    setFromDir(from, dir, distance) {
        this._origin.copy(from);
        this._target.copy(dir).normalize().multiplyScalar(distance||1.0).add(from);
        this.reposition();
    }

    reposition() {
        const distance = this._origin.distanceTo(this._target) ;
        this.scale.z = distance;
        this._center.copy(this._origin).add(this._target).divideScalar(2.0);
        this.position.copy(this._center);
        this.lookAt(this._target);
    }

    /**
     * Properly dispose of the Pointer instance and free resources
     * Call this method when you're done with the Pointer object
     */
    dispose() {
        // Dispose of geometry
        if (this.geometry) {
            this.geometry.dispose();
            this.geometry = null;
        }
        
        // Dispose of material
        if (this.material) {
            this.material.dispose();
            this.material = null;
        }
        
        // Clear vector references
        this._origin = null;
        this._target = null;
        this._zAxis = null;
        this._center = null;
        
        // Remove from parent if attached to a scene
        if (this.parent) {
            this.parent.remove(this);
        }
    }
}