import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { Reflector } from 'three/addons/objects/Reflector.js';
import Stats from 'three/addons/libs/stats.module.js';
import { XrInput } from './XRControls/xrInput';
import ThreeMeshUI from 'three-mesh-ui';
import { createPanel, createButton } from './XRControls/XRUI.js';

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

        this.buildHomeScene();

        this.frame = 0;
        this.elapsedTime = 0;
        this.deltaTime = 0;
        this.clock = new THREE.Clock();

        window.addEventListener('resize', () => this.onResize(), false);
        
        this.renderer.setAnimationLoop(() => this.onAnimate());
    }

    buildHomeScene() {
        let scene = new THREE.Scene();
        scene.background = new THREE.Color(0x333333);

        const corridorLength = 12;
        const corridorWidth = 4;
        const corridorHeight = 2.5;

        const floor = new THREE.Mesh(
            new THREE.PlaneGeometry(corridorWidth, corridorLength),
            new THREE.MeshStandardMaterial({ 
                color: 0x7D8491,
                roughness: 0.8,
                metalness: 0.2
            })
        );
        floor.rotation.x = -Math.PI / 2;
        floor.position.set(0,0,-corridorLength/2)
        scene.add(floor);

        const wallMaterial = new THREE.MeshStandardMaterial({
            color: 0x669D31,
            roughness: 0.7,
            metalness: 0.1
        });

        const leftWall = new THREE.Mesh(
            new THREE.PlaneGeometry(corridorLength, corridorHeight),
            wallMaterial
        );
        leftWall.position.set(-corridorWidth/2, corridorHeight/2, -corridorLength/2);
        leftWall.rotation.y = Math.PI / 2;
        scene.add(leftWall);

        const rightWall = new THREE.Mesh(
            new THREE.PlaneGeometry(corridorLength, corridorHeight),
            wallMaterial
        );
        rightWall.position.set(corridorWidth/2, corridorHeight/2, -corridorLength/2);
        rightWall.rotation.y = -Math.PI / 2;
        scene.add(rightWall);

        const ceiling = new THREE.Mesh(
            new THREE.PlaneGeometry(corridorWidth, corridorLength),
            new THREE.MeshStandardMaterial({ color: 0x555555 })
        );
        ceiling.position.set(0, corridorHeight, -corridorLength/2);
        ceiling.rotation.x = Math.PI / 2;
        scene.add(ceiling);

        const backWall = new THREE.Mesh(
            new THREE.PlaneGeometry(corridorWidth, corridorHeight),
            wallMaterial
        );
        backWall.position.set(0, corridorHeight/2, -corridorLength);
        scene.add(backWall);

        // Front wall, with a empty space for the door
        const frontWallTop = new THREE.Mesh(
            new THREE.BoxGeometry(corridorWidth, corridorHeight/3, 0.1),
            wallMaterial
        );
        frontWallTop.position.set(0, corridorHeight - corridorHeight/6, 0);
        scene.add(frontWallTop);

        const frontWallLeft = new THREE.Mesh(
            new THREE.BoxGeometry(corridorWidth/3, corridorHeight * 2/3, 0.1),
            wallMaterial
        );
        frontWallLeft.position.set(-corridorWidth/3, corridorHeight/3, 0);
        scene.add(frontWallLeft);

        const frontWallRight = new THREE.Mesh(
            new THREE.BoxGeometry(corridorWidth/3, corridorHeight * 2/3, 0.1),
            wallMaterial
        );
        frontWallRight.position.set(corridorWidth/3, corridorHeight/3, 0);
        scene.add(frontWallRight);

        const panelData = [
            {
                title: "Demo des controles de deplacement",
                content: "Vous pourrez tester les differentes facon de naviguer dans le monde virtuel",
                position: new THREE.Vector3(-corridorWidth/2 + 0.01, 1, -2),
                rotation: new THREE.Euler(0, Math.PI/2, 0),
                buttons: [
                    {
                        text: "Tester",
                        backgroundColor: new THREE.Color(0xa9a3c2),
                        callback: () => {
                            this.changeScene('movement');
                        }
                    }
                ]
            },
            {
                title: "Demo des colliders",
                content: "Dans cette scene vous pourrez tester des differentes facon d'interagir avec les elements",
                position: new THREE.Vector3(-corridorWidth/2 + 0.01, 1, -6),
                rotation: new THREE.Euler(0, Math.PI/2, 0),
            },
            {
                title: "Demo de l'accelerometre",
                content: "Dans ce monde vous pourrez tester les fonctionnalites d'acceleration en lancant des balles",
                position: new THREE.Vector3(-corridorWidth/2 + 0.01, 1, -10),
                rotation: new THREE.Euler(0, Math.PI/2, 0),
            },
            {
                title: "Particules",
                content: "Ici, vous pourrez observer les differents effets de particules",
                position: new THREE.Vector3(corridorWidth/2 - 0.01, 1, -2),
                rotation: new THREE.Euler(0, -Math.PI/2, 0),
            },
            {
                title: "Jonglage Musical",
                content: "Dans ce monde vous pourrez ecouter une melodie faite en jonglant",
                position: new THREE.Vector3(corridorWidth/2 - 0.01, 1, -6),
                rotation: new THREE.Euler(0, -Math.PI/2, 0),
            }
        ];

        let buttons = [];
        panelData.forEach(data => {
            const panel = createPanel(data);
            scene.add(panel);
            buttons.push(...panel.userData.buttons);
        });

        // ===== Light =====
        for (let i = 0; i <= 4; i += 2) {
            const light = new THREE.PointLight(0xffffff, 1.5, 10);
            light.position.set(0, corridorHeight - 0.1, -i * 2 - 2);
            
            scene.add(light);
            
            const lightMesh = new THREE.Mesh(
                new THREE.BoxGeometry(0.2, 0.1, 0.2),
                new THREE.MeshBasicMaterial({ color: 0xffff99 })
            );
            lightMesh.position.copy(light.position);
            scene.add(lightMesh);
        }

        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        scene.add(ambientLight);

        this.scene = scene;
        
        // VR
        const xr = this.renderer.xr;
        this.xrInput.setupController(0, xr);
        this.xrInput.setupController(1, xr);
        this.xrInput.setFlyingMode(false);

        this.xrInput.addColliderTarget(buttons);
        this.xrInput.setOnPointing((target) => {
            if (target && target.isUI) {
                if (this.xrInput?.getRightController().trigger) {
                    target.setState('selected');
                } else {
                    target.setState('hovered');
                }
            }
        })
    }

    buildMovementScene() {
        let scene = new THREE.Scene();
        scene.background = new THREE.Color("skyblue");

        // Ground
        const box = new THREE.Mesh(
            new THREE.PlaneGeometry(100, 100),
            new THREE.MeshStandardMaterial({ color: new THREE.Color(0x31572c) }));
        box.quaternion.setFromAxisAngle(new THREE.Vector3(-1, 0, 0), Math.PI / 2.0);
        box.position.set(0, -0.001, 0);
        scene.add(box);

        // Mirror 
        /*const mirror = new Reflector(
            new THREE.PlaneGeometry(3, 4),
            {
                color: new THREE.Color(0xa0a0a0),
                textureWidth: window.innerWidth * window.devicePixelRatio * 2,
                textureHeight: window.innerHeight * window.devicePixelRatio * 2
            }
        );
        mirror.position.set(0, 2, -2);
        scene.add(mirror);*/

        let buttons = [];

        
        const button1 = createButton({
            text: "Set Flying Mode ON",
            position: new THREE.Vector3(0, 0.75, -1),
            callback: () => {
                this.xrInput.setFlyingMode(true);
                button1.setState('on');
                button2.setState('off');
            }
        });
        scene.add(button1);
        buttons.push(button1);
        const button2 = createButton({
            text: "Set Flying Mode OFF",
            position: new THREE.Vector3(0, 1, -1),
            callback: () => {
                this.xrInput.setFlyingMode(false);
                button1.setState('off');
                button2.setState('on');
            }
        });
        scene.add(button2);
        buttons.push(button2);

        const button3 = createButton({
            text: "Set jump ON",
            position: new THREE.Vector3(-1, 0.75, -1),
            callback: () => {
                this.xrInput.setJump(true);
                button3.setState('on');
                button4.setState('off');
            }
        });
        scene.add(button3);
        buttons.push(button3);
        const button4 = createButton({
            text: "Set jump OFF",
            position: new THREE.Vector3(-1, 1, -1),
            callback: () => {
                this.xrInput.setJump(false);
                button3.setState('off');
                button4.setState('on');
            }
        });
        scene.add(button4);
        buttons.push(button4);

        const button5 = createButton({
            text: "Set Flying with joystick",
            position: new THREE.Vector3(1, 0.75, -1),
            callback: () => {
                this.xrInput.setFlyingMethod(0)
                button5.setState('on');
                button6.setState('off');
            }
        });
        scene.add(button5);
        buttons.push(button5);
        const button6 = createButton({
            text: "Set Flying with button",
            position: new THREE.Vector3(1, 1, -1),
            callback: () => {
                this.xrInput.setFlyingMethod(1)
                button5.setState('off');
                button6.setState('on');
            }
        });
        scene.add(button6);
        buttons.push(button6);

        const button7 = createButton({
            text: "Set Always on flying mode ON",
            position: new THREE.Vector3(-2, 0.75, -1),
            callback: () => {
                this.xrInput.setAlwaysOnFlyingMode(true);
                button7.setState('on');
                button8.setState('off');
            }
        });
        scene.add(button7);
        buttons.push(button7);
        const button8 = createButton({
            text: "Set Always on flying mode OFF",
            position: new THREE.Vector3(-2, 1, -1),
            callback: () => {
                this.xrInput.setAlwaysOnFlyingMode(false);
                button7.setState('off');
                button8.setState('on');
            }
        });
        scene.add(button8);
        buttons.push(button8);

        const button9 = createButton({
            text: "Set rotation mode : discrete",
            position: new THREE.Vector3(2, 0.75, -1),
            callback: () => {
                this.xrInput.setDiscreteRotation(true);
                button9.setState('on');
                button10.setState('off');
            }
        });
        scene.add(button9);
        buttons.push(button9);
        const button10 = createButton({
            text: "Set rotation mode : continue",
            position: new THREE.Vector3(2, 1, -1),
            callback: () => {
                this.xrInput.setDiscreteRotation(false);
                button9.setState('off');
                button10.setState('on');
            }
        });
        scene.add(button10);
        buttons.push(button10);

        this.scene = scene;
        this.addGridAndLight();

        // VR
        const xr = this.renderer.xr;
        this.xrInput.setupController(0, xr);
        this.xrInput.setupController(1, xr);
        this.xrInput.recreatePointers();

        this.xrInput.setFlyingMode(true);
        button1.setState('on');
        button2.setState('off');
        this.xrInput.setJump(false);
        button3.setState('off');
        button4.setState('on');
        this.xrInput.setFlyingMethod(0);
        button5.setState('on');
        button6.setState('off');
        this.xrInput.setAlwaysOnFlyingMode(false);
        button7.setState('off');
        button8.setState('on');
        this.xrInput.setDiscreteRotation(false);
        button9.setState('off');
        button10.setState('on');

        this.xrInput.addColliderTarget(buttons);
        this.xrInput.setOnPointing((target) => {
            if (target && target.isUI) {
                if (this.xrInput.getRightController().trigger) {
                    target.setState('selected');
                } else {
                    target.setState('hovered');
                }
            }
        });
    }

    addGridAndLight() {
        const gridHelper = new THREE.GridHelper(10, 10);
        this.scene.add(gridHelper);
        const axesHelper = new THREE.AxesHelper(10, 10);
        this.scene.add(axesHelper);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
        directionalLight.position.set(10, 10, -10);
        this.scene.add(directionalLight);

        // Ajouter une lumire ambiante pour ameliorer la visibilite du texte
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);
    }

    onAnimate() {
        this.frame++;
        this.elapsedTime = this.clock.elapsedTime;
        this.deltaTime = this.clock.getDelta();
        
        this.xrInput.onAnimate();
        this.controls.update();
        
        // Mettre à jour ThreeMeshUI
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
        
        switch(scene) {
            case 'home':
                this.buildHomeScene();
                break;
            case 'movement':
                this.buildMovementScene();
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

        this.renderer.setAnimationLoop(() => this.onAnimate());
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