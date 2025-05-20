import * as THREE from 'three';
import { createButton } from '../UI/XRUI.js';

/**
 * Build movement demo scene
 * @param {Context} context 
 */
export function buildMovementScene(context) {
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
            context.xrInput.setFlyingMode(true);
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
            context.xrInput.setFlyingMode(false);
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
            context.xrInput.setJump(true);
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
            context.xrInput.setJump(false);
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
            context.xrInput.setFlyingMethod(0)
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
            context.xrInput.setFlyingMethod(1)
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
            context.xrInput.setAlwaysOnFlyingMode(true);
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
            context.xrInput.setAlwaysOnFlyingMode(false);
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
            context.xrInput.setDiscreteRotation(true);
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
            context.xrInput.setDiscreteRotation(false);
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

    context.xrInput.setFlyingMode(true);
    button1.setState('on');
    button2.setState('off');
    context.xrInput.setJump(false);
    button3.setState('off');
    button4.setState('on');
    context.xrInput.setFlyingMethod(0);
    button5.setState('on');
    button6.setState('off');
    context.xrInput.setAlwaysOnFlyingMode(false);
    button7.setState('off');
    button8.setState('on');
    context.xrInput.setDiscreteRotation(false);
    button9.setState('off');
    button10.setState('on');

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
}