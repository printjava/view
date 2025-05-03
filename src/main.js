import "./style.css";

import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

let container;

let camera, scene, renderer, controls;

let floor_display = true;
let floor;
let grid_display = true;
let gridHelpers = [];

document.querySelector(".disable-floor").addEventListener("click", () => {
    floor_display = !floor_display;
    document.querySelector(".disable-floor").classList.toggle("active");
    floor.visible = floor_display;
    controls.maxPolarAngle = floor_display ? Math.PI / 2 - 0.05 : Math.PI
})

document.querySelector(".disable-grid").addEventListener("click", () => {
    grid_display = !grid_display;
    document.querySelector(".disable-grid").classList.toggle("active");

    gridHelpers.forEach((grid) => {
        grid.visible = grid_display;
    });

});

document.querySelector(".show-wireframe").addEventListener("click", () => {
    const model = scene.getObjectByName("model");
    if (model) {
        if(document.querySelector(".show-wireframe").classList.contains("active")) {
            model.material.wireframe = false;
            document.querySelector(".show-wireframe").classList.remove("active");
        } else {
            model.material.wireframe = true;
            document.querySelector(".show-wireframe").classList.add("active");
        }
    }
})

document.querySelector(".reset-cam").addEventListener("click", () => {
    camera.position.set(20, 10, 20);
    controls.target.set(0, 0, 0);
    camera.lookAt(0, 0, 0);
    controls.update();
})

document.querySelector(".debug-normals").addEventListener("click", () => {
    const model = scene.getObjectByName("model");
    if(!document.querySelector(".debug-normals").classList.contains("active")) {
        model.material = new THREE.MeshPhongMaterial({
            color: 0x0000ff,
            specular: 0x808080,
            side: THREE.FrontSide
        });
        const backside_model = new THREE.Mesh(model.geometry.clone(), new THREE.MeshPhongMaterial({
            color: 0xff0000,
            specular: 0x808080,
            side: THREE.BackSide
        }));
        backside_model.name = "backside_model";
        backside_model.position.copy(model.position);
        backside_model.rotation.copy(model.rotation);
        backside_model.scale.copy(model.scale);
        scene.add(backside_model);
    } else {
        const backside_model = scene.getObjectByName("backside_model");
        if(backside_model) {
            scene.remove(backside_model);
        }
        model.material = new THREE.MeshPhongMaterial({
            color: 0x808080,
            specular: 0xffffff,
        });
    }

    document.querySelector(".debug-normals").classList.toggle("active");
});

document.querySelector(".choose-file").addEventListener("click", () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".stl";
    input.addEventListener("change", (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (event) {
                const loader = new STLLoader();
                const arrayBuffer = event.target.result;
                const geometry = loader.parse(arrayBuffer);

                const material = new THREE.MeshPhongMaterial({
                    color: 0x808080,
                    specular: 0xffffff,
                });
                const mesh = new THREE.Mesh(geometry, material);

                mesh.castShadow = true;
                mesh.receiveShadow = true;
                mesh.name = "model";

                scene.children.forEach((child) => {
                    if (child.name === "model") {
                        scene.remove(child);
                    }
                })

                scene.add(mesh);
            };
            reader.readAsArrayBuffer(file);
        }
    });
    document.querySelector(".choose-file").innerHTML = file.name;
    input.click();
})

document.addEventListener('dragenter', preventDefaults, false);
document.addEventListener('dragover', preventDefaults, false);

function preventDefaults (e) {
  e.preventDefault();
  e.stopPropagation();
}

document.addEventListener("drop", (e) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files[0];

    console.log(scene);

    scene.children.forEach((child) => {
        if (child.name === "model") {
            scene.remove(child);
        }
    })

    const reader = new FileReader();
    reader.onload = function (event) {
        const loader = new STLLoader();
        const arrayBuffer = event.target.result;
        const geometry = loader.parse(arrayBuffer);

        const material = new THREE.MeshPhongMaterial({
            color: 0x808080,
            specular: 0xffffff,
        });
        const mesh = new THREE.Mesh(geometry, material);

        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.name = "model";

        scene.add(mesh);
    };
    document.querySelector(".choose-file").innerHTML = file.name;
    reader.readAsArrayBuffer(file);
});

init();

function init() {
    container = document.createElement("div");
    document.body.appendChild(container);

    camera = new THREE.PerspectiveCamera(
        40,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.set(20, 10, 20);
    camera.lookAt(0, 0, 0);

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x424242);

    const plane = new THREE.Mesh(
        new THREE.PlaneGeometry(25.6, 25.6),
        new THREE.MeshPhongMaterial({
            color: 0x000000,
            shininess: 0,
            specular: 0x444444,
        })
    );
    plane.rotation.x = -Math.PI / 2;
    scene.add(plane);
    floor = plane;

    scene.add(new THREE.HemisphereLight(0x808080, 0xffffff, 5));

    const directionalLight = new THREE.DirectionalLight(0xffffff, 5);
    directionalLight.position.set(40, 20, 40);
    scene.add(directionalLight);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setAnimationLoop(animate);

    container.appendChild(renderer.domElement);

    window.addEventListener("resize", onWindowResize);

    controls = new OrbitControls(camera, renderer.domElement);

    controls.enableDamping = true;
    controls.dampingFactor = 0.25;

    controls.screenSpacePanning = false;

    controls.minDistance = 1;
    controls.maxDistance = 70;

    controls.maxPolarAngle = Math.PI / 2 - 0.05;

    if (grid_display) {
        const minorGridHelper = new THREE.GridHelper(25.6, 256, 0xff0000, 0x404040);
        minorGridHelper.position.y = 0.01;
        scene.add(minorGridHelper);
        gridHelpers.push(minorGridHelper);

        const gridHelper = new THREE.GridHelper(25, 25, 0xff0000, 0x808080);
        gridHelper.position.y = 0.02;
        scene.add(gridHelper);
        gridHelpers.push(gridHelper);
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    render();
}

function render() {
    //const timer = Date.now() * 0.0005;

    //camera.position.x = Math.cos( timer ) * 3;
    //camera.position.z = Math.sin( timer ) * 3;

    //camera.lookAt( cameraTarget );
    controls.update();

    renderer.render(scene, camera);
}
