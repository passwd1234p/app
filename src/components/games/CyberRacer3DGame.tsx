import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { PlayerConfig } from '../../game/types';
import { sound } from '../../game/sound';
import { RotateCcw, Zap, ArrowLeft, ArrowRight, Gauge } from 'lucide-react';
import confetti from 'canvas-confetti';

interface CyberRacer3DGameProps {
  playerCount: number;
  players: PlayerConfig[];
}

export const CyberRacer3DGame: React.FC<CyberRacer3DGameProps> = ({
  playerCount,
  players,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [speed, setSpeed] = useState<number>(0);
  const [distance, setDistance] = useState<number>(0);
  const [nitro, setNitro] = useState<number>(100);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const carRef = useRef<THREE.Group | null>(null);
  const car2Ref = useRef<THREE.Group | null>(null);
  const obstaclesRef = useRef<THREE.Group[]>([]);
  const nitroPadsRef = useRef<THREE.Mesh[]>([]);

  // Steer & Nitro Input
  const steerInputRef = useRef<{ p1: number; p1Nitro: boolean }>({
    p1: 0,
    p1Nitro: false,
  });

  // Keyboard handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') steerInputRef.current.p1 = 1;
      if (e.code === 'KeyD' || e.code === 'ArrowRight') steerInputRef.current.p1 = -1;
      if (e.code === 'Space' || e.code === 'ShiftLeft') steerInputRef.current.p1Nitro = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (
        (e.code === 'KeyA' || e.code === 'ArrowLeft') &&
        steerInputRef.current.p1 === 1
      )
        steerInputRef.current.p1 = 0;
      if (
        (e.code === 'KeyD' || e.code === 'ArrowRight') &&
        steerInputRef.current.p1 === -1
      )
        steerInputRef.current.p1 = 0;
      if (e.code === 'Space' || e.code === 'ShiftLeft')
        steerInputRef.current.p1Nitro = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Procedural Cyber Car Builder
  const createCyberCar = (colorHex: string): THREE.Group => {
    const carGroup = new THREE.Group();

    // Body
    const bodyGeo = new THREE.BoxGeometry(1.8, 0.6, 3.8);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(colorHex),
      metalness: 0.85,
      roughness: 0.2,
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.5;
    body.castShadow = true;
    carGroup.add(body);

    // Cabin / Windshield
    const cabinGeo = new THREE.BoxGeometry(1.4, 0.45, 1.8);
    const cabinMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      metalness: 0.9,
      roughness: 0.1,
    });
    const cabin = new THREE.Mesh(cabinGeo, cabinMat);
    cabin.position.set(0, 0.9, -0.2);
    carGroup.add(cabin);

    // Neon Headlights
    const lightGeo = new THREE.BoxGeometry(0.35, 0.15, 0.1);
    const lightMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const hl1 = new THREE.Mesh(lightGeo, lightMat);
    hl1.position.set(-0.6, 0.5, 1.9);
    const hl2 = new THREE.Mesh(lightGeo, lightMat);
    hl2.position.set(0.6, 0.5, 1.9);
    carGroup.add(hl1, hl2);

    // Spoiler
    const spoilerGeo = new THREE.BoxGeometry(1.8, 0.1, 0.4);
    const spoilerMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3 });
    const spoiler = new THREE.Mesh(spoilerGeo, spoilerMat);
    spoiler.position.set(0, 1.1, -1.7);
    carGroup.add(spoiler);

    // Wheels
    const wheelGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.3, 16);
    wheelGeo.rotateZ(Math.PI / 2);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 });

    const wheelPos = [
      [-0.95, 0.35, 1.2],
      [0.95, 0.35, 1.2],
      [-0.95, 0.35, -1.2],
      [0.95, 0.35, -1.2],
    ];

    wheelPos.forEach(([x, y, z]) => {
      const w = new THREE.Mesh(wheelGeo, wheelMat);
      w.position.set(x, y, z);
      carGroup.add(w);
    });

    return carGroup;
  };

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x030712);
    scene.fog = new THREE.FogExp2(0x030712, 0.012);

    const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 300);
    camera.position.set(0, 5, -8);
    camera.lookAt(0, 1.5, 12);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0x38bdf8, 1.5);
    dirLight.position.set(10, 30, -10);
    scene.add(dirLight);

    // Road Plane (Infinite scrolling illusion)
    const roadGeo = new THREE.PlaneGeometry(16, 400);
    const roadMat = new THREE.MeshStandardMaterial({
      color: 0x090d16,
      roughness: 0.8,
      metalness: 0.2,
    });
    const road = new THREE.Mesh(roadGeo, roadMat);
    road.rotation.x = -Math.PI / 2;
    scene.add(road);

    // Road Borders with Neon Strips
    const borderGeo = new THREE.BoxGeometry(0.4, 0.4, 400);
    const neonMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
    const leftBorder = new THREE.Mesh(borderGeo, neonMat);
    leftBorder.position.set(-8, 0.2, 0);
    const rightBorder = new THREE.Mesh(borderGeo, neonMat);
    rightBorder.position.set(8, 0.2, 0);
    scene.add(leftBorder, rightBorder);

    // Neon Skyscrapers in the background
    const cityGroup = new THREE.Group();
    for (let i = 0; i < 40; i++) {
      const bHeight = 15 + Math.random() * 45;
      const bWidth = 8 + Math.random() * 10;
      const bGeo = new THREE.BoxGeometry(bWidth, bHeight, bWidth);
      const bMat = new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        roughness: 0.4,
        metalness: 0.8,
      });
      const bMesh = new THREE.Mesh(bGeo, bMat);
      const side = Math.random() > 0.5 ? 1 : -1;
      bMesh.position.set(
        side * (18 + Math.random() * 40),
        bHeight / 2,
        Math.random() * 300 - 50
      );
      cityGroup.add(bMesh);
    }
    scene.add(cityGroup);

    // Player Car
    const playerCar = createCyberCar(players[0]?.color || '#ef4444');
    playerCar.position.set(0, 0, 0);
    scene.add(playerCar);
    carRef.current = playerCar;

    // Obstacle Vehicles / Barriers
    const obstacles: THREE.Group[] = [];
    for (let i = 0; i < 12; i++) {
      const obsCar = createCyberCar('#e11d48');
      obsCar.position.set(
        (Math.random() - 0.5) * 12,
        0,
        40 + i * 28 + Math.random() * 10
      );
      obsCar.rotation.y = Math.PI; // oncoming
      scene.add(obsCar);
      obstacles.push(obsCar);
    }
    obstaclesRef.current = obstacles;

    // Nitro Boost Pads
    const nitroPads: THREE.Mesh[] = [];
    const padGeo = new THREE.PlaneGeometry(3, 3);
    padGeo.rotateX(-Math.PI / 2);
    const padMat = new THREE.MeshBasicMaterial({
      color: 0x22c55e,
      side: THREE.DoubleSide,
    });
    for (let i = 0; i < 6; i++) {
      const pad = new THREE.Mesh(padGeo, padMat);
      pad.position.set((Math.random() - 0.5) * 10, 0.05, 60 + i * 50);
      scene.add(pad);
      nitroPads.push(pad);
    }
    nitroPadsRef.current = nitroPads;

    // Resize
    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Game loop
    let currentSpeed = 1.0;
    let distCounter = 0;
    let nitroFuel = 100;
    let gameOver = false;

    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);

      if (!gameOver && playerCar) {
        // Boost logic
        const isBoosting = steerInputRef.current.p1Nitro && nitroFuel > 0;
        if (isBoosting) {
          currentSpeed = Math.min(2.4, currentSpeed + 0.03);
          nitroFuel = Math.max(0, nitroFuel - 0.4);
        } else {
          currentSpeed = Math.max(1.0, currentSpeed - 0.02);
          nitroFuel = Math.min(100, nitroFuel + 0.1);
        }

        // Steer car
        const steer = steerInputRef.current.p1;
        playerCar.position.x += steer * 0.22;
        playerCar.position.x = Math.max(-6.8, Math.min(6.8, playerCar.position.x));
        playerCar.rotation.z = -steer * 0.12;
        playerCar.rotation.y = steer * 0.06;

        // Camera follow
        camera.position.x = THREE.MathUtils.lerp(camera.position.x, playerCar.position.x * 0.6, 0.1);

        distCounter += Math.floor(currentSpeed * 4);
        setSpeed(Math.floor(currentSpeed * 120));
        setDistance(distCounter);
        setNitro(Math.floor(nitroFuel));
        setScore(Math.floor(distCounter / 10));

        // Move oncoming obstacles towards player
        obstacles.forEach((obs) => {
          obs.position.z -= currentSpeed * 1.2;

          // Check collision
          const dx = Math.abs(obs.position.x - playerCar.position.x);
          const dz = Math.abs(obs.position.z - playerCar.position.z);
          if (dx < 1.6 && dz < 2.5) {
            // Crash!
            sound.playExplosion();
            gameOver = true;
            setIsGameOver(true);
          }

          // Respawn past camera
          if (obs.position.z < -10) {
            obs.position.z = 240 + Math.random() * 40;
            obs.position.x = (Math.random() - 0.5) * 12;
          }
        });

        // Nitro pads
        nitroPads.forEach((pad) => {
          pad.position.z -= currentSpeed * 1.2;
          if (
            Math.abs(pad.position.x - playerCar.position.x) < 2.0 &&
            Math.abs(pad.position.z - playerCar.position.z) < 2.0
          ) {
            sound.playGoal();
            nitroFuel = Math.min(100, nitroFuel + 30);
            pad.position.z = 260 + Math.random() * 50;
            pad.position.x = (Math.random() - 0.5) * 10;
          }
          if (pad.position.z < -10) {
            pad.position.z = 260 + Math.random() * 50;
            pad.position.x = (Math.random() - 0.5) * 10;
          }
        });
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (rendererRef.current && rendererRef.current.domElement) {
        rendererRef.current.dispose();
        if (container.contains(rendererRef.current.domElement)) {
          container.removeChild(rendererRef.current.domElement);
        }
      }
    };
  }, []);

  const restartRace = () => {
    sound.playClick();
    setIsGameOver(false);
    setDistance(0);
    setNitro(100);
    setScore(0);
    if (carRef.current) {
      carRef.current.position.set(0, 0, 0);
    }
    obstaclesRef.current.forEach((obs, idx) => {
      obs.position.set((Math.random() - 0.5) * 12, 0, 40 + idx * 28);
    });
  };

  return (
    <div className="relative w-full h-[78vh] min-h-[520px] bg-slate-950 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col">
      <div ref={mountRef} className="absolute inset-0 w-full h-full" />

      {/* Top HUD Stats */}
      <div className="relative z-10 px-4 py-3 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-2xl bg-slate-900/85 backdrop-blur-md border border-cyan-500/40 flex items-center gap-2">
            <Gauge className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-black text-white">{speed} كم/س</span>
          </div>

          <div className="px-3.5 py-1.5 rounded-2xl bg-slate-900/85 backdrop-blur-md border border-slate-700/60 flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400">المسافة:</span>
            <span className="text-sm font-black text-amber-400">{distance} م</span>
          </div>
        </div>

        {/* Nitro Gauge */}
        <div className="px-3.5 py-1.5 rounded-2xl bg-slate-900/85 backdrop-blur-md border border-emerald-500/40 flex items-center gap-2">
          <Zap className="w-4 h-4 text-emerald-400" />
          <div className="w-20 h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all"
              style={{ width: `${nitro}%` }}
            />
          </div>
          <span className="text-[11px] font-black text-emerald-400">{nitro}%</span>
        </div>
      </div>

      {/* Game Over Screen */}
      {isGameOver && (
        <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-rose-500/50 p-6 sm:p-8 rounded-3xl text-center space-y-4 shadow-2xl max-w-sm w-full animate-in fade-in zoom-in-95">
            <div className="text-4xl">💥</div>
            <h3 className="text-xl font-black text-white">انتهى السباق (حادث تصادم)!</h3>
            <p className="text-sm text-slate-400">
              المسافة المقطوعة: <strong className="text-amber-400">{distance} م</strong>
            </p>
            <button
              onClick={restartRace}
              className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black rounded-2xl text-sm shadow-lg cursor-pointer hover:brightness-110 active:scale-95"
            >
              إعادة المحاولة
            </button>
          </div>
        </div>
      )}

      {/* On-Screen Mobile Steering & Nitro */}
      <div className="absolute inset-x-0 bottom-14 z-20 px-6 flex items-end justify-between pointer-events-none">
        {/* Left/Right Steer Buttons */}
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            onTouchStart={() => (steerInputRef.current.p1 = 1)}
            onTouchEnd={() => (steerInputRef.current.p1 = 0)}
            onMouseDown={() => (steerInputRef.current.p1 = 1)}
            onMouseUp={() => (steerInputRef.current.p1 = 0)}
            className="w-16 h-16 rounded-2xl bg-slate-900/90 active:bg-cyan-500/40 border border-slate-700 active:border-cyan-400 flex items-center justify-center text-cyan-400 font-bold active:scale-95 shadow-xl cursor-pointer"
            aria-label="انعطاف يساراً"
          >
            <ArrowRight className="w-8 h-8" />
          </button>
          <button
            onTouchStart={() => (steerInputRef.current.p1 = -1)}
            onTouchEnd={() => (steerInputRef.current.p1 = 0)}
            onMouseDown={() => (steerInputRef.current.p1 = -1)}
            onMouseUp={() => (steerInputRef.current.p1 = 0)}
            className="w-16 h-16 rounded-2xl bg-slate-900/90 active:bg-cyan-500/40 border border-slate-700 active:border-cyan-400 flex items-center justify-center text-cyan-400 font-bold active:scale-95 shadow-xl cursor-pointer"
            aria-label="انعطاف يميناً"
          >
            <ArrowLeft className="w-8 h-8" />
          </button>
        </div>

        {/* Nitro Turbo Button */}
        <div className="pointer-events-auto">
          <button
            onTouchStart={() => (steerInputRef.current.p1Nitro = true)}
            onTouchEnd={() => (steerInputRef.current.p1Nitro = false)}
            onMouseDown={() => (steerInputRef.current.p1Nitro = true)}
            onMouseUp={() => (steerInputRef.current.p1Nitro = false)}
            className="w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 active:from-emerald-600 active:to-teal-500 border-4 border-emerald-300/60 shadow-xl active:scale-90 flex flex-col items-center justify-center text-slate-950 font-black cursor-pointer"
            aria-label="نيترو توربو"
          >
            <Zap className="w-7 h-7 fill-slate-950" />
            <span className="text-[10px] uppercase tracking-wider">نيترو</span>
          </button>
        </div>
      </div>

      {/* Bottom Dock */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 pointer-events-auto bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-800 px-4 py-2 flex items-center gap-3">
        <button
          onClick={restartRace}
          className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-xl text-xs font-bold transition-all cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>إعادة البدء</span>
        </button>
        <span className="text-[11px] text-slate-400 hidden sm:inline">
          ⌨️ تحكم الكيبورد: A / D أو الأسهم للانعطاف | المسافة للنيترو
        </span>
      </div>
    </div>
  );
};
