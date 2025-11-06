import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export default class FramedImage {
  constructor({
    imageUrl,
    position = new THREE.Vector3(0, 0, 0),
    rotation = new THREE.Euler(0, 0, 0),
    scale = new THREE.Vector3(1, 1, 1),
    photoWidth = 2,
    photoHeight = 1.5,
    frameThickness = 0.1,
    frameDepth = 0.2,
    mass = 1,
    world,
    scene,
  }) {
    this.world = world;
    this.photoWidth = photoWidth * scale.x;
    this.photoHeight = photoHeight * scale.y;
    this.frameThickness = frameThickness * scale.x;
    this.frameDepth = frameDepth * scale.z;

    this.group = new THREE.Group();

    // Create the photo mesh
    const textureLoader = new THREE.TextureLoader();
    const photoTexture = textureLoader.load(imageUrl);
    const photoGeometry = new THREE.PlaneGeometry(this.photoWidth, this.photoHeight);
    const photoMaterial = new THREE.MeshStandardMaterial({ map: photoTexture });
    const photoMesh = new THREE.Mesh(photoGeometry, photoMaterial);

    // Frame material
    const frameMaterial = new THREE.MeshStandardMaterial({ color: 0x3e2723 });

    // Helper for frame segments
    const makeFramePart = (w, h, x, y) => {
      const geom = new THREE.BoxGeometry(w, h, this.frameDepth);
      const mesh = new THREE.Mesh(geom, frameMaterial);
      mesh.position.set(x, y, 0);
      return mesh;
    };

    const halfW = this.photoWidth / 2;
    const halfH = this.photoHeight / 2;

    const topFrame = makeFramePart(this.photoWidth + this.frameThickness * 2, this.frameThickness, 0, halfH + this.frameThickness / 2);
    const bottomFrame = makeFramePart(this.photoWidth + this.frameThickness * 2, this.frameThickness, 0, -halfH - this.frameThickness / 2);
    const leftFrame = makeFramePart(this.frameThickness, this.photoHeight, -halfW - this.frameThickness / 2, 0);
    const rightFrame = makeFramePart(this.frameThickness, this.photoHeight, halfW + this.frameThickness / 2, 0);

    // Combine all into one group
    this.group.add(photoMesh, topFrame, bottomFrame, leftFrame, rightFrame);

    // Apply transforms
    this.group.position.copy(position);
    this.group.rotation.copy(rotation);
    this.group.scale.copy(scale);
    scene.add(this.group);

    // Create Cannon.js physics body
    const shape = new CANNON.Box(
      new CANNON.Vec3(
        4.5,
        3.5,
        1
      )
    );

    this.body = new CANNON.Body({
      mass,
      shape,
      position: new CANNON.Vec3(position.x, position.y, position.z),
    });

    this.body.quaternion.setFromEuler(rotation.x, rotation.y, rotation.z);

    // Add to physics world
    if (this.world) {
      this.world.addBody(this.body);
    }
  }

  // Update Three.js group with Cannon.js physics
  update() {
    this.group.position.copy(this.body.position);
    this.group.quaternion.copy(this.body.quaternion);
  }
}
