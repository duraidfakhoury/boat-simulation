import * as THREE from "three";
import Stats from "three/addons/libs/stats.module.js";
import * as dat from "dat.gui";
import "./style.css";
import "./costumDatGUI.css";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { Water } from "three/addons/objects/Water.js";
import { Sky } from "three/addons/objects/Sky.js";
import Physics from "./Physics";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

let elapsedtime;
let oldElapsedTime = 0;
let deltatime = 0;
let time = 0;

let initialHeight = 3.6;
let initialWidth = 8.4;
let initialLength = 22.7;

let container, stats;
let camera, scene, renderer, loader, clock;
let controls, water, sun, physic, gui, params, model;
let rotationSpeed = 0.01; // سرعة الدوران

document.addEventListener("DOMContentLoaded", init);

function init() {
  container = document.getElementById("container");

  physic = new Physics(5.2, 2.09, 0.95, 450);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setAnimationLoop(animate);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.5;
  container.appendChild(renderer.domElement);

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 1, 20000);
  camera.position.set(30, 30, 100);

  sun = new THREE.Vector3();

  // Water
  const waterGeometry = new THREE.PlaneGeometry(10000, 10000);
  water = new Water(waterGeometry, {
    textureWidth: 512,
    textureHeight: 512,
    waterNormals: new THREE.TextureLoader().load("./models/waternormals.jpg", function (texture) {
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    }),
    sunDirection: new THREE.Vector3(),
    sunColor: 0xffffff,
    waterColor: 0x000054,
    distortionScale: 3.7,
    fog: scene.fog !== undefined,
  });

  water.rotation.x = -Math.PI / 2;
  scene.add(water);

  // Skybox
  const sky = new Sky();
  sky.scale.setScalar(10000);
  scene.add(sky);

  const skyUniforms = sky.material.uniforms;
  skyUniforms["turbidity"].value = 10;
  skyUniforms["rayleigh"].value = 2;
  skyUniforms["mieCoefficient"].value = 0.005;
  skyUniforms["mieDirectionalG"].value = 0.8;

  const parameters = { elevation: 2, azimuth: 180 };
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  let renderTarget;

  function updateSun() {
    const phi = THREE.MathUtils.degToRad(90 - parameters.elevation);
    const theta = THREE.MathUtils.degToRad(parameters.azimuth);

    sun.setFromSphericalCoords(1, phi, theta);

    sky.material.uniforms["sunPosition"].value.copy(sun);
    water.material.uniforms["sunDirection"].value.copy(sun).normalize();

    if (renderTarget !== undefined) renderTarget.dispose();

    renderTarget = pmremGenerator.fromScene(scene, 0.1);
    scene.environment = renderTarget.texture;
  }

  updateSun();

  // Clock
  clock = new THREE.Clock();

  controls = new OrbitControls(camera, renderer.domElement);
  controls.maxPolarAngle = Math.PI * 0.495;
  controls.target.set(0, 10, 0);
  controls.minDistance = 40.0;
  controls.maxDistance = 200.0;
  controls.update();

  loader = new GLTFLoader().setPath("models/speedboat/");
  loader.load("scene.gltf", async (gltf) => {
    model = gltf.scene;

    await renderer.compileAsync(model, camera, scene);

    model.scale.set(0.1, 0.1, 0.1);
    model.rotation.set(0, -Math.PI/2, 0); // تدوير الموديل ليواجه الأمام
    model.position.set(0, 2, 0);

    scene.add(model);

    render();
  });

  stats = new Stats();
  container.appendChild(stats.dom);

  // dat.GUI settings
  gui = new dat.GUI();
  params = {
    rpm: 500,
    boatLength: 5.2,
    boatWidth: 2.09,
    boatHeight: 0.95,
    boatMass: 450,
  };

  let rpm = 0;
  const rpmOptions = [0, 500, 2000, 5000, 7000];
  gui.add(params, 'rpm', rpmOptions).name('RPM').onChange(value => {
    rpm = value;
  });
  gui.add(params, "boatLength").name("Length (m)").onChange(updateBoatParams);
  gui.add(params, "boatWidth").name("Width (m)").onChange(updateBoatParams);
  gui.add(params, "boatHeight").name("Height (m)").onChange(updateBoatParams);
  gui.add(params, "boatMass").name("Weight (kg)").onChange(updateBoatParams);

  window.addEventListener("resize", onWindowResize);

  // Keyboard controls
  window.addEventListener("keydown", onKeyDown);
}
function onKeyDown(event) {
  switch (event.code) {
    case "ArrowLeft":
      physic.updateRotationAngle(physic.rotationAngle + rotationSpeed);
      break;
    case "ArrowRight":
      physic.updateRotationAngle(physic.rotationAngle - rotationSpeed);
      break;
  }
}

function updateBoatParams() {
  if (model) {
    model.scale.set(
      params.boatLength / initialLength,
      params.boatHeight / initialHeight,
      params.boatWidth / initialWidth
    );

    physic.updateParams(params.boatLength, params.boatWidth, params.boatHeight, params.boatMass);
  }
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
  render();
}

function animate() {
  render();

  elapsedtime = clock.getElapsedTime();
  deltatime = elapsedtime - oldElapsedTime;
  oldElapsedTime = elapsedtime;

  if (model) {
    physic.calculateThrustForce(params.rpm);
    physic.updateVelocity();

    // حساب الاتجاه الذي يتحرك فيه القارب
    const direction = new THREE.Vector3(0, 0, -1).applyMatrix4(new THREE.Matrix4().makeRotationY(physic.rotationAngle));
    model.rotation.y = (-Math.PI/2+physic.rotationAngle);

    model.position.x += direction.x * physic.velocity * deltatime;
    model.position.z += direction.z * physic.velocity * deltatime;

    const submergedHeight = physic.getSubmergedHeight();
    const heightRatio = params.boatHeight / initialHeight;
    model.position.y = -submergedHeight / heightRatio;

    if (physic.isSinking()) {
      time += deltatime;
      model.position.y -= time;
    }
  }

  stats.update();
}

function render() {
  water.material.uniforms["time"].value += 1.0 / 60.0;
  renderer.render(scene, camera);
}
