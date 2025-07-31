import * as THREE from 'three';
import { createPanel } from '../UI/XRUI.js';
import { Clock } from "musicaljuggling";

/**
 * Build Home Scene
 * @param {Context} context 
 * @param {Boolean} [reload = false] - Indicates if scene is built as a reload (i.e., we need to rebuild pointers)
 */
export function Curve(context, reload = false) {

    const clock = new Clock({bounds: [0, 20]});
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x333333);

    const axesHelper = new THREE.AxesHelper(5);
    scene.add(axesHelper);

    let points = [];
    const f = (x) => -0.3 * x ** 2 + 6;
    let x = -5;

    for (; x < -3; x += 0.05) {
        points.push(new THREE.Vector3(x, f(x), 0));
    }

    let curve = new THREE.CatmullRomCurve3(points);
    curve.closed = false;
    curve.curveType = 'catmullrom';
    curve.tension = 0.5;

    const curvePoints = curve.getPoints(100);
    const geometry = new THREE.BufferGeometry().setFromPoints(curvePoints);
    const material = new THREE.LineBasicMaterial({
        color: 0xff0000,
        linewidth: 2
    });
    const splineLine = new THREE.Line(geometry, material);
    scene.add(splineLine);

    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);

    context.scene = scene;

    let factor = 1;
    clock.play();
    context.renderer.setAnimationLoop(() => {
        console.log(clock.getTime())
        if(factor > 0 && x > 6){
            factor = -1;
        }else if(factor < 0 && x < -6){
            factor = 1;
        }

        points.shift();
        points.push(new THREE.Vector3(x, f(x), f(x)));
        x += 0.05*factor;
        curve = new THREE.CatmullRomCurve3(points);
        curve.closed = false;
        curve.curveType = 'catmullrom';
        curve.tension = 0.5;

        const newPoints = curve.getPoints(100);
        splineLine.geometry.setFromPoints(newPoints);

        context.onAnimate();
    });
}
