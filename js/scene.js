import * as THREE from "../vendor/three.module.js";
import { OrbitControls } from "../vendor/OrbitControls.js";

export async function createScene(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x0c1016, 0.085);
  scene.background = new THREE.Color(0x0c1016);

  const camera = new THREE.PerspectiveCamera(38, 1, 0.05, 80);
  camera.position.set(2.4, 1.55, 2.8);

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.target.set(0, 0.55, 0);
  controls.maxPolarAngle = Math.PI * 0.49;
  controls.minDistance = 1.2;
  controls.maxDistance = 9;

  scene.add(new THREE.HemisphereLight(0xf0e2c8, 0x1b2430, 0.7));
  const key = new THREE.DirectionalLight(0xfff1d2, 2.2);
  key.position.set(3.2, 5.4, 2.2);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x88b7ff, 0.85);
  rim.position.set(-3.5, 2.2, -2.4);
  scene.add(rim);
  const fill = new THREE.PointLight(0xd4a574, 6, 8);
  fill.position.set(-1.2, 0.8, 1.4);
  scene.add(fill);

  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(4.2, 64),
    new THREE.MeshStandardMaterial({ color: 0x141920, roughness: 0.92, metalness: 0.08 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  const grid = new THREE.GridHelper(6, 24, 0x3a342c, 0x222830);
  grid.position.y = 0.002;
  scene.add(grid);

  const root = new THREE.Group();
  scene.add(root);
  const pivot = new THREE.Group();
  root.add(pivot);

  const steel = new THREE.MeshStandardMaterial({ color: 0xb7b1a6, roughness: 0.38, metalness: 0.72 });
  const copper = new THREE.MeshStandardMaterial({ color: 0xb87333, roughness: 0.32, metalness: 0.8 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x2a3038, roughness: 0.55, metalness: 0.4 });
  const rubber = new THREE.MeshStandardMaterial({ color: 0x1c1f24, roughness: 0.8, metalness: 0.1 });

  const flange = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.3, 0.06, 32), steel);
  flange.castShadow = true;
  flange.receiveShadow = true;
  root.add(flange);

  const boss = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.08, 24), dark);
  boss.position.y = 0.07;
  root.add(boss);

  const motor = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.22, 28), copper);
  motor.rotation.z = Math.PI / 2;
  motor.position.set(-0.22, 0.12, 0);
  motor.castShadow = true;
  root.add(motor);

  const link = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1, 0.06), steel);
  link.castShadow = true;
  pivot.add(link);

  const pad = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.05, 0.1), dark);
  pad.castShadow = true;
  pivot.add(pad);

  const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.7, 10), rubber);
  strut.castShadow = true;
  root.add(strut);

  const figure = new THREE.Group();
  const cloth = new THREE.MeshStandardMaterial({ color: 0x243042, roughness: 0.8, metalness: 0.05 });
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.11, 0.62, 4, 8), cloth);
  body.position.y = 0.85;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 12), cloth);
  head.position.y = 1.48;
  figure.add(body, head);
  figure.position.set(1.35, 0, -0.4);
  scene.add(figure);

  const ruler = new THREE.Mesh(
    new THREE.BoxGeometry(0.012, 1, 0.012),
    new THREE.MeshStandardMaterial({ color: 0xf0b429, roughness: 0.4, metalness: 0.2 })
  );
  ruler.position.set(-1.55, 0.5, 0);
  scene.add(ruler);
  const chainMat = new THREE.MeshStandardMaterial({ color: 0x8d9298, roughness: 0.45, metalness: 0.65 });
  const chain = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.012, 8, 28), chainMat);
  chain.rotation.y = Math.PI / 2;
  chain.position.set(-0.08, 0.12, 0);
  root.add(chain);

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(rect.width, 320);
    const h = Math.max(rect.height, 240);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  function update(state, theta) {
    const L = Math.max(state.L, 0.08);
    const section = 0.045 + Math.cbrt(Math.max(state.m, 0.2)) * 0.012;
    link.scale.set(section / 0.08, L, section / 0.06);
    link.position.y = 0.12 + L / 2;
    pad.position.y = 0.12 + L + 0.03;
    pad.scale.set(1.1, 1, 1);
    pivot.rotation.z = theta;
    const regime = state.m < 1.2 ? 0xc47a6a : state.m > 150 ? 0x7f96b8 : 0xc4b48a;
    steel.color.setHex(regime);
    strut.visible = state.counterbalance > 0.15;
    strut.position.set(0.18, 0.28 + L * 0.25, 0);
    strut.rotation.z = 0.7 - theta * 0.35;
    strut.scale.y = 0.55 + L * 0.35;
    chain.rotation.x = theta * 2.4;
  }

  function frameImported(geometry) {
    const mat = new THREE.MeshStandardMaterial({
      color: 0xd7c4a3,
      roughness: 0.45,
      metalness: 0.35,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(geometry, mat);
    geometry.computeBoundingBox();
    const box = geometry.boundingBox;
    const size = new THREE.Vector3();
    box.getSize(size);
    const center = new THREE.Vector3();
    box.getCenter(center);
    mesh.position.sub(center);
    const scale = 1.4 / Math.max(size.x, size.y, size.z, 0.001);
    mesh.scale.setScalar(scale);
    mesh.position.y += (size.y * scale) / 2;
    mesh.castShadow = true;
    return mesh;
  }

  let running = true;
  function loop() {
    if (!running) return;
    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(loop);
  }
  resize();
  loop();
  window.addEventListener("resize", resize);

  return {
    update,
    resize,
    showImport(geometry) {
      root.visible = false;
      const old = scene.getObjectByName("import");
      if (old) scene.remove(old);
      const mesh = frameImported(geometry);
      mesh.name = "import";
      scene.add(mesh);
    },
    clearImport() {
      const old = scene.getObjectByName("import");
      if (old) scene.remove(old);
      root.visible = true;
    },
    dispose() {
      running = false;
      renderer.dispose();
    },
  };
}
