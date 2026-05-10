import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import {
    Upload, Play, Pause, Activity, Crosshair, BarChart2, Info,
    Shield, Cpu, Network, Zap, Target, Lock, Database, Server,
    CheckCircle2, AlertTriangle, FileAudio, MapPin, ChevronDown,
    FileUp, Box, CarFront, BrainCircuit, Scale, Mic, Radar
} from 'lucide-react';

// Shared drone screen position — DroneHero writes, ParticleBackground reads
const droneScreenPos = { x: null, y: null, radius: 180 };

const PROCESSING_STEPS = [
    { id: 1, label: 'FILE INGEST', icon: FileUp, x: 15, y: 15 },
    { id: 2, label: 'NOISE REDUCTION', icon: Activity, x: 15, y: 40 },
    { id: 3, label: 'TIME-FREQ ANALYSIS', icon: Box, x: 30, y: 10 },
    { id: 4, label: 'FEATURE EXTRACTION', icon: BarChart2, x: 30, y: 80 },
    { id: 5, label: 'ANOMALY DETECT', icon: Network, x: 70, y: 10 },
    { id: 6, label: 'CLASSIFICATION', icon: CarFront, x: 70, y: 80 },
    { id: 7, label: 'NEURAL FUSION', icon: BrainCircuit, x: 50, y: 50, isCenter: true },
    { id: 8, label: 'FINAL DECISION', icon: Scale, x: 85, y: 50 }
];


const ParticleBackground = () => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let animationFrameId;
        let particles = [];
        let mouse = { x: null, y: null, radius: 160 };

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            initParticles();
        };

        window.addEventListener('resize', resize);
        window.addEventListener('mousemove', (e) => {
            mouse.x = e.x;
            mouse.y = e.y;
        });

        class Particle {
            constructor(x, y, size) {
                this.x = x; this.y = y; this.size = size;
                this.baseX = this.x; this.baseY = this.y;
                this.density = (Math.random() * 30) + 1;
            }
            draw() {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fillStyle = '#7a6b5e'; // darker warm stone
                ctx.fill();
            }
            update() {
                let moved = false;

                // --- Mouse repulsion ---
                if (mouse.x !== null) {
                    const dx = mouse.x - this.x;
                    const dy = mouse.y - this.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < mouse.radius && dist > 0) {
                        const force = (mouse.radius - dist) / mouse.radius;
                        this.x -= (dx / dist) * force * this.density;
                        this.y -= (dy / dist) * force * this.density;
                        moved = true;
                    }
                }

                // --- Drone repulsion ---
                if (droneScreenPos.x !== null) {
                    const ddx = droneScreenPos.x - this.x;
                    const ddy = droneScreenPos.y - this.y;
                    const droneDist = Math.sqrt(ddx * ddx + ddy * ddy);
                    if (droneDist < droneScreenPos.radius && droneDist > 0) {
                        const force = (droneScreenPos.radius - droneDist) / droneScreenPos.radius;
                        this.x -= (ddx / droneDist) * force * this.density * 1.8;
                        this.y -= (ddy / droneDist) * force * this.density * 1.8;
                        moved = true;
                    }
                }

                // Spring back to base if no repulsion
                if (!moved) {
                    if (this.x !== this.baseX) this.x -= (this.x - this.baseX) / 10;
                    if (this.y !== this.baseY) this.y -= (this.y - this.baseY) / 10;
                }

                this.draw();
            }
        }

        const initParticles = () => {
            particles = [];
            // Reduced particle density
            const numberOfParticles = (canvas.width * canvas.height) / 7000;
            for (let i = 0; i < numberOfParticles; i++) {
                particles.push(new Particle(
                    Math.random() * canvas.width,
                    Math.random() * canvas.height,
                    (Math.random() * 2.5) + 0.8
                ));
            }
        };

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => p.update());
            animationFrameId = requestAnimationFrame(animate);
        };

        resize(); animate();
        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', resize);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none z-0"
            style={{ background: 'radial-gradient(circle at center, #fdfbf7 0%, #f0e6d8 100%)' }}
        />
    );
};

const DigitalWaveBackground = () => {
    const mountRef = useRef(null);

    useEffect(() => {
        const AMOUNTX = 150;
        const AMOUNTY = 150;
        const SEPARATION = 30;

        let camera, scene, renderer, particles;
        let count = 0;
        let mouseX = 0, mouseY = 0;
        let windowHalfX = window.innerWidth / 2;
        let windowHalfY = window.innerHeight / 2;

        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000);
        camera.position.y = 1000;
        camera.position.z = 0;

        scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(0xf8f6f0, 0.0004);

        const numParticles = AMOUNTX * AMOUNTY;
        const positions = new Float32Array(numParticles * 3);

        let i = 0;
        for (let ix = 0; ix < AMOUNTX; ix++) {
            for (let iy = 0; iy < AMOUNTY; iy++) {
                positions[i] = ix * SEPARATION - ((AMOUNTX * SEPARATION) / 2);
                positions[i + 1] = 0;
                positions[i + 2] = iy * SEPARATION - ((AMOUNTY * SEPARATION) / 2);
                i += 3;
            }
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const canvas = document.createElement('canvas');
        canvas.width = 16;
        canvas.height = 16;
        const context = canvas.getContext('2d');
        const gradient = context.createRadialGradient(8, 8, 0, 8, 8, 8);
        gradient.addColorStop(0, 'rgba(0, 0, 0, 1)');
        gradient.addColorStop(0.2, 'rgba(0, 0, 0, 0.8)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        context.fillStyle = gradient;
        context.fillRect(0, 0, 16, 16);
        const texture = new THREE.CanvasTexture(canvas);

        const material = new THREE.PointsMaterial({
            color: 0x000000,
            size: 10,
            map: texture,
            transparent: true,
            opacity: 0.12,
            depthWrite: false
        });

        particles = new THREE.Points(geometry, material);
        scene.add(particles);

        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        mountRef.current?.appendChild(renderer.domElement);

        const onPointerMove = (event) => {
            mouseX = event.clientX - windowHalfX;
            mouseY = event.clientY - windowHalfY;
        };

        const onWindowResize = () => {
            windowHalfX = window.innerWidth / 2;
            windowHalfY = window.innerHeight / 2;
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };

        window.addEventListener('pointermove', onPointerMove);
        window.addEventListener('resize', onWindowResize);

        let animId;
        const animate = () => {
            animId = requestAnimationFrame(animate);
            camera.position.x += (mouseX * 0.5 - camera.position.x) * 0.05;
            camera.position.z += (mouseY * 0.5 - camera.position.z) * 0.05;
            camera.position.y = 1000;
            camera.lookAt(scene.position);

            const posArray = particles.geometry.attributes.position.array;
            let idx = 0;
            for (let ix = 0; ix < AMOUNTX; ix++) {
                for (let iy = 0; iy < AMOUNTY; iy++) {
                    posArray[idx + 1] = (Math.sin((ix + count) * 0.1) * 80) +
                        (Math.sin((iy + count) * 0.1) * 80);
                    idx += 3;
                }
            }
            particles.geometry.attributes.position.needsUpdate = true;
            renderer.render(scene, camera);
            count += 0.18;
        };
        animate();

        return () => {
            window.removeEventListener('pointermove', onPointerMove);
            window.removeEventListener('resize', onWindowResize);
            cancelAnimationFrame(animId);
            renderer.dispose();
        };
    }, []);

    return <div ref={mountRef} className="absolute inset-0 pointer-events-none z-0 overflow-hidden opacity-80" />;
};


const FadeInSection = ({ children, delay = 0 }) => {
    const [isVisible, setVisible] = useState(false);
    const domRef = useRef();

    useEffect(() => {
        const observer = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting) {
                setVisible(true);
                if (domRef.current) observer.unobserve(domRef.current);
            }
        }, { threshold: 0.15 });

        if (domRef.current) observer.observe(domRef.current);

        return () => {
            if (domRef.current) observer.unobserve(domRef.current);
        };
    }, []);

    return (
        <div
            ref={domRef}
            className={`transition-all duration-1000 ease-out will-change-transform ${isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-16 scale-95'
                }`}
            style={{ transitionDelay: `${delay}ms` }}
        >
            {children}
        </div>
    );
};

const TypewriterText = ({ text, delay = 0, className = "", cursor = true, speed = 40 }) => {
    const [displayText, setDisplayText] = useState("");
    const [startTyping, setStartTyping] = useState(false);
    const [isDone, setIsDone] = useState(false);

    useEffect(() => {
        const timeout = setTimeout(() => setStartTyping(true), delay);
        return () => clearTimeout(timeout);
    }, [delay]);

    useEffect(() => {
        if (!startTyping) return;
        let i = 0;
        setDisplayText("");
        setIsDone(false);
        const interval = setInterval(() => {
            setDisplayText(text.slice(0, i + 1));
            i++;
            if (i >= text.length) {
                clearInterval(interval);
                setIsDone(true);
            }
        }, speed);
        return () => clearInterval(interval);
    }, [text, startTyping, speed]);

    return (
        <div className={className}>
            {displayText}
            {cursor && (!isDone || true) && <span className="animate-pulse opacity-50 ml-1">_</span>}
        </div>
    );
};

const NeuralTreeScene = ({ sceneState, activeStageNumber, stageCount, isAnalyzing }) => {
    const containerRef = useRef(null);
    const stateRef = useRef({ sceneState, activeStageNumber, stageCount, isAnalyzing });

    useEffect(() => {
        stateRef.current = { sceneState, activeStageNumber, stageCount, isAnalyzing };
    }, [sceneState, activeStageNumber, stageCount, isAnalyzing]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return undefined;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 50);
        camera.position.set(0, 2.3, 6.2);

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setClearColor(0x000000, 0);
        container.appendChild(renderer.domElement);

        const geometryStore = [];
        const materialStore = [];

        const rootGroup = new THREE.Group();
        scene.add(rootGroup);

        const ambient = new THREE.AmbientLight(0xffffff, 0.55);
        const keyLight = new THREE.PointLight(0xffffff, 1.25, 30);
        keyLight.position.set(2.6, 4.2, 3.2);
        const rimLight = new THREE.PointLight(0x7bffd4, 0.8, 25);
        rimLight.position.set(-3.2, 2.4, -3.4);
        scene.add(ambient, keyLight, rimLight);

        const palettes = {
            idle: {
                core: new THREE.Color(0x8c7764),
                glow: new THREE.Color(0xb59a80),
                emissive: new THREE.Color(0x2d1f16),
                node: new THREE.Color(0xd2b397),
                trunk: new THREE.Color(0x7b5b44),
                trunkEmissive: new THREE.Color(0x2a1a12),
                glowOpacity: 0.18,
                nodeIntensity: 0.45,
                trunkIntensity: 0.35,
                somaIntensity: 0.55
            },
            processing: {
                core: new THREE.Color(0xd0a77f),
                glow: new THREE.Color(0xffd6a7),
                emissive: new THREE.Color(0x6a3d22),
                node: new THREE.Color(0xf3d3ae),
                trunk: new THREE.Color(0xb8906d),
                trunkEmissive: new THREE.Color(0x5a321b),
                glowOpacity: 0.32,
                nodeIntensity: 0.95,
                trunkIntensity: 0.75,
                somaIntensity: 1.05
            },
            pass: {
                core: new THREE.Color(0x31d18a),
                glow: new THREE.Color(0x9bffd2),
                emissive: new THREE.Color(0x0f7d56),
                node: new THREE.Color(0xc9ffea),
                trunk: new THREE.Color(0x1eb77c),
                trunkEmissive: new THREE.Color(0x0d5a3f),
                glowOpacity: 0.32,
                nodeIntensity: 1.1,
                trunkIntensity: 0.95,
                somaIntensity: 1.2
            },
            fail: {
                core: new THREE.Color(0xe04b4b),
                glow: new THREE.Color(0xff9a9a),
                emissive: new THREE.Color(0x8b1d1d),
                node: new THREE.Color(0xffbaba),
                trunk: new THREE.Color(0xc73838),
                trunkEmissive: new THREE.Color(0x6b1414),
                glowOpacity: 0.32,
                nodeIntensity: 1.15,
                trunkIntensity: 1.05,
                somaIntensity: 1.3
            }
        };

        const trunkMaterial = new THREE.MeshStandardMaterial({
            color: palettes.processing.trunk,
            emissive: palettes.processing.trunkEmissive,
            emissiveIntensity: palettes.processing.trunkIntensity,
            roughness: 0.3,
            metalness: 0.2
        });
        materialStore.push(trunkMaterial);

        const trunkHeight = 2.4;
        const trunkGeometry = new THREE.CylinderGeometry(0.18, 0.26, trunkHeight, 18, 1);
        geometryStore.push(trunkGeometry);
        const trunkMesh = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunkMesh.position.y = trunkHeight / 2;
        rootGroup.add(trunkMesh);

        const somaMaterial = new THREE.MeshStandardMaterial({
            color: palettes.processing.core,
            emissive: palettes.processing.glow,
            emissiveIntensity: palettes.processing.somaIntensity,
            roughness: 0.2,
            metalness: 0.15
        });
        materialStore.push(somaMaterial);

        const somaGeometry = new THREE.SphereGeometry(0.28, 32, 32);
        geometryStore.push(somaGeometry);
        const somaMesh = new THREE.Mesh(somaGeometry, somaMaterial);
        somaMesh.position.y = trunkHeight;
        rootGroup.add(somaMesh);

        const somaGlowMaterial = new THREE.MeshBasicMaterial({
            color: palettes.processing.glow,
            transparent: true,
            opacity: 0.45,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        materialStore.push(somaGlowMaterial);

        const somaGlowGeometry = new THREE.SphereGeometry(0.46, 32, 32);
        geometryStore.push(somaGlowGeometry);
        const somaGlowMesh = new THREE.Mesh(somaGlowGeometry, somaGlowMaterial);
        somaGlowMesh.position.y = trunkHeight;
        rootGroup.add(somaGlowMesh);

        const rootMaterial = new THREE.MeshStandardMaterial({
            color: palettes.processing.trunk,
            emissive: palettes.processing.trunkEmissive,
            emissiveIntensity: palettes.processing.trunkIntensity,
            roughness: 0.35,
            metalness: 0.15
        });
        materialStore.push(rootMaterial);

        const rootGlowMaterial = new THREE.MeshBasicMaterial({
            color: palettes.processing.glow,
            transparent: true,
            opacity: 0.2,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        materialStore.push(rootGlowMaterial);

        const rootsGroup = new THREE.Group();
        rootGroup.add(rootsGroup);

        const rootCurves = [];
        const rootCount = 5;
        for (let i = 0; i < rootCount; i += 1) {
            const angle = (-0.85 + (i / (rootCount - 1)) * 1.7) * Math.PI;
            const end = new THREE.Vector3(Math.cos(angle) * 1.8, -0.9, Math.sin(angle) * 1.2);
            const mid = new THREE.Vector3(end.x * 0.45, -0.3, end.z * 0.35);
            const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, 0), mid, end]);
            rootCurves.push(curve);

            const rootGeometry = new THREE.TubeGeometry(curve, 18, 0.07, 6, false);
            geometryStore.push(rootGeometry);
            const rootMesh = new THREE.Mesh(rootGeometry, rootMaterial);
            rootsGroup.add(rootMesh);

            const rootGlowGeometry = new THREE.TubeGeometry(curve, 18, 0.11, 6, false);
            geometryStore.push(rootGlowGeometry);
            const rootGlowMesh = new THREE.Mesh(rootGlowGeometry, rootGlowMaterial);
            rootsGroup.add(rootGlowMesh);
        }

        const stageGroups = [];
        const stageParticles = [];
        const rootParticles = [];

        const particleGeometry = new THREE.SphereGeometry(0.05, 10, 10);
        geometryStore.push(particleGeometry);
        const particleMaterial = new THREE.MeshBasicMaterial({
            color: 0xeaf7ee,
            transparent: true,
            opacity: 0.9,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        materialStore.push(particleMaterial);

        const mulberry32 = (seed) => () => {
            let t = seed += 0x6D2B79F5;
            t = Math.imul(t ^ (t >>> 15), t | 1);
            t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };

        const createStageMaterials = () => {
            const core = new THREE.MeshStandardMaterial({
                color: palettes.processing.core,
                emissive: palettes.processing.emissive,
                emissiveIntensity: 1,
                roughness: 0.3,
                metalness: 0.15
            });
            const glow = new THREE.MeshBasicMaterial({
                color: palettes.processing.glow,
                transparent: true,
                opacity: palettes.processing.glowOpacity,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            });
            const node = new THREE.MeshStandardMaterial({
                color: palettes.processing.node,
                emissive: palettes.processing.glow,
                emissiveIntensity: palettes.processing.nodeIntensity,
                roughness: 0.2,
                metalness: 0.1
            });
            materialStore.push(core, glow, node);
            return { core, glow, node };
        };

        const addBranchSegment = (start, direction, length, radius, materials, group) => {
            const end = start.clone().add(direction.clone().multiplyScalar(length));
            const mid = start.clone().lerp(end, 0.55).add(new THREE.Vector3(0, length * 0.14, 0));
            const curve = new THREE.CatmullRomCurve3([start, mid, end]);

            const coreGeometry = new THREE.TubeGeometry(curve, 20, radius, 6, false);
            geometryStore.push(coreGeometry);
            const coreMesh = new THREE.Mesh(coreGeometry, materials.core);
            group.add(coreMesh);

            const glowGeometry = new THREE.TubeGeometry(curve, 20, radius * 1.6, 6, false);
            geometryStore.push(glowGeometry);
            const glowMesh = new THREE.Mesh(glowGeometry, materials.glow);
            group.add(glowMesh);

            return { curve, end };
        };

        const addBranchCluster = (start, direction, length, depth, radius, materials, group, rng, mainCurveStore) => {
            const { curve, end } = addBranchSegment(start, direction, length, radius, materials, group);
            if (mainCurveStore && mainCurveStore.length === 0) mainCurveStore.push(curve);

            if (depth === 0) {
                const nodeGeometry = new THREE.SphereGeometry(radius * 1.8, 12, 12);
                geometryStore.push(nodeGeometry);
                const nodeMesh = new THREE.Mesh(nodeGeometry, materials.node);
                nodeMesh.position.copy(end);
                group.add(nodeMesh);
                return;
            }

            const childCount = 2 + (rng() > 0.6 ? 1 : 0);
            for (let i = 0; i < childCount; i += 1) {
                const axis = new THREE.Vector3(rng() - 0.5, 0.35 + rng() * 0.6, rng() - 0.5).normalize();
                const angle = (0.3 + rng() * 0.5) * (rng() > 0.5 ? 1 : -1);
                const childDir = direction.clone().applyAxisAngle(axis, angle).normalize();
                addBranchCluster(end, childDir, length * (0.65 + rng() * 0.1), depth - 1, radius * 0.72, materials, group, rng, null);
            }
        };

        const stageTotal = stageCount || 8;
        for (let i = 0; i < stageTotal; i += 1) {
            const rng = mulberry32(900 + i * 37);
            const stageGroup = new THREE.Group();
            const materials = createStageMaterials();
            const baseAngle = (i / stageTotal) * Math.PI * 2;
            const direction = new THREE.Vector3(Math.cos(baseAngle) * 0.9, 0.7, Math.sin(baseAngle) * 0.9).normalize();
            const mainCurveStore = [];
            addBranchCluster(
                new THREE.Vector3(0, trunkHeight, 0),
                direction,
                1.9,
                2,
                0.075,
                materials,
                stageGroup,
                rng,
                mainCurveStore
            );
            stageGroup.userData = { stageIndex: i + 1, materials, mainCurve: mainCurveStore[0] };
            stageGroups.push(stageGroup.userData);
            rootGroup.add(stageGroup);

            if (mainCurveStore[0]) {
                const particleMesh = new THREE.Mesh(particleGeometry, particleMaterial);
                particleMesh.visible = false;
                rootGroup.add(particleMesh);
                stageParticles.push({
                    mesh: particleMesh,
                    curve: mainCurveStore[0],
                    offset: rng(),
                    speed: 0.18 + rng() * 0.12,
                    stageIndex: i + 1
                });
            }
        }

        rootCurves.forEach((curve, curveIndex) => {
            for (let i = 0; i < 3; i += 1) {
                const particleMesh = new THREE.Mesh(particleGeometry, particleMaterial);
                rootGroup.add(particleMesh);
                rootParticles.push({
                    mesh: particleMesh,
                    curve,
                    offset: (curveIndex * 0.2 + i * 0.3) % 1,
                    speed: 0.22 + i * 0.05
                });
            }
        });

        const resize = () => {
            const width = container.clientWidth || 1;
            const height = container.clientHeight || 1;
            renderer.setSize(width, height, false);
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
        };

        window.addEventListener('resize', resize);
        resize();

        const applyStagePalette = (materials, palette, intensity) => {
            materials.core.color.copy(palette.core);
            materials.core.emissive.copy(palette.emissive);
            materials.core.emissiveIntensity = intensity;
            materials.glow.color.copy(palette.glow);
            materials.glow.opacity = palette.glowOpacity * Math.min(1.5, intensity);
            materials.node.color.copy(palette.node);
            materials.node.emissive.copy(palette.glow);
            materials.node.emissiveIntensity = palette.nodeIntensity * Math.min(1.6, intensity);
        };

        const clock = new THREE.Clock();
        let animationId = null;

        const animate = () => {
            const delta = clock.getDelta();
            const elapsed = clock.getElapsedTime();
            const { sceneState: currentState, activeStageNumber: activeStage, stageCount: totalStages, isAnalyzing: analyzing } = stateRef.current;
            const palette = palettes[currentState] || palettes.idle;
            const pulse = 0.85 + Math.sin(elapsed * 2.2) * 0.15;
            const completeState = currentState === 'pass' || currentState === 'fail';

            trunkMaterial.color.copy(palette.trunk);
            trunkMaterial.emissive.copy(palette.trunkEmissive);
            trunkMaterial.emissiveIntensity = palette.trunkIntensity * (currentState === 'processing' ? pulse : 1);

            somaMaterial.color.copy(palette.core);
            somaMaterial.emissive.copy(palette.glow);
            somaMaterial.emissiveIntensity = palette.somaIntensity * (currentState === 'processing' ? pulse : 1);
            somaGlowMaterial.color.copy(palette.glow);
            somaGlowMaterial.opacity = palette.glowOpacity * (currentState === 'processing' ? 1.3 : 1);

            rootMaterial.color.copy(palette.trunk);
            rootMaterial.emissive.copy(palette.trunkEmissive);
            rootMaterial.emissiveIntensity = palette.trunkIntensity * 0.85;
            rootGlowMaterial.color.copy(palette.glow);
            rootGlowMaterial.opacity = palette.glowOpacity * 0.7;

            stageGroups.forEach((stage) => {
                const stageIndex = stage.stageIndex;
                const isCritical = currentState === 'fail' && stageIndex === (totalStages || stageTotal);
                let intensity = 0.45;
                let stagePalette = palettes.idle;

                if (completeState) {
                    stagePalette = palette;
                    intensity = isCritical ? 1.6 : 1.15;
                } else if (analyzing) {
                    if (stageIndex === activeStage) {
                        stagePalette = palettes.processing;
                        intensity = 1.25 * pulse;
                    } else if (stageIndex < activeStage) {
                        stagePalette = palettes.processing;
                        intensity = 0.95;
                    }
                }

                applyStagePalette(stage.materials, stagePalette, intensity);
            });

            rootParticles.forEach((particle) => {
                particle.offset = (particle.offset + delta * particle.speed) % 1;
                particle.mesh.position.copy(particle.curve.getPointAt(particle.offset));
            });

            stageParticles.forEach((particle) => {
                const visible = completeState || (analyzing && particle.stageIndex <= activeStage);
                particle.mesh.visible = visible;
                if (!visible) return;
                particle.offset = (particle.offset + delta * particle.speed) % 1;
                particle.mesh.position.copy(particle.curve.getPointAt(particle.offset));
            });

            rootGroup.rotation.y = elapsed * 0.08;
            rootGroup.rotation.x = Math.sin(elapsed * 0.35) * 0.03;

            renderer.render(scene, camera);
            animationId = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            if (animationId) cancelAnimationFrame(animationId);
            window.removeEventListener('resize', resize);
            renderer.dispose();
            materialStore.forEach((material) => material.dispose());
            geometryStore.forEach((geometry) => geometry.dispose());
            if (renderer.domElement && renderer.domElement.parentNode) {
                renderer.domElement.parentNode.removeChild(renderer.domElement);
            }
        };
    }, []);

    return <div ref={containerRef} className="neural-tree-canvas" />;
};

const NetworkUniverseScene = ({
    sceneState,
    activeStageNumber,
    stageCount,
    isAnalyzing,
    pipelineStages,
    result,
    statusHeadline,
    statusMessage
}) => {
    const containerRef = useRef(null);
    const labelRefs = useRef([]);
    const stateRef = useRef({ sceneState, activeStageNumber });

    useEffect(() => {
        stateRef.current = { sceneState, activeStageNumber };
    }, [sceneState, activeStageNumber]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return undefined;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 100);
        camera.position.z = 10;

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setClearColor(0x000000, 0);
        container.appendChild(renderer.domElement);

        const colorCyan = new THREE.Color(0x2dd4bf);
        const colorGreen = new THREE.Color(0x10b981);
        const colorRed = new THREE.Color(0xef4444);
        const colorDim = new THREE.Color(0x07262b);
        const colorWhite = new THREE.Color(0xffffff);
        const mutedRed = new THREE.Color(0x7f1d1d);

        const targetColor = colorCyan.clone();

        const pCount = 190;
        const pGeo = new THREE.BufferGeometry();
        const pPos = new Float32Array(pCount * 3);
        const pVel = [];

        for (let i = 0; i < pCount; i += 1) {
            pPos[i * 3] = (Math.random() - 0.5) * 22;
            pPos[i * 3 + 1] = (Math.random() - 0.5) * 14;
            pPos[i * 3 + 2] = (Math.random() - 0.5) * 10 - 2;
            pVel.push({
                x: (Math.random() - 0.5) * 0.012,
                y: (Math.random() - 0.5) * 0.012,
                z: (Math.random() - 0.5) * 0.012
            });
        }

        pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
        const pMat = new THREE.PointsMaterial({
            color: colorCyan,
            size: 0.06,
            transparent: true,
            opacity: 0.55,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        const particles = new THREE.Points(pGeo, pMat);
        scene.add(particles);

        const lMat = new THREE.LineBasicMaterial({
            color: colorCyan,
            transparent: true,
            opacity: 0.12,
            blending: THREE.AdditiveBlending
        });
        const lGeo = new THREE.BufferGeometry();
        const linesMesh = new THREE.LineSegments(lGeo, lMat);
        scene.add(linesMesh);

        const nodePositions = [
            new THREE.Vector3(-4.8, 2.6, 0),
            new THREE.Vector3(-3.2, 0.9, 1.2),
            new THREE.Vector3(-4.0, -1.8, -0.2),
            new THREE.Vector3(-1.0, -1.0, -1.1),
            new THREE.Vector3(1.6, -2.2, 0.1),
            new THREE.Vector3(3.4, -0.8, 1.3),
            new THREE.Vector3(1.8, 2.2, 0.2),
            new THREE.Vector3(4.8, 1.8, -0.8)
        ];

        const nodeGroup = new THREE.Group();
        scene.add(nodeGroup);
        const nodeMeshes = [];
        const glowGeo = new THREE.SphereGeometry(0.75, 20, 20);
        const glowBaseMat = new THREE.MeshBasicMaterial({
            color: colorCyan,
            transparent: true,
            opacity: 0.5,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        nodePositions.forEach((pos) => {
            const geo = new THREE.SphereGeometry(0.2, 16, 16);
            const mat = new THREE.MeshBasicMaterial({ color: colorCyan });
            const mesh = new THREE.Mesh(geo, mat);
            const glowMat = glowBaseMat.clone();
            const glowMesh = new THREE.Mesh(glowGeo, glowMat);
            mesh.position.copy(pos);
            glowMesh.position.copy(pos);
            nodeGroup.add(mesh);
            nodeGroup.add(glowMesh);
            nodeMeshes.push({ mesh, glow: glowMesh, baseScale: 1 });
        });

        const pathGeo = new THREE.BufferGeometry();
        const pathPos = new Float32Array((nodePositions.length - 1) * 6);
        let idx = 0;
        for (let i = 0; i < nodePositions.length - 1; i += 1) {
            pathPos[idx++] = nodePositions[i].x;
            pathPos[idx++] = nodePositions[i].y;
            pathPos[idx++] = nodePositions[i].z;
            pathPos[idx++] = nodePositions[i + 1].x;
            pathPos[idx++] = nodePositions[i + 1].y;
            pathPos[idx++] = nodePositions[i + 1].z;
        }
        pathGeo.setAttribute('position', new THREE.BufferAttribute(pathPos, 3));
        const pathMat = new THREE.LineBasicMaterial({
            color: colorCyan,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });
        const pathLines = new THREE.LineSegments(pathGeo, pathMat);
        scene.add(pathLines);

        const pulseGeo = new THREE.SphereGeometry(0.12, 12, 12);
        const pulseMat = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.9,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        const pulseMesh = new THREE.Mesh(pulseGeo, pulseMat);
        scene.add(pulseMesh);

        const resize = () => {
            const width = container.clientWidth || 1;
            const height = container.clientHeight || 1;
            renderer.setSize(width, height);
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
        };
        window.addEventListener('resize', resize);
        resize();

        let rafId;
        const tempVec = new THREE.Vector3();

        const animate = () => {
            const { sceneState: currentSt, activeStageNumber: activeNum } = stateRef.current;

            if (currentSt === 'pass') targetColor.copy(colorGreen);
            else if (currentSt === 'fail') targetColor.copy(colorRed);
            else targetColor.copy(colorCyan);

            pMat.color.lerp(targetColor, 0.05);
            lMat.color.lerp(targetColor, 0.05);
            pathMat.color.lerp(targetColor, 0.05);

            const posAttr = particles.geometry.attributes.position.array;
            const linePositions = [];
            for (let i = 0; i < pCount; i += 1) {
                posAttr[i * 3] += pVel[i].x;
                posAttr[i * 3 + 1] += pVel[i].y;
                posAttr[i * 3 + 2] += pVel[i].z;
                if (posAttr[i * 3] > 14 || posAttr[i * 3] < -14) pVel[i].x *= -1;
                if (posAttr[i * 3 + 1] > 9 || posAttr[i * 3 + 1] < -9) pVel[i].y *= -1;
                if (posAttr[i * 3 + 2] > 7 || posAttr[i * 3 + 2] < -7) pVel[i].z *= -1;
            }

            for (let i = 0; i < pCount; i += 1) {
                const v1 = new THREE.Vector3(posAttr[i * 3], posAttr[i * 3 + 1], posAttr[i * 3 + 2]);
                for (let j = i + 1; j < pCount; j += 1) {
                    const v2 = new THREE.Vector3(posAttr[j * 3], posAttr[j * 3 + 1], posAttr[j * 3 + 2]);
                    if (v1.distanceTo(v2) < 2.5) {
                        linePositions.push(v1.x, v1.y, v1.z, v2.x, v2.y, v2.z);
                    }
                }
            }
            lGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
            particles.geometry.attributes.position.needsUpdate = true;

            scene.rotation.y = Math.sin(Date.now() * 0.0002) * 0.15;
            scene.rotation.x = Math.cos(Date.now() * 0.0003) * 0.1;

            nodePositions.forEach((nodePos, i) => {
                const node = nodeMeshes[i];
                const isPassed = i < activeNum - 1 || currentSt === 'pass' || currentSt === 'fail';
                const isActive = i === activeNum - 1 && currentSt === 'processing';
                const isCritical = currentSt === 'fail' && i === activeNum - 1;

                let glowOpacity = 0.35;

                if (currentSt === 'pass') {
                    node.mesh.material.color.lerp(colorGreen, 0.1);
                    node.baseScale = THREE.MathUtils.lerp(node.baseScale, 1.2, 0.1);
                    glowOpacity = 0.7;
                } else if (currentSt === 'fail') {
                    node.mesh.material.color.lerp(isCritical ? colorRed : mutedRed, 0.1);
                    node.baseScale = THREE.MathUtils.lerp(node.baseScale, isCritical ? 2.2 : 0.8, 0.1);
                    glowOpacity = isCritical ? 0.9 : 0.45;
                } else {
                    if (isActive) {
                        node.mesh.material.color.lerp(colorWhite, 0.1);
                        node.baseScale = 1.8 + Math.sin(Date.now() * 0.008) * 0.3;
                        glowOpacity = 0.85;
                    } else if (isPassed) {
                        node.mesh.material.color.lerp(colorCyan, 0.1);
                        node.baseScale = THREE.MathUtils.lerp(node.baseScale, 1.2, 0.1);
                        glowOpacity = 0.65;
                    } else {
                        node.mesh.material.color.lerp(colorDim, 0.1);
                        node.baseScale = THREE.MathUtils.lerp(node.baseScale, 0.7, 0.1);
                        glowOpacity = 0.4;
                    }
                }
                node.mesh.scale.set(node.baseScale, node.baseScale, node.baseScale);

                if (node.glow) {
                    node.glow.material.color.copy(node.mesh.material.color);
                    node.glow.material.opacity = glowOpacity;
                    const glowScale = node.baseScale * 3.1;
                    node.glow.scale.set(glowScale, glowScale, glowScale);
                }

                if (labelRefs.current[i]) {
                    node.mesh.getWorldPosition(tempVec);
                    tempVec.project(camera);
                    const wHalf = container.clientWidth / 2;
                    const hHalf = container.clientHeight / 2;
                    const x = (tempVec.x * wHalf) + wHalf;
                    const y = -(tempVec.y * hHalf) + hHalf;
                    labelRefs.current[i].style.transform = 'translate(-50%, -100%)';
                    labelRefs.current[i].style.left = `${x}px`;
                    labelRefs.current[i].style.top = `${y - 18}px`;
                }
            });

            if (currentSt === 'processing' && activeNum > 1 && activeNum <= nodePositions.length) {
                pulseMesh.visible = true;
                const p1 = nodePositions[activeNum - 2].clone().applyEuler(scene.rotation);
                const p2 = nodePositions[activeNum - 1].clone().applyEuler(scene.rotation);
                const t = (Date.now() % 900) / 900;
                pulseMesh.position.copy(p1.lerp(p2, t));
                pulseMat.color.copy(colorCyan);
            } else {
                pulseMesh.visible = false;
            }

            renderer.render(scene, camera);
            rafId = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            cancelAnimationFrame(rafId);
            window.removeEventListener('resize', resize);
            renderer.dispose();
            if (renderer.domElement && renderer.domElement.parentNode) {
                renderer.domElement.parentNode.removeChild(renderer.domElement);
            }
        };
    }, []);

    const overlayBase = sceneState === 'pass'
        ? 'text-emerald-300'
        : sceneState === 'fail'
            ? 'text-red-400'
            : 'text-teal-300';

    return (
        <div ref={containerRef} className="absolute inset-0 w-full h-full font-sans">
            {(pipelineStages || []).map((stage, i) => {
                const isActive = isAnalyzing && i + 1 === activeStageNumber;
                const isPassed = !isAnalyzing && result ? true : i + 1 < activeStageNumber;
                return (
                    <div
                        key={stage || i}
                        ref={(el) => { labelRefs.current[i] = el; }}
                        className="absolute w-40 text-center pointer-events-none transition-all duration-200"
                        style={{ top: '-999px', left: '-999px' }}
                    >
                        <div
                            className={`text-[10px] uppercase font-bold tracking-[0.2em] transition-colors ${isActive
                                    ? 'text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.6)]'
                                    : isPassed
                                        ? 'text-teal-200/90'
                                        : 'text-teal-200/40'
                                }`}
                        >
                            Stage {i + 1}
                        </div>
                        <div
                            className={`text-xs uppercase font-black tracking-tight leading-tight transition-colors ${isActive
                                    ? 'text-teal-200 scale-110 drop-shadow-[0_0_10px_rgba(45,212,191,0.8)]'
                                    : isPassed
                                        ? 'text-teal-200/80'
                                        : 'text-teal-200/40'
                                }`}
                        >
                            {stage}
                        </div>
                    </div>
                );
            })}

        </div>
    );
};

const getProcessingTheme = (analysisState) => {
    switch (analysisState) {
        case 'safe':
            return {
                main: '#059669',
                rgb: '5, 150, 105',
                text: 'text-emerald-700',
                bg: 'bg-[#fdfbf7]',
                label: 'SAFE'
            };
        case 'danger':
            return {
                main: '#DC2626',
                rgb: '220, 38, 38',
                text: 'text-red-700',
                bg: 'bg-[#fdfbf7]',
                label: 'DANGER'
            };
        default:
            return {
                main: '#5D4037',
                rgb: '93, 64, 55',
                text: 'text-stone-700',
                bg: 'bg-[#fdfbf7]',
                label: 'PROCESSING'
            };
    }
};

const buildProcessingLogs = (analysisState, activeStep) => {
    if (analysisState === 'idle') {
        return ['[SYSTEM] INITIALIZED. READY FOR ACOUSTIC ANALYSIS.'];
    }

    const lines = ['[SYSTEM] INITIALIZING BATCH ANALYSIS...'];
    const totalSteps = PROCESSING_STEPS.length;
    const clampedStep = Math.min(Math.max(activeStep, 0), totalSteps);

    if (analysisState === 'processing') {
        const completedCount = clampedStep > 0 ? Math.max(clampedStep - 1, 0) : 0;
        for (let i = 0; i < completedCount; i += 1) {
            lines.push(`> [${PROCESSING_STEPS[i].label}] ... COMPLETED`);
        }
        const currentStep = PROCESSING_STEPS[Math.min(completedCount, totalSteps - 1)];
        if (currentStep) {
            lines.push(`> [${currentStep.label}] ... PROCESSING`);
        }
    } else {
        for (let i = 0; i < totalSteps; i += 1) {
            lines.push(`> [${PROCESSING_STEPS[i].label}] ... COMPLETED`);
        }
    }

    if (analysisState === 'safe') {
        lines.push('> [FINAL RESULT] CLASSIFICATION: SAFE');
    }
    if (analysisState === 'danger') {
        lines.push('> [FINAL RESULT] CLASSIFICATION: CRITICAL THREAT DETECTED');
    }

    return lines;
};

const RealTimeProcessingPanel = ({ analysisState, activeStep, onRunAnalysis, isAnalyzing, confidence }) => {

    const canvasRef = useRef(null);
    const animationRef = useRef(null);
    const stepRefs = useRef([]);

    const theme = getProcessingTheme(analysisState);
    const FIXED_BROWN = '#5D4037';
    const FIXED_BROWN_RGB = '93, 64, 55';


    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return undefined;
        const ctx = canvas.getContext('2d');

        let width = canvas.offsetWidth || canvas.parentElement?.offsetWidth || 1200;
        let height = canvas.offsetHeight || canvas.parentElement?.offsetHeight || 600;
        canvas.width = width;
        canvas.height = height;

        const particles = [];
        const particleCount = 180;
        const maxDistance = 150;

        for (let i = 0; i < particleCount; i += 1) {
            particles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                vx: (Math.random() - 0.5) * 1.2,
                vy: (Math.random() - 0.5) * 1.2,
                radius: Math.random() * 2 + 0.5
            });
        }

        const draw = () => {
            ctx.clearRect(0, 0, width, height);
            const time = Date.now() * 0.001;

            const stepPositions = PROCESSING_STEPS.map((step) => {
                const baseX = width * (step.x / 100);
                const baseY = height * (step.y / 100);
                const floatX = Math.sin(time * 0.6 + step.id * 1.5) * 20;
                const floatY = Math.cos(time * 0.8 + step.id * 0.8) * 20;
                return {
                    ...step,
                    actualX: baseX + floatX,
                    actualY: baseY + floatY,
                    floatX,
                    floatY
                };
            });

            stepPositions.forEach((sp, i) => {
                if (stepRefs.current[i]) {
                    stepRefs.current[i].style.transform = `translate(-50%, -50%) translate(${sp.floatX}px, ${sp.floatY}px)`;
                }
            });

            const centerStep = stepPositions.find((step) => step.isCenter);

            if (centerStep) {
                stepPositions.forEach((sp) => {
                    if (sp.isCenter) return;

                    const isCompleted = activeStep >= sp.id;
                    const isActive = activeStep === sp.id;

                    ctx.beginPath();
                    ctx.moveTo(sp.actualX, sp.actualY);
                    ctx.lineTo(centerStep.actualX, centerStep.actualY);

                    if (isCompleted || isActive) {
                        ctx.strokeStyle = FIXED_BROWN;
                        ctx.lineWidth = isCompleted ? 2.5 : 1.5;
                        ctx.shadowColor = FIXED_BROWN;
                        ctx.shadowBlur = 12 + Math.sin(time * 5 + sp.id) * 6;
                    } else {
                        ctx.strokeStyle = 'rgba(0, 0, 0, 0.06)';
                        ctx.lineWidth = 1;
                        ctx.shadowBlur = 0;
                    }

                    ctx.setLineDash([]);

                    ctx.stroke();
                    ctx.setLineDash([]);
                    ctx.shadowBlur = 0;
                });
            }

            for (let i = 0; i < particleCount; i += 1) {
                const particle = particles[i];
                particle.x += particle.vx;
                particle.y += particle.vy;

                if (particle.x < 0) particle.x = width;
                else if (particle.x > width) particle.x = 0;

                if (particle.y < 0) particle.y = height;
                else if (particle.y > height) particle.y = 0;

                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(0, 0, 0, ${activeStep > 0 ? 0.15 : 0.05})`;
                ctx.fill();

                for (let j = i + 1; j < particleCount; j += 1) {
                    const other = particles[j];
                    const dx = particle.x - other.x;
                    const dy = particle.y - other.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < maxDistance) {
                        ctx.beginPath();
                        ctx.moveTo(particle.x, particle.y);
                        ctx.lineTo(other.x, other.y);
                        const opacity = (1 - dist / maxDistance) * (activeStep > 0 ? 0.15 : 0.05);
                        ctx.strokeStyle = `rgba(0, 0, 0, ${opacity})`;
                        ctx.lineWidth = 1;
                        ctx.stroke();
                    }
                }

                for (let j = 0; j < stepPositions.length; j += 1) {
                    const sp = stepPositions[j];
                    const dx = particle.x - sp.actualX;
                    const dy = particle.y - sp.actualY;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    const connectionDist = 220;

                    if (dist < connectionDist) {
                        ctx.beginPath();
                        ctx.moveTo(particle.x, particle.y);
                        ctx.lineTo(sp.actualX, sp.actualY);

                        const isCompleted = activeStep >= sp.id;
                        const isActive = activeStep === sp.id;
                        let opacityMultiplier = isCompleted ? 0.6 : (activeStep > 0 ? 0.15 : 0.05);
                        if (isActive) opacityMultiplier = 0.8;
                        const opacity = (1 - dist / connectionDist) * opacityMultiplier;

                        if (isCompleted || isActive) {
                            ctx.strokeStyle = `rgba(${FIXED_BROWN_RGB}, ${opacity})`;
                            ctx.lineWidth = isActive ? 2 : 1;
                            ctx.shadowColor = FIXED_BROWN;
                            ctx.shadowBlur = 8 * (1 - dist / connectionDist);
                        } else {
                            ctx.strokeStyle = `rgba(0, 0, 0, ${opacity})`;
                            ctx.lineWidth = 0.5;
                            ctx.shadowBlur = 0;
                        }

                        ctx.stroke();
                        ctx.shadowBlur = 0;
                    }
                }
            }

            animationRef.current = requestAnimationFrame(draw);
        };

        draw();

        const handleResize = () => {
            width = canvas.offsetWidth || canvas.parentElement?.offsetWidth || window.innerWidth * 0.8;
            height = canvas.offsetHeight || canvas.parentElement?.offsetHeight || (window.innerWidth * 0.8) / 2;
            canvas.width = width;
            canvas.height = height;
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, [theme.rgb, theme.main, activeStep]);

    const scrollToSection = (id) => {
        const element = document.getElementById(id);
        if (element) {
            const headerOffset = 100;
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
            window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
        }
    };

    return (
        <div className={`h-screen text-[#2B2927] px-8 pt-2 pb-8 font-sans transition-colors duration-1000 flex flex-col items-center ${theme.bg}`}>
            <header className="flex flex-col items-center mb-6 relative z-10 w-full max-w-[1400px]">
                <div className="flex flex-col items-center text-center">
                    <div>
                        <h1 className="text-4xl font-black tracking-widest mb-1 text-[#222]">SYSTEM FEED</h1>
                        <h2 className={`text-sm font-bold tracking-widest uppercase transition-colors duration-1000 ${theme.text}`}>
                            REAL-TIME DIAGNOSTICS.
                        </h2>
                    </div>
                </div>

            </header>

            <div className="flex-1 w-full flex flex-col items-center justify-center pb-64">
                <div 
                    className="relative w-full max-w-[1100px] aspect-[2.2/1] bg-white border-2 border-[#D2691E]/30 rounded-3xl shadow-lg overflow-hidden"
                    style={{ boxShadow: '0 20px 50px -10px rgba(210, 105, 30, 0.25), 0 0 15px rgba(210, 105, 30, 0.15)' }}
                >
                    <canvas
                        ref={canvasRef}
                        className="absolute inset-0 w-full h-full pointer-events-none z-10"
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent pointer-events-none" />

                    {PROCESSING_STEPS.map((step, index) => {
                        const isCompleted = activeStep >= step.id;
                        const isActive = activeStep === step.id;
                        const isPending = activeStep < step.id;
                        const Icon = step.icon;

                        return (
                            <div
                                key={step.id}
                                ref={(el) => { stepRefs.current[index] = el; }}
                                className={`absolute flex flex-col items-center justify-center ${step.isCenter ? 'z-30' : 'z-20'}`}
                                style={{
                                    left: `${step.x}%`,
                                    top: `${step.y}%`,
                                    transform: 'translate(-50%, -50%)',
                                    opacity: isPending && analysisState !== 'idle' ? 0.6 : 1
                                }}
                            >
                                <div
                                    className={`relative flex items-center justify-center rounded-full transition-all duration-500 backdrop-blur-md ${isActive ? 'scale-125 bg-white border-2' : 'scale-100 bg-white/90 border border-gray-100'
                                        } ${step.isCenter ? 'w-24 h-24' : 'w-14 h-14'}`}
                                    style={{ borderColor: isActive ? FIXED_BROWN : undefined }}

                                >
                                    <div
                                        className="absolute inset-0 rounded-full transition-colors duration-1000"
                                        style={{
                                            backgroundColor: isCompleted ? FIXED_BROWN : 'transparent',
                                            opacity: isCompleted ? 0.1 : 1
                                        }}

                                    />


                                    <Icon
                                        size={step.isCenter ? 48 : 24}
                                        className="relative z-10 transition-colors duration-1000"
                                        color={isCompleted ? FIXED_BROWN : (isActive ? FIXED_BROWN : '#6B7280')}

                                    />
                                </div>

                                {!step.isCenter && (
                                    <div className="mt-2 flex flex-col items-center">
                                        <span className={`text-[10px] font-bold tracking-wider text-center transition-colors duration-500 whitespace-nowrap ${isActive || isCompleted ? 'text-gray-900' : 'text-gray-500'
                                            }`}>
                                            {step.id}. {step.label}
                                        </span>

                                        <div className="w-20 h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden shadow-inner border border-gray-200">
                                            <div
                                                className="h-full transition-all duration-[1200ms] ease-linear"
                                                style={{
                                                    width: isCompleted ? '100%' : '0%',
                                                    backgroundColor: FIXED_BROWN

                                                }}
                                            />
                                        </div>
                                    </div>
                                )}

                                {step.isCenter && (
                                    <div className="absolute top-full mt-2 text-center w-40">
                                        <div className="text-xl font-black tracking-widest text-gray-900 drop-shadow-sm">
                                            NEURAL FUSION
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}

                </div>
                
                {analysisState !== 'idle' && analysisState !== 'processing' && (
                    <div className="mt-1 animate-in zoom-in duration-700">
                        <div className="text-center">
                            <div
                                className="text-5xl font-black tracking-tighter drop-shadow-sm uppercase text-center"
                                style={{ color: theme.main }}
                            >
                                {theme.label}
                            </div>
                            <p className="text-stone-500 font-bold tracking-[0.3em] uppercase mt-2 text-sm">
                                Confidence Level: {confidence !== undefined ? `${confidence}%` : '---'}
                            </p>
                        </div>
                    </div>
                )}
            </div>


        </div>
    );
};

const DroneHero = () => {
    const droneRef = useRef(null);   // scroll-driven outer container
    const textRef = useRef(null);
    const btnRef = useRef(null);
    const leftPanelRef = useRef(null);
    const rightPanelRef = useRef(null);
    const typeRef1 = useRef(null);
    const typeRef2 = useRef(null);
    const typeRef3 = useRef(null);
    const typeRef4 = useRef(null);

    useEffect(() => {
        let rafId = null;

        const update = () => {
            const scrollY = window.scrollY;
            const vh = window.innerHeight || 800;
            const vw = window.innerWidth || 1200;
            rafId = null;

            const textOpacity = Math.max(0, 1 - scrollY / (vh * 0.4));

            // t goes 0 -> 1 over 1.2 screen heights
            const t = Math.min(scrollY / (vh * 1.2), 1);

            // Exponential scale — simulates drone approaching from far away
            // Starts tiny (far away), grows rapidly (rushing towards viewer)
            const easedT = Math.pow(t, 0.6);           // accelerates mid-scroll
            const scale = 0.55 + easedT * 4.5;         // 0.55 (far) → 5.05 (close)

            // Diagonal: start upper-right, sweep to lower-left, matching real flight path
            const tx = 550 - easedT * (550 + vw * 0.62);  // far right → off left edge
            const ty = -100 + easedT * 160;                // high up → slightly below center

            // Tilt: banking right when far, levels then banks left as it approaches
            const rotate = 12 - easedT * 26;              // +12° → -14°

            // Opacity: fully visible until 65%, then fades cleanly
            const opacity = t < 0.65 ? 1 : Math.max(1 - (t - 0.65) / 0.35, 0);

            // Scroll-driven text writing, synchronized to happen at the same time
            // Both motions scale directly with the drone's scroll speed, finishing quickly (t from 0 to 0.28) to avoid collision
            const sharedProgress = Math.max(0, Math.min(t / 0.28, 1));

            // Left text starts fully typed (1), then un-types (to 0)
            const typeProgressLeft = 1 - sharedProgress;
            // Right text starts empty (0), then types (to 1)
            const typeProgressRight = sharedProgress;

            const str1 = "SYS.INIT: ACOUSTIC_DEFENSE";
            const str2 = "WE LISTEN WHEN THE NAKED EYE FAILS.";
            const str3 = "DETECTING MICRO-UAV ANOMALIES.";
            const str4 = "SECURING AIRSPACE WITH 97.5% PRECISION.";

            const leftChars = str1.length + str2.length;
            const leftCharsToShow = Math.floor(typeProgressLeft * leftChars);

            if (typeRef1.current) {
                const children = typeRef1.current.children;
                for (let i = 0; i < children.length; i++) children[i].style.opacity = i < leftCharsToShow ? '1' : '0';
            }
            if (typeRef2.current) {
                const children = typeRef2.current.children;
                const offset = str1.length;
                for (let i = 0; i < children.length; i++) children[i].style.opacity = (i + offset) < leftCharsToShow ? '1' : '0';
            }

            const rightChars = str3.length + str4.length;
            const rightCharsToShow = Math.floor(typeProgressRight * rightChars);

            if (typeRef3.current) {
                const children = typeRef3.current.children;
                for (let i = 0; i < children.length; i++) children[i].style.opacity = i < rightCharsToShow ? '1' : '0';
            }
            if (typeRef4.current) {
                const children = typeRef4.current.children;
                const offset = str3.length;
                for (let i = 0; i < children.length; i++) children[i].style.opacity = (i + offset) < rightCharsToShow ? '1' : '0';
            }

            // Left panel fades out slowly as drone approaches to avoid collision (synchronized with un-typing)
            const leftPanelOpacity = 1 - Math.max(0, Math.min(t / 0.28, 1));
            const rightPanelOpacity = t < 0.85 ? 1 : Math.max(0, 1 - (t - 0.85) / 0.15);

            if (droneRef.current) {
                droneRef.current.style.transform =
                    `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) scale(${scale}) rotate(${rotate}deg)`;
                droneRef.current.style.opacity = opacity;
            }
            // Update shared drone screen position for particle repulsion
            droneScreenPos.x = window.innerWidth / 2 + tx;
            droneScreenPos.y = window.innerHeight / 2 + ty;
            droneScreenPos.radius = 180 * scale; // repulsion radius grows with drone scale
            if (textRef.current) textRef.current.style.opacity = textOpacity;
            if (btnRef.current) btnRef.current.style.opacity = textOpacity;
            if (leftPanelRef.current) leftPanelRef.current.style.opacity = leftPanelOpacity;
            if (rightPanelRef.current) rightPanelRef.current.style.opacity = rightPanelOpacity;
        };

        const onScroll = () => {
            if (rafId) return;
            rafId = requestAnimationFrame(update);
        };

        window.addEventListener('scroll', onScroll, { passive: true });
        update();
        return () => {
            window.removeEventListener('scroll', onScroll);
            if (rafId) cancelAnimationFrame(rafId);
        };
    }, []);

    // ── Drone buzz audio removed ──────────────────

    return (
        <div className="relative h-screen w-full flex flex-col items-center justify-center overflow-hidden z-10">
            {/* Background handled by ParticleBackground at App root */}
            <style>{`
                @keyframes slide-down {
                    0%   { transform: translateY(-50px); opacity: 0; }
                    100% { transform: translateY(0);     opacity: 1; }
                }
                /* Float bob runs on CSS compositor — zero JS cost */
                @keyframes droneFloat {
                    0%, 100% { transform: translateY(-9px); }
                    50%      { transform: translateY( 9px); }
                }
                @keyframes liquidWave {
                    0% {
                        transform: translate(-50%, -50%) scale(0.2);
                        opacity: 1;
                    }
                    100% {
                        transform: translate(-50%, -50%) scale(3.5);
                        opacity: 0;
                    }
                }
                .animate-slide-down { animation: slide-down 1.2s cubic-bezier(0.2,0.8,0.2,1) forwards; }
                .drone-float        { animation: droneFloat 3.2s ease-in-out infinite; }
            `}</style>

            {/* Brand title — always visible, NOT affected by scroll fade */}
            <div className="absolute top-12 left-0 w-full flex flex-col items-center z-30 animate-slide-down px-6 pointer-events-none">
                <div className="flex items-center gap-3 mb-2">
                    <Target className="w-8 h-8 text-stone-700" />
                    <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-stone-900">
                        AeroSense <span className="text-stone-500">AI</span>
                    </h1>
                </div>
            </div>

            {/* Invisible scroll-opacity anchor (for CTA button fade) */}
            <div ref={textRef} className="absolute top-12 left-0 w-full pointer-events-none" />

            {/* Aesthetic Left Panel (Part 1) */}
            <div
                ref={leftPanelRef}
                className="absolute top-[22%] left-[5%] md:left-[8%] lg:left-[10%] z-30 flex flex-col gap-4 max-w-lg pointer-events-none"
                style={{ willChange: 'opacity' }}
            >
                <div
                    ref={typeRef1}
                    className="text-[#d4c5b9] font-mono text-sm tracking-[0.4em] uppercase font-bold min-h-[20px]"
                >
                    {"SYS.INIT: ACOUSTIC_DEFENSE".split("").map((c, i) => <span key={i}>{c}</span>)}
                </div>
                <div
                    ref={typeRef2}
                    className="text-black text-5xl md:text-6xl lg:text-7xl font-black tracking-tighter leading-[0.9] block min-h-[140px]"
                >
                    {"WE LISTEN WHEN THE NAKED EYE FAILS.".split("").map((c, i) => <span key={i}>{c}</span>)}
                </div>
            </div>

            {/* Aesthetic Right Panel (Part 2) */}
            <div
                ref={rightPanelRef}
                className="absolute top-[64%] right-[5%] md:right-[8%] lg:right-[10%] z-30 flex flex-col gap-3 max-w-md pointer-events-none text-right items-end"
                style={{ willChange: 'opacity' }}
            >
                <div className="flex flex-col gap-3 border-r-4 border-[#5A3324] pr-6 mr-1 items-end">
                    <div
                        ref={typeRef3}
                        className="text-[#5A3324] text-3xl md:text-4xl lg:text-5xl font-black tracking-tighter uppercase block min-h-[48px]"
                    >
                        {"DETECTING MICRO-UAV ANOMALIES.".split("").map((c, i) => <span key={i}>{c}</span>)}
                    </div>
                    <div
                        ref={typeRef4}
                        className="text-[#A9A9A9] text-lg md:text-xl font-bold uppercase tracking-widest block min-h-[32px]"
                    >
                        {"SECURING AIRSPACE WITH 97.5% PRECISION.".split("").map((c, i) => <span key={i}>{c}</span>)}
                    </div>
                </div>
            </div>

            {/* Outer div: JS scroll-driven (scale / translate / rotate / opacity) */}
            <div
                ref={droneRef}
                className="absolute top-1/2 left-1/2 z-20 pointer-events-none"
                style={{ willChange: 'transform, opacity' }}
            >
                {/* Removed old CSS ripples in favor of full WebGL fluid sim */}
                {/* Inner img: pure CSS hover float — compositor thread only */}
                <img
                    src="drone.png"
                    alt="Drone"
                    className="drone-float"
                    style={{
                        width: '420px',
                        maxWidth: 'none',
                        display: 'block',
                        userSelect: 'none',
                        WebkitUserDrag: 'none',
                        willChange: 'transform',
                    }}
                />
            </div>

            {/* Scroll CTA */}
            <button
                ref={btnRef}
                onClick={() => window.scrollTo({ top: window.innerHeight * 1.5, behavior: 'smooth' })}
                className="absolute bottom-10 p-4 rounded-full text-stone-400 hover:text-stone-800 transition-colors z-30 animate-bounce cursor-pointer pointer-events-auto"
            >
                <p className="text-[10px] uppercase tracking-widest font-bold mb-2">Scroll to Deploy</p>
                <ChevronDown className="w-6 h-6 mx-auto" />
            </button>
        </div>
    );
};


const WaveformVisualizer = ({ isPlaying }) => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let animationFrameId;
        let time = 0;

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const width = canvas.width;
            const height = canvas.height;
            const centerY = height / 2;

            ctx.beginPath();
            ctx.moveTo(0, centerY);

            for (let i = 0; i < width; i++) {
                const amplitude = isPlaying ? Math.sin(time + i * 0.05) * 20 + Math.sin(time * 0.5 + i * 0.01) * 10 : 2;
                ctx.lineTo(i, centerY + amplitude);
            }

            ctx.strokeStyle = '#a89f91';
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.lineTo(width, height);
            ctx.lineTo(0, height);
            ctx.fillStyle = 'rgba(168, 159, 145, 0.15)';
            ctx.fill();

            if (isPlaying) time += 0.1;
            animationFrameId = requestAnimationFrame(animate);
        };

        animate();
        return () => cancelAnimationFrame(animationFrameId);
    }, [isPlaying]);

    return <canvas ref={canvasRef} width={600} height={100} className="w-full h-full rounded-lg" />;
};

const DetectionPage = ({ PageNav }) => {
    const [file, setFile] = useState(null);
    const [rawFile, setRawFile] = useState(null);
    const [audioUrl, setAudioUrl] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [activeStep, setActiveStep] = useState(0);
    const [result, setResult] = useState(null);
    const audioRef = useRef(null);
    const boxEntranceRef = useRef(null);

    const pipelineStages = [
        "Data Cleansing",
        "Duplicate Removal",
        "Signal Normalization",
        "Noise Suppression",
        "Feature Extraction",
        "Spectral Integrity",
        "Anomaly Filtering",
        "Final Integrity Check"
    ];

    const sceneState = result
        ? (result.is_drone ? 'fail' : 'pass')
        : (isAnalyzing ? 'processing' : 'idle');
    const analysisState = sceneState === 'pass'
        ? 'safe'
        : sceneState === 'fail'
            ? 'danger'
            : (isAnalyzing ? 'processing' : 'idle');
    const pipelineComplete = Boolean(result) && !isAnalyzing;
    const currentStageLabel = isAnalyzing
        ? (pipelineStages[activeStep - 1] || pipelineStages[pipelineStages.length - 1])
        : (pipelineComplete ? pipelineStages[pipelineStages.length - 1] : 'Data Ingest');
    const activeStageNumber = isAnalyzing
        ? activeStep
        : (pipelineComplete ? pipelineStages.length : 0);
    const StatusIcon = sceneState === 'pass'
        ? CheckCircle2
        : sceneState === 'fail'
            ? AlertTriangle
            : sceneState === 'processing'
                ? Activity
                : Info;
    const statusHeadline = sceneState === 'pass'
        ? 'VALIDATED'
        : sceneState === 'fail'
            ? 'ERROR DETECTED'
            : sceneState === 'processing'
                ? 'PROCESSING'
                : 'STANDBY';
    const statusMessage = sceneState === 'pass'
        ? 'Diagnostic Result: DATA INTEGRITY VERIFIED (GREEN).'
        : sceneState === 'fail'
            ? 'Diagnostic Result: ERROR DETECTED (RED).'
            : sceneState === 'processing'
                ? 'Sequential preprocessing engaged. Branches illuminate in order.'
                : 'Awaiting analysis deployment.';
    const sceneBannerTitle = sceneState === 'pass'
        ? 'PREPROCESSING COMPLETE'
        : sceneState === 'fail'
            ? 'ERROR DETECTED'
            : sceneState === 'processing'
                ? 'PREPROCESSING ACTIVE'
                : 'PIPELINE STANDBY';
    const sceneBannerSubtitle = sceneState === 'pass'
        ? 'ALL STAGES VALIDATED'
        : sceneState === 'fail'
            ? 'DIAGNOSTIC FAILURE'
            : sceneState === 'processing'
                ? 'DATA STREAM ONLINE'
                : 'WAITING FOR INPUT';

    const handleDragOver = (e) => e.preventDefault();

    const loadFile = (f) => {
        if (audioUrl) URL.revokeObjectURL(audioUrl);
        const url = URL.createObjectURL(f);
        setAudioUrl(url);
        setRawFile(f);
        setFile({ name: f.name, size: (f.size / 1024).toFixed(1) });
        setResult(null);
        setIsPlaying(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files[0]) loadFile(e.dataTransfer.files[0]);
    };

    const handleFileSelect = (e) => {
        if (e.target.files && e.target.files[0]) loadFile(e.target.files[0]);
    };

    const togglePlay = () => {
        const audio = audioRef.current;
        if (!audio) return;
        if (isPlaying) {
            audio.pause();
            setIsPlaying(false);
        } else {
            audio.play();
            setIsPlaying(true);
        }
    };

    const startAnalysis = async () => {
        if (!rawFile) return;

        setIsAnalyzing(true);
        setActiveStep(1);
        setResult(null);

        // Auto-scroll to the Real-Time Pipeline page after a brief delay
        // to prevent React state updates from aborting the scroll animation
        setTimeout(() => {
            const detectionSection = document.getElementById('detection');
            if (detectionSection) {
                const vh = window.innerHeight;
                const absoluteY = window.scrollY + detectionSection.getBoundingClientRect().top;
                window.scrollTo({ top: absoluteY + vh, behavior: 'smooth' });
            }
        }, 100);

        const formData = new FormData();
        formData.append('audio', rawFile);

        try {
            const res = await fetch('/api/predict', { method: 'POST', body: formData });
            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) {
                    setIsAnalyzing(false);
                    break;
                }

                buffer += decoder.decode(value, { stream: true });
                const parts = buffer.split('\n\n');
                buffer = parts.pop();

                parts.forEach(part => {
                    const lines = part.split('\n');
                    let event = 'message', data = '';
                    lines.forEach(l => {
                        if (l.startsWith('event: ')) event = l.slice(7).trim();
                        if (l.startsWith('data: ')) data = l.slice(6).trim();
                    });
                    if (!data) return;

                    try {
                        const parsed = JSON.parse(data);
                        if (event === 'step') {
                            setActiveStep(parsed.id);
                        } else if (event === 'result') {
                            setResult(parsed);
                            setIsAnalyzing(false);
                            setActiveStep(pipelineStages.length);
                        } else if (event === 'error') {
                            console.error(parsed.message);
                            setIsAnalyzing(false);
                        }
                    } catch (e) { }
                });
            }
        } catch (err) {
            console.error(err);
            setIsAnalyzing(false);
        }
    };

    const containerRef = useRef(null);
    const sliderRef = useRef(null);

    useEffect(() => {
        let rafId = null;
        const updateScroll = () => {
            rafId = null;
            if (!containerRef.current || !sliderRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            // scrollDistance is how far we can scroll while the element is on screen
            const scrollDistance = rect.height - window.innerHeight;

            let progress = 0;
            // When the top of the container hits the top of the viewport
            if (rect.top <= 0) {
                // If it scrolls past, it maxes at 1
                progress = Math.min(1, Math.max(0, -rect.top / scrollDistance));
            }

            // At progress=0, translate is 0%
            // At progress=1, translate is -50% (since width is 200vw, -50% shifts by 100vw)
            sliderRef.current.style.transform = `translateX(-${progress * 50}%)`;
        };
        const onScroll = () => {
            if (rafId) return;
            rafId = requestAnimationFrame(updateScroll);
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        updateScroll();

        // Drive box entrance using window.scrollY so it's synced to
        // the detection panel sliding UP into view.
        // Box starts growing at scrollY = vh*1.0 and is fully visible
        // by scrollY = vh*1.5 (exactly when the auto-scroll lands).
        // After that it stays full size while the horizontal pan runs.
        const driveBoxEntrance = () => {
            if (!boxEntranceRef.current) return;
            const vh = window.innerHeight;
            const startY = vh * 1.0;   // begin growing
            const endY = vh * 1.45;  // fully grown (just before auto-snap at 1.5)
            const scrollY = window.scrollY;

            // raw 0→1 over the scroll band
            const raw = Math.min(1, Math.max(0, (scrollY - startY) / (endY - startY)));
            // smoothstep easing
            const eased = raw * raw * (3 - 2 * raw);

            const sc = 0.25 + eased * 0.75;   // 25% → 100%
            const op = raw;                     // fade in
            const ty = (1 - eased) * 70;       // slide up

            boxEntranceRef.current.style.opacity = op;
            boxEntranceRef.current.style.transform = `translateY(${ty}px) scale(${sc})`;
        };

        window.addEventListener('scroll', driveBoxEntrance, { passive: true });
        driveBoxEntrance();

        return () => {
            window.removeEventListener('scroll', onScroll);
            window.removeEventListener('scroll', driveBoxEntrance);
        };
    }, []);

    return (
        <div ref={containerRef} className="h-[200vh] w-full relative z-10">
            <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center">
                <div ref={sliderRef} className="flex w-[200vw] h-full will-change-transform pt-6">

                    {/* PAGE 1: Upload & Waveform */}
                    <div className="w-[100vw] flex-shrink-0 flex flex-col items-center justify-center px-6 lg:px-12 relative overflow-hidden">
                        <DigitalWaveBackground />

                        {/* Navigation Bar at Top Right */}
                        <div
                            className="absolute top-8 right-8 z-50 flex bg-[#F0ECE1]/80 backdrop-blur-md rounded-full p-1.5 shadow-inner border border-[#E5E0D3] animate-[slideInRight_0.8s_ease-out_forwards]"
                            style={{ animationDelay: '0.5s', opacity: 0 }}
                        >
                            <button
                                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                                className="flex items-center gap-2 px-6 py-2 font-bold text-sm text-gray-600 hover:text-black transition-all hover:scale-105"
                            >
                                <Target size={16} /> Home
                            </button>
                            <button
                                className="px-6 py-2 bg-white rounded-full font-bold text-sm shadow-sm text-black"
                            >
                                Detection
                            </button>
                            <button
                                onClick={() => scrollToSection('metrics')}
                                className="px-6 py-2 font-bold text-sm text-gray-600 hover:text-black transition-all hover:scale-105"
                            >
                                Metrics
                            </button>
                            <button
                                onClick={() => scrollToSection('about')}
                                className="px-6 py-2 font-bold text-sm text-gray-600 hover:text-black transition-all hover:scale-105"
                            >
                                About
                            </button>
                        </div>

                        <div className="w-full max-w-4xl flex flex-col gap-8 pt-6">
                            <div className="text-center mb-4">
                                <h2 className="text-4xl font-black text-stone-800 tracking-tight mb-2">Acoustic Analysis</h2>
                                <p className="text-stone-500 uppercase tracking-widest text-xs font-bold">Step 01 / Input</p>
                            </div>

                            <div
                                ref={boxEntranceRef}
                                className="w-full"
                                style={{ opacity: 0, transform: 'translateY(60px) scale(0.30)', transformOrigin: 'center center', transition: 'none' }}
                            >
                                <label
                                    className="h-64 w-full relative overflow-hidden rounded-3xl flex flex-col items-center justify-center group cursor-pointer animate-float"
                                    style={{
                                        background: 'linear-gradient(135deg, rgba(255,255,255,0.85) 0%, rgba(230,238,255,0.55) 40%, rgba(255,255,255,0.75) 60%, rgba(220,235,255,0.45) 100%)',
                                        border: '1px solid rgba(255,255,255,0.95)',
                                        boxShadow: [
                                            '0 40px 80px -20px rgba(100,120,180,0.25)',
                                            '0 15px 35px -10px rgba(80,100,160,0.18)',
                                            'inset 0 1px 0 rgba(255,255,255,1)',
                                            'inset 0 -1px 0 rgba(200,210,255,0.3)',
                                            'inset 1px 0 0 rgba(255,255,255,0.8)',
                                            'inset -1px 0 0 rgba(200,220,255,0.4)'
                                        ].join(', '),
                                        backdropFilter: 'blur(20px) saturate(180%)',
                                        WebkitBackdropFilter: 'blur(20px) saturate(180%)'
                                    }}
                                    onDragOver={handleDragOver}
                                    onDrop={handleDrop}
                                >
                                    {/* Mirror shimmer overlay */}
                                    <div style={{
                                        position: 'absolute', inset: 0, pointerEvents: 'none',
                                        background: 'linear-gradient(110deg, rgba(255,255,255,0) 20%, rgba(255,255,255,0.55) 50%, rgba(255,255,255,0) 80%)',
                                        borderRadius: 'inherit'
                                    }} />
                                    {/* Diagonal top-left glare streak */}
                                    <div style={{
                                        position: 'absolute', top: 0, left: 0, width: '60%', height: '50%',
                                        background: 'linear-gradient(135deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0) 60%)',
                                        borderRadius: 'inherit', pointerEvents: 'none'
                                    }} />
                                    <input type="file" className="hidden" accept="audio/*" onChange={handleFileSelect} />
                                    <div className="relative z-10 p-4 rounded-full mb-4 group-hover:scale-110 transition-all duration-300" style={{ background: 'rgba(255,255,255,0.6)', boxShadow: '0 4px 15px rgba(100,120,200,0.2), inset 0 1px 0 rgba(255,255,255,0.9)' }}>
                                        <Upload className="w-8 h-8 text-slate-600" />
                                    </div>
                                    <h3 className="relative z-10 text-xl font-bold text-slate-800 mb-2 drop-shadow-sm">Drag & Drop Audio</h3>
                                    <p className="relative z-10 text-slate-500 text-sm font-medium">WAV, MP3, OGG, FLAC, M4A up to 50MB</p>
                                </label>
                            </div>

                            {file && (
                                <div className="bg-white/70 p-4 md:p-6 rounded-3xl border border-stone-200/50 backdrop-blur-md shadow-[0_8px_30px_rgba(0,0,0,0.04)] animate-in slide-in-from-bottom-4 duration-500">
                                    <audio
                                        ref={audioRef}
                                        src={audioUrl}
                                        onEnded={() => setIsPlaying(false)}
                                        preload="auto"
                                    />
                                    <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-4">
                                        <div className="flex items-center gap-5 w-full md:w-auto">
                                            <button
                                                onClick={togglePlay}
                                                className="w-14 h-14 shrink-0 rounded-full bg-stone-800 flex items-center justify-center hover:bg-stone-700 transition-all shadow-lg hover:scale-105 hover:shadow-xl active:scale-95"
                                            >
                                                {isPlaying ? <Pause className="w-6 h-6 text-[#fdfbf7]" /> : <Play className="w-6 h-6 text-[#fdfbf7] ml-1" />}
                                            </button>
                                            <div className="overflow-hidden">
                                                <h4 className="text-stone-800 font-bold text-lg truncate">{file.name}</h4>
                                                <p className="text-stone-500 text-sm">{file.size} KB</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={startAnalysis}
                                            disabled={isAnalyzing}
                                            className="w-full md:w-auto px-8 py-3.5 bg-gradient-to-r from-stone-800 to-stone-600 hover:from-stone-700 hover:to-stone-500 text-white rounded-full font-bold transition-all shadow-lg disabled:opacity-50 flex items-center justify-center gap-3 hover:shadow-xl active:scale-95"
                                        >
                                            <Zap className="w-5 h-5" /> {isAnalyzing ? 'Analyzing...' : 'Deploy Analytics'}
                                        </button>
                                    </div>
                                    <div className="h-20 w-full bg-stone-100/50 rounded-2xl overflow-hidden border border-stone-200/50 relative shadow-inner">
                                        <WaveformVisualizer isPlaying={isPlaying} />
                                    </div>
                                </div>
                            )}

                            {/* Scroll Indicator */}
                            <div className="flex flex-col items-center gap-2 mt-4 opacity-60">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-stone-500">Scroll for Pipeline</span>
                                <div className="w-12 h-1.5 bg-stone-200 rounded-full overflow-hidden">
                                    <div className="w-4 h-full bg-stone-500 rounded-full animate-[slideRight_1.5s_ease-in-out_infinite]" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* PAGE 2: Pipeline & Results */}
                    <div className="w-[100vw] flex-shrink-0">
                        <RealTimeProcessingPanel
                            analysisState={analysisState}
                            activeStep={activeStageNumber}
                            onRunAnalysis={startAnalysis}
                            isAnalyzing={isAnalyzing}
                            confidence={result?.confidence}
                        />

                    </div>

                </div>
            </div>

            <style>{`
                @keyframes slideRight {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(300%); }
                }
                @keyframes slideInRight {
                    0% { transform: translateX(30px); opacity: 0; }
                    100% { transform: translateX(0); opacity: 1; }
                }
            `}</style>
        </div>
    );
};

const AnimatedNumber = ({ value, duration = 1500, delay = 0, isPercent = false }) => {
    const [displayValue, setDisplayValue] = useState(0);
    const [hasStarted, setHasStarted] = useState(false);
    const nodeRef = useRef(null);
    const audioContextRef = useRef(null);

    const playTick = () => {
        try {
            if (!audioContextRef.current) {
                audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
            }
            const ctx = audioContextRef.current;
            if (ctx.state === 'suspended') ctx.resume();

            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(600 + Math.random() * 200, ctx.currentTime);
            gain.gain.setValueAtTime(0.02, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
            
            osc.start();
            osc.stop(ctx.currentTime + 0.05);
        } catch (e) {
            // Silently fail if audio is blocked
        }
    };

    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting && !hasStarted) {
                setTimeout(() => setHasStarted(true), delay);
            }
        }, { threshold: 0.1 });

        if (nodeRef.current) observer.observe(nodeRef.current);
        return () => observer.disconnect();
    }, [hasStarted, delay]);

    useEffect(() => {
        if (!hasStarted) return;

        const endValue = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.-]/g, '')) : value;
        if (isNaN(endValue)) {
            setDisplayValue(value);
            return;
        }

        const startTime = performance.now();
        let lastTickValue = 0;

        const update = (now) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing: easeOutExpo
            const easedProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
            const current = easedProgress * endValue;
            
            setDisplayValue(current);

            // Play tick sound every time the integer part changes significantly
            if (Math.floor(current) !== lastTickValue) {
                playTick();
                lastTickValue = Math.floor(current);
            }

            if (progress < 1) {
                requestAnimationFrame(update);
            } else {
                setDisplayValue(endValue);
            }
        };

        requestAnimationFrame(update);
    }, [hasStarted, value, duration]);

    const formatted = typeof value === 'number' && Number.isInteger(value)
        ? Math.floor(displayValue).toLocaleString()
        : displayValue.toFixed(2);

    return <span ref={nodeRef}>{formatted}{isPercent ? '%' : ''}</span>;
};

const MetricsPage = () => {

    const [metrics, setMetrics] = React.useState(null);

    React.useEffect(() => {
        fetch('/api/metrics')
            .then(res => res.json())
            .then(data => {
                if (data.status === 'ok') setMetrics(data.metrics);
            })
            .catch(console.error);
    }, []);

    const kpis = metrics ? [
        { label: 'Accuracy', val: metrics.accuracy, color: 'text-black', isPercent: true },
        { label: 'Drone Recall', val: metrics.recall, color: 'text-black', isPercent: true },
        { label: 'Precision', val: metrics.precision, color: 'text-black', isPercent: true },
        { label: 'F1 Score', val: metrics.f1, color: 'text-black', isPercent: true },
        { label: 'Threshold', val: metrics.threshold * 100, color: 'text-black', isPercent: true },
        { label: 'Features', val: metrics.n_features, color: 'text-black', isPercent: false }
    ] : [
        { label: 'Accuracy', val: '-', color: 'text-stone-500', isPercent: true },
        { label: 'Drone Recall', val: '-', color: 'text-stone-500', isPercent: true },
        { label: 'Precision', val: '-', color: 'text-stone-500', isPercent: true },
        { label: 'F1 Score', val: '-', color: 'text-stone-500', isPercent: true },
        { label: 'Threshold', val: '-', color: 'text-stone-500', isPercent: true },
        { label: 'Features', val: '-', color: 'text-stone-500', isPercent: false }
    ];


    const cm = metrics?.confusion_matrix || { tn: '-', fp: '-', fn: '-', tp: '-' };

    return (
        <div className="w-full max-w-7xl mx-auto z-10 relative flex flex-col gap-8">
            <FadeInSection delay={0}>
                <div className="text-center mb-6">
                    <h2 className="text-4xl font-black tracking-tighter text-stone-900">System Metrics</h2>
                    <p className="text-stone-500 mt-2 font-medium uppercase tracking-widest text-sm">Performance Analysis</p>
                </div>
            </FadeInSection>

            <FadeInSection delay={100}>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {kpis.map((kpi, i) => (
                        <div key={i} className="bg-white/60 p-5 rounded-2xl border border-stone-200 backdrop-blur-md flex flex-col items-center justify-center hover:bg-stone-50/80 transition-colors shadow-sm">
                            <span className="text-stone-500 text-sm mb-1">{kpi.label}</span>
                            <span className={`text-2xl font-mono font-bold ${kpi.color}`}>
                                {metrics ? <AnimatedNumber value={kpi.val} isPercent={kpi.isPercent} delay={i * 100} /> : kpi.val}
                            </span>

                        </div>
                    ))}
                </div>
            </FadeInSection>

            <div className="grid lg:grid-cols-2 gap-6">
                <FadeInSection delay={200}>
                    <div className="bg-white/60 h-full p-6 rounded-3xl border border-stone-200 backdrop-blur-md shadow-sm">
                        <h3 className="text-lg font-medium text-stone-800 mb-6">Confusion Matrix</h3>
                        <div className="flex items-center justify-center p-4">
                            <div className="grid grid-cols-3 gap-2 text-center text-sm font-mono w-full max-w-md">
                                <div></div>
                                <div className="text-stone-500 pb-2">Pred: No Drone</div>
                                <div className="text-stone-500 pb-2">Pred: Drone</div>

                                <div className="text-stone-500 flex items-center justify-end pr-4">True: No</div>
                                <div className="bg-stone-100/80 p-4 rounded-lg border border-stone-200 flex flex-col relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-emerald-500/5 group-hover:bg-emerald-500/10 transition-colors"></div>
                                    <span className="text-xl font-bold text-stone-800 relative z-10">
                                        {metrics ? <AnimatedNumber value={cm.tn} /> : cm.tn}
                                    </span>
                                    <span className="text-xs text-stone-500 relative z-10">True Neg</span>
                                </div>
                                <div className="bg-stone-100/80 p-4 rounded-lg border border-stone-200 flex flex-col relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-red-500/5 group-hover:bg-red-500/10 transition-colors"></div>
                                    <span className="text-xl font-bold text-stone-800 relative z-10">
                                        {metrics ? <AnimatedNumber value={cm.fp} /> : cm.fp}
                                    </span>
                                    <span className="text-xs text-stone-500 relative z-10">False Pos</span>
                                </div>

                                <div className="text-stone-500 flex items-center justify-end pr-4">True: Yes</div>
                                <div className="bg-stone-100/80 p-4 rounded-lg border border-stone-200 flex flex-col relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-orange-500/5 group-hover:bg-orange-500/10 transition-colors"></div>
                                    <span className="text-xl font-bold text-stone-800 relative z-10">
                                        {metrics ? <AnimatedNumber value={cm.fn} /> : cm.fn}
                                    </span>
                                    <span className="text-xs text-stone-500 relative z-10">False Neg</span>
                                </div>
                                <div className="bg-stone-100/80 p-4 rounded-lg border border-stone-200 flex flex-col relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-stone-300/30 group-hover:bg-stone-300/50 transition-colors"></div>
                                    <span className="text-xl font-bold text-stone-800 relative z-10">
                                        {metrics ? <AnimatedNumber value={cm.tp} /> : cm.tp}
                                    </span>
                                    <span className="text-xs text-stone-500 relative z-10">True Pos</span>
                                </div>

                            </div>
                        </div>
                    </div>
                </FadeInSection>

                <FadeInSection delay={300}>
                    <div className="bg-white/60 h-full p-6 rounded-3xl border border-stone-200 backdrop-blur-md shadow-sm">
                        <h3 className="text-lg font-medium text-stone-800 mb-6">Performance Distribution</h3>
                        <div className="space-y-6">
                            {[
                                { label: 'Accuracy', val: metrics?.accuracy || 0, color: 'bg-[#5D4037]' },
                                { label: 'Recall', val: metrics?.recall || 0, color: 'bg-[#5D4037]' },
                                { label: 'Precision', val: metrics?.precision || 0, color: 'bg-[#5D4037]' },
                                { label: 'F1 Score', val: metrics?.f1 || 0, color: 'bg-[#5D4037]' }
                            ].map((stat, i) => (
                                <div key={i}>
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="text-stone-600 font-medium">{stat.label}</span>
                                        <span className="text-stone-500 font-mono">
                                            {metrics ? <AnimatedNumber value={stat.val} isPercent /> : '0%'}
                                        </span>

                                    </div>
                                    <div className="h-2 w-full bg-stone-200 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full ${stat.color} rounded-full`}
                                            style={{ width: `${stat.val}%`, transition: 'width 1.5s cubic-bezier(0.4, 0, 0.2, 1)' }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </FadeInSection>
            </div>

            <div className="flex flex-col items-center gap-2 mt-8 opacity-60">
                <span className="text-[10px] font-bold uppercase tracking-widest text-stone-500">Scroll for Data Stats</span>
                <div className="w-12 h-1.5 bg-stone-200 rounded-full overflow-hidden">
                    <div className="w-4 h-full bg-stone-500 rounded-full animate-[slideRight_1.5s_ease-in-out_infinite]" />
                </div>
            </div>
        </div>
    );
};

const DataStatisticsPage = ({ metrics }) => {
    return (
        <div className="w-full max-w-7xl mx-auto z-10 relative flex flex-col gap-8">
            <FadeInSection delay={0}>
                <div className="text-center mb-6">
                    <h2 className="text-4xl font-black tracking-tighter text-stone-900">Data Statistics</h2>
                    <p className="text-stone-500 mt-2 font-medium uppercase tracking-widest text-sm">Corpus Overview</p>
                </div>
            </FadeInSection>

            <div className="grid lg:grid-cols-2 gap-6">
                <FadeInSection delay={100}>
                    <div className="bg-white/60 p-8 rounded-3xl border border-stone-200 backdrop-blur-md shadow-sm h-full">
                        <h3 className="text-lg font-medium text-stone-800 mb-6">Sample Distribution</h3>
                        <div className="space-y-6">
                            <div className="flex items-center justify-between p-4 bg-stone-100/80 rounded-xl">
                                <span className="text-stone-500 text-sm">Total Samples</span>
                                <span className="text-stone-800 font-mono font-bold text-lg">
                                    {metrics ? <AnimatedNumber value={metrics.total_samples} /> : '-'}
                                </span>

                            </div>

                            <div className="space-y-3">
                                <div className="h-6 w-full flex rounded-full overflow-hidden border border-stone-200 shadow-sm">
                                    <div
                                        className="h-full bg-stone-400 flex items-center justify-center"
                                        style={{ width: metrics ? `${(metrics.no_drone_samples / metrics.total_samples) * 100}%` : '87.7%' }}
                                    >
                                        <span className="text-[10px] font-bold text-stone-700 truncate px-1">
                                            {metrics ? ((metrics.no_drone_samples / metrics.total_samples) * 100).toFixed(1) : 87.7}%
                                        </span>
                                    </div>
                                    <div
                                        className="h-full bg-stone-800 flex items-center justify-center"
                                        style={{ width: metrics ? `${(metrics.drone_samples / metrics.total_samples) * 100}%` : '12.3%' }}
                                    >
                                        <span className="text-[10px] font-bold text-stone-200 truncate px-1">
                                            {metrics ? ((metrics.drone_samples / metrics.total_samples) * 100).toFixed(1) : 12.3}%
                                        </span>
                                    </div>
                                </div>
                                <div className="flex justify-between text-xs text-stone-500 px-2">
                                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-stone-400 inline-block"></span> Background</span>
                                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-stone-800 inline-block"></span> Drone</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 text-center">
                                    <p className="text-2xl font-black font-mono text-stone-800">
                                        <AnimatedNumber value={metrics?.n_features || 85} />
                                    </p>

                                    <p className="text-[10px] text-stone-400 uppercase tracking-wider mt-1 font-bold">Features</p>
                                </div>
                                <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 text-center">
                                    <p className="text-2xl font-black font-mono text-stone-800">{metrics ? `${metrics.threshold * 100}%` : '15%'}</p>
                                    <p className="text-[10px] text-stone-400 uppercase tracking-wider mt-1 font-bold">Threshold</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </FadeInSection>

                <FadeInSection delay={200}>
                    <div className="bg-white/60 p-8 rounded-3xl border border-stone-200 backdrop-blur-md shadow-sm h-full flex flex-col">
                        <h3 className="text-lg font-medium text-stone-800 mb-6">Model Architecture</h3>
                        <div className="space-y-4 text-sm text-stone-600 flex-1">
                            <p className="leading-relaxed">The system utilizes a <strong>Random Forest Classifier</strong> optimized for low-latency acoustic inference.</p>
                            <ul className="space-y-3 mt-4">
                                <li className="flex items-center gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                    <span>Gini Impurity for optimal node splitting</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-stone-400"></div>
                                    <span>100 base estimators (decision trees)</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-stone-400"></div>
                                    <span>Max depth constrained to prevent overfitting</span>
                                </li>
                            </ul>
                            <div className="mt-auto pt-8">
                                <div className="p-4 bg-stone-800 rounded-2xl text-white">
                                    <h4 className="text-xs font-bold uppercase tracking-widest mb-1 text-stone-400">Deployment Status</h4>
                                    <p className="text-sm font-medium">Production Kernel: Active</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </FadeInSection>
            </div>
        </div>
    );
};

const ThreatLandscapeCarousel = () => {
    const containerRef = useRef(null);
    const scrollRef = useRef(0);
    const lerpRef = useRef(0);
    const cardsRef = useRef([]);

    const items = [
        { icon: <Lock />, title: 'Critical Infrastructure', desc: 'Protecting power grids and data centers from airborne sabotage.' },
        { icon: <Crosshair />, title: 'Border Security', desc: 'Detecting smuggling routes evading traditional RF jammers.' },
        { icon: <Shield />, title: 'Law Enforcement', desc: 'Monitoring unauthorized flights over public events.' },
        { icon: <Database />, title: 'Industrial Espionage', desc: 'Preventing aerial surveillance of IP and facilities.' },
        { icon: <Target />, title: 'Campus Security', desc: 'Maintaining privacy zones over educational grounds.' },
        { icon: <AlertTriangle />, title: 'VVIP Protection', desc: 'Mobile acoustic sentries for high-profile transit.' }
    ];

    useEffect(() => {
        const handleScroll = () => {
            if (!containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            const windowHeight = window.innerHeight;
            const totalScrollable = rect.height - windowHeight;
            const scrolled = -rect.top;
            const progress = Math.max(0, Math.min(1, scrolled / totalScrollable));
            scrollRef.current = progress;
        };

        const radius = 400;
        const count = items.length;

        const update = () => {
            // Buttery smooth Lerping: 0.08 factor for premium feel
            lerpRef.current += (scrollRef.current - lerpRef.current) * 0.08;
            const progress = lerpRef.current;

            cardsRef.current.forEach((card, i) => {
                if (!card) return;
                
                const angleStep = (2 * Math.PI) / count;
                const rotationOffset = progress * (2 * Math.PI) * 0.9; 
                const itemAngle = (i * angleStep) - rotationOffset;

                const x = Math.sin(itemAngle) * radius;
                const z = Math.cos(itemAngle) * radius;
                
                const normalizedZ = (z + radius) / (2 * radius); 
                const isFocused = z > radius * 0.8;
                
                const blur = Math.max(0, (radius - z) / 80);
                const opacity = Math.max(0.05, (z + radius) / (2 * radius));
                const scale = 0.5 + (normalizedZ * 0.6);

                // Apply styles directly to bypass React re-render cycle
                card.style.transform = `translate3d(${x}px, ${Math.sin(itemAngle * 2) * 30}px, ${z}px) scale(${scale})`;
                card.style.opacity = opacity.toString();
                card.style.filter = `blur(${blur}px)`;
                card.style.zIndex = Math.round(z + radius).toString();
                
                if (isFocused) {
                    card.classList.add('focused-card');
                } else {
                    card.classList.remove('focused-card');
                }
            });

            requestAnimationFrame(update);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        const animFrame = requestAnimationFrame(update);
        handleScroll();

        return () => {
            window.removeEventListener('scroll', handleScroll);
            cancelAnimationFrame(animFrame);
        };
    }, []);

    return (
        <div ref={containerRef} className="relative h-[200vh]">
            <div className="sticky top-16 h-[70vh] w-full flex flex-col items-center justify-center overflow-hidden" style={{ perspective: '3000px' }}>
                <div className="w-full max-w-7xl mx-auto px-4 mb-8">
                    <h3 className="text-xl font-medium text-stone-800 flex items-center gap-2">
                        <Shield className="w-6 h-6 text-stone-600" /> Threat Landscapes
                    </h3>
                </div>
                
                <div className="relative w-full flex-1 flex items-center justify-center" style={{ transformStyle: 'preserve-3d' }}>
                    <div className="w-[1400px] h-[1400px] border-[2px] border-stone-300 rounded-full absolute pointer-events-none opacity-20" 
                         style={{ transform: 'rotateX(80deg) translateZ(-300px)' }} 
                    />
                    <div className="w-[1000px] h-[1000px] border-[1px] border-stone-300 rounded-full absolute pointer-events-none opacity-20" 
                         style={{ transform: 'rotateX(80deg) translateZ(-200px)' }} 
                    />
                    
                    {items.map((item, i) => (
                        <div
                            key={i}
                            ref={el => cardsRef.current[i] = el}
                            className="carousel-card absolute w-[260px] p-6 rounded-[1.5rem] flex flex-col items-center text-center bg-white border border-stone-100"
                        >
                            <div className="icon-container p-3 rounded-xl mb-4 bg-stone-100 text-stone-300">
                                {React.cloneElement(item.icon, { size: 24, strokeWidth: 1.5 })}
                            </div>
                            <h4 className="landscape-title text-base font-black mb-2 tracking-tighter uppercase text-stone-300">
                                {item.title}
                            </h4>
                            <p className="landscape-desc leading-relaxed font-medium text-[10px] px-2 text-stone-100">
                                {item.desc}
                            </p>
                            
                            <div className="mt-4 h-0.5 w-0 bg-stone-100 rounded-full overflow-hidden landscape-progress">
                                 <div className="h-full bg-[#5D4037] animate-pulse" style={{ width: '100%' }} />
                            </div>
                        </div>
                    ))}
                </div>

                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
                     <div className="w-px h-8 bg-gradient-to-b from-transparent via-stone-300 to-transparent"></div>
                     <span className="text-stone-400 font-bold tracking-[0.5em] uppercase text-[8px] whitespace-nowrap">
                          Scroll to traverse
                     </span>
                </div>
            </div>
        </div>
    );
};

const AboutPage = () => {
    return (
        <div className="w-full max-w-7xl mx-auto z-10 relative flex flex-col gap-6 pb-12">
            <FadeInSection delay={0}>
                <div className="text-center max-w-3xl mx-auto mt-4">
                    <h2 className="text-3xl md:text-5xl font-black text-stone-800 mb-6 tracking-tight">
                        Acoustic Intelligence <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-stone-700 to-stone-400">
                            For Asymmetric Threats
                        </span>
                    </h2>
                    <p className="text-stone-500 text-lg leading-relaxed">
                        Traditional radar struggles with low-altitude micro-UAVs. Our pipeline leverages 85-dimensional acoustic feature extraction and machine learning to achieve passive, real-time detection with 97.5% recall.
                    </p>
                </div>
            </FadeInSection>

            <FadeInSection delay={100}>
                <ThreatLandscapeCarousel />
            </FadeInSection>

            <FadeInSection delay={200}>
                <div className="bg-white/60 p-8 rounded-3xl border border-stone-200 backdrop-blur-md shadow-sm">
                    <h3 className="text-xl font-medium text-stone-800 mb-8 text-center">End-to-End Analysis Pipeline</h3>
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4 relative">
                        <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-gradient-to-r from-stone-200 via-stone-400 to-stone-200 -translate-y-1/2 z-0"></div>
                        {[
                            { label: 'Audio In', icon: <FileAudio /> },
                            { label: 'Decode', icon: <Cpu /> },
                            { label: 'Features', icon: <Network /> },
                            { label: 'Model', icon: <Server /> },
                            { label: 'Decision', icon: <Zap /> }
                        ].map((node, i) => (
                            <div key={i} className="relative z-10 flex flex-col items-center gap-3">
                                <div className="w-16 h-16 rounded-2xl bg-white border border-stone-200 flex items-center justify-center text-stone-600 shadow-md hover:scale-110 hover:border-stone-400 transition-all duration-300">
                                    {node.icon}
                                </div>
                                <span className="text-sm font-medium text-stone-600">{node.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </FadeInSection>

            <div className="grid md:grid-cols-2 gap-8">
                <FadeInSection delay={300}>
                    <div className="h-full">
                        <h3 className="text-xl font-medium text-stone-800 mb-6">Why This Approach Works</h3>
                        <div className="space-y-4">
                            <div className="p-4 border-l-2 border-emerald-500 bg-stone-50/80 rounded-r-xl">
                                <h4 className="text-emerald-700 font-medium mb-1">High Recall Priority</h4>
                                <p className="text-stone-500 text-sm">Configured threshold at 15% to prioritize catching 97.5% of drones, accepting minor false positives over critical misses.</p>
                            </div>
                            <div className="p-4 border-l-2 border-stone-500 bg-stone-50/80 rounded-r-xl">
                                <h4 className="text-stone-700 font-medium mb-1">Passive Operation</h4>
                                <p className="text-stone-500 text-sm">Unlike radar, acoustic sensors emit no signals, making the defense system undetectable to intruders.</p>
                            </div>
                            <div className="p-4 border-l-2 border-purple-500 bg-stone-50/80 rounded-r-xl">
                                <h4 className="text-purple-700 font-medium mb-1">Interpretable Features</h4>
                                <p className="text-stone-500 text-sm">Using standard MFCCs allows deterministic analysis compared to black-box deep learning visual models.</p>
                            </div>
                        </div>
                    </div>
                </FadeInSection>

                <FadeInSection delay={400}>
                    <div className="h-full">
                        <h3 className="text-xl font-medium text-stone-800 mb-6">Technology Stack</h3>
                        <div className="flex flex-wrap gap-3">
                            {['Python 3', 'scikit-learn', 'librosa', 'Flask', 'NumPy', 'Pandas', 'Web Audio API', 'React', 'Tailwind', 'Canvas Rendering'].map((tech, i) => (
                                <span key={i} className="px-4 py-2 bg-white border border-stone-200 rounded-full text-stone-600 text-sm hover:border-stone-400 hover:text-stone-800 transition-colors shadow-sm cursor-default">
                                    {tech}
                                </span>
                            ))}
                        </div>
                    </div>
                </FadeInSection>
            </div>
        </div>
    );
};

const encodeWAV = (samples, sampleRate) => {
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);
    
    const writeString = (view, offset, string) => {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    };
    
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + samples.length * 2, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true); 
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(view, 36, 'data');
    view.setUint32(40, samples.length * 2, true);
    
    let offset = 44;
    for (let i = 0; i < samples.length; i++, offset += 2) {
        let s = Math.max(-1, Math.min(1, samples[i]));
        view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
    
    return new Blob([view], { type: 'audio/wav' });
};

const LiveMonitor = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [droneDetected, setDroneDetected] = useState(false);
    const [confidence, setConfidence] = useState(0);
    const [error, setError] = useState(null);

    const audioCtxRef = useRef(null);
    const processorRef = useRef(null);
    const streamRef = useRef(null);
    const bufferRef = useRef(new Float32Array(0));
    const intervalRef = useRef(null);
    const sampleRateRef = useRef(44100);

    const sendBuffer = async () => {
        if (bufferRef.current.length === 0) return;
        
        const wavBlob = encodeWAV(bufferRef.current, sampleRateRef.current);
        const formData = new FormData();
        formData.append("audio", wavBlob, "live_audio.wav");

        try {
            const res = await fetch("http://localhost:5050/api/stream_predict", {
                method: "POST",
                body: formData
            });
            const data = await res.json();
            
            if (data.error) {
                console.error("Prediction error:", data.error);
                return;
            }
            
            setDroneDetected(data.is_drone);
            setConfidence(data.confidence);
            
        } catch (err) {
            console.error("Failed to send audio chunk:", err);
        }
    };

    const startRecording = async () => {
        try {
            setError(null);
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;
            
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            const audioCtx = new AudioContext();
            audioCtxRef.current = audioCtx;
            sampleRateRef.current = audioCtx.sampleRate;
            
            const source = audioCtx.createMediaStreamSource(stream);
            const processor = audioCtx.createScriptProcessor(4096, 1, 1);
            processorRef.current = processor;
            
            processor.onaudioprocess = (e) => {
                const input = e.inputBuffer.getChannelData(0);
                const newBuffer = new Float32Array(bufferRef.current.length + input.length);
                newBuffer.set(bufferRef.current);
                newBuffer.set(input, bufferRef.current.length);
                
                const maxSamples = audioCtx.sampleRate * 3; 
                if (newBuffer.length > maxSamples) {
                    bufferRef.current = newBuffer.slice(newBuffer.length - maxSamples);
                } else {
                    bufferRef.current = newBuffer;
                }
            };
            
            const gainNode = audioCtx.createGain();
            gainNode.gain.value = 0; 
            source.connect(processor);
            processor.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            
            setIsRecording(true);
            setDroneDetected(false);
            setConfidence(0);
            
            intervalRef.current = setInterval(sendBuffer, 1000); 
            
        } catch (err) {
            setError(err.message);
        }
    };

    const stopRecording = () => {
        setIsRecording(false);
        if (intervalRef.current) clearInterval(intervalRef.current);
        if (processorRef.current) processorRef.current.disconnect();
        if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') audioCtxRef.current.close();
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }
        setDroneDetected(false);
        setConfidence(0);
    };

    useEffect(() => {
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
                audioCtxRef.current.close();
            }
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    return (
        <div className="w-full min-h-[70vh] flex flex-col items-center justify-center p-8 bg-stone-900 rounded-[3rem] text-stone-100 relative overflow-hidden shadow-2xl border border-stone-800">
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                <div className={`w-[800px] h-[800px] border border-stone-600 rounded-full absolute ${isRecording ? 'animate-[spin_4s_linear_infinite]' : ''}`}>
                    <div className="w-1/2 h-full bg-gradient-to-r from-transparent to-stone-500 rounded-r-full opacity-10"></div>
                </div>
                <div className="w-[600px] h-[600px] border border-stone-700 rounded-full absolute"></div>
                <div className="w-[400px] h-[400px] border border-stone-700 rounded-full absolute"></div>
                <div className="w-[200px] h-[200px] border border-stone-700 rounded-full absolute"></div>
            </div>

            <div className="z-10 flex flex-col items-center max-w-2xl text-center space-y-8">
                <div>
                    <h2 className="text-4xl font-light mb-4">Live Acoustic Monitor</h2>
                    <p className="text-stone-400">
                        Continuously analyzing the surrounding environment using a rolling 3-second overlapping window.
                    </p>
                </div>

                <div className="relative w-64 h-64 flex items-center justify-center">
                    <div className={`absolute inset-0 rounded-full transition-all duration-500 ${droneDetected ? 'bg-red-500/20 shadow-[0_0_50px_rgba(239,68,68,0.5)] border-red-500' : 'bg-stone-800 border-stone-700'} border-4`}></div>
                    
                    {droneDetected && (
                        <div className="absolute inset-0 rounded-full animate-ping bg-red-500/30"></div>
                    )}
                    
                    <div className="z-10 flex flex-col items-center justify-center">
                        {droneDetected ? (
                            <AlertTriangle className="w-16 h-16 text-red-500 mb-2 animate-pulse" />
                        ) : (
                            <Radar className={`w-16 h-16 ${isRecording ? 'text-emerald-400' : 'text-stone-600'}`} />
                        )}
                        <span className={`text-2xl font-bold ${droneDetected ? 'text-red-500' : 'text-stone-500'}`}>
                            {droneDetected ? 'DRONE DETECTED' : (isRecording ? 'SCANNING' : 'STANDBY')}
                        </span>
                    </div>
                </div>

                <div className={`transition-all duration-300 w-full ${droneDetected ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none h-0 overflow-hidden'}`}>
                    <div className="bg-red-950/50 border border-red-500/50 p-6 rounded-2xl flex items-center justify-between">
                        <div className="text-left">
                            <h3 className="text-red-400 font-bold text-lg flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5" /> THREAT DETECTED
                            </h3>
                            <p className="text-red-200/70 text-sm mt-1">Acoustic signature matches drone profile.</p>
                        </div>
                        <div className="text-right">
                            <div className="text-3xl font-mono text-red-400">{confidence}%</div>
                            <div className="text-red-500/70 text-xs">CONFIDENCE</div>
                        </div>
                    </div>
                </div>

                <div className="pt-8 flex flex-col items-center gap-4">
                    {error && (
                        <div className="text-red-400 text-sm bg-red-950/30 px-4 py-2 rounded-lg">
                            {error}
                        </div>
                    )}
                    
                    <button
                        onClick={isRecording ? stopRecording : startRecording}
                        className={`group relative px-8 py-4 rounded-full font-bold tracking-wide transition-all duration-300 flex items-center gap-3 ${
                            isRecording 
                                ? 'bg-stone-800 text-stone-300 hover:bg-stone-700 border border-stone-600'
                                : 'bg-stone-100 text-stone-900 hover:scale-105 hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]'
                        }`}
                    >
                        {isRecording ? (
                            <>
                                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                                STOP MONITORING
                            </>
                        ) : (
                            <>
                                <Mic className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                INITIATE LIVE SCAN
                            </>
                        )}
                    </button>
                    
                    {!isRecording && (
                        <span className="text-stone-500 text-sm flex items-center gap-2">
                            <Lock className="w-4 h-4" /> Requires microphone permission
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default function App() {
    const detectionPanelRef = useRef(null);
    const metricsContainerRef = useRef(null);
    const metricsSliderRef = useRef(null);
    const [metrics, setMetrics] = useState(null);

    useEffect(() => {
        fetch('/api/metrics')
            .then(res => res.json())
            .then(data => {
                if (data.status === 'ok') setMetrics(data.metrics);
            })
            .catch(console.error);
    }, []);

    useEffect(() => {
        let rafId = null;
        let isAutoScrolling = false;
        let lastScrollY = window.scrollY;

        const update = () => {
            const scrollY = window.scrollY;
            const vh = window.innerHeight || 800;
            rafId = null;
            if (detectionPanelRef.current) {
                // Fade in from opacity 0 to 1 as scroll goes from 0.6vh to 1.2vh
                const panelOpacity = scrollY > vh * 0.6 ? Math.min((scrollY - vh * 0.6) / (vh * 0.6), 1) : 0;
                detectionPanelRef.current.style.opacity = panelOpacity;
            }

            // Metrics Horizontal Slider Logic
            if (metricsContainerRef.current && metricsSliderRef.current) {
                const rect = metricsContainerRef.current.getBoundingClientRect();
                const scrollDistance = rect.height - window.innerHeight;
                let progress = 0;
                if (rect.top <= 0) {
                    progress = Math.min(1, Math.max(0, -rect.top / scrollDistance));
                }
                metricsSliderRef.current.style.transform = `translateX(-${progress * 50}%)`;
            }
        };

        const onScroll = () => {
            const scrollY = window.scrollY;
            const vh = window.innerHeight || 800;


            // At 1.15vh, the drone is reaching the far left side
            const triggerPoint = vh * 1.15;
            // The exact top of the Detection Page
            const targetPoint = vh * 1.5;

            // If the user scrolls past the trigger point but hasn't reached the Detection page yet
            if (!isAutoScrolling && scrollY > triggerPoint && scrollY < targetPoint - 10) {
                // Only trigger if they are actively scrolling DOWN
                if (scrollY > lastScrollY + 5) {
                    isAutoScrolling = true;

                    // 1. Calculate scrollbar width to prevent layout shift
                    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
                    document.body.style.paddingRight = `${scrollbarWidth}px`;

                    // 2. Temporarily hide overflow. This instantly kills the physical mouse/trackpad momentum.
                    document.body.style.overflow = 'hidden';

                    // 3. Wait a tiny fraction of a second to let the browser process the momentum kill
                    setTimeout(() => {
                        // Restore overflow
                        document.body.style.paddingRight = '';
                        document.body.style.overflow = '';

                        // 4. Now execute the smooth auto-scroll. 
                        // Because momentum is dead, there is no "tug of war" glitch!
                        window.scrollTo({ top: targetPoint, behavior: 'smooth' });

                        // Release the flag after the smooth scroll completes (~800ms)
                        setTimeout(() => { isAutoScrolling = false; }, 800);
                    }, 40);
                }
            }

            lastScrollY = scrollY;

            if (rafId) return;
            rafId = requestAnimationFrame(update);
        };

        window.addEventListener('scroll', onScroll, { passive: true });
        update();
        return () => {
            window.removeEventListener('scroll', onScroll);
            if (rafId) cancelAnimationFrame(rafId);
            document.body.style.paddingRight = '';
            document.body.style.overflow = '';
        };
    }, []);

    const scrollToSection = (id) => {
        const element = document.getElementById(id);
        if (element) {
            const headerOffset = 100;
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
            window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
        }
    };

    const PageNav = ({ positionClass = "top-8 right-8" }) => (
        <header className={`absolute ${positionClass} z-50 pointer-events-none`}>
            <nav className="flex items-center gap-1 backdrop-blur-xl bg-white/80 p-1.5 rounded-full border border-stone-200 shadow-lg pointer-events-auto">
                <button
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="px-4 py-2 rounded-full text-sm font-bold text-stone-800 hover:bg-stone-100 transition-colors flex items-center gap-2"
                >
                    <Target className="w-4 h-4" /> Home
                </button>
                <div className="w-px h-4 bg-stone-300 mx-1"></div>
                <button
                    onClick={() => scrollToSection('detection')}
                    className="px-5 py-2 rounded-full text-sm font-bold transition-all text-stone-600 hover:text-stone-900 hover:bg-stone-100"
                >
                    Detection
                </button>
                <button
                    onClick={() => scrollToSection('live-monitoring')}
                    className="px-5 py-2 rounded-full text-sm font-bold transition-all text-stone-600 hover:text-stone-900 hover:bg-stone-100 flex items-center gap-2 text-red-500 hover:text-red-600 hover:bg-red-50"
                >
                    <Radar className="w-4 h-4" /> Live
                </button>
                <button
                    onClick={() => scrollToSection('metrics')}
                    className="px-5 py-2 rounded-full text-sm font-bold transition-all text-stone-600 hover:text-stone-900 hover:bg-stone-100"
                >
                    Metrics
                </button>
                <button
                    onClick={() => scrollToSection('statistics')}
                    className="px-5 py-2 rounded-full text-sm font-bold transition-all text-stone-600 hover:text-stone-900 hover:bg-stone-100"
                >
                    Statistics
                </button>
                <button
                    onClick={() => scrollToSection('about')}
                    className="px-5 py-2 rounded-full text-sm font-bold transition-all text-stone-600 hover:text-stone-900 hover:bg-stone-100"
                >
                    About
                </button>
            </nav>
        </header>
    );

    return (
        <div className="min-h-screen bg-[#fdfbf7] text-stone-800 font-sans selection:bg-stone-200">

            <ParticleBackground />

            {/* Spacer for scroll */}
            <div className="h-[150vh]" />

            {/* Fixed Hero */}
            <div className="fixed top-0 left-0 w-full h-screen z-10 pointer-events-none">
                <div className="pointer-events-auto w-full h-full relative">
                    <DroneHero />
                </div>
            </div>

            {/* Detection page — Slides up naturally in document flow */}
            <div
                ref={detectionPanelRef}
                className="relative z-20 flex flex-col min-h-screen rounded-t-[3rem] border-t border-stone-200/80 shadow-[0_-20px_60px_rgba(0,0,0,0.08)] bg-[#fdfbf7]"
                style={{
                    background: 'radial-gradient(circle at top center, #fdfbf7 0%, #f0e6d8 100%)',
                    opacity: 0,
                    willChange: 'opacity'
                }}
            >
                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-24 h-1.5 bg-stone-300/60 rounded-full" />


                <main className="flex-1 flex flex-col w-full">
                    {/* DetectionPage is no longer constrained by max-w-7xl, it controls its own layout */}
                    <div className="w-full flex flex-col pb-32">
                        <section id="detection" className="w-full relative">
                            <DetectionPage PageNav={PageNav} />
                        </section>

                        <div className="w-full max-w-7xl mx-auto flex flex-col gap-32 px-6">
                            <div className="w-full h-px bg-stone-300/50 mt-16" />

                            <section id="live-monitoring" className="w-full relative pt-8">
                                <PageNav positionClass="-top-4 -right-2 md:-top-8 md:-right-10 lg:-right-16" />
                                <LiveMonitor />
                            </section>

                            <div className="w-full h-px bg-stone-300/50" />

                            <section id="metrics" className="w-full relative">
                                <div ref={metricsContainerRef} className="h-[200vh] w-full relative">
                                    <div className="sticky top-0 h-screen w-[100vw] -ml-[calc((100vw-100%)/2)] overflow-hidden flex items-center">
                                        <div ref={metricsSliderRef} className="flex w-[200vw] h-full will-change-transform">
                                            {/* PAGE 1: Metrics */}
                                            <div className="w-[100vw] flex-shrink-0 flex items-center justify-center px-6 lg:px-12 relative pt-24">
                                                <PageNav positionClass="top-8 right-8" />
                                                <MetricsPage metrics={metrics} />
                                            </div>

                                            {/* PAGE 2: Statistics */}
                                            <div id="statistics" className="w-[100vw] flex-shrink-0 flex items-center justify-center px-6 lg:px-12 relative pt-24">
                                                <PageNav positionClass="top-8 right-8" />
                                                <DataStatisticsPage metrics={metrics} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <div className="w-full h-px bg-stone-300/50" />

                            <section id="about" className="w-full relative pt-8">
                                <PageNav positionClass="-top-4 -right-2 md:-top-8 md:-right-10 lg:-right-16" />
                                <AboutPage />
                            </section>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}