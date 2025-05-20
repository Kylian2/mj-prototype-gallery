import * as THREE from 'three';
import { createPanel } from '../UI/XRUI.js';

/**
 * Build Home Scene
 * @param {Context} context 
 * @param {Boolean} [reload = false] - Indicates if scene is build as a reload (ie we need to rebuild pointers) 
 */
export function buildHomeScene(context, reload = false) {
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
                        context.changeScene('movement');
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
                        context.changeScene('collider');
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
                        context.changeScene('speed');
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
                        context.changeScene('particle');
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

    context.scene = scene;
    
    // VR
    const xr = context.renderer.xr;
    context.xrInput.setupController(0, xr);
    context.xrInput.setupController(1, xr);
    if(reload){
        context.xrInput.recreatePointers();
    }
    context.xrInput.setFlyingMode(false);

    context.xrInput.addColliderTarget(buttons);
    context.xrInput.setOnPointing((target) => {
        if (target && target.isUI) {
            if (context.xrInput?.getRightController().trigger) {
                target.setState('selected');
            } else {
                target.setState('hovered');
            }
        }
    })
}