'use client';

import React, { useState, useEffect, useRef, Suspense, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import * as THREE from 'three';
// Local helper to generate a player ID if needed for session storage
function generatePlayerId() {
    return 'player_' + Math.random().toString(36).substr(2, 9);
}

import { gameTitle, gameSubtitle } from '@/data/displayNames';
import Tutorial from './Tutorial';
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

// Tank configuration type
interface TankConfig {
    id: number;
    startX: number;
    y: number;
    z: number;
    scale: number;
    speed: number;
    rotation: [number, number, number];
    spawnTime: number;
}

// Tank3D component - moves from right to left, reports when off screen
function Tank3D({
    config,
    onOffScreen
}: {
    config: TankConfig;
    onOffScreen: (id: number) => void;
}) {
    const groupRef = useRef<THREE.Group>(null);
    const turretRef = useRef<THREE.Group>(null);
    const wheelsLeftRef = useRef<THREE.Group>(null);
    const wheelsRightRef = useRef<THREE.Group>(null);
    const startTimeRef = useRef<number | null>(null);
    const hasReportedOffScreen = useRef(false);

    useFrame((state, delta) => {
        if (!groupRef.current) return;

        // Initialize start time on first frame
        if (startTimeRef.current === null) {
            startTimeRef.current = state.clock.elapsedTime;
        }

        const elapsed = state.clock.elapsedTime - startTimeRef.current;
        const x = config.startX - elapsed * config.speed;

        groupRef.current.position.x = x;

        // Subtle bounce
        groupRef.current.position.y = config.y + Math.sin(state.clock.elapsedTime * 3) * 0.015;

        // Check if tank is off screen (past left edge with some buffer)
        if (x < -25 && !hasReportedOffScreen.current) {
            hasReportedOffScreen.current = true;
            onOffScreen(config.id);
        }

        if (turretRef.current) {
            // Turret slightly sways
            turretRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
        }
        // Rotate wheels (using delta time for frame-rate independence)
        if (wheelsLeftRef.current) {
            wheelsLeftRef.current.children.forEach((child) => {
                if (child instanceof THREE.Mesh) {
                    child.rotation.y += delta * config.speed * 6;
                }
            });
        }
        if (wheelsRightRef.current) {
            wheelsRightRef.current.children.forEach((child) => {
                if (child instanceof THREE.Mesh) {
                    child.rotation.y += delta * config.speed * 6;
                }
            });
        }
    });

    const tankColor = "#3d4a2d"; // Military olive green
    const trackColor = "#1a1a1a";
    const metalColor = "#2a2a2a";

    return (
        <group ref={groupRef} position={[config.startX, config.y, config.z]} rotation={config.rotation} scale={config.scale}>
            {/* HULL - Main body */}
            <mesh position={[0, 0.4, 0]}>
                <boxGeometry args={[3, 0.6, 1.8]} />
                <meshStandardMaterial color={tankColor} roughness={0.8} metalness={0.3} />
            </mesh>

            {/* Hull front slope */}
            <mesh position={[1.2, 0.55, 0]} rotation={[0, 0, -0.4]}>
                <boxGeometry args={[0.8, 0.4, 1.75]} />
                <meshStandardMaterial color={tankColor} roughness={0.8} metalness={0.3} />
            </mesh>

            {/* Hull rear */}
            <mesh position={[-1.3, 0.5, 0]}>
                <boxGeometry args={[0.5, 0.5, 1.7]} />
                <meshStandardMaterial color={tankColor} roughness={0.8} metalness={0.3} />
            </mesh>

            {/* TURRET */}
            <group ref={turretRef} position={[0.2, 0.9, 0]}>
                {/* Turret base */}
                <mesh position={[0, 0, 0]}>
                    <cylinderGeometry args={[0.7, 0.8, 0.4, 8]} />
                    <meshStandardMaterial color={tankColor} roughness={0.7} metalness={0.4} />
                </mesh>

                {/* Turret body */}
                <mesh position={[0, 0.25, 0]}>
                    <boxGeometry args={[1.2, 0.5, 1]} />
                    <meshStandardMaterial color={tankColor} roughness={0.7} metalness={0.4} />
                </mesh>

                {/* Main gun */}
                <mesh position={[1.2, 0.25, 0]} rotation={[0, 0, Math.PI / 2]}>
                    <cylinderGeometry args={[0.08, 0.1, 1.8, 12]} />
                    <meshStandardMaterial color={metalColor} roughness={0.4} metalness={0.8} />
                </mesh>

                {/* Gun muzzle brake */}
                <mesh position={[2.1, 0.25, 0]} rotation={[0, 0, Math.PI / 2]}>
                    <cylinderGeometry args={[0.12, 0.12, 0.15, 8]} />
                    <meshStandardMaterial color={metalColor} roughness={0.3} metalness={0.9} />
                </mesh>

                {/* Commander's hatch */}
                <mesh position={[-0.3, 0.55, 0.2]}>
                    <cylinderGeometry args={[0.15, 0.15, 0.1, 8]} />
                    <meshStandardMaterial color={metalColor} roughness={0.5} metalness={0.6} />
                </mesh>
            </group>

            {/* TRACKS - Left side */}
            <group position={[0, 0, 1.05]}>
                {/* Track housing */}
                <mesh position={[0, 0.15, 0]}>
                    <boxGeometry args={[3.2, 0.5, 0.3]} />
                    <meshStandardMaterial color={tankColor} roughness={0.9} metalness={0.2} />
                </mesh>
                {/* Track */}
                <mesh position={[0, 0.15, 0.12]}>
                    <boxGeometry args={[3.4, 0.55, 0.08]} />
                    <meshStandardMaterial color={trackColor} roughness={1} metalness={0.1} />
                </mesh>
                {/* Wheels - animated */}
                <group ref={wheelsLeftRef}>
                    {[-1.2, -0.6, 0, 0.6, 1.2].map((x, i) => (
                        <mesh key={i} position={[x, 0.15, 0.2]} rotation={[Math.PI / 2, 0, 0]}>
                            <cylinderGeometry args={[0.22, 0.22, 0.1, 12]} />
                            <meshStandardMaterial color={metalColor} roughness={0.6} metalness={0.5} />
                        </mesh>
                    ))}
                </group>
                {/* Drive sprocket */}
                <mesh position={[1.5, 0.25, 0.2]} rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[0.28, 0.28, 0.12, 8]} />
                    <meshStandardMaterial color={metalColor} roughness={0.5} metalness={0.6} />
                </mesh>
                {/* Idler wheel */}
                <mesh position={[-1.5, 0.25, 0.2]} rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[0.25, 0.25, 0.1, 12]} />
                    <meshStandardMaterial color={metalColor} roughness={0.5} metalness={0.6} />
                </mesh>
            </group>

            {/* TRACKS - Right side */}
            <group position={[0, 0, -1.05]}>
                <mesh position={[0, 0.15, 0]}>
                    <boxGeometry args={[3.2, 0.5, 0.3]} />
                    <meshStandardMaterial color={tankColor} roughness={0.9} metalness={0.2} />
                </mesh>
                <mesh position={[0, 0.15, -0.12]}>
                    <boxGeometry args={[3.4, 0.55, 0.08]} />
                    <meshStandardMaterial color={trackColor} roughness={1} metalness={0.1} />
                </mesh>
                <group ref={wheelsRightRef}>
                    {[-1.2, -0.6, 0, 0.6, 1.2].map((x, i) => (
                        <mesh key={i} position={[x, 0.15, -0.2]} rotation={[Math.PI / 2, 0, 0]}>
                            <cylinderGeometry args={[0.22, 0.22, 0.1, 12]} />
                            <meshStandardMaterial color={metalColor} roughness={0.6} metalness={0.5} />
                        </mesh>
                    ))}
                </group>
                <mesh position={[1.5, 0.25, -0.2]} rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[0.28, 0.28, 0.12, 8]} />
                    <meshStandardMaterial color={metalColor} roughness={0.5} metalness={0.6} />
                </mesh>
                <mesh position={[-1.5, 0.25, -0.2]} rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[0.25, 0.25, 0.1, 12]} />
                    <meshStandardMaterial color={metalColor} roughness={0.5} metalness={0.6} />
                </mesh>
            </group>

            {/* Details - Side skirts */}
            <mesh position={[0, 0.3, 0.92]}>
                <boxGeometry args={[2.8, 0.25, 0.05]} />
                <meshStandardMaterial color={tankColor} roughness={0.8} metalness={0.3} />
            </mesh>
            <mesh position={[0, 0.3, -0.92]}>
                <boxGeometry args={[2.8, 0.25, 0.05]} />
                <meshStandardMaterial color={tankColor} roughness={0.8} metalness={0.3} />
            </mesh>

            {/* Exhaust pipes */}
            <mesh position={[-1.4, 0.6, 0.6]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.05, 0.05, 0.3, 8]} />
                <meshStandardMaterial color={metalColor} roughness={0.4} metalness={0.7} />
            </mesh>
            <mesh position={[-1.4, 0.6, -0.6]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.05, 0.05, 0.3, 8]} />
                <meshStandardMaterial color={metalColor} roughness={0.4} metalness={0.7} />
            </mesh>

            {/* Dust trail behind tank */}
            {[-2, -2.5, -3].map((x, i) => (
                <mesh key={i} position={[x, 0.1, 0]}>
                    <sphereGeometry args={[0.3 + i * 0.1, 6, 6]} />
                    <meshBasicMaterial color="#5a5040" transparent opacity={0.15 - i * 0.04} />
                </mesh>
            ))}
        </group>
    );
}

// Ground plane with grid
function Ground() {
    return (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.2, 0]}>
            <planeGeometry args={[100, 100, 50, 50]} />
            <meshBasicMaterial color="#1a2010" wireframe transparent opacity={0.15} />
        </mesh>
    );
}

// Dust/Smoke particle
function SmokeParticle({ position, delay = 0 }: { position: [number, number, number], delay?: number }) {
    const meshRef = useRef<THREE.Mesh>(null);
    const startTime = useRef(delay);

    useFrame((state) => {
        if (meshRef.current) {
            const t = (state.clock.elapsedTime - startTime.current) % 8;
            meshRef.current.position.y = position[1] + t * 0.8;
            meshRef.current.position.x = position[0] + Math.sin(t * 0.5 + delay) * 0.5;
            const scale = 0.3 + t * 0.15;
            meshRef.current.scale.setScalar(scale);
            const opacity = Math.max(0, 0.4 - t * 0.05);
            (meshRef.current.material as THREE.MeshBasicMaterial).opacity = opacity;
        }
    });

    return (
        <mesh ref={meshRef} position={position}>
            <sphereGeometry args={[1, 8, 8]} />
            <meshBasicMaterial color="#4a4035" transparent opacity={0.3} />
        </mesh>
    );
}

// Tank lane configurations for spawning
const TANK_LANES = [
    { y: -0.8, z: 3, scale: 1.3, speedRange: [1.3, 1.7], rotation: [0, Math.PI, 0] as [number, number, number] },      // Front lane
    { y: -0.9, z: 0, scale: 1.0, speedRange: [1.0, 1.4], rotation: [0, Math.PI + 0.05, 0] as [number, number, number] }, // Middle lane
    { y: -1, z: -4, scale: 0.7, speedRange: [0.7, 1.1], rotation: [0, Math.PI - 0.03, 0] as [number, number, number] },  // Back lane
];

// TankManager component to handle spawning/deletion
const MAX_TANKS = 3;

function TankManager() {
    const [tanks, setTanks] = useState<TankConfig[]>([]);
    const nextIdRef = useRef(0);
    const lastSpawnTimeRef = useRef(0);

    // Initialize with 2 tanks on screen
    useEffect(() => {
        const now = Date.now();
        const initialTanks: TankConfig[] = TANK_LANES.slice(0, 2).map((lane, index) => {
            const speed = lane.speedRange[0] + Math.random() * (lane.speedRange[1] - lane.speedRange[0]);
            return {
                id: nextIdRef.current++,
                startX: 20 - index * 18, // Stagger initial positions
                y: lane.y,
                z: lane.z,
                scale: lane.scale,
                speed,
                rotation: lane.rotation,
                spawnTime: now,
            };
        });
        setTanks(initialTanks);
        lastSpawnTimeRef.current = now;
    }, []);

    // Spawn tanks periodically (only if below max)
    useEffect(() => {
        const spawnInterval = setInterval(() => {
            const now = Date.now();

            setTanks(prevTanks => {
                // Don't spawn if at max capacity
                if (prevTanks.length >= MAX_TANKS) return prevTanks;

                const lastSpawn = lastSpawnTimeRef.current;
                const spawnDelay = 10000 + Math.random() * 5000; // 10-15 seconds between spawns

                if (now - lastSpawn < spawnDelay) return prevTanks;

                // Pick a random lane that doesn't have a tank near spawn point
                const availableLanes = TANK_LANES.filter(lane => {
                    return !prevTanks.some(t => {
                        if (t.z !== lane.z) return false;
                        const elapsedSec = (now - t.spawnTime) / 1000;
                        const currentX = t.startX - elapsedSec * t.speed;
                        return currentX > 10;
                    });
                });

                if (availableLanes.length === 0) return prevTanks;

                const lane = availableLanes[Math.floor(Math.random() * availableLanes.length)];
                const speed = lane.speedRange[0] + Math.random() * (lane.speedRange[1] - lane.speedRange[0]);

                lastSpawnTimeRef.current = now;

                return [...prevTanks, {
                    id: nextIdRef.current++,
                    startX: 25,
                    y: lane.y,
                    z: lane.z,
                    scale: lane.scale,
                    speed,
                    rotation: lane.rotation,
                    spawnTime: now,
                }];
            });
        }, 2000);

        return () => clearInterval(spawnInterval);
    }, []);

    const handleTankOffScreen = useCallback((id: number) => {
        setTanks(prevTanks => prevTanks.filter(t => t.id !== id));
    }, []);

    return (
        <>
            {tanks.map(tank => (
                <Tank3D
                    key={tank.id}
                    config={tank}
                    onOffScreen={handleTankOffScreen}
                />
            ))}
        </>
    );
}

// 3D Scene
const Scene = React.memo(function Scene() {
    // Memoize smoke particles to ensure they don't reset on re-renders
    const smokeParticles = React.useMemo(() => [...Array(15)].map((_, i) => ({
        id: i,
        position: [
            (Math.random() - 0.5) * 15,
            -0.5,
            (Math.random() - 0.5) * 10 - 5
        ] as [number, number, number],
        delay: Math.random() * 8
    })), []);

    return (
        <>
            <ambientLight intensity={0.4} />
            <directionalLight position={[5, 10, 5]} intensity={1} color="#ffeedd" castShadow />
            <pointLight position={[-5, 5, -5]} intensity={0.5} color="#ff8844" />
            <pointLight position={[0, 2, 5]} intensity={0.3} color="#88aaff" />

            {/* Fog for atmosphere */}
            <fog attach="fog" args={['#1a1510', 8, 30]} />

            {/* Tank Manager - handles spawning tanks from right and deleting when off screen */}
            <TankManager />

            {/* Smoke/Dust particles */}
            {smokeParticles.map((p) => (
                <SmokeParticle
                    key={p.id}
                    position={p.position}
                    delay={p.delay}
                />
            ))}

            <Ground />
            <Environment preset="sunset" />
        </>
    );
});

// Memoized Background Effects to prevent re-renders when typing
const BackgroundEffects = React.memo(function BackgroundEffects() {
    // Generate random values once
    const particles = React.useMemo(() => [...Array(12)].map((_, i) => ({
        id: i,
        left: `${5 + i * 8}%`,
        bottom: `${5 + (i % 3) * 8}%`,
        width: `${80 + Math.random() * 100}px`,
        height: `${60 + Math.random() * 80}px`,
        opacity: 0.3 + Math.random() * 0.2,
        duration: `${3 + Math.random() * 3}s`,
        delay: `${Math.random() * 2}s`
    })), []);

    return (
        <>
            {/* Enhanced Smoke Overlay - CSS based */}
            <div className="fixed inset-0 z-[1] pointer-events-none">
                {/* Bottom smoke layer */}
                <div className="absolute bottom-0 left-0 right-0 h-[60%]" style={{
                    background: 'linear-gradient(to top, rgba(30,25,20,0.95) 0%, rgba(30,25,20,0.7) 30%, rgba(30,25,20,0.3) 60%, transparent 100%)'
                }} />

                {/* Smoke puffs */}
                {particles.map((p) => (
                    <div
                        key={p.id}
                        className="absolute rounded-full animate-pulse"
                        style={{
                            left: p.left,
                            bottom: p.bottom,
                            width: p.width,
                            height: p.height,
                            background: `radial-gradient(ellipse, rgba(60,50,40,${p.opacity}) 0%, transparent 70%)`,
                            animationDuration: p.duration,
                            animationDelay: p.delay,
                            filter: 'blur(10px)',
                        }}
                    />
                ))}

                {/* Fire glow effects */}
                <div className="absolute bottom-[10%] left-[15%] w-40 h-32 animate-pulse" style={{
                    background: 'radial-gradient(ellipse, rgba(255,100,30,0.4) 0%, rgba(255,50,0,0.2) 40%, transparent 70%)',
                    animationDuration: '2s',
                    filter: 'blur(20px)',
                }} />
                <div className="absolute bottom-[8%] right-[25%] w-32 h-28 animate-pulse" style={{
                    background: 'radial-gradient(ellipse, rgba(255,80,20,0.35) 0%, rgba(255,40,0,0.15) 40%, transparent 70%)',
                    animationDuration: '3s',
                    animationDelay: '1s',
                    filter: 'blur(15px)',
                }} />
                <div className="absolute bottom-[15%] left-[50%] w-24 h-20 animate-pulse" style={{
                    background: 'radial-gradient(ellipse, rgba(255,120,40,0.3) 0%, transparent 60%)',
                    animationDuration: '2.5s',
                    animationDelay: '0.5s',
                    filter: 'blur(12px)',
                }} />
            </div>

            {/* Vignette */}
            <div className="fixed inset-0 z-[2] pointer-events-none" style={{
                background: 'radial-gradient(ellipse at center, transparent 20%, rgba(0,0,0,0.7) 100%)'
            }} />

            {/* Military Corner Brackets */}
            <div className="fixed inset-0 z-[3] pointer-events-none">
                <div className="absolute top-4 left-4 w-20 h-20 border-l-2 border-t-2 border-[#4caf50]/60" />
                <div className="absolute top-4 right-4 w-20 h-20 border-r-2 border-t-2 border-[#4caf50]/60" />
                <div className="absolute bottom-4 left-4 w-20 h-20 border-l-2 border-b-2 border-[#4caf50]/60" />
                <div className="absolute bottom-4 right-4 w-20 h-20 border-r-2 border-b-2 border-[#4caf50]/60" />
            </div>

            {/* Radar Display - Top Right */}
            <div className="fixed top-6 right-6 z-[4] pointer-events-none">
                <div className="w-28 h-28 rounded-full border-2 border-[#4caf50]/40 relative bg-black/40 backdrop-blur-sm">
                    <div className="absolute inset-2 rounded-full border border-[#4caf50]/20" />
                    <div className="absolute inset-4 rounded-full border border-[#4caf50]/15" />
                    <div className="absolute inset-6 rounded-full border border-[#4caf50]/10" />
                    <div className="absolute top-1/2 left-1/2 w-1/2 h-0.5 bg-gradient-to-r from-[#4caf50] to-transparent origin-left animate-spin" style={{ animationDuration: '3s' }} />
                    <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-[#4caf50] rounded-full -translate-x-1/2 -translate-y-1/2" />
                    <div className="absolute top-[35%] left-[55%] w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />
                    <div className="absolute top-[60%] left-[35%] w-1.5 h-1.5 bg-[#4caf50] rounded-full animate-ping" style={{ animationDelay: '1s' }} />
                </div>
                <p className="text-[#4caf50]/60 text-[10px] font-mono text-center mt-1">TACTICAL RADAR</p>
            </div>

            {/* Status Panel - Top Left */}
            <div className="fixed top-6 left-6 z-[4] pointer-events-none">
                <div className="bg-black/50 backdrop-blur-sm border border-[#4caf50]/30 rounded px-3 py-2">
                    <div className="text-[#4caf50] font-mono text-xs space-y-1">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-[#4caf50] rounded-full animate-pulse" />
                            <span>COMMAND ONLINE</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                            <span>DEFCON 3</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full" />
                            <span>ARMOR DEPLOYED</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Scanline Effect */}
            <div className="fixed inset-0 z-[3] pointer-events-none opacity-[0.03]" style={{
                backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(76,175,80,0.1) 2px, rgba(76,175,80,0.1) 4px)',
            }} />
        </>
    );
});


interface LandingPageProps {
    onJoinRoom: (roomId: string, playerId: string, playerName: string) => void;
    onPlayLocal: () => void;
}

export default function LandingPage({ onJoinRoom, onPlayLocal }: LandingPageProps) {
    const [mode, setMode] = useState<'select' | 'create' | 'join'>('select');
    const [playerName, setPlayerName] = useState('');
    const [roomCode, setRoomCode] = useState('');
    const [playerId, setPlayerId] = useState('');
    const [showTutorial, setShowTutorial] = useState(false);
    const [showBugReport, setShowBugReport] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        let storedId = sessionStorage.getItem('shasn_player_id');
        if (!storedId) {
            storedId = generatePlayerId();
            sessionStorage.setItem('shasn_player_id', storedId);
        }
        setPlayerId(storedId);
        const storedName = localStorage.getItem('shasn_player_name');
        if (storedName) setPlayerName(storedName);

        setTimeout(() => setIsLoaded(true), 100);
    }, []);

    const createRoom = useMutation(api.rooms.createRoom);
    const joinRoom = useMutation(api.rooms.joinRoom);

    const handleCreateRoom = async () => {
        if (!playerName.trim()) { alert('Please enter your codename'); return; }
        localStorage.setItem('shasn_player_name', playerName);
        try {
            const { roomId, playerId: newPlayerId } = await createRoom({ playerName });
            onJoinRoom(roomId, newPlayerId, playerName);
        } catch (e) {
            console.error(e);
            alert("Failed to create mission: " + e);
        }
    };

    const handleJoinRoom = async () => {
        if (!playerName.trim()) { alert('Please enter your codename'); return; }
        if (!roomCode.trim()) { alert('Please enter a room code'); return; }
        localStorage.setItem('shasn_player_name', playerName);
        try {
            const { roomId, playerId: newPlayerId } = await joinRoom({ roomCode: roomCode.trim().toUpperCase(), playerName });
            onJoinRoom(roomId, newPlayerId, playerName);
        } catch (e: any) {
            console.error(e);
            alert("Failed to join mission: " + (e.message || e));
        }
    };

    return (
        <div className="min-h-screen relative overflow-hidden bg-[#0a0a08]">
            {/* 3D Canvas Background */}
            <div className="fixed inset-0 z-0">
                <Canvas
                    camera={{ position: [0, 3, 10], fov: 45 }}
                    gl={{ antialias: true, alpha: true }}
                    shadows
                >
                    <Suspense fallback={null}>
                        <Scene />
                    </Suspense>
                </Canvas>
            </div>

            <BackgroundEffects />

            {showTutorial && <Tutorial onClose={() => setShowTutorial(false)} />}

            {/* Main Content */}
            <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-8">

                {/* Hero Section */}
                <div className={`text-center mb-8 transform transition-all duration-1000 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                    <h1
                        className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-[0.15em] text-transparent bg-clip-text bg-gradient-to-b from-[#d4d4d4] via-[#a0a0a0] to-[#505050] drop-shadow-2xl"
                        style={{
                            fontFamily: 'system-ui, -apple-system, sans-serif',
                            textShadow: '0 0 60px rgba(76,175,80,0.4), 0 4px 20px rgba(0,0,0,0.8)',
                            WebkitTextStroke: '1px rgba(76,175,80,0.2)',
                        }}
                    >
                        {gameTitle}
                    </h1>
                    <div className="flex items-center justify-center gap-4 mt-4">
                        <div className="h-px w-16 sm:w-24 bg-gradient-to-r from-transparent to-[#4caf50]" />
                        <p className="text-[#4caf50] uppercase tracking-[0.3em] text-xs sm:text-sm font-medium">{gameSubtitle}</p>
                        <div className="h-px w-16 sm:w-24 bg-gradient-to-l from-transparent to-[#4caf50]" />
                    </div>
                </div>

                {/* Main Menu Card */}
                <div className={`w-full max-w-lg transform transition-all duration-1000 delay-300 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                    <div className="relative bg-black/70 backdrop-blur-xl border border-[#4caf50]/30 rounded-lg p-6 sm:p-8 shadow-[0_0_60px_rgba(0,0,0,0.8),0_0_30px_rgba(76,175,80,0.1)]">

                        {/* Command Center Header */}
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-black px-4">
                            <span className="text-[#4caf50] text-xs font-mono tracking-wider">COMMAND CENTER</span>
                        </div>

                        {/* Corner accents */}
                        <div className="absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 border-[#4caf50]" />
                        <div className="absolute top-0 right-0 w-4 h-4 border-r-2 border-t-2 border-[#4caf50]" />
                        <div className="absolute bottom-0 left-0 w-4 h-4 border-l-2 border-b-2 border-[#4caf50]" />
                        <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-[#4caf50]" />

                        {mode === 'select' && (
                            <div className="space-y-4">
                                <button
                                    onClick={() => setShowTutorial(true)}
                                    className="group w-full py-4 px-6 bg-gradient-to-r from-red-950/50 to-red-900/30 hover:from-red-900/60 hover:to-red-800/40 border border-red-500/30 hover:border-red-500/60 rounded-lg text-red-400 hover:text-red-300 font-bold uppercase tracking-wider text-sm transition-all duration-300 flex items-center justify-center gap-3"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    Intel Briefing
                                </button>

                                <div className="relative py-4">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full h-px bg-gradient-to-r from-transparent via-[#4caf50]/30 to-transparent" />
                                    </div>
                                    <div className="relative flex justify-center">
                                        <span className="px-4 bg-black/70 text-[#4caf50]/60 text-xs uppercase tracking-[0.2em] font-mono">Online Operations</span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setMode('create')}
                                    className="group w-full py-5 px-6 bg-gradient-to-r from-[#4caf50]/20 to-[#4caf50]/10 hover:from-[#4caf50]/30 hover:to-[#4caf50]/20 border border-[#4caf50]/40 hover:border-[#4caf50]/80 rounded-lg text-[#4caf50] font-bold uppercase tracking-wider text-base transition-all duration-300 hover:shadow-[0_0_40px_rgba(76,175,80,0.3)] flex items-center justify-between"
                                >
                                    <span className="flex items-center gap-3">
                                        <span className="w-3 h-3 rounded-full bg-[#4caf50] animate-pulse shadow-[0_0_10px_#4caf50]" />
                                        Create Mission
                                    </span>
                                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>

                                <button
                                    onClick={() => setMode('join')}
                                    className="group w-full py-5 px-6 bg-white/5 hover:bg-white/10 border border-white/20 hover:border-white/40 rounded-lg text-white/80 hover:text-white font-bold uppercase tracking-wider text-base transition-all duration-300 flex items-center justify-between"
                                >
                                    <span className="flex items-center gap-3">
                                        <span className="w-3 h-3 rounded-full border-2 border-white/60" />
                                        Join Mission
                                    </span>
                                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>

                                <div className="relative py-4">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                                    </div>
                                    <div className="relative flex justify-center">
                                        <span className="px-4 bg-black/70 text-white/40 text-xs uppercase tracking-[0.2em] font-mono">Local Operations</span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => onPlayLocal()}
                                    className="group w-full py-4 px-6 bg-gradient-to-r from-amber-950/30 to-amber-900/20 hover:from-amber-900/40 hover:to-amber-800/30 border border-amber-500/30 hover:border-amber-500/60 rounded-lg text-amber-400 hover:text-amber-300 font-bold uppercase tracking-wider text-sm transition-all duration-300 flex items-center justify-between"
                                >
                                    <span className="flex items-center gap-3">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                        Same Device Battle
                                    </span>
                                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>

                                <div className="flex gap-3 pt-4">
                                    <a
                                        href="https://discord.gg/mNXK4ejYpf"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex-1 py-3 px-4 bg-[#5865F2]/20 hover:bg-[#5865F2]/30 border border-[#5865F2]/40 hover:border-[#5865F2]/70 rounded-lg text-[#5865F2] hover:text-white font-semibold text-sm transition-all duration-300 text-center"
                                    >
                                        Discord
                                    </a>
                                    <button
                                        onClick={() => setShowBugReport(true)}
                                        className="flex-1 py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/20 hover:border-white/40 rounded-lg text-white/60 hover:text-white font-semibold text-sm transition-all duration-300"
                                    >
                                        Report Bug
                                    </button>
                                </div>
                            </div>
                        )}

                        {mode === 'create' && (
                            <div className="space-y-5">
                                <button
                                    onClick={() => setMode('select')}
                                    className="flex items-center gap-2 text-white/50 hover:text-white text-sm font-medium transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                    Back to HQ
                                </button>

                                <h2 className="text-2xl font-bold text-white">Create Mission</h2>

                                <div>
                                    <label className="block text-[#4caf50]/80 text-sm mb-2 font-medium font-mono">CALLSIGN</label>
                                    <input
                                        type="text"
                                        value={playerName}
                                        onChange={(e) => setPlayerName(e.target.value)}
                                        placeholder="Enter your callsign"
                                        className="w-full bg-black/50 text-white px-4 py-4 rounded-lg border border-[#4caf50]/30 focus:border-[#4caf50] focus:outline-none focus:ring-2 focus:ring-[#4caf50]/20 placeholder-white/30 text-base transition-all font-mono"
                                        maxLength={20}
                                    />
                                </div>

                                <button
                                    onClick={handleCreateRoom}
                                    className="w-full py-5 bg-gradient-to-r from-[#4caf50] to-[#66bb6a] hover:from-[#66bb6a] hover:to-[#81c784] text-black font-bold uppercase tracking-wider text-base rounded-lg transition-all duration-300 shadow-[0_0_30px_rgba(76,175,80,0.4)] hover:shadow-[0_0_50px_rgba(76,175,80,0.6)]"
                                >
                                    Deploy Mission
                                </button>

                                <p className="text-white/30 text-xs text-center font-mono">Mission code will be auto-generated</p>
                            </div>
                        )}

                        {mode === 'join' && (
                            <div className="space-y-5">
                                <button
                                    onClick={() => setMode('select')}
                                    className="flex items-center gap-2 text-white/50 hover:text-white text-sm font-medium transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                    Back to HQ
                                </button>

                                <h2 className="text-2xl font-bold text-white">Join Mission</h2>

                                <div>
                                    <label className="block text-[#4caf50]/80 text-sm mb-2 font-medium font-mono">CALLSIGN</label>
                                    <input
                                        type="text"
                                        value={playerName}
                                        onChange={(e) => setPlayerName(e.target.value)}
                                        placeholder="Enter your callsign"
                                        className="w-full bg-black/50 text-white px-4 py-4 rounded-lg border border-[#4caf50]/30 focus:border-[#4caf50] focus:outline-none focus:ring-2 focus:ring-[#4caf50]/20 placeholder-white/30 text-base transition-all font-mono"
                                        maxLength={20}
                                    />
                                </div>

                                <div>
                                    <label className="block text-[#4caf50]/80 text-sm mb-2 font-medium font-mono">MISSION CODE</label>
                                    <input
                                        type="text"
                                        value={roomCode}
                                        onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                                        placeholder="XXXXXX"
                                        className="w-full bg-black/50 text-white px-4 py-4 rounded-lg border border-[#4caf50]/30 focus:border-[#4caf50] focus:outline-none focus:ring-2 focus:ring-[#4caf50]/20 text-center text-2xl tracking-[0.3em] placeholder-white/30 font-mono transition-all"
                                        maxLength={6}
                                    />
                                </div>

                                <button
                                    onClick={handleJoinRoom}
                                    className="w-full py-5 bg-gradient-to-r from-[#4caf50] to-[#66bb6a] hover:from-[#66bb6a] hover:to-[#81c784] text-black font-bold uppercase tracking-wider text-base rounded-lg transition-all duration-300 shadow-[0_0_30px_rgba(76,175,80,0.4)] hover:shadow-[0_0_50px_rgba(76,175,80,0.6)]"
                                >
                                    Join Mission
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className={`mt-8 text-center transform transition-all duration-1000 delay-500 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0'}`}>
                    <p className="text-white/30 text-xs tracking-wider font-mono">© 2026 THE BATTALION | ALL RIGHTS RESERVED</p>
                </div>

                {/* Bug Report Display (Mock) */}
                {showBugReport && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                        <div className="bg-black border border-[#f44336] p-8 rounded-lg max-w-md text-center">
                            <h3 className="text-[#f44336] text-xl font-bold mb-4">REPORT DISRUPTIONS</h3>
                            <p className="text-gray-300 mb-6">Please report any bugs or issues on our Discord frequency.</p>
                            <button
                                onClick={() => setShowBugReport(false)}
                                className="px-6 py-2 bg-[#f44336]/20 text-[#f44336] border border-[#f44336] rounded hover:bg-[#f44336]/40 transition-colors"
                            >
                                DISMISS
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
