import React, { useState, useEffect, useRef } from "react";
import * as THREE from "three";
import { motion } from "framer-motion";
import {
  ArrowLeft, FlaskConical, Dna, Info,
  Plus, Trash2, HelpCircle, Sparkles, Compass,
  Activity, Settings, Eye
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function MoleculesLab() {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  
  // Local storage states
  const [theme] = useState(() => localStorage.getItem("theme") || "dark");
  const [language] = useState(() => localStorage.getItem("lang") || "en");

  // Selected atom option in the custom builder workbench
  const [selectedBuilderAtom, setSelectedBuilderAtom] = useState("H");

  // Active molecule list of atoms
  const [atoms, setAtoms] = useState([
    { id: 1, element: "O", pos: [0, 0.25, 0] },
    { id: 2, element: "H", pos: [0.85, -0.45, 0] },
    { id: 3, element: "H", pos: [-0.85, -0.45, 0] }
  ]);

  // Chemical analytical stats
  const [chemicalFormula, setChemicalFormula] = useState("H₂O");
  const [molecularWeight, setMolecularWeight] = useState(18.015);
  const [activeMoleculeName, setActiveMoleculeName] = useState("Water");
  const [moleculeDescription, setMoleculeDescription] = useState(
    "Water is a polar inorganic compound that is at room temperature a tasteless and odorless liquid, which is nearly colorless. It is the main constituent of Earth's hydrosphere."
  );

  const sceneRef = useRef(null);
  const atomsGroupRef = useRef(null);
  const bondsGroupRef = useRef(null);

  // Available atoms templates config
  const atomTypes = {
    H: { name: "Hydrogen", mass: 1.008, color: 0xffffff, size: 0.26, symbol: "H", tone: "emerald" },
    C: { name: "Carbon", mass: 12.011, color: 0x334155, size: 0.39, symbol: "C", tone: "slate" },
    O: { name: "Oxygen", mass: 15.999, color: 0xf43f5e, size: 0.36, symbol: "O", tone: "rose" },
    N: { name: "Nitrogen", mass: 14.007, color: 0x0ea5e9, size: 0.36, symbol: "N", tone: "sky" }
  };

  // Translations
  const t = {
    en: {
      title: "Molecular Bio-Lab",
      subtitle: "Synthesize covalent chemical bonds, configure molecular geometries, and inspect telemetry stats.",
      backBtn: "Dashboard",
      simTitle: "3D Molecular Synthesizer",
      panelTitle: "Preset Vials (Compound Templates)",
      workbenchTitle: "Molecular Assembly Workbench",
      statsTitle: "Compound Telemetry Analysis",
      formula: "Formula",
      weight: "Molecular Mass",
      addAtom: "Inject Atom",
      clearBtn: "Purge Model",
      synthesizeBtn: "Connect Chemical Bonds",
      descTitle: "Biochemical Notes & Utility",
      hintText: "Tip: Drag on model to rotate. Load templates to analyze bonds."
    },
    hi: {
      title: "आणविक बायो-लैब",
      subtitle: "सहसंयोजक रासायनिक बांड का संश्लेषण करें, आणविक ज्यामिति को कॉन्फ़िगर करें, और टेलीमेट्री विश्लेषण देखें।",
      backBtn: "डैशबोर्ड",
      simTitle: "3D आणविक सिंथेसाइज़र",
      panelTitle: "प्रीसेट शीशियां (अणु टेम्पलेट्स)",
      workbenchTitle: "आणविक असेंबली वर्कबेंच",
      statsTitle: "यौगिक टेलीमेट्री विश्लेषण",
      formula: "रासायनिक सूत्र",
      weight: "आणविक भार",
      addAtom: "परमाणु इंजेक्ट करें",
      clearBtn: "मॉडल साफ़ करें",
      synthesizeBtn: "रासायनिक बांड संकलित करें",
      descTitle: "जैव रासायनिक नोट्स और उपयोगिता",
      hintText: "युक्ति: मॉडल पर ड्रैग करके घुमाएं। बांड का विश्लेषण करने के लिए टेम्पलेट लोड करें।"
    }
  }[language] || t.en;

  // Preset molecules database
  const presetMolecules = [
    {
      name: "Water",
      hindiName: "पानी (H₂O)",
      formula: "H₂O",
      weight: 18.015,
      desc: "Water is a polar compound key to all life on Earth. Its bent molecule geometry leads to hydrogen bonding, high surface tension, and liquid behavior at room temperature.",
      hindiDesc: "पानी पृथ्वी पर सभी जीवन के लिए महत्वपूर्ण यौगिक है। इसकी झुकी हुई ज्यामिति हाइड्रोजन बॉन्डिंग, उच्च पृष्ठ तनाव और कमरे के तापमान पर तरल व्यवहार का कारण बनती है।",
      atoms: [
        { id: 1, element: "O", pos: [0, 0.25, 0] },
        { id: 2, element: "H", pos: [0.85, -0.45, 0] },
        { id: 3, element: "H", pos: [-0.85, -0.45, 0] }
      ]
    },
    {
      name: "Carbon Dioxide",
      hindiName: "कार्बन डाइऑक्साइड (CO₂)",
      formula: "CO₂",
      weight: 44.01,
      desc: "Carbon Dioxide is a linear greenhouse gas essential for photosynthesis in plants. Carbon forms double covalent bonds with both oxygen atoms at a 180-degree angle.",
      hindiDesc: "कार्बन डाइऑक्साइड एक रैखिक ग्रीनहाउस गैस है जो पौधों में प्रकाश संश्लेषण के लिए आवश्यक है। कार्बन 180 डिग्री के कोण पर दोनों ऑक्सीजन परमाणुओं के साथ सहसंयोजक बांड बनाता है।",
      atoms: [
        { id: 1, element: "C", pos: [0, 0, 0] },
        { id: 2, element: "O", pos: [-1.2, 0, 0] },
        { id: 3, element: "O", pos: [1.2, 0, 0] }
      ]
    },
    {
      name: "Methane",
      hindiName: "मीथेन (CH₄)",
      formula: "CH₄",
      weight: 16.04,
      desc: "Methane is the simplest alkane and the main constituent of natural gas. It has a tetrahedral molecular shape with carbon in the center and 4 hydrogen atoms evenly distributed.",
      hindiDesc: "मीथेन सबसे सरल अल्केन है और प्राकृतिक गैस का मुख्य घटक है। इसमें केंद्र में कार्बन और समान रूप से वितरित 4 हाइड्रोजन परमाणुओं के साथ एक टेट्राहेड्रल आणविक आकार होता है।",
      atoms: [
        { id: 1, element: "C", pos: [0, 0, 0] },
        { id: 2, element: "H", pos: [0, 1.1, 0] },
        { id: 3, element: "H", pos: [0.95, -0.35, 0.55] },
        { id: 4, element: "H", pos: [-0.95, -0.35, 0.55] },
        { id: 5, element: "H", pos: [0, -0.35, -1.05] }
      ]
    },
    {
      name: "Ammonia",
      hindiName: "अमोनिया (NH₃)",
      formula: "NH₃",
      weight: 17.03,
      desc: "Ammonia is a colorless gas with a characteristic pungent smell. Its molecular shape is trigonal pyramidal due to nitrogen's lone pair of electrons repelling the hydrogen bonds.",
      hindiDesc: "अमोनिया एक रंगहीन गैस है जिसमें तीखी गंध होती है। नाइट्रोजन के अकेले इलेक्ट्रॉन युग्म द्वारा हाइड्रोजन बॉन्ड को पीछे धकेलने के कारण इसका आकार त्रिकोणीय पिरामिड जैसा होता है।",
      atoms: [
        { id: 1, element: "N", pos: [0, 0.25, 0] },
        { id: 2, element: "H", pos: [0.85, -0.3, 0] },
        { id: 3, element: "H", pos: [-0.42, -0.3, 0.74] },
        { id: 4, element: "H", pos: [-0.42, -0.3, -0.74] }
      ]
    }
  ];

  const loadPreset = (preset) => {
    setAtoms(preset.atoms);
    setActiveMoleculeName(language === "hi" ? preset.hindiName : preset.name);
    setChemicalFormula(preset.formula);
    setMolecularWeight(preset.weight);
    setMoleculeDescription(language === "hi" ? preset.hindiDesc : preset.desc);
  };

  const addCustomAtom = () => {
    const randomOffset = () => (Math.random() - 0.5) * 2;
    const newAtom = {
      id: Date.now(),
      element: selectedBuilderAtom,
      pos: [randomOffset(), randomOffset(), randomOffset()]
    };
    const updated = [...atoms, newAtom];
    setAtoms(updated);
    recalculateFormula(updated);
  };

  const clearModel = () => {
    setAtoms([]);
    setChemicalFormula("—");
    setMolecularWeight(0);
    setActiveMoleculeName("Custom Molecule");
    setMoleculeDescription("Assemble atoms and click synthesize to analyze chemical compounds.");
  };

  const recalculateFormula = (activeAtoms) => {
    if (activeAtoms.length === 0) {
      setChemicalFormula("—");
      setMolecularWeight(0);
      return;
    }

    const counts = {};
    let totalMass = 0;
    activeAtoms.forEach((a) => {
      counts[a.element] = (counts[a.element] || 0) + 1;
      totalMass += atomTypes[a.element]?.mass || 0;
    });

    let formulaStr = "";
    const order = ["C", "H", "O", "N"];
    order.forEach((sym) => {
      if (counts[sym]) {
        const sub = counts[sym] > 1 ? String(counts[sym]).replace(/[0-9]/g, (c) => "₀₁₂₃₄₅₆₇₈₉"[c]) : "";
        formulaStr += sym + sub;
      }
    });

    Object.keys(counts).forEach((sym) => {
      if (!order.includes(sym)) {
        const sub = counts[sym] > 1 ? String(counts[sym]).replace(/[0-9]/g, (c) => "₀₁₂₃₄₅₆₇₈₉"[c]) : "";
        formulaStr += sym + sub;
      }
    });

    setChemicalFormula(formulaStr);
    setMolecularWeight(Number(totalMass.toFixed(3)));
    setActiveMoleculeName("Custom Molecule");
  };

  const triggerSynthesize = () => {
    recalculateFormula(atoms);
    if (!bondsGroupRef.current || !atomsGroupRef.current) return;
    
    while (bondsGroupRef.current.children.length > 0) {
      bondsGroupRef.current.remove(bondsGroupRef.current.children[0]);
    }

    const MAX_BOND_DIST = 1.85;

    for (let i = 0; i < atoms.length; i++) {
      for (let j = i + 1; j < atoms.length; j++) {
        const p1 = new THREE.Vector3(...atoms[i].pos);
        const p2 = new THREE.Vector3(...atoms[j].pos);
        const dist = p1.distanceTo(p2);

        if (dist <= MAX_BOND_DIST && dist > 0.1) {
          const direction = new THREE.Vector3().subVectors(p2, p1);
          const length = direction.length();
          
          const geom = new THREE.CylinderGeometry(0.05, 0.05, length, 12);
          const mat = new THREE.MeshStandardMaterial({
            color: 0x64748b,
            roughness: 0.3,
            metalness: 0.5
          });
          const stick = new THREE.Mesh(geom, mat);

          stick.position.copy(p1).add(p2).multiplyScalar(0.5);
          stick.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize());
          
          bondsGroupRef.current.add(stick);
        }
      }
    }
  };

  useEffect(() => {
    const t = setTimeout(() => {
      triggerSynthesize();
    }, 100);
    return () => clearTimeout(t);
  }, [atoms]);

  // Three.js renderer lifecycle
  useEffect(() => {
    if (!canvasRef.current) return;

    const width = canvasRef.current.clientWidth || 600;
    const height = canvasRef.current.clientHeight || 450;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 5.5);

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      alpha: true,
      antialias: true
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const atomsGroup = new THREE.Group();
    atomsGroupRef.current = atomsGroup;
    scene.add(atomsGroup);

    const bondsGroup = new THREE.Group();
    bondsGroupRef.current = bondsGroup;
    scene.add(bondsGroup);

    // Star Dust Particles
    const starGeom = new THREE.BufferGeometry();
    const count = 100;
    const coords = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i++) {
      coords[i] = (Math.random() - 0.5) * 10;
    }
    starGeom.setAttribute("position", new THREE.BufferAttribute(coords, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0x10b981,
      size: 0.04,
      transparent: true,
      opacity: 0.6
    });
    const starField = new THREE.Points(starGeom, starMat);
    scene.add(starField);

    let rotX = 0;
    let rotY = 0;
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
      rotX += dY * 0.007;
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

    const ambient = new THREE.AmbientLight(0xffffff, 0.55);
    scene.add(ambient);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.4);
    dirLight1.position.set(4, 6, 5);
    scene.add(dirLight1);

    const pointLight = new THREE.PointLight(0x10b981, 2, 8);
    pointLight.position.set(0, 0, 3);
    scene.add(pointLight);

    let animId;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Orbital slow drift
      atomsGroup.rotation.y = rotY + elapsed * 0.06;
      atomsGroup.rotation.x = rotX;
      bondsGroup.rotation.y = rotY + elapsed * 0.06;
      bondsGroup.rotation.x = rotX;

      starField.rotation.y += 0.001;

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

  // Update Three.js meshes
  useEffect(() => {
    if (!atomsGroupRef.current) return;

    while (atomsGroupRef.current.children.length > 0) {
      atomsGroupRef.current.remove(atomsGroupRef.current.children[0]);
    }

    atoms.forEach((atom) => {
      const type = atomTypes[atom.element] || atomTypes.H;
      const geom = new THREE.SphereGeometry(type.size, 32, 32);
      
      const mat = new THREE.MeshStandardMaterial({
        color: type.color,
        roughness: 0.15,
        metalness: 0.8
      });
      
      const sphere = new THREE.Mesh(geom, mat);
      sphere.position.set(...atom.pos);
      atomsGroupRef.current.add(sphere);
    });
  }, [atoms]);

  return (
    <div className="min-h-screen bg-[#010307] text-slate-200 p-4 md:p-8 font-sans selection:bg-emerald-500/40 overflow-y-auto">
      
      {/* Background Cyber Glow Blobs */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-emerald-500/10 blur-[150px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-teal-500/10 blur-[150px] rounded-full" />
        <div className="absolute top-[40%] right-[30%] w-[35vw] h-[35vw] bg-cyan-500/5 blur-[120px] rounded-full" />
        <div className="absolute inset-0 opacity-[0.02] bg-[radial-gradient(#fff_1px,transparent_1px)] bg-[size:16px_16px]" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10 space-y-6">
        
        {/* Navigation HUD */}
        <nav className="flex justify-between items-center backdrop-blur-2xl bg-white/5 p-4 rounded-3xl border border-white/10 shadow-[0_8px_32px_0_rgba(16,185,129,0.08)]">
          <button onClick={() => navigate("/home")} className="flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition group">
            <ArrowLeft className="w-5 h-5 text-emerald-400 group-hover:-translate-x-1.5 transition-transform" />
            <span className="uppercase tracking-[0.25em] text-[10px] font-black">{t.backBtn}</span>
          </button>
          
          <div className="flex items-center gap-4">
            <Dna className="w-5 h-5 text-emerald-400 animate-pulse" />
            <span className="text-[10px] font-mono text-emerald-300 uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1.5 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.15)]">
              Bio-Synthesis active
            </span>
          </div>
        </nav>

        {/* Header Title */}
        <header className="space-y-2">
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white leading-none">
            <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-500 bg-clip-text text-transparent drop-shadow-[0_2px_15px_rgba(16,185,129,0.3)]">
              {t.title}
            </span>
          </h1>
          <p className="text-slate-400 text-xs md:text-sm max-w-2xl font-light tracking-wide">{t.subtitle}</p>
        </header>

        {/* Grid Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start pb-10">
          
          {/* LEFT: 3D Holographic view */}
          <div className="lg:col-span-7 flex flex-col space-y-4">
            
            {/* Hologram Screen Container */}
            <div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-slate-950/40 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] backdrop-blur-xl">
              
              {/* Decorative HUD Corners */}
              <div className="absolute top-6 left-6 w-8 h-8 border-t-2 border-l-2 border-emerald-500/50" />
              <div className="absolute top-6 right-6 w-8 h-8 border-t-2 border-r-2 border-emerald-500/50" />
              <div className="absolute bottom-6 left-6 w-8 h-8 border-b-2 border-l-2 border-emerald-500/50" />
              <div className="absolute bottom-6 right-6 w-8 h-8 border-b-2 border-r-2 border-emerald-500/50" />

              <div className="absolute top-8 left-16 z-20 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-[10px] font-mono uppercase text-emerald-300 tracking-widest font-black">
                  {t.simTitle}
                </span>
              </div>
              
              <div className="w-full h-[400px] md:h-[480px] relative flex items-center justify-center">
                {/* Star mesh pattern overlay */}
                <div className="absolute inset-0 bg-cyber-grid opacity-10 pointer-events-none" />
                <canvas ref={canvasRef} className="w-full h-full relative z-10 cursor-grab active:cursor-grabbing" />
              </div>

              {/* Lower HUD Overlay inside 3D Canvas */}
              <div className="absolute bottom-8 left-8 right-8 z-20 flex justify-between items-center bg-slate-950/80 border border-white/10 rounded-2xl p-4 text-[10px] font-mono text-slate-400 shadow-xl">
                <div className="flex gap-4">
                  <div>
                    <span className="text-emerald-400">ATOMS:</span> {atoms.length}
                  </div>
                  <div>
                    <span className="text-emerald-400">STRUCTURE:</span> {activeMoleculeName}
                  </div>
                </div>
                <div className="hidden sm:block text-slate-500">
                  {t.hintText}
                </div>
              </div>
            </div>

            {/* Molecule Description Notes */}
            <div className="rounded-[2rem] border border-white/10 bg-slate-950/40 p-6 backdrop-blur-xl space-y-2 shadow-2xl">
              <h4 className="text-xs font-mono uppercase tracking-widest text-emerald-400 flex items-center gap-2 mb-2">
                <Info className="w-4 h-4 text-emerald-400" /> {t.descTitle}
              </h4>
              <p className="text-sm text-slate-300 leading-relaxed font-light">
                {moleculeDescription}
              </p>
            </div>
          </div>

          {/* RIGHT: Vials Library & Workbench */}
          <div className="lg:col-span-5 flex flex-col space-y-6">
            
            {/* Vials Library */}
            <div className="rounded-[2.5rem] border border-white/10 bg-slate-950/40 p-6 backdrop-blur-xl space-y-4 shadow-2xl">
              <div>
                <h3 className="text-xl font-black text-white flex items-center gap-2">
                  <Dna className="w-5 h-5 text-emerald-400" /> {t.panelTitle}
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {presetMolecules.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => loadPreset(preset)}
                    className="p-4 rounded-2xl border border-white/5 bg-white/5 hover:bg-emerald-950/20 hover:border-emerald-500/40 transition duration-300 text-left space-y-1 group"
                  >
                    <div className="text-xs text-slate-500 font-mono tracking-wider group-hover:text-emerald-400 transition-colors">{preset.formula}</div>
                    <div className="text-sm font-extrabold text-white truncate">
                      {language === "hi" ? preset.hindiName.split(" ")[0] : preset.name}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Atom Assembly Workbench */}
            <div className="rounded-[2.5rem] border border-white/10 bg-slate-950/40 p-6 backdrop-blur-xl space-y-4 shadow-2xl">
              <div>
                <h3 className="text-xl font-black text-white flex items-center gap-2">
                  <FlaskConical className="w-5 h-5 text-teal-400" /> {t.workbenchTitle}
                </h3>
              </div>

              {/* Elements grid selection cards */}
              <div className="grid grid-cols-4 gap-2">
                {Object.entries(atomTypes).map(([sym, item]) => {
                  const toneColors = {
                    slate: "border-slate-500/30 text-slate-300 bg-slate-500/5",
                    emerald: "border-emerald-500/30 text-emerald-300 bg-emerald-500/5",
                    rose: "border-rose-500/30 text-rose-300 bg-rose-500/5",
                    sky: "border-sky-500/30 text-sky-300 bg-sky-500/5"
                  };
                  const activeColors = {
                    slate: "border-slate-400 text-white bg-slate-500/25 shadow-[0_0_10px_rgba(148,163,184,0.15)]",
                    emerald: "border-emerald-400 text-white bg-emerald-500/25 shadow-[0_0_10px_rgba(16,185,129,0.15)]",
                    rose: "border-rose-400 text-white bg-rose-500/25 shadow-[0_0_10px_rgba(244,63,94,0.15)]",
                    sky: "border-sky-400 text-white bg-sky-500/25 shadow-[0_0_10px_rgba(14,165,233,0.15)]"
                  };

                  return (
                    <button
                      key={sym}
                      onClick={() => setSelectedBuilderAtom(sym)}
                      className={`p-3 rounded-2xl border text-center transition flex flex-col items-center justify-center ${
                        selectedBuilderAtom === sym
                          ? activeColors[item.tone]
                          : toneColors[item.tone] + " hover:bg-white/5"
                      }`}
                    >
                      <span className="text-sm font-black">{sym}</span>
                      <span className="text-[9px] opacity-60 mt-1 truncate">{item.name.slice(0, 5)}</span>
                    </button>
                  );
                })}
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={addCustomAtom}
                  className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs uppercase tracking-[0.2em] rounded-xl transition shadow-[0_10px_20px_rgba(16,185,129,0.2)] flex items-center justify-center gap-2 border border-white/10"
                >
                  <Plus className="w-4 h-4 text-white animate-pulse" /> {t.addAtom}
                </button>
                <button
                  onClick={clearModel}
                  className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-black text-xs uppercase tracking-[0.2em] rounded-xl transition flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4 text-rose-400" /> {t.clearBtn}
                </button>
              </div>

              <button
                onClick={triggerSynthesize}
                className="w-full py-4 mt-2 bg-slate-950 hover:bg-slate-900 border border-emerald-500/25 hover:border-emerald-500/50 text-emerald-400 font-black text-xs uppercase tracking-[0.2em] rounded-xl transition flex items-center justify-center gap-2 shadow-inner"
              >
                <Compass className="w-4 h-4 text-emerald-400 animate-spin-slow" /> {t.synthesizeBtn}
              </button>
            </div>

            {/* Diagnostics Analysis Dashboard */}
            <div className="rounded-[2.5rem] border border-white/10 bg-slate-950/40 p-6 backdrop-blur-xl space-y-4 shadow-2xl">
              <div>
                <h3 className="text-xl font-black text-white flex items-center gap-2">
                  <Compass className="w-5 h-5 text-cyan-400" /> {t.statsTitle}
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                
                {/* SVG circular mass gauge */}
                <div className="p-4 rounded-3xl bg-white/5 border border-white/5 flex flex-col items-center text-center justify-center space-y-2 relative overflow-hidden">
                  <div className="absolute top-2 left-2 flex gap-1 items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
                    <span className="text-[8px] font-mono text-slate-500 uppercase">{t.weight}</span>
                  </div>

                  <div className="relative w-20 h-20 flex items-center justify-center mt-2">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="40" cy="40" r="32" stroke="rgba(255,255,255,0.05)" strokeWidth="4" fill="transparent" />
                      <circle cx="40" cy="40" r="32" stroke="#06b6d4" strokeWidth="4" fill="transparent" 
                              strokeDasharray="200" 
                              strokeDashoffset={200 - (200 * Math.min(60, molecularWeight)) / 60}
                              strokeLinecap="round" />
                    </svg>
                    <div className="absolute text-[10px] font-mono font-extrabold text-white">
                      {molecularWeight}
                    </div>
                  </div>
                </div>

                {/* SVG Formula screen */}
                <div className="p-4 rounded-3xl bg-white/5 border border-white/5 flex flex-col items-center text-center justify-center space-y-2 relative overflow-hidden">
                  <div className="absolute top-2 left-2 flex gap-1 items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="text-[8px] font-mono text-slate-500 uppercase">{t.formula}</span>
                  </div>

                  <div className="relative w-20 h-20 flex items-center justify-center mt-2">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="40" cy="40" r="32" stroke="rgba(255,255,255,0.05)" strokeWidth="4" fill="transparent" />
                      <circle cx="40" cy="40" r="32" stroke="#10b981" strokeWidth="4" fill="transparent" 
                              strokeDasharray="200" 
                              strokeDashoffset={200 - (200 * Math.min(10, atoms.length)) / 10}
                              strokeLinecap="round" />
                    </svg>
                    <div className="absolute text-sm font-mono font-black text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]">
                      {chemicalFormula}
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>

        </div>

      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.1); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(16, 185, 129, 0.25); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(16, 185, 129, 0.5); }
        .animate-spin-slow { animation: spin 8s linear infinite; }
        
        .bg-cyber-grid {
          background-image: 
            linear-gradient(to right, rgba(16, 185, 129, 0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(16, 185, 129, 0.05) 1px, transparent 1px);
          background-size: 24px 24px;
        }
      `}} />
    </div>
  );
}
