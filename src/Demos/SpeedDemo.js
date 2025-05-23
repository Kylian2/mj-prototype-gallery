import * as THREE from 'three';
import { createPanel, createButton } from '../UI/XRUI.js';
import { disposeObject } from '../Utils/dispose3D.js';

/**
 * Build speed demo scene
 * @param {Context} context 
 */
export function buildSpeedScene(context){
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

        if (!context.frame%50){
            return;
        }

        if(!context.xrInput.getRightController()){
            return;
        }
        const speed = context.xrInput.getRightController().getSpeed();

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

    let balls = []
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
    balls.push(ball);

    ball.userData = {
        type: 'BALL',
        isGrabbed: false,
        velocity: new THREE.Vector3(0, 0, 0),
        gravity: 9.8,
        lastPosition: new THREE.Vector3(),
        launchPosition: null,
        landingPosition: null,
        isLaunched: false,
        isTracking: false,
        controller: null,
        distanceTraveled: 0, 
        display: true
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
    
    const updateBall = (ball, deltaTime) => {
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
                    if(ball.userData.display === true){
                        updateDistanceDisplay(ball.userData.distanceTraveled);
                    }
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
            if (ball.position.y <= 0.1) {
                ball.position.y = 0.1;
                if(ball.userData.initialPosition){
                    ball.position.copy(ball.userData.initialPosition);
                    ball.userData = {
                        type: 'BALL',
                        isGrabbed: false,
                        velocity: new THREE.Vector3(0, 0, 0),
                        gravity: 6.8,
                        lastPosition: new THREE.Vector3(),
                        launchPosition: null,
                        landingPosition: null,
                        initialPosition: ball.userData.initialPosition,
                        isLaunched: false,
                        isTracking: false,
                        controller: null,
                        distanceTraveled: 0, 
                        display: false
                    };
                    console.log(ball)
                }
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

    const desk2 = new THREE.Mesh(
    new THREE.BoxGeometry(2, 1, 0.5),
    new THREE.MeshStandardMaterial({ color: new THREE.Color(0x020202) }));
    desk2.position.set(-3, 0, 0);
    desk2.rotation.set(0, Math.PI/2, 0);
    scene.add(desk2);

    for(let i = 0; i < 3; i++){
        const ball = new THREE.Mesh(
            new THREE.SphereGeometry(0.1, 16, 16),
            new THREE.MeshStandardMaterial({ 
                color: new THREE.Color(Math.random(), Math.random(), Math.random()),
                roughness: 0.7,
                metalness: 0.2
            })
        );
        ball.position.set(-3, 0.6, -1 + i);
        ball.userData = {
            type: 'BALL',
            isGrabbed: false,
            velocity: new THREE.Vector3(0, 0, 0),
            gravity: 6.8,
            lastPosition: new THREE.Vector3(),
            launchPosition: null,
            landingPosition: null,
            initialPosition: new THREE.Vector3(-3, 0.6, -1 + i),
            isLaunched: false,
            isTracking: false,
            controller: null,
            distanceTraveled: 0, 
            display: false
        };
        scene.add(ball);
        balls.push(ball)
    }

    const homeButton = createButton({
        text: "Back to home",
        position: new THREE.Vector3(0, 1, 2),
        rotation: new THREE.Vector3(0, Math.PI, 0),
        backgroundColor: new THREE.Color(0x9CC69B),
        callback: () => {
            context.changeScene('home');
        }
    }); 
    scene.add(homeButton);
    buttons.push(homeButton);

    context.scene = scene;
    context.addGridAndLight();
            
    const animate = () => {
        updateSpeed();
        balls.forEach((ball)=> updateBall(ball, context.deltaTime))
        context.onAnimate();
    };

    context.renderer.setAnimationLoop(animate);

    const xr = context.renderer.xr;
    context.xrInput.setupController(0, xr);
    context.xrInput.setupController(1, xr);
    context.xrInput.recreatePointers();
    context.xrInput.addColliderTarget(buttons);
    context.xrInput.addColliderTarget(balls);

    const handleRightHand = (target) => {
        if(target.userData.type === 'BALL'){
            if (context.xrInput.getRightController().trigger && !target.userData.isGrabbed) {
                target.userData.isGrabbed = true;
                target.userData.controller = context.xrInput.getRightController();
                context.xrInput.getRightController().getWorldPosition(target.userData.lastPosition);
            } 
            else if (!context.xrInput.getRightController().trigger && target.userData.isGrabbed && target.userData.controller === context.xrInput.getRightController()) {
                target.userData.isGrabbed = false;
                target.userData.isLaunched = true;
                target.userData.isTracking = true;
                target.userData.launchPosition = target.position.clone();
            }
        }
    }

    const handleLeftHand = (target) => {
        if(target.userData.type === 'BALL'){
            if (context.xrInput.getLeftController().trigger && !target.userData.isGrabbed) {
                target.userData.isGrabbed = true;
                target.userData.controller = context.xrInput.getLeftController();
                context.xrInput.getLeftController().getWorldPosition(target.userData.lastPosition);
            } 
            else if (!context.xrInput.getLeftController().trigger && target.userData.isGrabbed && target.userData.controller === context.xrInput.getLeftController()) {
                target.userData.isGrabbed = false;
                target.userData.isLaunched = true;
                target.userData.isTracking = true;
                target.userData.launchPosition = target.position.clone();
            }
        }
    }

    context.xrInput.getRightController().setOnColliderEnter(handleRightHand);
    context.xrInput.getRightController().setOnColliderStay(handleRightHand);

    context.xrInput.getLeftController().setOnColliderEnter(handleLeftHand);
    context.xrInput.getLeftController().setOnColliderStay(handleLeftHand);
}