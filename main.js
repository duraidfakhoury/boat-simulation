import "./style.css";
import "./costumDatGUI.css";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import * as dat from "dat.gui";
import Physics from "./Physics";

// Create Physics object
let physic = new Physics(5.23, 2.09, 0.95, 450);

// Get canvas from DOM
const canvas = document.querySelector("canvas.webgl");

// Load textures
const textureLoader = new THREE.TextureLoader();
const grasscolorTexture = textureLoader.load("./textures/water/water.jpg");
const grassambientocculsionTexture = textureLoader.load("./textures/water/water.jpg");
const grassroughnessTexture = textureLoader.load("./textures/water/water.jpg");
const grassnormalTexture = textureLoader.load("./textures/water/water.jpg");
const DisplacementTexture = textureLoader.load("./textures/grass/Displacement.jpg");

// Create scene
const scene = new THREE.Scene();

// Create ground
const geometry = new THREE.CircleGeometry(20000, 20000);
const material = new THREE.MeshStandardMaterial({
  map: grasscolorTexture,
  aoMap: grassambientocculsionTexture,
  roughnessMap: grassroughnessTexture,
  normalMap: grassnormalTexture,
  displacementMap: DisplacementTexture,
});
const Meshfloor = new THREE.Mesh(geometry, material);
Meshfloor.rotation.x = -Math.PI * 0.5;
Meshfloor.position.y = 0;
scene.add(Meshfloor);

grasscolorTexture.repeat.set(18000, 18000);
grassambientocculsionTexture.repeat.set(18000, 18000);
grassnormalTexture.repeat.set(18000, 18000);
grassroughnessTexture.repeat.set(18000, 18000);
DisplacementTexture.repeat.set(18000, 18000);

grasscolorTexture.wrapS = THREE.RepeatWrapping;
grassambientocculsionTexture.wrapS = THREE.RepeatWrapping;
grassnormalTexture.wrapS = THREE.RepeatWrapping;
grassroughnessTexture.wrapS = THREE.RepeatWrapping;
DisplacementTexture.wrapS = THREE.RepeatWrapping;

grasscolorTexture.wrapT = THREE.RepeatWrapping;
grassambientocculsionTexture.wrapT = THREE.RepeatWrapping;
grassnormalTexture.wrapT = THREE.RepeatWrapping;
grassroughnessTexture.wrapT = THREE.RepeatWrapping;
DisplacementTexture.wrapT = THREE.RepeatWrapping;

// Lighting
const ambientLight = new THREE.AmbientLight("#b9d5ff", 0.75);
scene.add(ambientLight);
const moonLight = new THREE.DirectionalLight("#b9d5ff", 0.5);
moonLight.position.set(4, 5, -2);
scene.add(moonLight);

// Camera and resizing
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};
window.onload = () => {
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
};

// Camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 1000);
camera.position.x = 15;
camera.position.y = 10;
camera.position.z = 70;
scene.add(camera);

// Camera controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

// Renderer
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Handle resizing
window.addEventListener("resize", () => {
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  document.addEventListener("keydown", onDocumentKeyDown, false);
});

renderer.setClearColor("#87ceeb");

// Show axes
var axesHelper = new THREE.AxesHelper(500);
scene.add(axesHelper);

// Load models
const loader = new GLTFLoader();
const mixers = [];
const models = [];
let boatModel;
let initialHeight = 3.6;
let initialWidth = 8.4;
let initialLength = 22.7;

let heightRatio = 0.95 / initialHeight;
let lengthRatio = 5.23 / initialLength;
let widthRatio = 2.09 / initialWidth;

function loadModel(modelPath, modelLocation, modelScale, animationIndex, modelRotations) {
  loader.load(
    modelPath,
    function (gltf) {
      const mixer = new THREE.AnimationMixer(gltf.scene);
      const animation = gltf.animations[animationIndex];
      if (animation) {
        const action = mixer.clipAction(animation);
        mixers.push(mixer);
        action.play();
      }
      const model = gltf.scene;
      model.scale.set(modelScale.x, modelScale.y, modelScale.z);
      model.position.set(modelLocation.x, modelLocation.y, modelLocation.z);
      model.rotation.set(modelRotations.x, modelRotations.y, modelRotations.z);
      scene.add(model);
      models.push(model);
      if (modelPath === "models/speedboat/scene.gltf") {
        boatModel = model;
      }
    },
    undefined,
    function (error) {
      console.error(error);
    }
  );
}

const modelPaths = ["models/speedboat/scene.gltf", ];
const modelLocations = [
  { x: 0, y: 0, z: 0 },
];
const modelRotations = [
  { x: 0, y: Math.PI / 2, z: 0 },
];
const modelScales = [
  { x: lengthRatio, y: heightRatio, z: widthRatio },
];
const animationIndices = [0];

for (let i = 0; i < modelPaths.length; i++) {
  loadModel(modelPaths[i], modelLocations[i], modelScales[i], animationIndices[i], modelRotations[i]);
}

// dat.GUI settings
const gui = new dat.GUI();
const params = {
  rpm: 0,
  boatLength: 5.23,
  boatWidth: 2.09,
  boatHeight: 0.95,
  boatMass: 450
};

// Add RPM control to GUI
gui.add(params, 'rpm', 0, 7000).name('RPM').onChange(value => {
  console.log(`RPM: ${value}`);
});
gui.add(params, 'boatLength').name('Length (m)').onChange(updateBoatParams);
gui.add(params, 'boatWidth').name('Width (m)').onChange(updateBoatParams);
gui.add(params, 'boatHeight').name('Height (m)').onChange(updateBoatParams);
gui.add(params, 'boatMass').name('Weight (kg)').onChange(updateBoatParams);

function updateBoatParams() {
  if (boatModel) {
    boatModel.scale.set(params.boatLength / initialLength, params.boatHeight / initialHeight, params.boatWidth / initialWidth);
    
    // Update Physics object
    physic.updateParams(params.boatLength, params.boatWidth, params.boatHeight, params.boatMass);
  }
}

const arrowHelper = [];
function DrawVector(IndexOfVector, vector3, color, lengthOfVector, startingPointOfVector) {
  var dir = new THREE.Vector3(vector3.x, vector3.y, vector3.z);
  dir.normalize();
  var origin = new THREE.Vector3(startingPointOfVector.x, startingPointOfVector.y, startingPointOfVector.z);
  var length = lengthOfVector;
  var hex = color;
  if (arrowHelper[IndexOfVector] !== undefined) {
    scene.remove(arrowHelper[IndexOfVector]);
  }
  arrowHelper[IndexOfVector] = new THREE.ArrowHelper(dir, origin, length, hex);
  scene.add(arrowHelper[IndexOfVector]);
}

var elapsedtime;
var oldElapsedTime;
var deltatime;
var time = 0 ; 
const clock = new THREE.Clock();

function animate() {
  setTimeout(function () {
    requestAnimationFrame(animate);
  }, 30);

  elapsedtime = clock.getElapsedTime();
  deltatime = elapsedtime - oldElapsedTime;
  oldElapsedTime = elapsedtime;

  if (boatModel) {
    const submergedHeight = physic.getSubmergedHeight();
    const heightRatio = params.boatHeight / initialHeight;
    boatModel.position.y = -submergedHeight / heightRatio ;
    console.log('boat y position is ' + boatModel.position.y);
    if (physic.isSinking()) {
      time += deltatime;

      boatModel.position.y -= time; // Make the boat sink faster
      console.log('The boat is sinking!' + "the boat sinking position is " + boatModel.position.y);
    } else {
      console.log('The boat is floating.');
    }
  }

  controls.update();
  renderer.render(scene, camera);
}

animate();
