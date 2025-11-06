import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export default class TriggerSphere {
  constructor({
    scene,
    camera,
    world,
    position = new THREE.Vector3(),
    radius = 2,
    color = 0xffff00,
    triggerRadius = 5,
  }) {
    this.scene = scene;
    this.camera = camera;
    this.world = world;
    this.position = position.clone();
    this.radius = radius;
    this.color = color;
    this.triggerRadius = triggerRadius;

    this.isGlowing = false;
    this.isClickable = false;
    this.onClick = false;

    // --- Mesh ---
    const geometry = new THREE.SphereGeometry(radius, 32, 32);
    const material = new THREE.MeshStandardMaterial({
      color: this.color,
      emissive: 0x000000,
      emissiveIntensity: 0.6,
    });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.copy(this.position);
    this.scene.add(this.mesh);

    // --- Physics Body (static) ---
    const shape = new CANNON.Sphere(radius);
    this.body = new CANNON.Body({
      mass: 0,
      type: CANNON.Body.STATIC,
      shape,
    });
    this.body.position.copy(this.position);
    this.world.addBody(this.body);

    // --- Raycaster for click/touch detection ---
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    // Handle both mouse and touch input
    const handleInput = (x, y) => {
      if (!this.isClickable) return;
      this.mouse.x = (x / window.innerWidth) * 2 - 1;
      this.mouse.y = -(y / window.innerHeight) * 2 + 1;
      this.raycaster.setFromCamera(this.mouse, this.camera);
      const intersects = this.raycaster.intersectObject(this.mesh);
      if (intersects.length > 0) {
        this.onClick = true;
        //console.log('✅ TriggerSphere clicked/touched!');
      }
    };

    // Mouse click
    window.addEventListener('click', (event) => {
      handleInput(event.clientX, event.clientY);
    });

    // Touch support
    window.addEventListener('touchstart', (event) => {
      const touch = event.touches[0];
      handleInput(touch.clientX, touch.clientY);
    });
  }

  update(targetBody) {
    if (!targetBody) return;

    const distance = this.body.position.distanceTo(targetBody.position);

    if (distance <= this.triggerRadius) {
      if (!this.isGlowing) {
        this.mesh.material.emissive.setHex(0xffff00);
        this.mesh.material.emissiveIntensity = 0.2;
        this.isGlowing = true;
      }
      this.isClickable = true;
    } else {
      if (this.isGlowing) {
        this.mesh.material.emissive.setHex(0x000000);
        this.isGlowing = false;
      }
      this.isClickable = false;
    }
  }

  consumeClick() {
    const wasClicked = this.onClick;
    this.onClick = false;
    return wasClicked;
  }
}
