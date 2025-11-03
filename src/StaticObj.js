import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';

export default class StaticObj {
  constructor({
    scene,
    world,
    position = new THREE.Vector3(),
    scale = new THREE.Vector3(1, 1, 1),
    rotation = new THREE.Vector3(),
    objpath,
  }) {
    this.scene = scene;
    this.world = world;
    this.mesh = null;
    this.body = null;
    this.isReady = false;

    const loader = new OBJLoader();

    loader.load(
      objpath,
      (object) => {
        object.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            child.material = new THREE.MeshStandardMaterial({ color: 0x888888 });
          }
        });

        object.scale.copy(scale);
        object.position.copy(position);
        object.rotation.set(rotation.x, rotation.y, rotation.z);
        object.updateWorldMatrix(true, true);

        // Create an empty compound body
        const body = new CANNON.Body({ mass: 0 });

        // For each mesh inside the object, compute its local bounding box and add as a shape
        object.traverse((child) => {
          if (!child.isMesh) return;

          child.geometry.computeBoundingBox();
          const bbox = child.geometry.boundingBox;
          const size = new THREE.Vector3();
          const center = new THREE.Vector3();
          bbox.getSize(size);
          bbox.getCenter(center);

          // Convert to world space
          child.updateWorldMatrix(true, true);
          const worldPos = new THREE.Vector3();
          child.getWorldPosition(worldPos);

          // Compute local offset from the object's origin
          const localOffset = new THREE.Vector3().subVectors(worldPos, object.position);

          // Create the box shape
          const halfExtents = new CANNON.Vec3(size.x / 2, size.y / 2, size.z / 2);
          const shape = new CANNON.Box(halfExtents);

          // Add to compound body with offset and rotation
          const q = new CANNON.Quaternion(
            child.quaternion.x,
            child.quaternion.y,
            child.quaternion.z,
            child.quaternion.w
          );
          body.addShape(shape, localOffset, q);
        });

        // Set the body position to the object's position
        body.position.set(position.x, position.y, position.z);
        this.world.addBody(body);

        // Add to scene
        this.scene.add(object);

        // Store references
        this.mesh = object;
        this.body = body;
        this.isReady = true;
      },
      (xhr) => {
        console.log(`${(xhr.loaded / xhr.total) * 100}% loaded`);
      },
      (error) => {
        console.error('Error loading OBJ:', error);
      }
    );
  }

  update() {
    if (!this.isReady || !this.mesh || !this.body) return;
    this.mesh.position.copy(this.body.position);
    this.mesh.quaternion.copy(this.body.quaternion);
  }
}
