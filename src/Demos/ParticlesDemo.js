import * as THREE from 'three';
import { createButton } from '../UI/XRUI.js';

/**
 * Build particles demo scene
 * @param {Context} context 
 */
export function buildParticleScene(context){
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
            context.changeScene('home');
        }
    }); 
    scene.add(homeButton);
    buttons.push(homeButton);

    context.scene = scene;
    context.addGridAndLight();
    context.renderer.setAnimationLoop(() => {context.onAnimate(); tick();});

    // VR
    const xr = context.renderer.xr;
    context.xrInput.setupController(0, xr);
    context.xrInput.setupController(1, xr);
    context.xrInput.recreatePointers();
    context.xrInput.addColliderTarget(buttons);
}