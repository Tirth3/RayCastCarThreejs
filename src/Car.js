import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { OBJLoader } from 'three/examples/jsm/Addons.js';

export default class Car {
  constructor({ scene, world, listner , manager, mass = 150 }) {
    if (!scene) throw new Error('Car: scene is required');
    if (!world) throw new Error('Car: world is required');

    this.scene = scene;
    this.world = world;
    this.mass = mass;
    this.isready = false;
    // --- chassis (CANNON) ---
    // Use half-extents for CANNON.Box (1,1,2) -> visual size will be doubled
    const halfExtents = new CANNON.Vec3(1.2, 1, 2.5);
    const chassisShape = new CANNON.Box(halfExtents);

    const chassisBody = new CANNON.Body({ mass: this.mass });
    const comoffset = new CANNON.Vec3(0, 0.5, 0);
    chassisBody.addShape(chassisShape, comoffset);
    chassisBody.position.set(0, 2, 0);
    chassisBody.angularDamping = 0.6; // reduce spinning
    this.ChassisBody = chassisBody;

    // --- chassis (THREE) ---
    // Full extents for THREE.BoxGeometry -> 2 * halfExtents
    // const chassisGeo = new THREE.BoxGeometry(halfExtents.x * 2, halfExtents.y * 2, halfExtents.z * 2);
    // const chassisMat = new THREE.MeshStandardMaterial({ color: 0xaa1111 });
    // const chassisMesh = new THREE.Mesh(chassisGeo, chassisMat);
    // chassisMesh.castShadow = true;
    // chassisMesh.position.copy(chassisBody.position);
    // this.scene.add(chassisMesh);
    // this.ChassisMesh = chassisMesh;

    this.listner = listner;
    //--- Truck audio ----
    this.sound = new THREE.PositionalAudio(this.listner);
    this.sound.autoplay = true;
    const audioloader = new THREE.AudioLoader(manager);
    audioloader.load('/audio/engineidle.mp3', (buffer) => {
      this.sound.setBuffer(buffer);
      this.sound.setRefDistance(10);
      this.sound.setLoop(true);
      this.sound.setVolume(1);
      this.sound.play();
    },
      (xhr) => {
        console.log((xhr.loaded / xhr.total) * 100 + '% mp3 loaded');
      },
      (error) => {
        console.error('Error loading mp3:', error);
      }
    );

    // --- BRAKE SOUND ---
    this.brakeSound = new THREE.PositionalAudio(this.listner);
    const brakeAudioLoader = new THREE.AudioLoader(manager);
    brakeAudioLoader.load('/audio/brake2.wav', (buffer) => {
      this.brakeSound.setBuffer(buffer);
      this.brakeSound.setRefDistance(10);
      this.brakeSound.setLoop(true); // plays once per brake press
      this.brakeSound.setVolume(0.8);
      this.brakeSound.pitch = 1000;
    });

    const loader = new OBJLoader(manager);
    loader.load('/models/truck.obj',
      (object) => {
        object.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            child.material = new THREE.MeshStandardMaterial({ color: 0xaa1111 });
          }
        });
        // Optionally scale the model
        object.scale.set(1.3, 0.75, 1.2);

        // Center the model
        object.position.set(0, 2, 0);
        object.add(this.sound);
        object.add(this.brakeSound);

        // Add to scene
        this.scene.add(object);

        // Save reference for updates
        this.ChassisMesh = object;
        this.isready = true;
      },
      (xhr) => {
        console.log((xhr.loaded / xhr.total) * 100 + '% loaded');
      },
      (error) => {
        console.error('Error loading OBJ:', error);
      }
    );
    // this.ChassisMesh.add(this.sound);

    // --- RaycastVehicle ---
    this.vehicle = new CANNON.RaycastVehicle({
      chassisBody: this.ChassisBody,
      indexForwardAxis: 2, // z
      indexRightAxis: 0,   // x
      indexUpAxis: 1       // y
    });


    // Wheel parameter
    // Positions are in chassis local coordinates
    const wheelOptions = {
      radius: 0.6, // Wheel radius
      directionLocal: new CANNON.Vec3(0, -1, 0), // Wheel's local direction vector
      suspensionStiffness: 35, // Affects the elasticity response of the wheel to the ground.
      suspensionRestLength: 0.3, // Initial length of the wheel suspension
      frictionSlip: 10, // Friction force of the wheel
      dampingRelaxation: 3.3, // Wheel's damping settings
      dampingCompression: 6.4, // Also affects elasticity
      maxSuspensionForce: 1500, // Maximum suspension force the wheel can handle
      rollInfluence: 0.08, // Influence of the wheel's rolling during steering
      axleLocal: new CANNON.Vec3(-1, 0, 0), // Set the axis of rotation for the wheel
      chassisConnectionPointLocal: new CANNON.Vec3(1, 0, -1),
      maxSuspensionTravel: 10,
      customSlidingRotationalSpeed: -30, // Speed of wheel sliding
      useCustomSlidingRotationalSpeed: true // Whether to use custom sliding rotational speed

    };

    // Add four wheels (front-left, front-right, back-left, back-right)
    const halfWidth = halfExtents.x * 1.1; // x offset
    const halfLength = halfExtents.z * 0.5; // z offset

    // front-left
    wheelOptions.chassisConnectionPointLocal = new CANNON.Vec3(halfWidth, -1, halfLength);
    this.vehicle.addWheel(Object.assign({}, wheelOptions));

    // front-right
    wheelOptions.chassisConnectionPointLocal = new CANNON.Vec3(-halfWidth, -1, halfLength);
    this.vehicle.addWheel(Object.assign({}, wheelOptions));

    // back-left
    wheelOptions.chassisConnectionPointLocal = new CANNON.Vec3(halfWidth, -1, -halfLength);
    this.vehicle.addWheel(Object.assign({}, wheelOptions));

    // back-right
    wheelOptions.chassisConnectionPointLocal = new CANNON.Vec3(-halfWidth, -1, -halfLength);
    this.vehicle.addWheel(Object.assign({}, wheelOptions));

    // Add to world AFTER adding wheels
    this.vehicle.addToWorld(this.world);

    // Create simple visual wheels in THREE and keep references
    this.wheelMeshes = [];
    for (let i = 0; i < this.vehicle.wheelInfos.length; i++) {
      const info = this.vehicle.wheelInfos[i];
      const wheelGeo = new THREE.CylinderGeometry(info.radius, info.radius, 0.25, 16);
      wheelGeo.rotateZ(Math.PI / 2); // align cylinder axis with axle
      const wheelMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
      const wheelMesh = new THREE.Mesh(wheelGeo, wheelMat);
      wheelMesh.castShadow = true;
      this.scene.add(wheelMesh);
      this.wheelMeshes.push(wheelMesh);
    }

    // Optionally add chassis body to world as well (RaycastVehicle already added it,
    // but adding here doesn't hurt if not present). Check it's present first:
    if (!this.world.bodies.includes(this.ChassisBody)) {
      this.world.addBody(this.ChassisBody);
    }


    // Engine settings
    this.MaxEngineForce = 1000;
  }


  // Call every frame: sync three meshes with cannon bodies
  Update() {
    if (!this.isready) return;
    if(!this.ChassisBody.position) return;
    // sync chassis
    this.ChassisMesh.position.copy(this.ChassisBody.position);
    this.ChassisMesh.quaternion.copy(this.ChassisBody.quaternion);

    // sync wheels
    // For each wheel: update transform then copy worldTransform position/quaternion
    for (let i = 0; i < this.vehicle.wheelInfos.length; i++) {
      this.vehicle.updateWheelTransform(i);
      const t = this.vehicle.wheelInfos[i].worldTransform; // has position & quaternion
      const mesh = this.wheelMeshes[i];
      if (t && mesh) {
        mesh.position.copy(t.position);
        mesh.quaternion.copy(t.quaternion);
      }
    }
    // console.log(this.sound.isPlaying);
    // --- Adjust pitch based on speed ---
    if (this.sound && this.sound.isPlaying) {
      const speed = this.ChassisBody.velocity.length();
      const pitch = THREE.MathUtils.clamp(1 + speed * 0.08, 1, 2.0);
      this.sound.setPlaybackRate(pitch);
    }
  }
  limitSpeedSmooth(maxSpeed = 50, damping = 0.9) {
    const vel = this.ChassisBody.velocity;
    const speed = vel.length();

    if (speed > maxSpeed) {
      vel.scale(damping, vel); // gradually slow it down
    }
  }
  resetCar() {
    // Assume `vehicle` is your CANNON.RaycastVehicle object
    const chassisBody = this.vehicle.chassisBody;
    console.log("reset");
    // Reset the angular velocity first
    chassisBody.angularVelocity.set(0, 0, 0);

    // Create a new quaternion
    const newQuaternion = new CANNON.Quaternion();

    // Define the rotation axis (the "up" vector, typically Y)
    const upAxis = new CANNON.Vec3(0, 1, 0);

    // Define the angle in radians (e.g., Math.PI for a 180-degree turn)
    const rotationAngle = Math.PI / 2; // 90 degrees

    // Set the quaternion from the axis and angle
    newQuaternion.setFromAxisAngle(upAxis, rotationAngle);

    // Apply the new quaternion to the chassis body
    chassisBody.quaternion.copy(newQuaternion);
    chassisBody.position.set(chassisBody.position.x, 3,chassisBody.position.z);
  }

  playBrakeSound(isbraking) {
    if (!this.brakeSound || !this.isready) return;

    // Avoid overlapping playback
    if (!this.brakeSound.isPlaying) {
      if (isbraking)
        this.brakeSound.play();
      // this.brakeSound.play();
    }
    if(!isbraking)
      this.brakeSound.stop();

  }


}

