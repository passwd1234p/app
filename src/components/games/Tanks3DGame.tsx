import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { PlayerConfig } from '../../game/types';
import { sound } from '../../game/sound';
import { RotateCcw, Crosshair, ChevronDown, ChevronUp, Eye } from 'lucide-react';
import confetti from 'canvas-confetti';

interface Tanks3DGameProps {
  playerCount: number;
  players: PlayerConfig[];
  onGameOver?: (winner: PlayerConfig) => void;
}

interface Projectile {
  mesh: THREE.Mesh;
  direction: THREE.Vector3;
  shooterId: number;
  life: number;
}

interface Particle {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
}

interface TankEntity {
  id: number;
  group: THREE.Group;
  turretGroup: THREE.Group;
  cannonMesh: THREE.Mesh;
  color: string;
  position: THREE.Vector3;
  rotation: number;
  speed: number;
  health: number;
  maxHealth: number;
  isAi: boolean;
  score: number;
  cooldown: number;
  moveInput: { forward: number; turn: number };
}

export const Tanks3DGame: React.FC<Tanks3DGameProps> = ({
  playerCount,
  players,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [hudCollapsed, setHudCollapsed] = useState(false);
  const [cameraMode, setCameraMode] = useState<'arena' | 'chase'>('arena');
  const [tankHealths, setTankHealths] = useState<{ [id: number]: number }>({
    1: 100,
    2: 100,
    3: 100,
    4: 100,
  });
  const [scores, setScores] = useState<{ [id: number]: number }>({
    1: 0,
    2: 0,
    3: 0,
    4: 0,
  });
  const [roundWinner, setRoundWinner] = useState<string | null>(null);

  // References for live loop state
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const tanksRef = useRef<TankEntity[]>([]);
  const projectilesRef = useRef<Projectile[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const obstaclesRef = useRef<THREE.Mesh[]>([]);
  const animFrameRef = useRef<number | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  // Input state for all potential players
  const inputStateRef = useRef<{
    [id: number]: { forward: number; turn: number; fire: boolean };
  }>({
    1: { forward: 0, turn: 0, fire: false },
    2: { forward: 0, turn: 0, fire: false },
    3: { forward: 0, turn: 0, fire: false },
    4: { forward: 0, turn: 0, fire: false },
  });

  // Keyboard handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Player 1 (WASD + Space)
      if (e.code === 'KeyW') inputStateRef.current[1].forward = 1;
      if (e.code === 'KeyS') inputStateRef.current[1].forward = -1;
      if (e.code === 'KeyA') inputStateRef.current[1].turn = 1;
      if (e.code === 'KeyD') inputStateRef.current[1].turn = -1;
      if (e.code === 'Space') inputStateRef.current[1].fire = true;

      // Player 2 (Arrows + Enter)
      if (e.code === 'ArrowUp') inputStateRef.current[2].forward = 1;
      if (e.code === 'ArrowDown') inputStateRef.current[2].forward = -1;
      if (e.code === 'ArrowLeft') inputStateRef.current[2].turn = 1;
      if (e.code === 'ArrowRight') inputStateRef.current[2].turn = -1;
      if (e.code === 'Enter') inputStateRef.current[2].fire = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'KeyW' || e.code === 'KeyS') inputStateRef.current[1].forward = 0;
      if (e.code === 'KeyA' || e.code === 'KeyD') inputStateRef.current[1].turn = 0;
      if (e.code === 'Space') inputStateRef.current[1].fire = false;

      if (e.code === 'ArrowUp' || e.code === 'ArrowDown') inputStateRef.current[2].forward = 0;
      if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') inputStateRef.current[2].turn = 0;
      if (e.code === 'Enter') inputStateRef.current[2].fire = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Spawn tank procedural model
  const createTankGroup = (colorHex: string): { group: THREE.Group; turretGroup: THREE.Group; cannonMesh: THREE.Mesh } => {
    const group = new THREE.Group();

    // 1. Tank Hull Body (Metallic beveled box)
    const hullGeo = new THREE.BoxGeometry(2.4, 0.7, 3.2);
    const hullMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(colorHex),
      metalness: 0.7,
      roughness: 0.3,
    });
    const hull = new THREE.Mesh(hullGeo, hullMat);
    hull.position.y = 0.6;
    hull.castShadow = true;
    hull.receiveShadow = true;
    group.add(hull);

    // 2. Left & Right Tracks
    const trackGeo = new THREE.BoxGeometry(0.5, 0.6, 3.4);
    const trackMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.9,
      roughness: 0.7,
    });
    const leftTrack = new THREE.Mesh(trackGeo, trackMat);
    leftTrack.position.set(-1.3, 0.45, 0);
    leftTrack.castShadow = true;
    group.add(leftTrack);

    const rightTrack = new THREE.Mesh(trackGeo, trackMat);
    rightTrack.position.set(1.3, 0.45, 0);
    rightTrack.castShadow = true;
    group.add(rightTrack);

    // 3. Rotating Turret
    const turretGroup = new THREE.Group();
    turretGroup.position.set(0, 1.05, 0);

    const domeGeo = new THREE.CylinderGeometry(0.9, 1.1, 0.6, 16);
    const domeMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(colorHex).multiplyScalar(1.2),
      metalness: 0.8,
      roughness: 0.2,
    });
    const dome = new THREE.Mesh(domeGeo, domeMat);
    dome.castShadow = true;
    turretGroup.add(dome);

    // 4. Cannon Barrel
    const cannonGeo = new THREE.CylinderGeometry(0.14, 0.18, 1.8, 12);
    cannonGeo.rotateX(Math.PI / 2);
    cannonGeo.translate(0, 0.1, 1.0);
    const cannonMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.9,
      roughness: 0.2,
    });
    const cannonMesh = new THREE.Mesh(cannonGeo, cannonMat);
    cannonMesh.castShadow = true;
    turretGroup.add(cannonMesh);

    group.add(turretGroup);

    return { group, turretGroup, cannonMesh };
  };

  // Three.js Scene Setup & Game Loop
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x050814);
    scene.fog = new THREE.FogExp2(0x050814, 0.015);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 200);
    camera.position.set(0, 32, 28);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    container.appendChild(renderer.domElement);

    // Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfff5e6, 2.0);
    dirLight.position.set(20, 40, 20);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 100;
    const d = 30;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    scene.add(dirLight);

    // Floor Arena Ground
    const groundGeo = new THREE.PlaneGeometry(60, 60);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.6,
      metalness: 0.3,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Arena Floor Grid Lines
    const gridHelper = new THREE.GridHelper(60, 30, 0x06b6d4, 0x1e293b);
    gridHelper.position.y = 0.02;
    scene.add(gridHelper);

    // Perimeter Arena Border Walls
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.8,
      roughness: 0.2,
    });
    const wallGeoH = new THREE.BoxGeometry(60, 3, 1.5);
    const wallGeoV = new THREE.BoxGeometry(1.5, 3, 60);

    const northWall = new THREE.Mesh(wallGeoH, wallMat);
    northWall.position.set(0, 1.5, -30);
    northWall.castShadow = true;
    scene.add(northWall);

    const southWall = new THREE.Mesh(wallGeoH, wallMat);
    southWall.position.set(0, 1.5, 30);
    southWall.castShadow = true;
    scene.add(southWall);

    const eastWall = new THREE.Mesh(wallGeoV, wallMat);
    eastWall.position.set(30, 1.5, 0);
    eastWall.castShadow = true;
    scene.add(eastWall);

    const westWall = new THREE.Mesh(wallGeoV, wallMat);
    westWall.position.set(-30, 1.5, 0);
    westWall.castShadow = true;
    scene.add(westWall);

    // Obstacles / Crates in Arena
    const obstacles: THREE.Mesh[] = [];
    const crateGeo = new THREE.BoxGeometry(3.5, 3.5, 3.5);
    const crateMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.4,
      metalness: 0.6,
    });

    const cratePositions = [
      [-12, -12],
      [12, -12],
      [-12, 12],
      [12, 12],
      [0, -14],
      [0, 14],
      [-14, 0],
      [14, 0],
      [0, 0],
    ];

    cratePositions.forEach(([x, z]) => {
      const crate = new THREE.Mesh(crateGeo, crateMat);
      crate.position.set(x, 1.75, z);
      crate.castShadow = true;
      crate.receiveShadow = true;
      scene.add(crate);
      obstacles.push(crate);
    });
    obstaclesRef.current = obstacles;

    // Spawn Tanks for Active Players
    const spawnPoints = [
      { x: -9, z: -9, angle: Math.PI / 4 },
      { x: 9, z: 9, angle: (5 * Math.PI) / 4 },
      { x: 9, z: -9, angle: (3 * Math.PI) / 4 },
      { x: -9, z: 9, angle: (7 * Math.PI) / 4 },
    ];

    const activeTanks: TankEntity[] = [];
    const totalTanks = playerCount === 1 ? 4 : playerCount; // 1P spawns 3 AI bots!

    for (let i = 0; i < totalTanks; i++) {
      const pConfig = players[i] || {
        id: i + 1,
        color: ['#ef4444', '#3b82f6', '#22c55e', '#eab308'][i],
        name: `دبابة ${i + 1}`,
      };

      const isAi = playerCount === 1 ? i > 0 : false;
      const { group, turretGroup, cannonMesh } = createTankGroup(pConfig.color);

      const sp = spawnPoints[i];
      group.position.set(sp.x, 0, sp.z);
      group.rotation.y = sp.angle;
      scene.add(group);

      activeTanks.push({
        id: i + 1,
        group,
        turretGroup,
        cannonMesh,
        color: pConfig.color,
        position: group.position,
        rotation: sp.angle,
        speed: 0,
        health: 100,
        maxHealth: 100,
        isAi,
        score: 0,
        cooldown: 0,
        moveInput: { forward: 0, turn: 0 },
      });
    }
    tanksRef.current = activeTanks;

    // Resize Handler
    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Spawn Projectile
    const fireBullet = (tank: TankEntity) => {
      if (tank.cooldown > 0 || tank.health <= 0) return;
      tank.cooldown = 24; // frames
      sound.playShoot();

      const bulletGeo = new THREE.SphereGeometry(0.35, 10, 10);
      const bulletMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(tank.color) });
      const bulletMesh = new THREE.Mesh(bulletGeo, bulletMat);

      // Calculate spawn point at cannon tip
      const forward = new THREE.Vector3(
        Math.sin(tank.group.rotation.y),
        0,
        Math.cos(tank.group.rotation.y)
      );
      const spawnPos = tank.group.position.clone().add(forward.clone().multiplyScalar(2.6));
      spawnPos.y = 1.3;
      bulletMesh.position.copy(spawnPos);
      scene.add(bulletMesh);

      projectilesRef.current.push({
        mesh: bulletMesh,
        direction: forward,
        shooterId: tank.id,
        life: 140,
      });

      // Recoil effect
      tank.cannonMesh.position.z -= 0.3;
      setTimeout(() => {
        tank.cannonMesh.position.z += 0.3;
      }, 70);
    };

    // Explosion Effect
    const spawnExplosion = (pos: THREE.Vector3, color: string) => {
      sound.playExplosion();
      for (let i = 0; i < 18; i++) {
        const pGeo = new THREE.BoxGeometry(0.3, 0.3, 0.3);
        const pMat = new THREE.MeshBasicMaterial({
          color: Math.random() > 0.5 ? 0xf97316 : new THREE.Color(color),
        });
        const pMesh = new THREE.Mesh(pGeo, pMat);
        pMesh.position.copy(pos);
        scene.add(pMesh);

        particlesRef.current.push({
          mesh: pMesh,
          velocity: new THREE.Vector3(
            (Math.random() - 0.5) * 0.7,
            Math.random() * 0.6 + 0.2,
            (Math.random() - 0.5) * 0.7
          ),
          life: 0,
          maxLife: 30 + Math.random() * 20,
        });
      }
    };

    // Main Game Loop
    let lastTime = performance.now();
    const clock = new THREE.Clock();

    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);
      const delta = Math.min(clock.getDelta(), 0.1);

      // Update Tanks
      tanksRef.current.forEach((tank) => {
        if (tank.health <= 0) {
          tank.group.visible = false;
          return;
        }

        if (tank.cooldown > 0) tank.cooldown--;

        // Determine input (Player or AI)
        if (tank.isAi) {
          // AI Behavior: Track closest alive enemy
          const target = tanksRef.current.find((t) => t.id !== tank.id && t.health > 0);
          if (target) {
            const dx = target.position.x - tank.position.x;
            const dz = target.position.z - tank.position.z;
            const targetAngle = Math.atan2(dx, dz);
            const diff = targetAngle - tank.group.rotation.y;
            tank.group.rotation.y += Math.sign(diff) * 0.035;
            tank.speed = 0.14;

            // Shoot if aligned roughly
            if (Math.abs(diff) < 0.35 && tank.cooldown === 0 && Math.random() < 0.04) {
              fireBullet(tank);
            }
          }
        } else {
          // Player input
          const input = inputStateRef.current[tank.id] || { forward: 0, turn: 0, fire: false };
          tank.group.rotation.y += input.turn * 0.055;
          tank.speed = input.forward * 0.22;

          if (input.fire) {
            fireBullet(tank);
          }
        }

        // Apply movement
        if (tank.speed !== 0) {
          const moveX = Math.sin(tank.group.rotation.y) * tank.speed;
          const moveZ = Math.cos(tank.group.rotation.y) * tank.speed;
          const newX = tank.group.position.x + moveX;
          const newZ = tank.group.position.z + moveZ;

          // Boundary check (-28 to +28)
          if (Math.abs(newX) < 27.5) tank.group.position.x = newX;
          if (Math.abs(newZ) < 27.5) tank.group.position.z = newZ;
        }
      });

      // Update Projectiles
      for (let i = projectilesRef.current.length - 1; i >= 0; i--) {
        const proj = projectilesRef.current[i];
        proj.life--;
        proj.mesh.position.add(proj.direction.clone().multiplyScalar(0.7));

        let hit = false;

        // Check Tank Hits
        for (const tank of tanksRef.current) {
          if (tank.health > 0 && tank.id !== proj.shooterId) {
            const dist = proj.mesh.position.distanceTo(tank.group.position);
            if (dist < 2.0) {
              hit = true;
              tank.health = Math.max(0, tank.health - 25);
              spawnExplosion(proj.mesh.position, tank.color);

              // Update UI Healths
              setTankHealths((prev) => ({ ...prev, [tank.id]: tank.health }));

              if (tank.health <= 0) {
                // Shooter gets score
                setScores((prev) => ({
                  ...prev,
                  [proj.shooterId]: (prev[proj.shooterId] || 0) + 1,
                }));

                // Check winner
                const alive = tanksRef.current.filter((t) => t.health > 0);
                if (alive.length === 1) {
                  const winName = players.find((p) => p.id === alive[0].id)?.name || `اللاعب ${alive[0].id}`;
                  setRoundWinner(winName);
                  sound.playWin();
                  confetti({ particleCount: 100, spread: 70 });
                }
              }
              break;
            }
          }
        }

        // Check Obstacle Hits or Boundary
        if (!hit) {
          if (
            Math.abs(proj.mesh.position.x) > 28.5 ||
            Math.abs(proj.mesh.position.z) > 28.5
          ) {
            hit = true;
          } else {
            for (const crate of obstaclesRef.current) {
              if (proj.mesh.position.distanceTo(crate.position) < 2.2) {
                hit = true;
                break;
              }
            }
          }
        }

        if (hit || proj.life <= 0) {
          scene.remove(proj.mesh);
          proj.mesh.geometry.dispose();
          projectilesRef.current.splice(i, 1);
        }
      }

      // Update Particles
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.life++;
        p.mesh.position.add(p.velocity);
        p.velocity.y -= 0.02; // gravity
        p.mesh.scale.multiplyScalar(0.95);

        if (p.life >= p.maxLife) {
          scene.remove(p.mesh);
          p.mesh.geometry.dispose();
          particlesRef.current.splice(i, 1);
        }
      }

      // Camera Follow or Overview
      if (cameraMode === 'chase' && tanksRef.current[0]) {
        const p1 = tanksRef.current[0];
        const offset = new THREE.Vector3(
          -Math.sin(p1.group.rotation.y) * 12,
          10,
          -Math.cos(p1.group.rotation.y) * 12
        );
        camera.position.lerp(p1.group.position.clone().add(offset), 0.08);
        camera.lookAt(p1.group.position.x, 2, p1.group.position.z);
      } else {
        camera.position.lerp(new THREE.Vector3(0, 32, 28), 0.05);
        camera.lookAt(0, 0, 0);
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
  }, [playerCount, cameraMode]);

  // Restart Round
  const restartRound = () => {
    sound.playClick();
    setRoundWinner(null);
    setTankHealths({ 1: 100, 2: 100, 3: 100, 4: 100 });

    const spawnPoints = [
      { x: -9, z: -9, angle: Math.PI / 4 },
      { x: 9, z: 9, angle: (5 * Math.PI) / 4 },
      { x: 9, z: -9, angle: (3 * Math.PI) / 4 },
      { x: -9, z: 9, angle: (7 * Math.PI) / 4 },
    ];

    tanksRef.current.forEach((tank, idx) => {
      tank.health = 100;
      tank.group.visible = true;
      const sp = spawnPoints[idx];
      tank.group.position.set(sp.x, 0, sp.z);
      tank.group.rotation.y = sp.angle;
      tank.cooldown = 0;
    });
  };

  // Touch Virtual Joystick Handler for Player 1 & 2
  const handleTouchControl = (playerId: number, action: 'forward' | 'backward' | 'left' | 'right' | 'stopTurn' | 'stopMove' | 'fire' | 'stopFire') => {
    if (!inputStateRef.current[playerId]) return;
    if (action === 'forward') inputStateRef.current[playerId].forward = 1;
    if (action === 'backward') inputStateRef.current[playerId].forward = -1;
    if (action === 'left') inputStateRef.current[playerId].turn = 1;
    if (action === 'right') inputStateRef.current[playerId].turn = -1;
    if (action === 'stopMove') inputStateRef.current[playerId].forward = 0;
    if (action === 'stopTurn') inputStateRef.current[playerId].turn = 0;
    if (action === 'fire') inputStateRef.current[playerId].fire = true;
    if (action === 'stopFire') inputStateRef.current[playerId].fire = false;
  };

  return (
    <div className="relative w-full h-[78vh] min-h-[520px] bg-slate-950 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col">
      {/* 3D WebGL Canvas Mounting Point */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full" />

      {/* Top HUD: Health & Scores & Action Controls */}
      <div className="relative z-10 px-4 py-3 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div className="flex flex-wrap items-center gap-2 pointer-events-auto">
          {players.slice(0, playerCount === 1 ? 4 : playerCount).map((p) => (
            <div
              key={p.id}
              className="px-3 py-1.5 rounded-xl bg-slate-900/85 backdrop-blur-md border border-slate-700/60 flex items-center gap-2 shadow-lg"
            >
              <span className="text-base">{p.avatar}</span>
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-white flex items-center justify-between gap-2">
                  <span>{playerCount === 1 && p.id > 1 ? `روبوت ${p.id}` : p.name}</span>
                  <span className="text-amber-400 font-extrabold">{scores[p.id] || 0}</span>
                </span>
                {/* Health Bar */}
                <div className="w-16 sm:w-20 h-1.5 bg-slate-800 rounded-full overflow-hidden mt-0.5">
                  <div
                    className="h-full rounded-full transition-all duration-200"
                    style={{
                      width: `${tankHealths[p.id] || 0}%`,
                      backgroundColor: p.color,
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Top Utility Buttons */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={restartRound}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/90 backdrop-blur-md hover:bg-slate-800 text-cyan-400 rounded-xl text-xs font-bold border border-slate-700/60 transition-all cursor-pointer shadow-md active:scale-95"
            title="إعادة بدء الجولة"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>إعادة</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setCameraMode((prev) => (prev === 'arena' ? 'chase' : 'arena'));
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/90 backdrop-blur-md hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-bold border border-slate-700/60 transition-all cursor-pointer shadow-md"
            title="تبديل زاوية الكاميرا"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{cameraMode === 'arena' ? 'منظور علوي' : 'منظور خلفي'}</span>
          </button>
        </div>

        {/* Round Winner Toast */}
        {roundWinner && (
          <div className="w-full pointer-events-auto px-4 py-2 rounded-2xl bg-amber-500/95 text-slate-950 font-black text-sm flex items-center justify-between shadow-xl animate-bounce">
            <span>🏆 الفائز بالجولة: {roundWinner}!</span>
            <button
              onClick={restartRound}
              className="px-3 py-1 bg-slate-950 text-white rounded-xl text-xs font-bold"
            >
              جولة جديدة
            </button>
          </div>
        )}
      </div>

      {/* On-Screen Mobile Phone Touch Controls: Clear, un-occluded bottom area */}
      <div className="absolute inset-x-0 bottom-4 z-20 px-5 flex items-end justify-between pointer-events-none">
        {/* Left Side: D-Pad Steering & Drive */}
        <div className="pointer-events-auto flex flex-col items-center gap-1 bg-slate-900/85 backdrop-blur-md p-2 rounded-3xl border border-slate-700/60 shadow-2xl">
          <button
            onTouchStart={() => handleTouchControl(1, 'forward')}
            onTouchEnd={() => handleTouchControl(1, 'stopMove')}
            onMouseDown={() => handleTouchControl(1, 'forward')}
            onMouseUp={() => handleTouchControl(1, 'stopMove')}
            className="w-13 h-13 rounded-2xl bg-slate-800 active:bg-cyan-500/40 border border-slate-700 active:border-cyan-400 flex items-center justify-center text-cyan-400 font-bold active:scale-95 shadow cursor-pointer text-sm"
            aria-label="التحرك للأمام"
          >
            ▲
          </button>
          <div className="flex items-center gap-1">
            <button
              onTouchStart={() => handleTouchControl(1, 'left')}
              onTouchEnd={() => handleTouchControl(1, 'stopTurn')}
              onMouseDown={() => handleTouchControl(1, 'left')}
              onMouseUp={() => handleTouchControl(1, 'stopTurn')}
              className="w-13 h-13 rounded-2xl bg-slate-800 active:bg-cyan-500/40 border border-slate-700 active:border-cyan-400 flex items-center justify-center text-cyan-400 font-bold active:scale-95 shadow cursor-pointer text-sm"
              aria-label="الانعطاف يساراً"
            >
              ◀
            </button>
            <button
              onTouchStart={() => handleTouchControl(1, 'backward')}
              onTouchEnd={() => handleTouchControl(1, 'stopMove')}
              onMouseDown={() => handleTouchControl(1, 'backward')}
              onMouseUp={() => handleTouchControl(1, 'stopMove')}
              className="w-13 h-13 rounded-2xl bg-slate-800 active:bg-cyan-500/40 border border-slate-700 active:border-cyan-400 flex items-center justify-center text-cyan-400 font-bold active:scale-95 shadow cursor-pointer text-sm"
              aria-label="التحرك للخلف"
            >
              ▼
            </button>
            <button
              onTouchStart={() => handleTouchControl(1, 'right')}
              onTouchEnd={() => handleTouchControl(1, 'stopTurn')}
              onMouseDown={() => handleTouchControl(1, 'right')}
              onMouseUp={() => handleTouchControl(1, 'stopTurn')}
              className="w-13 h-13 rounded-2xl bg-slate-800 active:bg-cyan-500/40 border border-slate-700 active:border-cyan-400 flex items-center justify-center text-cyan-400 font-bold active:scale-95 shadow cursor-pointer text-sm"
              aria-label="الانعطاف يميناً"
            >
              ▶
            </button>
          </div>
        </div>

        {/* Right Side: Big Arcade Fire Button */}
        <div className="pointer-events-auto">
          <button
            onTouchStart={() => handleTouchControl(1, 'fire')}
            onTouchEnd={() => handleTouchControl(1, 'stopFire')}
            onMouseDown={() => handleTouchControl(1, 'fire')}
            onMouseUp={() => handleTouchControl(1, 'stopFire')}
            className="w-22 h-22 rounded-full bg-gradient-to-tr from-red-600 to-rose-500 active:from-red-700 active:to-rose-600 border-4 border-rose-400/60 shadow-2xl active:scale-90 flex flex-col items-center justify-center text-white cursor-pointer"
            aria-label="إطلاق القذيفة"
          >
            <Crosshair className="w-9 h-9 animate-spin-slow" />
            <span className="text-[11px] font-black tracking-wider">إطلاق</span>
          </button>
        </div>
      </div>
    </div>
  );
};

