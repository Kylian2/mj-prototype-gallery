import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { Reflector } from 'three/addons/objects/Reflector.js';
import Stats from 'three/addons/libs/stats.module.js';
import { XrInput } from './XRControls/xrInput';
import ThreeMeshUI from 'three-mesh-ui';
import { createPanel, createButton } from './UI/XRUI.js';
import { disposeObject } from './Utils/dispose3D.js';

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

    buildHomeScene(reload = false) {
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
                buttons: [
                    {
                        text: "Tester",
                        backgroundColor: new THREE.Color(0xa9a3c2),
                        callback: () => {
                            this.changeScene('collider');
                        }
                    }
                ]
            },
            {
                title: "Demo de l'accelerometre",
                content: "Dans ce monde vous pourrez tester les fonctionnalites de vitesse en lancant des balles",
                position: new THREE.Vector3(-corridorWidth/2 + 0.01, 1, -10),
                rotation: new THREE.Euler(0, Math.PI/2, 0),
                buttons: [
                    {
                        text: "Tester",
                        backgroundColor: new THREE.Color(0xa9a3c2),
                        callback: () => {
                            this.changeScene('speed');
                        }
                    }
                ]
            },
            {
                title: "Particules",
                content: "Ici, vous pourrez observer les differents effets de particules",
                position: new THREE.Vector3(corridorWidth/2 - 0.01, 1, -2),
                rotation: new THREE.Euler(0, -Math.PI/2, 0),
                buttons: [
                    {
                        text: "Tester",
                        backgroundColor: new THREE.Color(0xa9a3c2),
                        callback: () => {
                            this.changeScene('particle');
                        }
                    }
                ]
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
        if(reload){
            this.xrInput.recreatePointers();
        }
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

        const homeButton = createButton({
            text: "Back to home",
            position: new THREE.Vector3(0, 1, 2),
            rotation: new THREE.Vector3(0, Math.PI, 0),
            backgroundColor: new THREE.Color(0x9CC69B),
            callback: () => {
                this.changeScene('home');
            }
        }); 
        scene.add(homeButton);
        buttons.push(homeButton);

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

    buildColliderScene(){

        let buttons = [];
        let scene = new THREE.Scene();
        scene.background = new THREE.Color("skyblue");

        // Ground
        const box = new THREE.Mesh(
            new THREE.PlaneGeometry(100, 100),
            new THREE.MeshStandardMaterial({ color: new THREE.Color(0x7B5E7B) }));
        box.quaternion.setFromAxisAngle(new THREE.Vector3(-1, 0, 0), Math.PI / 2.0);
        box.position.set(0, -0.001, 0);
        scene.add(box);


        const panel = createPanel({
            title: "Catch the ball",
            content: "Put your right hand in the ball to catch it, lets lee how many you catch in 20 seconds",
            position: new THREE.Vector3(0, 1.5, -2),
            height: 0.6
        });
        scene.add(panel);

        const sphere = new THREE.Mesh(
            new THREE.SphereGeometry(0.1, 32, 32),
            new THREE.MeshStandardMaterial({ 
                color: 0x3498db,
                metalness: 0.3,
                roughness: 0.4,
            })
        );
        sphere.position.set(0, 1, -2);
        sphere.userData.score = 0;
        sphere.userData.id = 'SPHR1';
        sphere.userData.inGame = false;
        console.log(sphere);
        scene.add(sphere);
        this.xrInput.addColliderTarget(sphere, 'right');


        const R_ENTER_COLOR = new THREE.Color(0x76BED0);
        const R_STAY_COLOR = new THREE.Color(0xF7CB15);
        const R_EXIT_COLOR = new THREE.Color(0xF55D3E);
        const L_ENTER_COLOR = new THREE.Color(0xEB4B98);
        const L_STAY_COLOR = new THREE.Color(0xF26DF9);
        const L_EXIT_COLOR = new THREE.Color(0x5158BB);
        const TRIGGER_COLOR = new THREE.Color(0x878E88);

        const panelBlock = createPanel({
            title: "Enter, Stay and Exit",
            content: "Put your hand and see what happend (try to press trigger)",
            position: new THREE.Vector3(4, 1.5, 0),
            rotation: new THREE.Euler(0, -Math.PI/2),
            height: 0.6
        });
        scene.add(panelBlock);

        const block1 = new THREE.Mesh(
            new THREE.BoxGeometry(0.4, 0.4, 0.4),
            new THREE.MeshBasicMaterial({ color: 0x8B786D })
        );
        block1.position.set(4, 0.7, -0.4);
        block1.userData.id= "BLOCK1";
        scene.add(block1);
        this.xrInput.addColliderTarget(block1);

        const block2 = new THREE.Mesh(
            new THREE.BoxGeometry(0.4, 0.4, 0.4),
            new THREE.MeshBasicMaterial({ color: 0x8B786D })
        );
        block2.position.set(4, 0.7, 0.4);
        block2.userData.id = "BLOCK2";
        scene.add(block2);
        this.xrInput.addColliderTarget(block2);

        const homeButton = createButton({
            text: "Back to home",
            position: new THREE.Vector3(0, 1, 2),
            rotation: new THREE.Vector3(0, Math.PI, 0),
            backgroundColor: new THREE.Color(0x9CC69B),
            callback: () => {
                this.changeScene('home');
            }
        }); 
        scene.add(homeButton);
        buttons.push(homeButton);

        this.scene = scene;
        this.addGridAndLight();

        // VR
        const xr = this.renderer.xr;
        this.xrInput.setupController(0, xr);
        this.xrInput.setupController(1, xr);
        this.xrInput.recreatePointers();
        this.xrInput.setFlyingMethod(0);
        this.xrInput.setAlwaysOnFlyingMode(true);
        this.xrInput.setJump(false);
        this.xrInput.setFlyingMode(true);
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

        this.xrInput?.getRightController().setOnColliderEnter((target) => {
            if(target?.userData.id === 'SPHR1'){
                if(target.userData.inGame === true){
                    if(this.clock.getElapsedTime()-target.userData.startTime >= 20){
                        console.log(target.userData.score);
                        target.userData.inGame = false;
                        target.position.set(0, 1, -2);
                        target.material.color = new THREE.Color(0x3498db);
                        if(target.userData.scorePanel){
                            disposeObject(target.userData.scorePanel, this.scene);
                            target.userData.scorePanel = undefined;
                        }
                        const scorePanel = createPanel({
                            title: "Score : "+target.userData.score,
                            position: new THREE.Vector3(0, 0.6, -2),
                            height: 0.25,
                        });
                        target.userData.scorePanel = scorePanel;
                        this.scene.add(target.userData.scorePanel);
                        console.log(scorePanel);
                        this.renderer.render(this.scene, this.camera);
                    }else{
                        target.userData.score++; 
                        target.position.set(target.position.x + Math.random()*4-2, Math.max(target.position.y + Math.random(), 0.3)-0.5, target.position.z + Math.random()*4-2);
                    } 
                }else{
                    target.userData.inGame = true;
                    target.material.color = new THREE.Color(0xB9F18C)
                    target.userData.startTime = this.clock.getElapsedTime();
                    target.userData.score = 1;
                    target.position.set(target.position.x + Math.random()*4-2, Math.max(target.position.y + Math.random(), 0.3)-0.5, target.position.z + Math.random()*4-2);
                }
            }

            if(target?.userData.id === "BLOCK2"){
                target.material.color = R_ENTER_COLOR;
                //target.scale.set(1.1, 1.1, 1.1);
            }
        });

        this.xrInput?.getRightController().setOnColliderStay((target) => {
            if(target?.userData.id === "BLOCK2"){
                if(this.xrInput.getRightController().trigger){
                    target.material.color = R_STAY_COLOR;
                }else{
                    target.material.color = TRIGGER_COLOR;
                }
            }
        });

        this.xrInput?.getRightController().setOnColliderExit((target) => {
            if(target?.userData.id === "BLOCK2"){
                target.material.color = R_EXIT_COLOR;
                //target.scale.set(1, 1, 1);
            }
        });


        this.xrInput?.getLeftController().setOnColliderEnter((target) => {
            if(target?.userData.id === "BLOCK1"){
                target.material.color = L_ENTER_COLOR;
                //target.scale.set(1.1, 1.1, 1.1);
            }
        });

        this.xrInput?.getLeftController().setOnColliderStay((target) => {
            if(target?.userData.id === "BLOCK1"){
                if(this.xrInput.getLeftController().trigger){
                    target.material.color = L_STAY_COLOR;
                }else{
                    target.material.color = TRIGGER_COLOR;
                }
            }
        });

        this.xrInput?.getLeftController().setOnColliderExit((target) => {
            if(target?.userData.id === "BLOCK1"){
                target.material.color = L_EXIT_COLOR;
                //target.scale.set(1, 1, 1);
            }
        });

    }

    buildParticleScene(){
        let scene = new THREE.Scene();
        scene.background = new THREE.Color("skyblue");
        let buttons = [];

        // Ground
        const box = new THREE.Mesh(
            new THREE.PlaneGeometry(100, 100),
            new THREE.MeshStandardMaterial({ color: new THREE.Color(0x00272B) }));
        box.quaternion.setFromAxisAngle(new THREE.Vector3(-1, 0, 0), Math.PI / 2.0);
        box.position.set(0, -0.001, 0);
        scene.add(box);

        const geometry1 = new THREE.SphereGeometry(0.1, 16, 16);
        const geometry2 = new THREE.SphereGeometry(0.05, 16, 16);

        const material1 = new THREE.MeshBasicMaterial()
        const material2 = new THREE.PointsMaterial({
            size: 0.05,
            transparent: true
        })
        material1.color = new THREE.Color(0xff0000)
        material2.color = new THREE.Color(0xe6ff26)

        const sphere = new THREE.Group();
        const points = new THREE.Points(geometry2,material2)
        const mesh = new THREE.Mesh(geometry1,material1)

        sphere.add(mesh)
        sphere.add(points)
        scene.add(sphere)

        let tickcount = 1;
        let factor = 1;
        let isScaling = false;
        let scalingFactor = 1.1;
        let scalingTickCount = 1;

        const animation1 = () => {
            if(tickcount % 100 == 0){
                factor = -factor;
                if(factor === 1){
                    isScaling = true
                }
            }

            sphere.position.y = sphere.position.y + factor*0.005;
            tickcount++;

            if(isScaling){
                if(scalingTickCount > 15){
                    isScaling = false;
                    scalingTickCount = 0;
                    points.scale.set(1, 1, 1);
                    points.material.size = 0.05;
                }else{
                    points.scale.set(points.scale.x*scalingFactor,points.scale.y*scalingFactor,points.scale.z*scalingFactor);
                    points.material.size = points.material.size*0.9;
                    scalingTickCount++;
                }
            }   
        }

        //Animation 2
        const geometry3 = new THREE.SphereGeometry(0.1, 16, 16);
        const geometry4 = new THREE.SphereGeometry(0.05, 16, 16);

        const material3 = new THREE.MeshBasicMaterial()
        const material4 = new THREE.PointsMaterial({
            size: 0.05,
            transparent: true
        })
        material3.color = new THREE.Color(0xff0000);
        material4.color = new THREE.Color(0xe6ff26);

        const sphere2 = new THREE.Group();
        const points2 = new THREE.Points(geometry4,material4);
        const mesh2 = new THREE.Mesh(geometry3,material3);

        sphere2.add(mesh2);
        sphere2.add(points2);
        scene.add(sphere2);

        let tickcount2 = 1;
        let factor2 = 1;
        let celebrationMode2 = false;
        let celebrationTick2 = 0;

        const animation2 = () => {
        if(tickcount2 % 100 == 0){
            factor2 = -factor2;
            if(factor2 === 1){
            celebrationMode2 = true;
            }
        }

        sphere2.position.y = sphere2.position.y + factor2*0.005;
        tickcount2++;

        if(celebrationMode2) {
            celebrationTick2++;
            
            // pulsation
            points2.scale.set(2, 2, 2);
            points2.material.size = 0.01 + Math.sin(celebrationTick2 * 0.2) * 0.03;
            
            if(celebrationTick2 >= 80) {
            celebrationMode2 = false;
            celebrationTick2 = 0;
            points2.material.size = 0.05; 
            points2.scale.set(1, 1, 1);
            }
        }
        }

        //Animation 3
        const geometry5 = new THREE.SphereGeometry(0.1, 16, 16);
        const geometry6= new THREE.SphereGeometry(0.05, 16, 16);

        const material5 = new THREE.MeshBasicMaterial()
        const material6 = new THREE.PointsMaterial({
            size: 0.05,
            transparent: true
        })
        material5.color = new THREE.Color(0xff0000);
        material6.color = new THREE.Color(0xe6ff26);

        const sphere3 = new THREE.Group();
        const points3 = new THREE.Points(geometry6,material6);
        const mesh3 = new THREE.Mesh(geometry5,material5);

        sphere3.add(mesh3);
        sphere3.add(points3);
        scene.add(sphere3);

        let tickcount3 = 1;
        let factor3 = 1;
        let celebrationMode3 = false;
        let celebrationTick3 = 0;
        let initialParticlesPositions3 = [];

        // particle's position tab
        const particlePositions3 = points2.geometry.getAttribute('position');
        for (let i = 0; i < particlePositions3.count; i++) {
        initialParticlesPositions3.push({
            x: particlePositions3.getX(i),
            y: particlePositions3.getY(i),
            z: particlePositions3.getZ(i)
        });
        }

        const animation3 = () => {
        if(tickcount3 % 100 == 0){
            factor3 = -factor3;
            if(factor3 === 1){
            celebrationMode3 = true;
            }
        }

        sphere3.position.y = sphere3.position.y + factor3*0.005;
        tickcount3++;

        if(celebrationMode3) {
            celebrationTick3++;
            points3.material.size = 0.01;
            // Particle spiral explosion
            const particlePositions = points3.geometry.getAttribute('position');
            for (let i = 0; i < particlePositions.count; i++) {
            const initialPos = initialParticlesPositions3[i];
            //angle = progressive rotation (0.05 = radians/tick) + initial angle (particle distribution on a circle)
            const angle = celebrationTick3 * 0.05 + (i / particlePositions.count) * Math.PI * 2;
            const radius = Math.min(0.2, celebrationTick3 * 0.03); //calcule la croissance du rayon
            
            //position = initial position + radius applied on the angle
            particlePositions.setX(i, initialPos.x + Math.cos(angle) * radius);
            particlePositions.setY(i, initialPos.y + Math.sin(angle) * radius);
            particlePositions.setZ(i, initialPos.z + Math.sin(angle * 0.5) * 0.2);
            }

            //needed to refresh display
            particlePositions.needsUpdate = true;
            
            if(celebrationTick3 >= 50) {
            celebrationMode3 = false;
            celebrationTick3 = 0;
            
            // reset of particles's positions
            for (let i = 0; i < particlePositions.count; i++) {
                const initialPos = initialParticlesPositions3[i];
                particlePositions.setX(i, initialPos.x);
                particlePositions.setY(i, initialPos.y);
                particlePositions.setZ(i, initialPos.z);
            }
            particlePositions.needsUpdate = true;
            }
        }
        }

        const tick = () => {
            animation1();
            animation2();
            animation3();
        }

        //Sphere position
        sphere.position.x = -1;
        sphere.position.y = 1;
        sphere.position.z = -2;

        sphere2.position.x = 0;
        sphere2.position.y = 1;
        sphere2.position.z = -2;

        sphere3.position.x = 1;
        sphere3.position.y = 1;
        sphere3.position.z = -2;

        const homeButton = createButton({
            text: "Back to home",
            position: new THREE.Vector3(0, 1, 2),
            rotation: new THREE.Vector3(0, Math.PI, 0),
            backgroundColor: new THREE.Color(0x9CC69B),
            callback: () => {
                this.changeScene('home');
            }
        }); 
        scene.add(homeButton);
        buttons.push(homeButton);

        this.scene = scene;
        this.addGridAndLight();
        this.renderer.setAnimationLoop(() => {this.onAnimate(); tick();});

        // VR
        const xr = this.renderer.xr;
        this.xrInput.setupController(0, xr);
        this.xrInput.setupController(1, xr);
        this.xrInput.recreatePointers();
        this.xrInput.addColliderTarget(buttons);
    }

    buildSpeedScene(){
        let scene = new THREE.Scene();
        scene.background = new THREE.Color("skyblue");
        let buttons = [];

        // Ground
        const box = new THREE.Mesh(
            new THREE.PlaneGeometry(100, 100),
            new THREE.MeshStandardMaterial({ color: new THREE.Color(0x8EB897) }));
        box.quaternion.setFromAxisAngle(new THREE.Vector3(-1, 0, 0), Math.PI / 2.0);
        box.position.set(0, -0.001, 0);
        scene.add(box);


        const panelBlock = createPanel({
            title: "Speedometer",
            content: "Try to move and see how fast you are, it increment by 0.5 meter/s",
            position: new THREE.Vector3(-1, 0.5, -2),
            height: 0.6
        });
        scene.add(panelBlock);

        let cubes = [];

        for(let i = 0; i < 10; i++){    
            const cubeMaterial = new THREE.MeshStandardMaterial({color: 'white'});
            const cubeGeometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);

            const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
            cube.position.set(0, 0.2*i, -2);

            const ratio = i / (10 - 1);
            cube.material.color = new THREE.Color(ratio, 1 - ratio, 0);

            scene.add(cube);
            cubes.push(cube);
        }

        const updateSpeed = () => {

            if (!this.frame%50){
                return;
            }

            if(!this.xrInput.getRightController()){
                return;
            }
            const speed = this.xrInput.getRightController().getSpeed();

            if (speed > 1) {
                const step = Math.floor(speed*2) > 9 ? 9 : Math.floor(speed*2);
                for (let i = 0; i < step; i++) {
                    const ratio = i / (10 - 1); 
                    cubes[i].material.color = new THREE.Color(0xff9900);
                    cubes[i].material.emissive.setRGB(ratio * 0.8, (1 - ratio) * 0.8, 0);
                }
            } else {
                for (let i = 0; i < 10; i++) {
                    const ratio = i / (10 - 1);
                    cubes[i].material.color = new THREE.Color(ratio, 1 - ratio, 0); // Gradient de couleur
                    cubes[i].material.emissive.setRGB(0, 0, 0); // Réinitialise l'émission
                }
            }

        }

        const panelBlock2 = createPanel({
            title: "Launch a ball",
            content: "Try to launch a ball as far as you can",
            position: new THREE.Vector3(2, 1.5, 0),
            rotation: new THREE.Euler(0, -Math.PI/2),
            height: 0.6
        });
        scene.add(panelBlock2);

        const desk = new THREE.Mesh(
            new THREE.BoxGeometry(1, 1, 1),
            new THREE.MeshStandardMaterial({ color: new THREE.Color(0x020202) }));
        desk.position.set(2, 0, 0);
        scene.add(desk);

        const ball = new THREE.Mesh(
            new THREE.SphereGeometry(0.1, 16, 16),
            new THREE.MeshStandardMaterial({ 
                color: new THREE.Color(0xF5B82E),
                roughness: 0.7,
                metalness: 0.2
            })
        );
        ball.position.set(2, 0.8, 0);
        scene.add(ball);
        
        ball.userData = {
            isGrabbed: false,
            velocity: new THREE.Vector3(0, 0, 0),
            gravity: 9.8,
            lastPosition: new THREE.Vector3(),
            launchPosition: null,
            landingPosition: null,
            isLaunched: false,
            isTracking: false,
            controller: null,
            distanceTraveled: 0
        };

        let distancePanel;

        const updateDistanceDisplay = (distance) => {
            if(distancePanel){
                disposeObject(distancePanel);
            }
            distancePanel = createPanel({
                title: "Distance",
                content: distance.toFixed(2)+" meters",
                position: new THREE.Vector3(2, 1, 1.2),
                rotation: new THREE.Euler(0, -Math.PI/2),
                height: 0.4,
                width: 0.8
            });
            scene.add(distancePanel);
        };
        
        const updateBall = (deltaTime) => {
            if (ball.userData.isGrabbed && ball.userData.controller) {
                const controller = ball.userData.controller;
                controller.getWorldPosition(ball.position);
                
                const currentPosition = new THREE.Vector3();
                controller.getWorldPosition(currentPosition);
                if (ball.userData.lastPosition.length() > 0) {
                    ball.userData.velocity.subVectors(currentPosition, ball.userData.lastPosition).multiplyScalar(1 / deltaTime);
                }
                ball.userData.lastPosition.copy(currentPosition);
            } 
            else if (ball.userData.isLaunched) {
                ball.userData.velocity.y -= ball.userData.gravity * deltaTime;
                
                ball.position.x += ball.userData.velocity.x * deltaTime;
                ball.position.y += ball.userData.velocity.y * deltaTime;
                ball.position.z += ball.userData.velocity.z * deltaTime;
                
                if (ball.position.y <= 0.1 && ball.userData.isTracking) {
                    ball.userData.isTracking = false;
                    ball.userData.landingPosition = ball.position.clone();
                    
                    if (ball.userData.launchPosition) {
                        const dx = ball.userData.landingPosition.x - ball.userData.launchPosition.x;
                        const dz = ball.userData.landingPosition.z - ball.userData.launchPosition.z;
                        ball.userData.distanceTraveled = Math.sqrt(dx * dx + dz * dz);
                        
                        //updateDistanceDisplay(ball.userData.launchPosition.distanceTo(ball.userData.landingPosition));
                        updateDistanceDisplay(ball.userData.distanceTraveled);
                    }
                }
            
                if (ball.position.y < 0.1) {
                    ball.position.y = 0.1; 
                    
                    if (ball.userData.velocity.y < 0) {
                        ball.userData.velocity.y *= -0.5; 
                        
                        ball.userData.velocity.x *= 0.8;
                        ball.userData.velocity.z *= 0.8;
                    }
                    
                    if (Math.abs(ball.userData.velocity.y) < 0.05 && 
                        Math.abs(ball.userData.velocity.x) < 0.05 && 
                        Math.abs(ball.userData.velocity.z) < 0.05) {
                        ball.userData.velocity.set(0, 0, 0);
                        ball.userData.isLaunched = false;
                        
                        ball.position.y = 0.1;
                    }
                }
            } else {
                if (ball.position.y < 0.1) {
                    ball.position.y = 0.1;
                }
            }
        };
        
        const resetButton = createButton({
            text: "Reset Ball",
            position: new THREE.Vector3(2, 0.6, 1.2),
            rotation: new THREE.Euler(0, -Math.PI/2, 0),
            backgroundColor: new THREE.Color(0xE67E22),
            callback: () => {
                ball.position.set(2, 1, 0);
                ball.userData.velocity.set(0, 0, 0);
                ball.userData.isGrabbed = false;
                ball.userData.isLaunched = false;
                ball.userData.isTracking = false;
                ball.userData.launchPosition = null;
                ball.userData.landingPosition = null;
                ball.userData.controller = null;
            }
        });
        scene.add(resetButton);
        buttons.push(resetButton);

        const homeButton = createButton({
            text: "Back to home",
            position: new THREE.Vector3(0, 1, 2),
            rotation: new THREE.Vector3(0, Math.PI, 0),
            backgroundColor: new THREE.Color(0x9CC69B),
            callback: () => {
                this.changeScene('home');
            }
        }); 
        scene.add(homeButton);
        buttons.push(homeButton);

        this.scene = scene;
        this.addGridAndLight();
                
        const animate = () => {
            updateSpeed();
            updateBall(this.deltaTime);
            this.onAnimate();
        };

        this.renderer.setAnimationLoop(animate);

        const xr = this.renderer.xr;
        this.xrInput.setupController(0, xr);
        this.xrInput.setupController(1, xr);
        this.xrInput.recreatePointers();
        this.xrInput.addColliderTarget(buttons);
        this.xrInput.addColliderTarget(ball);

        const handleRightHand = () => {
            if (this.xrInput.getRightController().trigger && !ball.userData.isGrabbed) {
                ball.userData.isGrabbed = true;
                ball.userData.controller = this.xrInput.getRightController();
                this.xrInput.getRightController().getWorldPosition(ball.userData.lastPosition);
            } 
            else if (!this.xrInput.getRightController().trigger && ball.userData.isGrabbed && ball.userData.controller === this.xrInput.getRightController()) {
                ball.userData.isGrabbed = false;
                ball.userData.isLaunched = true;
                ball.userData.isTracking = true;
                ball.userData.launchPosition = ball.position.clone();
                console.log(`Ball launched from position: ${ball.userData.launchPosition.x.toFixed(2)}, ${ball.userData.launchPosition.y.toFixed(2)}, ${ball.userData.launchPosition.z.toFixed(2)}`);
            }
        }

        const handleLeftHand = () => {
            if (this.xrInput.getLeftController().trigger && !ball.userData.isGrabbed) {
                ball.userData.isGrabbed = true;
                ball.userData.controller = this.xrInput.getLeftController();
                this.xrInput.getLeftController().getWorldPosition(ball.userData.lastPosition);
            } 
            else if (!this.xrInput.getLeftController().trigger && ball.userData.isGrabbed && ball.userData.controller === this.xrInput.getLeftController()) {
                ball.userData.isGrabbed = false;
                ball.userData.isLaunched = true;
                ball.userData.isTracking = true;
                ball.userData.launchPosition = ball.position.clone();
                console.log(`Ball launched from position: ${ball.userData.launchPosition.x.toFixed(2)}, ${ball.userData.launchPosition.y.toFixed(2)}, ${ball.userData.launchPosition.z.toFixed(2)}`);
            }
        }

        this.xrInput.getRightController().setOnColliderEnter(handleRightHand);
        this.xrInput.getRightController().setOnColliderStay(handleRightHand);

        this.xrInput.getLeftController().setOnColliderEnter(handleLeftHand);
        this.xrInput.getLeftController().setOnColliderStay(handleLeftHand);
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
                this.buildHomeScene(true);
                break;
            case 'movement':
                this.buildMovementScene();
                break;
            case 'collider':
                this.buildColliderScene();
                break;
            case 'particle':
                this.buildParticleScene();
                break;
            case 'speed':
                this.buildSpeedScene();
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