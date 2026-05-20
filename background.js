import * as THREE from 'three';

const canvas = document.getElementById('bgCanvas');
const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 30;

/* Particle system */
const particleCount = 200;
const positions = new Float32Array(particleCount * 3);
const sizes = new Float32Array(particleCount);
for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 60;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 60;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 40 - 10;
    sizes[i] = Math.random() * 2 + 0.5;
}
const particleGeom = new THREE.BufferGeometry();
particleGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
particleGeom.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));

const particleMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: { uTime: { value: 0 }, uColor: { value: new THREE.Color(0x00ffaa) } },
    vertexShader: `
        attribute float aSize; uniform float uTime; varying float vAlpha;
        void main() {
            vec3 pos = position;
            pos.y += sin(uTime * 0.3 + position.x * 0.2) * 1.5;
            pos.x += cos(uTime * 0.2 + position.y * 0.15) * 1.0;
            vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
            gl_PointSize = aSize * (20.0 / -mvPos.z);
            gl_Position = projectionMatrix * mvPos;
            vAlpha = smoothstep(-40.0, -5.0, mvPos.z) * 0.6;
        }`,
    fragmentShader: `
        uniform vec3 uColor; varying float vAlpha;
        void main() {
            float d = length(gl_PointCoord - vec2(0.5));
            if (d > 0.5) discard;
            float alpha = smoothstep(0.5, 0.1, d) * vAlpha;
            gl_FragColor = vec4(uColor, alpha);
        }`
});
const particles = new THREE.Points(particleGeom, particleMat);
scene.add(particles);

/* Wireframe geometry */
const shapes = [];
for (let i = 0; i < 8; i++) {
    let geom;
    const r = Math.random();
    if (r < 0.33) geom = new THREE.IcosahedronGeometry(Math.random() * 3 + 1.5, 1);
    else if (r < 0.66) geom = new THREE.OctahedronGeometry(Math.random() * 3 + 1.5, 0);
    else geom = new THREE.TorusGeometry(Math.random() * 2 + 1, 0.3, 8, 16);
    const mat = new THREE.MeshBasicMaterial({ color: 0x00ffaa, wireframe: true, transparent: true, opacity: 0.06 });
    const mesh = new THREE.Mesh(geom, mat);
    mesh.position.set((Math.random() - 0.5) * 50, (Math.random() - 0.5) * 40, (Math.random() - 0.5) * 20 - 15);
    mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
    mesh.userData = {
        rotSpeed: { x: (Math.random() - 0.5) * 0.005, y: (Math.random() - 0.5) * 0.005 },
        floatOffset: Math.random() * Math.PI * 2,
        floatSpeed: Math.random() * 0.3 + 0.1,
        baseY: mesh.position.y
    };
    scene.add(mesh);
    shapes.push(mesh);
}

/* Ground grid */
const gridHelper = new THREE.GridHelper(80, 40, 0x003322, 0x001a11);
gridHelper.position.y = -20;
if (Array.isArray(gridHelper.material)) {
    gridHelper.material.forEach(m => { m.transparent = true; m.opacity = 0.3; });
} else {
    gridHelper.material.transparent = true;
    gridHelper.material.opacity = 0.3;
}
scene.add(gridHelper);

/* Mouse follow */
let mouseX = 0, mouseY = 0;
document.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
});

/* Animation loop */
const clock = new THREE.Clock();
function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();
    particleMat.uniforms.uTime.value = t;
    particles.rotation.y = t * 0.02;
    shapes.forEach(s => {
        s.rotation.x += s.userData.rotSpeed.x;
        s.rotation.y += s.userData.rotSpeed.y;
        s.position.y = s.userData.baseY + Math.sin(t * s.userData.floatSpeed + s.userData.floatOffset) * 2;
    });
    camera.position.x += (mouseX * 3 - camera.position.x) * 0.02;
    camera.position.y += (-mouseY * 2 - camera.position.y) * 0.02;
    camera.lookAt(0, 0, 0);
    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});