// Spencer Chinn CSE 160 Winter 2025
// Used various guides online, threejs.org guides and code as a base, and chatgpt to assist

import * as THREE from './three';
import { OBJLoader } from './three/examples/jsm/loaders/OBJLoader.js';
import { MTLLoader } from './three/examples/jsm/loaders/MTLLoader.js';
import { GUI } from './three/examples/jsm/libs/lil-gui.module.min.js';
import { OrbitControls } from './three/examples/jsm/controls/OrbitControls.js';

// GLOBALS
let scene = new THREE.Scene();
let renderer;
let camera;
let controls;
let mouseX = 0, mouseY = 0;


function createRenderer(canvas) {
	renderer = new THREE.WebGLRenderer({ antialias: true, canvas: canvas, logarithmicDepthBuffer: true, });;
	renderer.setClearColor(0xAAAAAA);
	renderer.shadowMap.enabled = true;
	return renderer;
}

function createCamera(fov = 60) {
	const aspect = 2; // the canvas default
	const zNear = 0.1;
	const zFar = 2000;
	camera = new THREE.PerspectiveCamera(fov, aspect, zNear, zFar);
	camera.position.set(8, 4, 10).multiplyScalar(3);
	camera.lookAt(0, 0, 0);
	return camera;
}

function createScene() {

    const light1 = new THREE.DirectionalLight(0x000000, 5);
    light1.position.set(0, 20, 0);
    light1.castShadow = true;
    light1.shadow.mapSize.width = 2048;
    light1.shadow.mapSize.height = 2048;
    const d = 50;
    light1.shadow.camera.left = -d;
    light1.shadow.camera.right = d;
    light1.shadow.camera.top = d;
    light1.shadow.camera.bottom = -d;
    light1.shadow.camera.near = 1;
    light1.shadow.camera.far = 50;
    light1.shadow.bias = 0.001;

    const moonlight = new THREE.DirectionalLight(0xAABBDD, 1);
    moonlight.position.set(moonPosition.x, moonPosition.y, moonPosition.z);
	moonlight.target.position.set(0,0,0);

    const ambientLight = new THREE.AmbientLight(0x404040, 1);
    scene.add(ambientLight);

    scene.add(light1);
    scene.add(moonlight);
	scene.add(moonlight.target);

    scene.fog = new THREE.Fog(0x551f13, 10, 400);
    return scene;
}


class MinMaxGUIHelper {

	constructor( obj, minProp, maxProp, minDif ) {

		this.obj = obj;
		this.minProp = minProp;
		this.maxProp = maxProp;
		this.minDif = minDif;

	}
	get min() {

		return this.obj[ this.minProp ];

	}
	set min( v ) {

		this.obj[ this.minProp ] = v;
		this.obj[ this.maxProp ] = Math.max( this.obj[ this.maxProp ], v + this.minDif );

	}
	get max() {

		return this.obj[ this.maxProp ];

	}
	set max( v ) {

		this.obj[ this.maxProp ] = v;
		this.min = this.min; // this will call the min setter

	}

}	

function updateCamera() {

	camera.updateProjectionMatrix();

}

let moonPosition = { x: 200, y: 80, z: 200 };

function createMoon() {
    const textureLoader = new THREE.TextureLoader();
    const textures = {
        ambientOcclusion: textureLoader.load('textures/Moon_002_ambientOcclusion.png'),
        basecolor: textureLoader.load('textures/Moon_002_basecolor.png'),
        height: textureLoader.load('textures/Moon_002_height.png'),
        normal: textureLoader.load('textures/Moon_002_normal.png'),
        roughness: textureLoader.load('textures/Moon_002_roughness.png'),
    };

    // geometry and material
    const geometry = new THREE.SphereGeometry(5, 32, 32);
    const material = new THREE.MeshStandardMaterial({
        map: textures.basecolor,
        normalMap: textures.normal,
        roughnessMap: textures.roughness,
        aoMap: textures.ambientOcclusion,
        displacementMap: textures.height,
        displacementScale: 0.05,
		transparent: true,
		opacity: 0.5,
    });	

    // moon mesh
    const moon = new THREE.Mesh(geometry, material);
	moon.scale.set(32, 32, 32);
    moon.position.set(moonPosition.x, moonPosition.y, moonPosition.z);

    return moon;
}

function createGround() {
	const groundGeometry = new THREE.PlaneGeometry(5000, 5000);
	const groundMaterial = new THREE.MeshPhongMaterial({ color: 0x9aa7ae });
	const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
	groundMesh.rotation.x = Math.PI * -0.5;
	groundMesh.receiveShadow = true;
	groundMesh.position.y = -1;
	return groundMesh;
}

function createTank(carWidth, carHeight, carLength, tankCameraFov) {
    const tank = new THREE.Object3D();

    // Create body
    const bodyGeometry = new THREE.BoxGeometry(carWidth, carHeight, carLength);
    const bodyMaterial = new THREE.MeshPhongMaterial({ color: 0x6688AA });
    const bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
    bodyMesh.position.y = 1.4;
    bodyMesh.castShadow = true;
    tank.add(bodyMesh);

    // Create tank camera
    const tankCamera = new THREE.PerspectiveCamera(tankCameraFov, 2, 0.1, 1000);
    tankCamera.position.y = 3;
    tankCamera.position.z = -6;
    tankCamera.rotation.y = Math.PI;
    bodyMesh.add(tankCamera);

    // Create wheels
    const wheelRadius = 1;
    const wheelThickness = 0.5;
    const wheelSegments = 6;
    const wheelGeometry = new THREE.CylinderGeometry(wheelRadius, wheelRadius, wheelThickness, wheelSegments);
    const wheelMaterial = new THREE.MeshPhongMaterial({ color: 0x888888 });
    const wheelPositions = [
        [-carWidth / 2 - wheelThickness / 2, -carHeight / 2, carLength / 3],
        [carWidth / 2 + wheelThickness / 2, -carHeight / 2, carLength / 3],
        [-carWidth / 2 - wheelThickness / 2, -carHeight / 2, 0],
        [carWidth / 2 + wheelThickness / 2, -carHeight / 2, 0],
        [-carWidth / 2 - wheelThickness / 2, -carHeight / 2, -carLength / 3],
        [carWidth / 2 + wheelThickness / 2, -carHeight / 2, -carLength / 3],
    ];
    const wheelMeshes = wheelPositions.map(position => {
        const mesh = new THREE.Mesh(wheelGeometry, wheelMaterial);
        mesh.position.set(...position);
        mesh.rotation.z = Math.PI * 0.5;
        mesh.castShadow = true;
        bodyMesh.add(mesh);
        return mesh;
    });

    // Create dome
    const domeRadius = 2;
    const domeGeometry = new THREE.SphereGeometry(domeRadius, 12, 12, 0, Math.PI * 2, 0, Math.PI * 0.5);
    const domeMesh = new THREE.Mesh(domeGeometry, bodyMaterial);
    domeMesh.castShadow = true;
    bodyMesh.add(domeMesh);
    domeMesh.position.y = 0.5;

    // Create turret
    const turretWidth = 0.1;
    const turretHeight = 0.1;
    const turretLength = carLength * 0.75 * 0.2;
    const turretGeometry = new THREE.BoxGeometry(turretWidth, turretHeight, turretLength);
    const turretMesh = new THREE.Mesh(turretGeometry, bodyMaterial);
    const turretPivot = new THREE.Object3D();
    turretMesh.castShadow = true;
    turretPivot.scale.set(5, 5, 5);
    turretPivot.position.y = 0.5;
    turretMesh.position.z = turretLength * 0.5;
    turretPivot.add(turretMesh);
    bodyMesh.add(turretPivot);

    // Create turret camera
    const turretCamera = new THREE.PerspectiveCamera(75, 2, 0.1, 1000);
    turretCamera.position.y = 0.75 * 0.2;
    turretMesh.add(turretCamera);

    // Add movement variables
    let forwardSpeed = 0;
    let turnSpeed = 0;
    let wheelRotationSpeed = 0;

	tank.scale.set(0.6, 0.6, 0.6);

    // Add keydown event listener for movement
    document.addEventListener('keydown', (event) => {
        if (event.key === 'w') {
            forwardSpeed = 0.2; // Move forward
            wheelRotationSpeed = 0.1; // Rotate wheels forward
        } else if (event.key === 's') {
            forwardSpeed = -0.2; // Move backward
            wheelRotationSpeed = -0.1; // Rotate wheels backward
        } else if (event.key === 'a') {
            turnSpeed = 0.05; // Turn left
        } else if (event.key === 'd') {
            turnSpeed = -0.05; // Turn right
        }
    });

    // Add keyup event listener to stop movement
    document.addEventListener('keyup', (event) => {
        if (event.key === 'w' || event.key === 's') {
            forwardSpeed = 0; // Stop moving forward/backward
            wheelRotationSpeed = 0; // Stop rotating wheels
        } else if (event.key === 'a' || event.key === 'd') {
            turnSpeed = 0; // Stop turning
        }
    });

    // Update function for movement
    function updateMovement() {
        // Move the tank relative to where it's facing
        bodyMesh.translateZ(forwardSpeed); // Move forward/backward based on the local Z axis
        bodyMesh.rotation.y += turnSpeed; // Rotate the tank (turning left/right)

        // Rotate wheels when moving
        wheelMeshes.forEach(wheel => {
            wheel.rotation.x += wheelRotationSpeed; // Rotate wheels along the X-axis
        });
    }

    // Call update movement in the animation loop
    function animate() {
        updateMovement();
        requestAnimationFrame(animate);
    }
    animate();

    // Return the tank object with all its components
    return { tank, bodyMesh, turretMesh, turretCamera, tankCamera, wheelMeshes };
}



// Store references to loaded models
const models = [];

function loadModel(objPath, mtlPath, position = {x: 0, y: 0, z: 0}, scale = {x: 1, y: 1, z: 1}, rotation = {x: 0, y: 0, z: 0}) {
    const mtlLoader = new MTLLoader();

    mtlLoader.load(mtlPath, (mtl) => {
        const objLoader = new OBJLoader();
        objLoader.setMaterials(mtl);

        objLoader.load(objPath, (root) => {
            // Add the model to the scene
            scene.add(root);
            
            // Set the position of the model
            root.position.set(position.x, position.y, position.z);
            
            // Set the scale of the model
            root.scale.set(scale.x, scale.y, scale.z);
            
            // Set the rotation of the model (in radians)
            root.rotation.set(rotation.x, rotation.y, rotation.z);

            // Store the model in the models array
            models.push(root);
        });
    });
}



function createSkybox() {
    const skyboxGeometry = new THREE.BoxGeometry(1000, 1000, 1000);
    const skyboxMaterial = new THREE.MeshBasicMaterial({ color:0x00141c, side: THREE.BackSide });
    const skyboxMesh = new THREE.Mesh(skyboxGeometry, skyboxMaterial);
    return skyboxMesh;
}


function resizeRendererToDisplaySize() {
	const canvas = renderer.domElement;
	const width = canvas.clientWidth;
	const height = canvas.clientHeight;
	const needResize = canvas.width !== width || canvas.height !== height;
	if (needResize) {
		renderer.setSize(width, height, false);
	}
	return needResize;
}

function renderScene(cameras, infoElem) {
    let currentCameraIndex = 2;

    document.addEventListener('keydown', (event) => {
        if (event.key === ' ') {
            currentCameraIndex = (currentCameraIndex + 1) % cameras.length;
        }
    });

    return function render(time) {
        time *= 0.001;

        if (resizeRendererToDisplaySize()) {
            const canvas = renderer.domElement;
            if (canvas) {
                cameras.forEach((cameraInfo) => {
                    const camera = cameraInfo.cam;
                    if (camera) {
                        camera.aspect = canvas.clientWidth / canvas.clientHeight;
                        camera.updateProjectionMatrix();
                    }
                });
            }
        }

        const selectedCamera = cameras[currentCameraIndex];

        if (selectedCamera && selectedCamera.cam) {
            const camera = selectedCamera.cam;
            infoElem.textContent = selectedCamera.desc;
            camera.updateProjectionMatrix();
            renderer.render(scene, camera);
        } else if (selectedCamera && selectedCamera.updateProjectionMatrix) {
            infoElem.textContent = selectedCamera.desc;
            selectedCamera.updateProjectionMatrix();
            renderer.render(scene, selectedCamera);
        } else {
            console.error("Selected camera or camera.cam is undefined or invalid.");
        }

        requestAnimationFrame(render);
    };
}


function setUpBuildings() {
	const buildingSize = {x: 10, y: 10, z: 10};
	let yRotate = 90 * Math.PI / 180;
	const buildingRotate = {x: 0, y: yRotate, z: 0};
	let a = -210;
	let b = -210;
	for (let i = 0; i < 10; i++) {
		for (let r = 0; r < 10; r++) {
			let xloc = a + i * 40;
			let zloc = b + r * 40;
			loadModel('/models/large_buildingA.obj', '/models/large_buildingA.mtl', {x: xloc, y: 0, z: zloc}, buildingSize, buildingRotate );
		}	
	}
}

function setUpRoads() {
	const buildingSize = {x: 0.2, y: 0.2, z: 0.2};
	let rotate = 90 * Math.PI / 180;
	const buildingRotate = {x: -rotate, y: 0, z: 0};
	let a = -210;
	let b = -239;
	for (let i = 0; i < 20; i++) {
		for (let r = 0; r < 10; r++) {
			let xloc = a + i * 25;
			let zloc = b + r * 41;
			loadModel('/models/roadtile.obj', '/models/roadtile.mtl', {x: xloc, y: -1, z: zloc}, buildingSize, buildingRotate );
		}	
	}
}

let lampPositions = [];

function setUpLamps() {
	const buildingSize = {x: 2, y: 3, z: 2};
	const buildingRotate = {x: 0, y: 0, z: 0};
	let a = -210;
	let b = -228;
	for (let i = 0; i < 20; i++) {
		for (let r = 0; r < 10; r++) {
			let xloc = a + i * 25;
			let zloc = b + r * 41;
            lampPositions.push({ x: xloc, z: zloc });
			loadModel('/models/streetlamp.obj', '/models/streetlamp.mtl', {x: xloc, y: 6, z: zloc}, buildingSize, buildingRotate );
		}	
	}
	// too many and lights dont work, need to instance lights, to do
	for (let i = 0; i < 5; i++) {
		// Create the spotlight
		const spotlight = new THREE.SpotLight(0xffffff, 100);
	
		// Set the position of the spotlight to the corresponding lamp position (x and z)
		spotlight.position.set(lampPositions[i].x, 5, lampPositions[i].z); // y = 5 for height
	
		// Configure the spotlight
		spotlight.castShadow = true;
		spotlight.angle = Math.PI / 2;
	
		// Add the spotlight to the scene
		scene.add(spotlight);
	}
}

function main() {
	const canvas = document.querySelector('#c');
	const sky = createSkybox();
	const ground = createGround();
	const tank = createTank(4, 1, 8, 75);
	const moon = createMoon();

	scene = createScene();
	renderer = createRenderer(canvas);
	camera = createCamera();

	scene.add(sky);
	scene.add(moon);

	scene.add(ground);
	scene.add(tank.tank);

	const infoElem = document.querySelector('#info');
	const cameras = [
		{ cam: camera, desc: 'detached camera (press space to change)' },
		{ cam: tank.turretCamera, desc: 'on turret looking at target (press space to change)' },
		{ cam: tank.tankCamera, desc: 'above back of tank (wasd, spacebar)' },
	];

	const gui = new GUI();
	gui.add( camera, 'fov', 1, 180 ).onChange( updateCamera );
	const minMaxGUIHelper = new MinMaxGUIHelper( camera, 'near', 'far', 0.1 );
	gui.add( minMaxGUIHelper, 'min', 0.1, 50, 0.1 ).name( 'near' ).onChange( updateCamera );
	gui.add( minMaxGUIHelper, 'max', 0.1, 50, 0.1 ).name( 'far' ).onChange( updateCamera );

	const controls = new OrbitControls(camera, canvas);
	controls.target.set(0, 0, 0);
	controls.update();
	
	setUpRoads();
	setUpLamps();
	setUpBuildings();

	const render = renderScene(cameras, infoElem);
	requestAnimationFrame(render);
}

main();
