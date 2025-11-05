import '@fortawesome/fontawesome-free/css/all.min.css';
import './style.css'
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as CANNON from 'cannon-es';
import CannonDebugger from 'cannon-es-debugger';


import Car from './Car';
import CharacterBox from './CharacterBox';
import StaticObj from './StaticObj';
import TriggerSphere from './TriggerSphere';

// --- Loading Setup ---
const loadingScreen = document.getElementById('loading-screen');
const loadingText = document.getElementById('loading-text');

// Create a loading manager
const manager = new THREE.LoadingManager();

// Called every time an item is loaded
manager.onProgress = function (url, itemsLoaded, itemsTotal) {
  const progress = Math.round((itemsLoaded / itemsTotal) * 100);
  loadingText.textContent = `Loading... ${progress}%`;
};

// Called when everything is loaded
manager.onLoad = function () {
  loadingText.innerHTML = `
  <h1 id="start-btn">START</h1>
  `;
  const startBtn = document.getElementById('start-btn');
  startBtn.onclick = () => {
    loadingScreen.classList.add('hidden');
    // resume AudioContext (important for mobile!)
    const ctx = THREE.AudioContext.getContext();
    if (ctx.state === 'suspended') ctx.resume();
  };
};

// Called on error
manager.onError = function (url) {
  console.error('Error loading', url);
  loadingText.textContent = 'Error loading assets';
};

// --- THREE.js setup ---
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0xffffff, 0.01);
scene.background = new THREE.Color(0xaaaaaa);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200);
camera.position.set(6, 6, 8);
camera.fov = 45;


const listner = new THREE.AudioListener();
camera.add(listner);

const canvas = document.querySelector(".webgl");
const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(2);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
// document.body.style.margin = '0';
// document.body.appendChild(renderer.domElement);
// const composer = new EffectComposer(renderer , camera);
// Orbit controls

// Lights
const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
hemi.position.set(0, 50, 0);
scene.add(hemi);

const dir = new THREE.DirectionalLight(0xffffff, 2);
dir.position.set(5, 10, 7);
dir.castShadow = true;
dir.shadow.camera.left = -200;
dir.shadow.camera.right = 200;
dir.shadow.camera.top = 200;
dir.shadow.camera.bottom = -200;
dir.shadow.camera.near = 0.5;
dir.shadow.camera.far = 1000;
dir.shadow.mapSize.set(4096, 4096); // higher = sharper shadows
dir.shadow.bias = -0.0001;
dir.shadow.normalBias = 0.02;
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
const groundGeo = new THREE.PlaneGeometry(2000, 2000);
const groundMat = new THREE.MeshStandardMaterial({ color: 0xfaa533, metalness: 0.1, roughness: 0.9 });
const groundMesh = new THREE.Mesh(groundGeo, groundMat);
groundMesh.receiveShadow = true;
groundMesh.rotation.x = -Math.PI / 2;
scene.add(groundMesh);

// Orbit controls 
// const controls = new OrbitControls(camera, renderer.domElement);
// controls.target.set(0, 1, 0);
// controls.update();

// Grid helper
//const grid = new THREE.GridHelper(20, 20, 0x222222, 0x222222);
//grid.material.opacity = 0.25;
//grid.material.transparent = true;
//scene.add(grid);
const axesHelper = new THREE.AxesHelper(5);
scene.add(axesHelper);
const cannonDebugger = new CannonDebugger(scene, world);

const car = new Car({ scene: scene, world: world, listner: listner, manager: manager });
let textgeo = [];
textgeo.push(new CharacterBox({
  scene: scene,
  world: world,
  font: '/Deluna_Regular.json',
  text: 'Use W A S D',
  rotation: new THREE.Vector3(Math.PI / 2, 0, 0),
  scale: new THREE.Vector3(-1, 1, 1),
  Size: 2,
  height: 2,
  depth: 0.9,
  mass: 0,
  manager: manager,
  position: new THREE.Vector3(0, 0, 6),
}));
textgeo.push(new CharacterBox({
  scene: scene,
  world: world,
  font: '/Deluna_Regular.json',
  text: 'Drive Around, see what you can find.',
  rotation: new THREE.Vector3(Math.PI / 2, 0, 0),
  scale: new THREE.Vector3(-1, 1, 1),
  Size: 1.5,
  height: 1.5,
  depth: 0.5,
  mass: 0,
  manager: manager,
  position: new THREE.Vector3(0, 0, 10),
}));

const staticobjs = [];
const paths = [
  '/models/obj/miscellaneous/Copper_Bars',
  '/models/obj/miscellaneous/Fuel_A_Barrels',
  '/models/obj/miscellaneous/Gold_Bars_Stack_Large',
  '/models/obj/miscellaneous/Textiles_B',
  '/models/obj/miscellaneous/Stone_Chunks_Small',
  '/models/obj/miscellaneous/Stone_Chunks_Large',
  '/models/obj/miscellaneous/Wood_Planks_Stack_Medium'
];
const poss = [
  [32, 0, -69],
  [-63, 0, 4],
  [-19, 0, 84],
  [66, 0, -27],
  [6, 0, 57],
  [17, 0, 29],
  [5, 0, 13],
  [-51, 0, 0],
  [-48, 0, -91],
  [-60, 0, -82],
  [-86, 0, 96],
  [13, 0, -56],
  [45, 0, 91],
  [57, 0, -54],
  [18, 0, 58],
  [-20, 0, 68],
  [77, 0, 59],
  [-57, 0, 53],
  [66, 0, 62],
  [-85, 0, -71],
  [-42, 0, -26],
  [88, 0, -29],
  [58, 0, -84],
  [-87, 0, -62],
  [96, 0, -38],
  [57, 0, 24],
  [39, 0, 83],
  [13, 0, 31],
  [39, 0, 97],
  [-56, 0, 11],
  [28, 0, 79],
  [-98, 0, -69],
  [26, 0, 17],
  [44, 0, 60],
  [-87, 0, -66],
  [-76, 0, -28],
  [100, 0, 29],
  [-11, 0, 73],
  [-34, 0, -72],
  [48, 0, -39],
  [5, 0, -21],
  [67, 0, 99],
  [-45, 0, 30],
  [-96, 0, 43],
  [-72, 0, 41],
  [47, 0, -28],
  [13, 0, -39],
  [98, 0, -83],
  [-36, 0, -15],
  [35, 0, 18],
];

for (let i = 0; i < poss.length; i++) {
  const path = paths[Math.floor(Math.random() * paths.length)];
  staticobjs.push(new StaticObj({
    scene: scene,
    world: world,
    position: new THREE.Vector3(poss[i][0], poss[i][1], poss[i][2]),
    scale: new THREE.Vector3(3, 3, 3),
    objpath: path + '.obj',
    mtlpath: path + '.mtl',
    boxSize: new THREE.Vector3(3, 2, 3),
    boxOffset: new THREE.Vector3(0, 1, 0),
    manager: manager,
  }));
}

const apl = ['A', 'E', 'F', 'G'];
let map = [
  [1, 0, 2, 1, 3, 0, 2, 3, 1, 1],
  [1, 0, 2, 1, 3, 0, 2, 3, 1, 1],
  [1, 0, 2, 1, 3, 0, 2, 3, 1, 1],
  [1, 0, 2, -1, -1, -1, -1, -1, -1, -1],
  [1, 0, 2, -1, -1, -1, -1, -1, -1, -1],
  [1, 0, 2, -1, -1, -1, -1, 3, 1, 1],
  [1, 0, 2, -1, -1, -1, -1, 3, 1, 1],
  [1, 0, 2, 1, 3, 0, 2, 3, 1, 1],
  [1, 0, 2, 1, 3, 0, 2, 3, 1, 1],
  [1, 0, 2, 1, 3, 0, 2, 3, 1, 1],
];

const center = {
  x: (map.length - 1) / 2,
  y: (map.length - 1) / 2,
};

for (let i = 0; i < map.length; i++) {
  for (let j = 0; j < map.length; j++) {
    if (map[i][j] == -1) continue;

    const dx = center.x - i;
    const dz = center.y - j;
    const angle = Math.atan2(dx, dz); // face toward center
    const snappedAngle = Math.round(angle / (Math.PI / 2)) * (Math.PI / 2);

    const path = '/models/obj/Buildings/building_' + apl[Math.floor(Math.random() * apl.length)] + '_withoutBase';

    staticobjs.push(new StaticObj({
      scene: scene,
      world: world,
      position: new THREE.Vector3((i * 10) - 50, 0, (j * 15) - 200),
      scale: new THREE.Vector3(3, 3, 3),
      rotation: new THREE.Vector3(0, snappedAngle, 0),
      objpath: path + '.obj',
      mtlpath: path + '.mtl',
      boxSize: new THREE.Vector3(5, 2.5, 5),
      boxOffset: new THREE.Vector3(0, 1, 0),
      manager: manager,
    }));
  }
}

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
      manager: manager,
    }));
    // textgeo.push(chars[i-1]);
  }
  return chars;
}

textgeo = textgeo.concat(create3DText("POOKIE", new THREE.Vector3(0, 10, 30), new THREE.Vector3(-1, 1, 1)));
textgeo = textgeo.concat(create3DText("TATYAAA", new THREE.Vector3(0, 5, 30), new THREE.Vector3(-1, 1, 1)));

const trigger = new TriggerSphere({
  scene,
  camera,
  world,
  position: new THREE.Vector3(0, 2, -150),
  radius: 1,
  triggerRadius: 10,
  color: 0xffaa00,
});

// --- Follow Camera Helper ---
// Persistent vectors for smooth transitions
const camTarget = new THREE.Vector3();
const camPosition = new THREE.Vector3();
const carVelocity = new THREE.Vector3();
// const carForward = new THREE.Vector3();

export function updateCinematicFollowCamera(camera, carBody, deltaTime) {
  // --- Adjustable parameters ---
  const followSmoothness = 5.0;   // how tightly camera follows position
  const lookSmoothness = 2.0;     // how smoothly camera rotates
  const lookDistance = 5.0;       // how far ahead of the car to look
  const offset = new THREE.Vector3(20, 20, -10); // world-space offset (corner view)

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
  debug: false,
};

// Keyboard input
window.addEventListener('keydown', (e) => {
  if (e.code === 'KeyW') keys.forward = true;
  if (e.code === 'KeyS') keys.backward = true;
  if (e.code === 'KeyA') keys.left = true;
  if (e.code === 'KeyD') keys.right = true;
  if (e.code === 'KeyP') keys.debug = true;
  if (e.code === "Space") keys.brake = true;
  if (e.key.toLocaleLowerCase() === 'r') car.resetCar();
});

window.addEventListener('keyup', (e) => {
  if (e.code === 'KeyW') keys.forward = false;
  if (e.code === 'KeyS') keys.backward = false;
  if (e.code === 'KeyA') keys.left = false;
  if (e.code === 'KeyD') keys.right = false;
  if (e.code === 'KeyP') keys.debug = false;
  if (e.code === 'Space') keys.brake = false;
});
window.oncontextmenu = function (event) {
  event.preventDefault();
  event.stopPropagation();
  return false;
};

const userAgent = navigator.userAgent.toLowerCase();
const isMobile = (userAgent.indexOf("android") > -1) || (userAgent.indexOf("iphone") > -1)
console.log(isMobile);
if (!isMobile) {
  document.getElementById('accelerate').disabled = true;
  document.getElementById('accelerate').style.visibility = 'hidden';

  document.getElementById('reverse').disabled = true;
  document.getElementById('reverse').style.visibility = 'hidden';

  document.getElementById('brake').disabled = true;
  document.getElementById('brake').style.visibility = 'hidden';

  document.getElementById('left').disabled = true;
  document.getElementById('left').style.visibility = 'hidden';

  document.getElementById('right').disabled = true;
  document.getElementById('right').style.visibility = 'hidden';

  document.getElementById('reset').disabled = true;
  document.getElementById('reset').style.visibility = 'hidden';

}

document.getElementById('accelerate').addEventListener('touchstart', () => keys.forward = true);
document.getElementById('accelerate').addEventListener('touchend', () => keys.forward = false);

document.getElementById('reverse').addEventListener('touchstart', () => keys.backward = true);
document.getElementById('reverse').addEventListener('touchend', () => keys.backward = false);

document.getElementById('brake').addEventListener('touchstart', () => keys.brake = true);
document.getElementById('brake').addEventListener('touchend', () => keys.brake = false);

document.getElementById('left').addEventListener('touchstart', () => keys.left = true);
document.getElementById('left').addEventListener('touchend', () => keys.left = false);

document.getElementById('right').addEventListener('touchstart', () => keys.right = true);
document.getElementById('right').addEventListener('touchend', () => keys.right = false);

document.getElementById('reset').addEventListener('touchstart', () => car.resetCar());
// document.getElementById('right').addEventListener('touchend', () => keys.right = false);

// static boxes for checking
function addRandomBlocks(scene, world, count = 50) {
  const blocks = [];

  const boxGeo = new THREE.BoxGeometry(1, 1, 1);

  let j = 1;
  // for (let j = 0 ; j < 10 ; j++)
  for (let i = 0; i < count; i++) {
    const boxMat = new THREE.MeshStandardMaterial({ color: (Math.random() - 0.5) * 127, metalness: 0.2, roughness: 0.8 });
    // Random position on ground
    /*const x = (Math.random() - 0.5) * 20;  // spread over ±10 meters
    const z = (Math.random() - 0.5) * 20;
    const y = -0.3; // half height, sitting on ground
    */
    let x = 2 * j;
    const y = -0.3;
    let z = i * 2;

    if (i > count / 2) {
      x = -2 * j;
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

//const blocks = addRandomBlocks(scene, world);
const maxEngineForce = 305;
const maxBrakingForce = 10;
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

  trigger.update(car.ChassisBody);

  if (trigger.consumeClick())
    alert("HELLO");

  // apply forces or any physics operation
  // Apply car control forces

  const force = keys.forward ? -maxEngineForce : keys.backward ? maxEngineForce : 0;
  const steer = keys.left ? maxSteerVal : keys.right ? -maxSteerVal : 0;
  const brake = (keys.brake && (force == 0)) ? maxBrakingForce : 2;
  // if(keys.brake)
  car.playBrakeSound(keys.brake);

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

  // // Sync mesh and physics body
  // sphereMesh.position.copy(sphereBody.position);
  // sphereMesh.quaternion.copy(sphereBody.quaternion);
  car.limitSpeedSmooth(30, 0.9);
  car.Update();
  // textgeo.update();
  textgeo.forEach((item) => {
    item.update();
  });
  // ambient.update(dt);

  updateCinematicFollowCamera(camera, car.ChassisBody, dt);
  if (keys.debug)
    cannonDebugger.update(scene, camera);
  renderer.render(scene, camera);
}

animate();

// Resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
