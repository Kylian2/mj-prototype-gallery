import * as THREE from 'three';
import { createPanel, createButton } from '../UI/XRUI.js';
import { disposeObject } from '../Utils/dispose3D.js';

/**
 * Build colliders demo scene
 * @param {Context} context 
 */
export function buildColliderScene(context){

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
    context.xrInput.addColliderTarget(sphere, 'right');


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
    context.xrInput.addColliderTarget(block1);

    const block2 = new THREE.Mesh(
        new THREE.BoxGeometry(0.4, 0.4, 0.4),
        new THREE.MeshBasicMaterial({ color: 0x8B786D })
    );
    block2.position.set(4, 0.7, 0.4);
    block2.userData.id = "BLOCK2";
    scene.add(block2);
    context.xrInput.addColliderTarget(block2);

    const sphere2 = new THREE.Mesh(
        new THREE.SphereGeometry(0.1, 32, 32),
        new THREE.MeshStandardMaterial({ 
            color: 0x8B786D,
            metalness: 0.3,
            roughness: 0.4,
        })
    );
    sphere2.position.set(4, 0.7, 1);
    sphere2.userData.id = 'SPHR2';
    scene.add(sphere2);
    context.xrInput.addColliderTarget(sphere2);

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

    // VR
    const xr = context.renderer.xr;
    context.xrInput.setupController(0, xr);
    context.xrInput.setupController(1, xr);
    context.xrInput.recreatePointers();
    context.xrInput.setFlyingMethod(0);
    context.xrInput.setAlwaysOnFlyingMode(true);
    context.xrInput.setJump(false);
    context.xrInput.setFlyingMode(true);
    context.xrInput.addColliderTarget(buttons);
    context.xrInput.setOnPointing((target) => {
        if (target && target.isUI) {
            if (context.xrInput.getRightController().trigger) {
                target.setState('selected');
            } else {
                target.setState('hovered');
            }
        }
    });

    context.xrInput?.getRightController().setOnColliderEnter((target) => {
        if(target?.userData.id === 'SPHR1'){
            if(target.userData.inGame === true){
                if(context.clock.getElapsedTime()-target.userData.startTime >= 20){
                    console.log(target.userData.score);
                    target.userData.inGame = false;
                    target.position.set(0, 1, -2);
                    target.material.color = new THREE.Color(0x3498db);
                    if(target.userData.scorePanel){
                        disposeObject(target.userData.scorePanel, context.scene);
                        target.userData.scorePanel = undefined;
                    }
                    const scorePanel = createPanel({
                        title: "Score : "+target.userData.score,
                        position: new THREE.Vector3(0, 0.6, -2),
                        height: 0.25,
                    });
                    target.userData.scorePanel = scorePanel;
                    context.scene.add(target.userData.scorePanel);
                    console.log(scorePanel);
                    context.renderer.render(context.scene, context.camera);
                }else{
                    target.userData.score++; 
                    target.position.set(target.position.x + Math.random()*4-2, Math.max(target.position.y + Math.random(), 0.3)-0.5, target.position.z + Math.random()*4-2);
                } 
            }else{
                target.userData.inGame = true;
                target.material.color = new THREE.Color(0xB9F18C)
                target.userData.startTime = context.clock.getElapsedTime();
                target.userData.score = 1;
                target.position.set(target.position.x + Math.random()*4-2, Math.max(target.position.y + Math.random(), 0.3)-0.5, target.position.z + Math.random()*4-2);
            }
        }

        if(target?.userData.id === "BLOCK2" || target?.userData.id === "SPHR2"){
            target.material.color = R_ENTER_COLOR;
            //target.scale.set(1.1, 1.1, 1.1);
        }
    });

    context.xrInput?.getRightController().setOnColliderStay((target) => {
        if(target?.userData.id === "BLOCK2" || target?.userData.id === "SPHR2"){
            if(context.xrInput.getRightController().trigger){
                target.material.color = R_STAY_COLOR;
            }else{
                target.material.color = TRIGGER_COLOR;
            }
        }
    });

    context.xrInput?.getRightController().setOnColliderExit((target) => {
        if(target?.userData.id === "BLOCK2" || target?.userData.id === "SPHR2"){
            target.material.color = R_EXIT_COLOR;
            //target.scale.set(1, 1, 1);
        }
    });


    context.xrInput?.getLeftController().setOnColliderEnter((target) => {
        if(target?.userData.id === "BLOCK1" || target?.userData.id === "SPHR2"){
            target.material.color = L_ENTER_COLOR;
            //target.scale.set(1.1, 1.1, 1.1);
        }
    });

    context.xrInput?.getLeftController().setOnColliderStay((target) => {
        if(target?.userData.id === "BLOCK1" || target?.userData.id === "SPHR2"){
            if(context.xrInput.getLeftController().trigger){
                target.material.color = L_STAY_COLOR;
            }else{
                target.material.color = TRIGGER_COLOR;
            }
        }
    });

    context.xrInput?.getLeftController().setOnColliderExit((target) => {
        if(target?.userData.id === "BLOCK1" || target?.userData.id === "SPHR2"){
            target.material.color = L_EXIT_COLOR;
            //target.scale.set(1, 1, 1);
        }
    });

}