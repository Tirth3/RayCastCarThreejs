import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';

export default class StaticObj {
  constructor({
    scene,
    world,
    position = new THREE.Vector3(),
    scale = new THREE.Vector3(1, 1, 1),
    rotation = new THREE.Vector3(0, 0, 0),
    objpath,
    mtlpath,
    boxSize = new THREE.Vector3(1, 1, 1), // Custom size for physics box
    color = 0xffffff,
  }) {
    this.scene = scene;
    this.world = world;
    this.mesh = null;
    this.body = null;
    this.isReady = false;

    const mtlLoader = new MTLLoader();

    mtlLoader.load(
      mtlpath,
      (materials) => {
        materials.preload();

        const objLoader = new OBJLoader();
        objLoader.setMaterials(materials);

        objLoader.load(
          objpath,
          (object) => {
            // ✅ Apply transforms
            object.scale.copy(scale);
            object.rotation.set(rotation.x, rotation.y, rotation.z);
            object.position.copy(position);

            // ✅ Shadows
            object.traverse((child) => {
              if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                if (child.material) {
                  child.material = new THREE.MeshStandardMaterial({ color });
                }
              }
            });

            // ✅ Add to scene
            this.scene.add(object);
            this.mesh = object;

            // ✅ Create simple box physics body using provided size
            const halfExtents = new CANNON.Vec3(
              boxSize.x / 2,
              boxSize.y / 2,
              boxSize.z / 2
            );
            const shape = new CANNON.Box(halfExtents);
            const body = new CANNON.Body({
              mass: 0, // static object
              shape,
            });

            body.position.set(position.x, position.y, position.z);
            this.world.addBody(body);
            this.body = body;

            this.isReady = true;
          },
          (xhr) => console.log(`${(xhr.loaded / xhr.total) * 100}% loaded`),
          (error) => console.error('Error loading OBJ:', error)
        );
      },
      undefined,
      (error) => console.error('Error loading MTL:', error)
    );
  }

  update() {
    if (!this.isReady || !this.mesh || !this.body) return;
    this.mesh.position.copy(this.body.position);
    this.mesh.quaternion.copy(this.body.quaternion);
  }
}
