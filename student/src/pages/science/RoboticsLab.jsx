import React, { useState, useEffect, useRef } from "react";
import * as THREE from "three";
import { motion } from "framer-motion";
import {
  ArrowLeft, Cpu, Play, Trash2, ArrowRight,
  Gauge, Zap, Thermometer, ShieldAlert,
  Terminal, Sparkles, RefreshCw, Layers,
  Compass, Activity, Radio
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function RoboticsLab() {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  
  // Settings
  const [theme] = useState(() => localStorage.getItem("theme") || "dark");
  const [language] = useState(() => localStorage.getItem("lang") || "en");

  // Telemetry metrics
  const [metrics, setMetrics] = useState({
    baseAngle: 0,
    shoulderAngle: 30,
    elbowAngle: -45,
    clawOpen: true,
    powerDraw: 12,
    temperature: 36.8,
    status: "SYSTEM STANDBY"
  });

  const [commandQueue, setCommandQueue] = useState([]);
  const [currentCmdIndex, setCurrentCmdIndex] = useState(-1);
  const [isExecuting, setIsExecuting] = useState(false);
  const [terminalLogs, setTerminalLogs] = useState([
    "🧬 CORE AI SYNAPSE SYNCHRONIZED.",
    "📡 NEURAL FEED: LATENCY 1.8ms.",
    "🦾 JOINT PRESSURE STABILIZED."
  ]);

  const targetsRef = useRef({
    baseAngle: 0,
    shoulderAngle: 0.5,
    elbowAngle: -0.8,
    clawWidth: 0.4
  });

  const commandsList = [
    { id: "BASE_L", label: "Rotate Base Left (+45°)", icon: "🔄" },
    { id: "BASE_R", label: "Rotate Base Right (-45°)", icon: "🔄" },
    { id: "SHLD_UP", label: "Raise Shoulder (+30°)", icon: "🔼" },
    { id: "SHLD_DN", label: "Lower Shoulder (-30°)", icon: "🔽" },
    { id: "ELB_EXT", label: "Extend Elbow (+30°)", icon: "↗️" },
    { id: "ELB_RET", label: "Retract Elbow (-30°)", icon: "↙️" },
    { id: "CLAW_CLOSE", label: "Close Gripper Claw", icon: "✊" },
    { id: "CLAW_OPEN", label: "Open Gripper Claw", icon: "✋" }
  ];

  const t = {
    en: {
      title: "AI & Robotics Lab",
      subtitle: "Compile automation loops, trace telemetry signals, and control cybernetic joints.",
      backBtn: "Dashboard",
      simTitle: "3D Hologram Feed",
      codeTitle: "Neural Code compiler",
      telemetryTitle: "System Telemetry Feed",
      runBtn: "Compile & Run",
      running: "Processing...",
      clearBtn: "Purge Buffer",
      consoleTitle: "Core AI Logs",
      addCmd: "Construct your sequence using modular chips below:",
      emptyQueue: "No instructions loaded. Click chips below to compile.",
      statusText: "System Status"
    },
    hi: {
      title: "एआई और रोबोटिक्स लैब",
      subtitle: "ऑटोमेशन लूप संकलित करें, टेलीमेट्री सिग्नलों को ट्रैक करें और जोड़ों को नियंत्रित करें।",
      backBtn: "डैशबोर्ड",
      simTitle: "3D होलोग्राम फीड",
      codeTitle: "न्यूरल कोड कंपाइलर",
      telemetryTitle: "सिस्टम टेलीमेट्री फीड",
      runBtn: "कंपाइल और रन",
      running: "प्रोसेसिंग...",
      clearBtn: "बफ़र साफ़ करें",
      consoleTitle: "कोर एआई लॉग्स",
      addCmd: "नीचे दिए गए मॉड्यूल चिप्स का उपयोग करके अनुक्रम बनाएं:",
      emptyQueue: "कोई निर्देश लोड नहीं है। संकलित करने के लिए नीचे चिप्स पर क्लिक करें।",
      statusText: "सिस्टम स्थिति"
    }
  }[language] || t.en;

  const addCommand = (cmdId) => {
    if (isExecuting) return;
    const cmd = commandsList.find((c) => c.id === cmdId);
    if (cmd) {
      setCommandQueue((prev) => [...prev, { ...cmd, index: prev.length }]);
      addLog(`LOADED: ${cmd.id} into code buffer.`);
    }
  };

  const clearQueue = () => {
    if (isExecuting) return;
    setCommandQueue([]);
    addLog("Buffer purged. All registries cleared.");
  };

  const addLog = (msg) => {
    setTerminalLogs((prev) => [...prev.slice(-30), `⚡ [${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const runProgram = async () => {
    if (commandQueue.length === 0 || isExecuting) return;
    setIsExecuting(true);
    addLog("⚙️ Starting neural command sequence...");

    for (let i = 0; i < commandQueue.length; i++) {
      setCurrentCmdIndex(i);
      const cmd = commandQueue[i];
      addLog(`EXECUTING [Step ${i + 1}/${commandQueue.length}]: ${cmd.id}`);
      
      setMetrics((prev) => ({
        ...prev,
        status: `ROUTING: ${cmd.id}`,
        powerDraw: 35 + Math.floor(Math.random() * 15),
        temperature: prev.temperature + 0.6
      }));

      switch (cmd.id) {
        case "BASE_L":
          targetsRef.current.baseAngle += Math.PI / 4;
          break;
        case "BASE_R":
          targetsRef.current.baseAngle -= Math.PI / 4;
          break;
        case "SHLD_UP":
          targetsRef.current.shoulderAngle = Math.min(Math.PI / 2, targetsRef.current.shoulderAngle + Math.PI / 6);
          break;
        case "SHLD_DN":
          targetsRef.current.shoulderAngle = Math.max(-Math.PI / 6, targetsRef.current.shoulderAngle - Math.PI / 6);
          break;
        case "ELB_EXT":
          targetsRef.current.elbowAngle = Math.min(Math.PI / 6, targetsRef.current.elbowAngle + Math.PI / 6);
          break;
        case "ELB_RET":
          targetsRef.current.elbowAngle = Math.max(-Math.PI / 2, targetsRef.current.elbowAngle - Math.PI / 6);
          break;
        case "CLAW_CLOSE":
          targetsRef.current.clawWidth = 0.05;
          setMetrics((m) => ({ ...m, clawOpen: false }));
          break;
        case "CLAW_OPEN":
          targetsRef.current.clawWidth = 0.35;
          setMetrics((m) => ({ ...m, clawOpen: true }));
          break;
        default:
          break;
      }

      setMetrics((prev) => ({
        ...prev,
        baseAngle: Math.round((targetsRef.current.baseAngle * 180) / Math.PI),
        shoulderAngle: Math.round((targetsRef.current.shoulderAngle * 180) / Math.PI),
        elbowAngle: Math.round((targetsRef.current.elbowAngle * 180) / Math.PI)
      }));

      await new Promise((r) => setTimeout(r, 1000));
    }

    setIsExecuting(false);
    setCurrentCmdIndex(-1);
    setMetrics((prev) => ({
      ...prev,
      status: "STABILIZED",
      powerDraw: 12,
      temperature: Math.max(36.8, prev.temperature - 0.8)
    }));
    addLog("🛰️ Sequence finished. Motors aligned.");
  };

  // 3D scene builder
  useEffect(() => {
    if (!canvasRef.current) return;

    const width = canvasRef.current.clientWidth || 600;
    const height = canvasRef.current.clientHeight || 450;

    const scene = new THREE.Scene();
    
    // Grid Helper
    const gridHelper = new THREE.GridHelper(12, 24, 0x8b5cf6, 0x1f192f);
    gridHelper.position.y = -2;
    scene.add(gridHelper);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(6, 4, 8);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      alpha: true,
      antialias: true
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Futuristic glowing materials
    const chromeMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.1,
      metalness: 0.9,
    });

    const neonOrangeMat = new THREE.MeshStandardMaterial({
      color: 0xff6600,
      emissive: 0xff3300,
      emissiveIntensity: 1.2,
      roughness: 0.2
    });

    const neonVioletMat = new THREE.MeshStandardMaterial({
      color: 0x8b5cf6,
      emissive: 0x6366f1,
      emissiveIntensity: 1.5,
      roughness: 0.2
    });

    // Particle Starfield Background
    const starsGeometry = new THREE.BufferGeometry();
    const starsCount = 150;
    const starPositions = new Float32Array(starsCount * 3);

    for (let i = 0; i < starsCount * 3; i++) {
      starPositions[i] = (Math.random() - 0.5) * 15;
    }

    starsGeometry.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
    const starMaterial = new THREE.PointsMaterial({
      color: 0x06b6d4,
      size: 0.05,
      transparent: true,
      opacity: 0.8
    });
    const starField = new THREE.Points(starsGeometry, starMaterial);
    scene.add(starField);

    // Robot arm joint rig hierarchy
    const baseGroup = new THREE.Group();
    baseGroup.position.y = -2;
    scene.add(baseGroup);

    // Cyber Base Droid Mesh
    const baseGeom = new THREE.CylinderGeometry(1.0, 1.1, 0.45, 32);
    const baseMesh = new THREE.Mesh(baseGeom, chromeMat);
    baseMesh.position.y = 0.22;
    baseGroup.add(baseMesh);

    // Glowing base ring
    const baseRingGeom = new THREE.TorusGeometry(1.05, 0.04, 8, 32);
    const baseRing = new THREE.Mesh(baseRingGeom, neonVioletMat);
    baseRing.rotation.x = Math.PI / 2;
    baseRing.position.y = 0.22;
    baseGroup.add(baseRing);

    // Shoulder Joint
    const shoulderJointGroup = new THREE.Group();
    shoulderJointGroup.position.y = 0.45;
    baseGroup.add(shoulderJointGroup);

    const shoulderJointMesh = new THREE.Mesh(new THREE.SphereGeometry(0.38, 16, 16), neonVioletMat);
    shoulderJointGroup.add(shoulderJointMesh);

    // Upper Arm Linkage
    const upperArmGroup = new THREE.Group();
    shoulderJointGroup.add(upperArmGroup);

    const upperArmMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 1.8, 16), chromeMat);
    upperArmMesh.position.y = 0.9;
    upperArmGroup.add(upperArmMesh);

    // Neon cables running along the arm
    const cableGeom = new THREE.CylinderGeometry(0.02, 0.02, 1.7, 8);
    const cableMesh = new THREE.Mesh(cableGeom, neonOrangeMat);
    cableMesh.position.set(0.12, 0.9, 0.08);
    upperArmGroup.add(cableMesh);

    // Elbow Joint
    const elbowJointGroup = new THREE.Group();
    elbowJointGroup.position.y = 1.8;
    upperArmGroup.add(elbowJointGroup);

    const elbowJointMesh = new THREE.Mesh(new THREE.SphereGeometry(0.32, 16, 16), neonVioletMat);
    elbowJointGroup.add(elbowJointMesh);

    // Lower Arm Linkage
    const lowerArmGroup = new THREE.Group();
    elbowJointGroup.add(lowerArmGroup);

    const lowerArmMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 1.4, 16), chromeMat);
    lowerArmMesh.position.y = 0.7;
    lowerArmGroup.add(lowerArmMesh);

    // Wrist Base
    const wristGroup = new THREE.Group();
    wristGroup.position.y = 1.4;
    lowerArmGroup.add(wristGroup);

    const wristMesh = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.22, 0.42), neonOrangeMat);
    wristMesh.position.y = 0.1;
    wristGroup.add(wristMesh);

    // Claw Gripper segments
    const leftClaw = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.38, 0.16), chromeMat);
    leftClaw.position.set(-0.15, 0.3, 0);
    wristGroup.add(leftClaw);

    const rightClaw = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.38, 0.16), chromeMat);
    rightClaw.position.set(0.15, 0.3, 0);
    wristGroup.add(rightClaw);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.45);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.4);
    dirLight1.position.set(5, 10, 6);
    scene.add(dirLight1);

    const pointLight1 = new THREE.PointLight(0x8b5cf6, 4, 10);
    pointLight1.position.set(1, 2, 2);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x06b6d4, 3, 10);
    pointLight2.position.set(-2, -1, 1);
    scene.add(pointLight2);

    // Rotation Drag interaction parameters
    let rotX = 0.25;
    let rotY = 0.45;
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;

    const onMouseDown = (e) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseMove = (e) => {
      if (!isDragging) return;
      const dX = e.clientX - prevMouseX;
      const dY = e.clientY - prevMouseY;
      rotY += dX * 0.007;
      rotX = Math.max(-Math.PI / 4, Math.min(Math.PI / 3, rotX + dY * 0.007));
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const canvasElem = canvasRef.current;
    canvasElem.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    // Animation Loop
    let animId;
    const lerp = (start, end, amt) => (1 - amt) * start + amt * end;

    const animate = () => {
      animId = requestAnimationFrame(animate);

      // Smooth joint interpolation
      baseGroup.rotation.y = lerp(baseGroup.rotation.y, targetsRef.current.baseAngle, 0.07);
      shoulderJointGroup.rotation.z = lerp(shoulderJointGroup.rotation.z, targetsRef.current.shoulderAngle, 0.07);
      elbowJointGroup.rotation.z = lerp(elbowJointGroup.rotation.z, targetsRef.current.elbowAngle, 0.07);
      
      leftClaw.position.x = lerp(leftClaw.position.x, -targetsRef.current.clawWidth / 2, 0.09);
      rightClaw.position.x = lerp(rightClaw.position.x, targetsRef.current.clawWidth / 2, 0.09);

      // Rotate camera around arm based on dragging angles
      camera.position.x = Math.sin(rotY) * Math.cos(rotX) * 9.5;
      camera.position.z = Math.cos(rotY) * Math.cos(rotX) * 9.5;
      camera.position.y = Math.sin(rotX) * 9.5;
      camera.lookAt(0, 0.2, 0);

      // Slow drift stars background
      starField.rotation.y += 0.0015;

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!canvasRef.current) return;
      const w = canvasRef.current.clientWidth;
      const h = canvasRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animId);
      canvasElem.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#020006] text-slate-200 p-4 md:p-8 font-sans selection:bg-indigo-500/40 overflow-y-auto">
      
      {/* Background Cyber Glow Blobs */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-indigo-500/10 blur-[150px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-cyan-500/10 blur-[150px] rounded-full" />
        <div className="absolute top-[40%] right-[30%] w-[30vw] h-[30vw] bg-purple-500/5 blur-[120px] rounded-full" />
        <div className="absolute inset-0 opacity-[0.02] bg-[radial-gradient(#fff_1px,transparent_1px)] bg-[size:16px_16px]" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10 space-y-6">
        
        {/* Navigation HUD */}
        <nav className="flex justify-between items-center backdrop-blur-2xl bg-white/5 p-4 rounded-3xl border border-white/10 shadow-[0_8px_32px_0_rgba(99,102,241,0.08)]">
          <button onClick={() => navigate("/home")} className="flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition group">
            <ArrowLeft className="w-5 h-5 text-indigo-400 group-hover:-translate-x-1.5 transition-transform" />
            <span className="uppercase tracking-[0.25em] text-[10px] font-black">{t.backBtn}</span>
          </button>
          
          <div className="flex items-center gap-4">
            <Radio className="w-5 h-5 text-cyan-400 animate-pulse" />
            <span className="text-[10px] font-mono text-cyan-300 uppercase tracking-widest bg-cyan-500/10 border border-cyan-500/20 px-3.5 py-1.5 rounded-full shadow-[0_0_15px_rgba(6,182,212,0.15)]">
              AI Controller Connected
            </span>
          </div>
        </nav>

        {/* Header Title */}
        <header className="space-y-2">
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white leading-none">
            <span className="bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-500 bg-clip-text text-transparent drop-shadow-[0_2px_15px_rgba(139,92,246,0.3)]">
              {t.title}
            </span>
          </h1>
          <p className="text-slate-400 text-xs md:text-sm max-w-2xl font-light tracking-wide">{t.subtitle}</p>
        </header>

        {/* Grid Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT: 3D Holographic view */}
          <div className="lg:col-span-7 flex flex-col space-y-4">
            
            {/* Hologram Screen Container */}
            <div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-slate-950/40 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] backdrop-blur-xl">
              
              {/* Decorative HUD Corners */}
              <div className="absolute top-6 left-6 w-8 h-8 border-t-2 border-l-2 border-cyan-500/50" />
              <div className="absolute top-6 right-6 w-8 h-8 border-t-2 border-r-2 border-cyan-500/50" />
              <div className="absolute bottom-6 left-6 w-8 h-8 border-b-2 border-l-2 border-cyan-500/50" />
              <div className="absolute bottom-6 right-6 w-8 h-8 border-b-2 border-r-2 border-cyan-500/50" />

              <div className="absolute top-8 left-16 z-20 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                <span className="text-[10px] font-mono uppercase text-cyan-300 tracking-widest font-black">
                  {t.simTitle}
                </span>
              </div>
              
              <div className="w-full h-[400px] md:h-[480px] relative flex items-center justify-center">
                {/* Star mesh pattern overlay */}
                <div className="absolute inset-0 bg-cyber-grid opacity-10 pointer-events-none" />
                <canvas ref={canvasRef} className="w-full h-full relative z-10 cursor-grab active:cursor-grabbing" />
              </div>

              {/* Lower HUD Overlay inside 3D Canvas */}
              <div className="absolute bottom-8 left-8 right-8 z-20 grid grid-cols-3 gap-2 bg-slate-950/80 border border-white/10 rounded-2xl p-4 text-[10px] font-mono text-slate-400 shadow-xl">
                <div>
                  <span className="text-cyan-400">BASE:</span> {metrics.baseAngle}°
                </div>
                <div>
                  <span className="text-cyan-400">SHOULDER:</span> {metrics.shoulderAngle}°
                </div>
                <div>
                  <span className="text-cyan-400">ELBOW:</span> {metrics.elbowAngle}°
                </div>
              </div>
            </div>

            {/* Virtual Console */}
            <div className="rounded-[2rem] border border-white/10 bg-slate-950/40 p-6 backdrop-blur-xl shadow-2xl">
              <h4 className="text-xs font-mono uppercase tracking-widest text-indigo-400 flex items-center gap-2 mb-3 border-b border-white/5 pb-2">
                <Terminal className="w-4 h-4 text-indigo-400" /> {t.consoleTitle}
              </h4>
              <div className="h-32 overflow-y-auto font-mono text-[11px] text-slate-400 space-y-1.5 custom-scrollbar">
                {terminalLogs.map((log, idx) => (
                  <div key={idx} className="leading-relaxed truncate hover:text-white transition-colors">
                    {log}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT: Code Blocks Sequencer & Gauges */}
          <div className="lg:col-span-5 flex flex-col space-y-6">
            
            {/* Visual Code Sequencer */}
            <div className="rounded-[2.5rem] border border-white/10 bg-slate-950/40 p-6 backdrop-blur-xl space-y-5 shadow-2xl relative">
              <div>
                <h3 className="text-xl font-black text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-purple-400" /> {t.codeTitle}
                </h3>
                <p className="text-xs text-slate-500 mt-1">{t.addCmd}</p>
              </div>

              {/* Cartridges code blocks queue */}
              <div className="h-48 border border-white/5 bg-black/40 rounded-2xl p-3.5 overflow-y-auto space-y-2.5 custom-scrollbar">
                {commandQueue.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-xs text-slate-600 gap-2">
                    <Activity className="w-5 h-5 text-slate-700 animate-pulse" />
                    <span className="italic">{t.emptyQueue}</span>
                  </div>
                ) : (
                  commandQueue.map((cmd, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`flex items-center justify-between p-3 rounded-xl border text-xs font-mono transition-all duration-300 ${
                        currentCmdIndex === i
                          ? "bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.15)] scale-[1.02]"
                          : "bg-slate-900/50 border-white/5 text-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-5.5 h-5.5 rounded-lg bg-slate-800 text-[10px] text-slate-500 flex items-center justify-center font-bold">
                          {i + 1}
                        </span>
                        <span className="font-extrabold">{cmd.icon} {cmd.label}</span>
                      </div>
                      {currentCmdIndex === i && (
                        <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                      )}
                    </motion.div>
                  ))
                )}
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={runProgram}
                  disabled={isExecuting || commandQueue.length === 0}
                  className="w-full py-4 bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 disabled:opacity-30 text-white font-black text-xs uppercase tracking-[0.2em] rounded-xl transition shadow-[0_10px_20px_rgba(99,102,241,0.2)] flex items-center justify-center gap-2 border border-white/10"
                >
                  <Play className="w-4 h-4 fill-white" /> {isExecuting ? t.running : t.runBtn}
                </button>
                <button
                  onClick={clearQueue}
                  disabled={isExecuting || commandQueue.length === 0}
                  className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 disabled:opacity-30 text-white font-black text-xs uppercase tracking-[0.2em] rounded-xl transition flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4 text-rose-400" /> {t.clearBtn}
                </button>
              </div>

              {/* Cybernetic Chips Block bank */}
              <div className="grid grid-cols-2 gap-2 pt-4 border-t border-white/5">
                {commandsList.map((cmd) => (
                  <motion.button
                    key={cmd.id}
                    onClick={() => addCommand(cmd.id)}
                    disabled={isExecuting}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className="p-3 rounded-xl border border-white/5 bg-white/5 hover:bg-indigo-950/20 hover:border-indigo-500/40 text-left text-[11px] font-mono transition duration-300 disabled:opacity-30 flex items-center gap-1.5 shadow-inner"
                  >
                    <span>{cmd.icon}</span> 
                    <span className="truncate text-slate-300 font-extrabold">{cmd.label.split(" (")[0]}</span>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Premium Circular Diagnostics Feed */}
            <div className="rounded-[2.5rem] border border-white/10 bg-slate-950/40 p-6 backdrop-blur-xl space-y-4 shadow-2xl">
              <div>
                <h3 className="text-xl font-black text-white flex items-center gap-2">
                  <Gauge className="w-5 h-5 text-cyan-400" /> {t.telemetryTitle}
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                
                {/* SVG Circular Temp Meter */}
                <div className="p-4 rounded-3xl bg-white/5 border border-white/5 flex flex-col items-center text-center justify-center space-y-2 relative overflow-hidden">
                  <div className="absolute top-2 left-2 flex gap-1 items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="text-[8px] font-mono text-slate-500 uppercase">Temp</span>
                  </div>

                  <div className="relative w-20 h-20 flex items-center justify-center mt-2">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="40" cy="40" r="32" stroke="rgba(255,255,255,0.05)" strokeWidth="4" fill="transparent" />
                      <circle cx="40" cy="40" r="32" stroke="#10b981" strokeWidth="4" fill="transparent" 
                              strokeDasharray="200" 
                              strokeDashoffset={200 - (200 * Math.min(100, metrics.temperature)) / 100}
                              strokeLinecap="round" />
                    </svg>
                    <div className="absolute text-xs font-mono font-extrabold text-white">
                      {metrics.temperature.toFixed(1)}°
                    </div>
                  </div>
                </div>

                {/* SVG Circular Power Meter */}
                <div className="p-4 rounded-3xl bg-white/5 border border-white/5 flex flex-col items-center text-center justify-center space-y-2 relative overflow-hidden">
                  <div className="absolute top-2 left-2 flex gap-1 items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    <span className="text-[8px] font-mono text-slate-500 uppercase">Power Draw</span>
                  </div>

                  <div className="relative w-20 h-20 flex items-center justify-center mt-2">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="40" cy="40" r="32" stroke="rgba(255,255,255,0.05)" strokeWidth="4" fill="transparent" />
                      <circle cx="40" cy="40" r="32" stroke="#f59e0b" strokeWidth="4" fill="transparent" 
                              strokeDasharray="200" 
                              strokeDashoffset={200 - (200 * Math.min(50, metrics.powerDraw)) / 50}
                              strokeLinecap="round" />
                    </svg>
                    <div className="absolute text-[11px] font-mono font-extrabold text-white">
                      {metrics.powerDraw}kW
                    </div>
                  </div>
                </div>

                {/* Status indicator Card */}
                <div className="p-4 rounded-3xl bg-white/5 border border-white/5 col-span-2 relative flex items-center justify-between p-4 overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-500" />
                  <div className="space-y-0.5">
                    <p className="text-[9px] text-slate-500 uppercase tracking-widest font-mono">
                      {t.statusText}
                    </p>
                    <p className="text-xs font-black text-cyan-400 font-mono uppercase tracking-wider">
                      {metrics.status}
                    </p>
                  </div>
                  <Radio className="w-5 h-5 text-cyan-500 animate-pulse shrink-0 ml-2" />
                </div>

              </div>
            </div>

          </div>

        </div>

      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.1); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(99, 102, 241, 0.25); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(99, 102, 241, 0.5); }
        
        .bg-cyber-grid {
          background-image: 
            linear-gradient(to right, rgba(99, 102, 241, 0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(99, 102, 241, 0.05) 1px, transparent 1px);
          background-size: 24px 24px;
        }
      `}} />
    </div>
  );
}
