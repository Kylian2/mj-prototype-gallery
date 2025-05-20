import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { Reflector } from 'three/addons/objects/Reflector.js';
import Stats from 'three/addons/libs/stats.module.js';
import { XrInput } from './XRControls/xrInput';
import ThreeMeshUI from 'three-mesh-ui';
import { buildSpeedScene } from './Demos/SpeedDemo.js';
import { buildColliderScene } from './Demos/ColliderDemo.js';
import { buildMovementScene } from './Demos/MovementDemo.js';
import { buildParticleScene } from './Demos/ParticlesDemo.js';
import { buildHomeScene } from './Scenes/HomeScene.js';

/**
 * The root of the Three.JS example, this context is used to setup and
 * hold global information about the state of the Three.JS application
 * like the camera, scene, etc.
 */
export class Context {

    constructor() {
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);

        this.renderer.colorSpace = THREE.SRGBColorSpace;
        this.renderer.toneMapping = THREE.ReinhardToneMapping;

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
        this.camera.position.set(-7, 10, 15);

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.update();

        this.stats = new Stats();
        document.body.appendChild(this.stats.dom);

        // VR 
        const sessionInit = {
            requiredFeatures: ['hand-tracking']
        };
        document.body.appendChild(VRButton.createButton(this.renderer, sessionInit));
        this.renderer.xr.enabled = true;
        this.xrInput = new XrInput(this);

        buildHomeScene(this);

        this.frame = 0;
        this.elapsedTime = 0;
        this.deltaTime = 0;
        this.clock = new THREE.Clock();

        window.addEventListener('resize', () => this.onResize(), false);
        
        this.renderer.setAnimationLoop(() => this.onAnimate());
    }

    addGridAndLight() {
        const gridHelper = new THREE.GridHelper(10, 10);
        this.scene.add(gridHelper);
        const axesHelper = new THREE.AxesHelper(10, 10);
        this.scene.add(axesHelper);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
        directionalLight.position.set(10, 10, -10);
        this.scene.add(directionalLight);

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);
    }

    onAnimate() {
        this.frame++;
        this.elapsedTime = this.clock.elapsedTime;
        this.deltaTime = this.clock.getDelta();
        
        this.xrInput.onAnimate();
        this.controls.update();
        
        ThreeMeshUI.update();
        
        this.renderer.render(this.scene, this.camera);
        this.stats.update();
    }

    onResize() {
        const winWidth = window.innerWidth;
        const winHeight = window.innerHeight;
        this.camera.aspect = winWidth / winHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(winWidth, winHeight);
        this.renderer.render(this.scene, this.camera);
    }

    /**
     * Properly cleans up the current scene and switches to a new one
     * @param {string} scene - The scene to build
     */
    changeScene(scene) {
        this.cleanupCurrentScene();
        this.xrInput.emptyColliders();
        this.renderer.setAnimationLoop(() => this.onAnimate());

        switch(scene) {
            case 'home':
                buildHomeScene(this, true);
                break;
            case 'movement':
                buildMovementScene(this);
                break;
            case 'collider':
                buildColliderScene(this);
                break;
            case 'particle':
                buildParticleScene(this);
                break;
            case 'speed':
                buildSpeedScene(this);
                break;
            default:
                console.warn(`Unknown scene: ${scene}`);
                this.buildHomeScene();
        }

        this.frame = 0;
        this.elapsedTime = 0;
        this.deltaTime = 0;
        this.clock = new THREE.Clock();


        const referenceSpace = this.renderer.xr.getReferenceSpace();
        if (!referenceSpace) {
            return;
        }
        const viewerPose = this.renderer.xr.getFrame().getViewerPose(referenceSpace);
        const position = viewerPose.transform.position;
        const moveToOrigin = new XRRigidTransform(
            { x: position.x, y: 0, z: position.z },
            { x: 0, y: 0, z: 0, w: 1 }
        );
        let newReferenceSpace = referenceSpace.getOffsetReferenceSpace(moveToOrigin);

        try{
            this.renderer.xr.setReferenceSpace(newReferenceSpace);
        } catch (e) {
            console.error("Error while moving to center", e);
        }

        console.log(this.xrInput.getLeftController());
    }

    /**
     * Clean up the current scene and dispose of all resources (keep the actuals controllers)
     */
    cleanupCurrentScene() {
        const oldScene = this.scene;
        
        ThreeMeshUI.update();
        oldScene.traverse((object) => {
            if (object.geometry) {
                object.geometry.dispose();
            }
            
            if (object.material) {
                if (Array.isArray(object.material)) {
                    object.material.forEach(material => {
                        disposeMaterial(material);
                    });
                } else {
                    disposeMaterial(object.material);
                }
            }
            
            // Special handling for Reflector objects (mirrors)
            if (object instanceof Reflector) {
                if (object.material) {
                    disposeMaterial(object.material);
                }
                if (object.getRenderTarget) {
                    const target = object.getRenderTarget();
                    if (target) {
                        target.dispose();
                    }
                }
            }
        });
        
        while(oldScene.children.length > 0) {
            oldScene.remove(oldScene.children[0]);
        }
        
        function disposeMaterial(material) {
            Object.keys(material).forEach(prop => {
                if (!material[prop]) return;
                if (material[prop].isTexture) {
                    material[prop].dispose();
                }
            });
            
            // Special handling for the main texture map
            if (material.map) material.map.dispose();
            if (material.lightMap) material.lightMap.dispose();
            if (material.bumpMap) material.bumpMap.dispose();
            if (material.normalMap) material.normalMap.dispose();
            if (material.specularMap) material.specularMap.dispose();
            if (material.envMap) material.envMap.dispose();
            
            material.dispose();
        }
    }

}