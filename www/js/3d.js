"use strict"

var Detector;
if (!Detector.webgl)
  Detector.addGetWebGLMessage();

var renderer, scene, camera, controls;

var uniforms;

var WIDTH = window.innerWidth, HEIGHT = window.innerHeight;

function change_3d(id) {

  camera = new THREE.PerspectiveCamera(25, WIDTH / HEIGHT, 1, 10000);
  //camera zoom
  camera.position.z = 1300;

  //  controls = new THREE.TrackballControls(camera);
  controls = new THREE.OrbitControls(camera);

  scene = new THREE.Scene();

  var light = new THREE.PointLight();
  light.position.set(5000, 50000, 0);
  scene.add(light);

  var light1 = new THREE.PointLight();
  light1.position.set(5000, -50000, 0);
  scene.add(light1);

  var loader = new THREE.JSONLoader();

  loader.load("js/plant.js", function(geometry) {
    var mesh = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({
      color : 0xC6C6C6
    }));
    //	polygon view
    //  var mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({wireframe: true}));
    //  mesh.material.color.setHex(0xff0000);
    mesh.scale.set(10, 10, 10);
    mesh.position.y = 0;

    mesh.position.x = 0;
    scene.add(mesh);
  });

  //

  renderer = new THREE.WebGLRenderer({
    alpha : true,
    antialias : true
  });
  renderer.setSize(WIDTH, HEIGHT);

  var container = document.getElementById('image-container');
  while (container.hasChildNodes()) {
    container.removeChild(container.firstChild);
  }
  container.appendChild(renderer.domElement);

  //

  window.addEventListener('resize', onWindowResize, false);
  animate();
}

function onWindowResize() {

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);

}

function animate() {
  requestAnimationFrame(animate);

  render();

}

function render() {

  var time = Date.now() * 0.001;
  if (controls) {
    controls.update();
  }
  renderer.render(scene, camera);
}

