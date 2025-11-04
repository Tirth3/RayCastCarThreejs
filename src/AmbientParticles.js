import * as THREE from 'three';

export default class AmbientParticles {
  constructor(scene, {
    count = 300,
    area = 100,
    color = 0xffffff,
    size = 0.15,
    speed = 0.001,
  } = {}) {
    this.scene = scene;
    this.count = count;
    this.area = area;
    this.speed = speed;

    // Create random positions for particles
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i++) {
      positions[i] = (Math.random() - 0.5) * area;
    }

    // Geometry & material
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: color,
      size: size,
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
    });

    // Points mesh
    this.particles = new THREE.Points(geometry, material);
    scene.add(this.particles);
  }

  update(deltaTime) {
    // Slight floating / drifting animation
    const positions = this.particles.geometry.attributes.position.array;
    for (let i = 0; i < this.count * 3; i += 3) {
      positions[i + 1] += Math.sin((i + performance.now() * this.speed) * 0.001) * 0.002;
    }
    this.particles.geometry.attributes.position.needsUpdate = true;
  }
}
