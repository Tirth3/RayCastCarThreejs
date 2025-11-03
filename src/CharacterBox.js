import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';

export default class CharacterBox {
  constructor({
    scene,
    world,
    position = new THREE.Vector3(),
    scale = new THREE.Vector3(1, 1, 1),
    rotation = new THREE.Vector3(0, 0, 0),
    Size = 1,
    height = 1,
    depth = 1,
    color = 0xffffff,
    text = 'Hello',
    font,
    mass = 1,
  }) {
    this.scene = scene;
    this.world = world;
    this.position = position.clone();
    this.color = color;
    this.fonturl = font;
    this.text = text;
    this.mass = mass;
    this.mesh = null;
    this.body = null;
    this.isReady = false;

    const loader = new FontLoader();
    loader.load(this.fonturl, (font) => {
      // Create text geometry
      const geo = new TextGeometry(this.text, {
        font: font,
        size: Size,
        height: height,
        depth: depth,
        curveSegments: 8,
        bevelEnabled: true,
        bevelThickness: 0.02,
        bevelSize: 0.01,
        bevelSegments: 2,
      });

      // Compute bounding box and center
      geo.computeBoundingBox();
      geo.center();
      geo.computeBoundingBox(); // ensure bbox is defined after centering


      // Create mesh
      const mesh = new THREE.Mesh(
        geo,
        new THREE.MeshStandardMaterial({
          color: this.color,
        })
      );
      mesh.rotation.set(rotation.x, rotation.y, rotation.z);
      mesh.scale.copy(scale);
      mesh.position.copy(this.position);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.scene.add(mesh);
      this.mesh = mesh;


      // Create physics body using bounding box size
      const bbox = geo.boundingBox;
      if (!bbox) {
        console.warn('Bounding box not computed for text geometry');
        return;
      }

      const size = new THREE.Vector3();
      bbox.getSize(size);

      const halfExtents = new CANNON.Vec3(size.x / 2, size.y / 2, size.z / 2);
      const shape = new CANNON.Box(halfExtents);
      const body = new CANNON.Body({ mass: this.mass });
      body.addShape(shape);
      body.position.set(this.position.x, this.position.y, this.position.z);

      const quat = new CANNON.Quaternion();
      quat.setFromEuler(rotation.x, rotation.y, rotation.z);
      body.quaternion.copy(quat);

      body.collisionFilterGroup = 1;
      body.collisionFilterMask = 1;
      this.world.addBody(body);
      this.body = body;

      this.isReady = true;
    });
  }

  update() {
    if (!this.isReady || !this.mesh || !this.body) return;
    this.mesh.position.copy(this.body.position);
    this.mesh.quaternion.copy(this.body.quaternion);
  }
}

