import './style.css'
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as CANNON from 'cannon-es';

import Car from './Car';
import CharacterBox from './CharacterBox';

// --- THREE.js setup ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x202530);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200);
camera.position.set(6, 6, 8);
camera.fov = 75;

const canvas = document.querySelector(".webgl");
const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
// renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
// document.body.style.margin = '0';
// document.body.appendChild(renderer.domElement);

// Orbit controls
//const controls = new OrbitControls(camera, renderer.domElement);
//controls.target.set(0, 1, 0);
//controls.update();

// Lights
const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
hemi.position.set(0, 50, 0);
scene.add(hemi);

const dir = new THREE.DirectionalLight(0xffffff, 2);
dir.position.set(5, 10, 7);
dir.castShadow = true;
dir.shadow.camera.left = -10;
dir.shadow.camera.right = 10;
dir.shadow.camera.top = 10;
dir.shadow.camera.bottom = -10;
dir.shadow.camera.near = 0.5;
dir.shadow.camera.far = 50;
scene.add(dir);

// --- Cannon-es physics world ---
const world = new CANNON.World({ gravity: new CANNON.Vec3(0, -9.82, 0) });

// Ground body
const groundBody = new CANNON.Body({ mass: 0 });
const groundShape = new CANNON.Plane();
groundBody.addShape(groundShape);
groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
world.addBody(groundBody);

// THREE ground mesh
const groundGeo = new THREE.PlaneGeometry(200, 200);
const groundMat = new THREE.MeshStandardMaterial({ color: 0xfaa533, metalness: 0.1, roughness: 0.9 });
const groundMesh = new THREE.Mesh(groundGeo, groundMat);
groundMesh.receiveShadow = true;
groundMesh.rotation.x = -Math.PI / 2;
scene.add(groundMesh);

// Grid helper
const grid = new THREE.GridHelper(20, 20, 0x222222, 0x222222);
grid.material.opacity = 0.25;
grid.material.transparent = true;
//scene.add(grid);
const axesHelper = new THREE.AxesHelper(5);
scene.add(axesHelper);


// Sphere (CANNON + THREE)
const radius = 2;
const sphereShape = new CANNON.Sphere(radius);
const sphereBody = new CANNON.Body({ mass: 1 });
sphereBody.addShape(sphereShape);
sphereBody.position.set(8, 10, 5);
sphereBody.angularDamping = 0.1;
world.addBody(sphereBody);

const sphereGeo = new THREE.SphereGeometry(radius, 32, 24);
const sphereMat = new THREE.MeshStandardMaterial({ color: 0x2194ce, metalness: 0.2, roughness: 0.3 });
const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
sphereMesh.castShadow = true;
scene.add(sphereMesh);

// Contact materials (optional)
const groundMatPhys = new CANNON.Material('groundMat');
const sphereMatPhys = new CANNON.Material('sphereMat');
const contactMat = new CANNON.ContactMaterial(groundMatPhys, sphereMatPhys, {
  friction: 0.4,
  restitution: 0.3
});
world.addContactMaterial(contactMat);
groundBody.material = groundMatPhys;
sphereBody.material = sphereMatPhys;

const car = new Car({ scene: scene, world: world });
const textgeo = new CharacterBox({
  scene: scene,
  world: world,
  font: '/Deluna_Regular.json',
  text: 'Use W A S D',
  rotation: new THREE.Vector3(Math.PI / 2, 0, 0),
  scale: new THREE.Vector3(-1, 1, 1),
  Size: 2,
  height: 2,
  depth: 1.5,
  position: new THREE.Vector3(-9, 2, 5),
})

function create3DText(text, position = new THREE.Vector3(0, 0, 0), scale = new THREE.Vector3(1, 1, 1)) {
  let chars = [];
  for (let i = text.length - 1; i >= 0; i--) {
    //for (let i = 0; i < text.length; i++) {

    chars.push(new CharacterBox({
      scene: scene,
      world: world,
      font: '/Deluna_Regular.json',
      text: text[i],
      position: new THREE.Vector3(i * -2 + position.x, 0 + position.y, 0 + position.z),
      scale: scale,
      Size: 2,
      height: 2,
      depth: 1,
    }));
  }
  return chars;
}

const name1 = create3DText("TATYAAA", new THREE.Vector3(-5, 0, 15), new THREE.Vector3(-1, 1, 1));
const name2 = create3DText("POOKIE", new THREE.Vector3(-5, 5, 15), new THREE.Vector3(-1, 1, 1));

// --- Follow Camera Helper ---
// Persistent vectors for smooth transitions
const camTarget = new THREE.Vector3();
const camPosition = new THREE.Vector3();
const carVelocity = new THREE.Vector3();
const carForward = new THREE.Vector3();

export function updateCinematicFollowCamera(camera, carBody, deltaTime) {
  // --- Adjustable parameters ---
  const followSmoothness = 10.0;   // how tightly camera follows position
  const lookSmoothness = 5.0;     // how smoothly camera rotates
  const lookDistance = 5.0;       // how far ahead of the car to look
  const offset = new THREE.Vector3(10, 10, -10); // world-space offset (corner view)

  // --- Compute desired camera position ---
  const desiredPos = new THREE.Vector3().copy(carBody.position).add(offset);

  // --- Smooth camera motion (lerp position) ---
  camPosition.lerp(desiredPos, followSmoothness * deltaTime);
  camera.position.copy(camPosition);

  // --- Compute car movement direction ---
  const vel = carBody.velocity;
  if (vel.length() > 0.1) {
    carVelocity.copy(vel).normalize();
  } else {
    // fallback to car's local forward if almost stationary
    const forward = new CANNON.Vec3(0, 0, 1);
    const rotatedForward = carBody.quaternion.vmult(forward);
    carVelocity.set(rotatedForward.x, rotatedForward.y, rotatedForward.z).normalize();
  }

  // --- Target look-at point ahead of the car ---
  const desiredLookAt = new THREE.Vector3(
    carBody.position.x + carVelocity.x * lookDistance,
    1,
    carBody.position.z + carVelocity.z * lookDistance
  );

  // --- Smoothly interpolate the look target ---
  camTarget.lerp(desiredLookAt, lookSmoothness * deltaTime);

  // --- Aim the camera ---
  camera.lookAt(camTarget);
}


// Keyboard Input
// Control state
const keys = {
  forward: false,
  backward: false,
  left: false,
  right: false,
  brake: false,
};

// Keyboard input
window.addEventListener('keydown', (e) => {
  if (e.code === 'KeyW') keys.forward = true;
  if (e.code === 'KeyS') keys.backward = true;
  if (e.code === 'KeyA') keys.left = true;
  if (e.code === 'KeyD') keys.right = true;
  if (e.code === "Space") keys.brake = true;
  if (e.key.toLocaleLowerCase() === 'r') car.resetCar();
});

window.addEventListener('keyup', (e) => {
  if (e.code === 'KeyW') keys.forward = false;
  if (e.code === 'KeyS') keys.backward = false;
  if (e.code === 'KeyA') keys.left = false;
  if (e.code === 'KeyD') keys.right = false;
  if (e.code === 'Space') keys.brake = false;
});

document.getElementById('accelerate').addEventListener('touchstart', () => keys.forward = true);
document.getElementById('accelerate').addEventListener('touchend', () => keys.forward = false);

document.getElementById('reverse').addEventListener('touchstart', () => keys.backward = true);
document.getElementById('reverse').addEventListener('touchend', () => keys.backward = false);

document.getElementById('brake').addEventListener('touchstart', () => keys.brake = true);
document.getElementById('brake').addEventListener('touchend', () => keys.brake = false);

// static boxes for checking
function addRandomBlocks(scene, world, count = 50) {
  const blocks = [];

  const boxGeo = new THREE.BoxGeometry(1, 1, 1);

  for (let i = 0; i < count; i++) {
    const boxMat = new THREE.MeshStandardMaterial({ color: (Math.random() - 0.5) * 127, metalness: 0.2, roughness: 0.8 });
    // Random position on ground
    /*const x = (Math.random() - 0.5) * 20;  // spread over ±10 meters
    const z = (Math.random() - 0.5) * 20;
    const y = -0.3; // half height, sitting on ground
    */
    let x = 1;
    const y = -0.3;
    let z = i * 2;

    if (i > count / 2) {
      x = -1;
      z = (count - i) * 2 + 0.5;
    }


    // --- Cannon body ---
    const halfExtents = new CANNON.Vec3(0.5, 0.5, 0.5);
    const boxShape = new CANNON.Box(halfExtents);
    const boxBody = new CANNON.Body({ mass: 0 }); // static
    boxBody.addShape(boxShape);
    boxBody.position.set(x, y, z);
    world.addBody(boxBody);

    // --- THREE mesh ---
    const boxMesh = new THREE.Mesh(boxGeo, boxMat);
    boxMesh.position.set(x, y, z);
    boxMesh.castShadow = true;
    boxMesh.receiveShadow = true;
    scene.add(boxMesh);

    blocks.push({ body: boxBody, mesh: boxMesh });
  }

  return blocks;
}

const blocks = addRandomBlocks(scene, world);
const maxEngineForce = 300;
const maxBrakingForce = 15;
const maxSteerVal = 0.3;

// Animation loop
const timeStep = 1 / 30;
let lastTime = performance.now() / 1000;

function animate() {
  requestAnimationFrame(animate);

  const now = performance.now() / 1000;
  const dt = Math.min(timeStep, now - lastTime);
  if (dt < timeStep) return;
  lastTime = now;
  world.step(timeStep, dt, 1);

  // apply forces or any physics operation
  // Apply car control forces

  const force = keys.forward ? -maxEngineForce : keys.backward ? maxEngineForce : 0;
  const steer = keys.left ? maxSteerVal : keys.right ? -maxSteerVal : 0;
  const brake = keys.brake ? maxBrakingForce : 0;


  // Apply engine force
  car.vehicle.applyEngineForce(force, 0);
  car.vehicle.applyEngineForce(force, 1);
  car.vehicle.applyEngineForce(force, 2);
  car.vehicle.applyEngineForce(force, 3);
  // Steerring 
  car.vehicle.setSteeringValue(steer, 0);
  car.vehicle.setSteeringValue(steer, 1);
  //car.vehicle.setSteeringValue(-steer, 2);
  //car.vehicle.setSteeringValue(-steer, 3);
  // brake 
  car.vehicle.setBrake(brake, 0);
  car.vehicle.setBrake(brake, 1);
  car.vehicle.setBrake(brake, 2);
  car.vehicle.setBrake(brake, 3);

  // Sync mesh and physics body
  sphereMesh.position.copy(sphereBody.position);
  sphereMesh.quaternion.copy(sphereBody.quaternion);
  car.Update();
  textgeo.update();

  name1.forEach((item) => {
    item.update();
  });

  name2.forEach((item) => {
    item.update();
  });
  updateCinematicFollowCamera(camera, car.ChassisBody, dt);

  renderer.render(scene, camera);
}

animate();

// Resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
