import React, { useState, useRef, useEffect, useMemo } from "react";
import * as THREE from "three";
import { ArrowLeft, Activity, X, Scan, Dna } from "lucide-react";
import { useNavigate } from "react-router-dom";

// ---------------------------------------------------------------------------
// GLOBAL SCISSOR ENGINE (Single WebGL Context to prevent crashes)
// ---------------------------------------------------------------------------
const globalOrgans = new Map();

const SingleCanvasEngine = ({ isModalOpen }) => {
    const containerRef = useRef(null);
    const modalOpenRef = useRef(isModalOpen);
    const [webglError, setWebglError] = useState(false);

    useEffect(() => {
        modalOpenRef.current = isModalOpen;
    }, [isModalOpen]);

    useEffect(() => {
        if (!containerRef.current) return;
        
        const canvas = document.createElement('canvas');
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        containerRef.current.appendChild(canvas);

        let renderer;
        try {
            renderer = new THREE.WebGLRenderer({ 
                canvas: canvas, 
                alpha: true, 
                antialias: true
            });
        } catch (e) {
            console.error("WebGL setup failed:", e);
            setWebglError(true);
            return;
        }
        
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        renderer.setScissorTest(true);
        renderer.setClearColor(0x000000, 0);

        const handleResize = () => {
            renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
        };
        handleResize();
        window.addEventListener('resize', handleResize);

        let animationId;
        const animate = () => {
            animationId = requestAnimationFrame(animate);
            
            // Clear screen
            renderer.setScissorTest(false);
            renderer.clear();
            renderer.setScissorTest(true);

            if (modalOpenRef.current) return;

            const height = canvas.clientHeight;
            const width = canvas.clientWidth;

            globalOrgans.forEach((organData) => {
                const { el, scene, camera, updateFn } = organData;
                if (!el) return;

                const rect = el.getBoundingClientRect();
                if (rect.bottom < 0 || rect.top > height || rect.right < 0 || rect.left > width) return; 

                if (updateFn) updateFn();

                const w = rect.width;
                const h = rect.height;
                const left = rect.left;
                const bottom = height - rect.bottom;

                renderer.setViewport(left, bottom, w, h);
                renderer.setScissor(left, bottom, w, h);
                
                camera.aspect = w / h;
                camera.updateProjectionMatrix();

                renderer.render(scene, camera);
            });
        };
        animate();

        return () => {
            cancelAnimationFrame(animationId);
            window.removeEventListener('resize', handleResize);
            if (renderer) {
                const ext = renderer.getContext().getExtension('WEBGL_lose_context');
                if (ext) ext.loseContext();
                renderer.dispose();
            }
            if (containerRef.current && canvas.parentNode) {
                containerRef.current.removeChild(canvas);
            }
        };
    }, []);

    if (webglError) {
        return (
            <div className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-black/95 text-white p-10 text-center font-sans backdrop-blur-xl">
                <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mb-6 animate-pulse">
                    <Activity className="w-12 h-12 text-red-500" />
                </div>
                <h2 className="text-4xl font-black text-white tracking-tighter mb-4 uppercase">Fatal Graphics Crash</h2>
                <p className="text-xl max-w-2xl text-slate-400 font-light leading-relaxed mb-10">
                    Your computer's GPU has run out of memory due to multiple code reloads. Chrome has completely locked 3D rendering for this tab.
                </p>
                <div className="p-8 bg-white/5 border border-white/10 rounded-2xl w-full max-w-lg text-left shadow-2xl">
                    <p className="text-sm font-bold text-cyan-400 mb-4 uppercase tracking-widest">Required Fix Actions:</p>
                    <ol className="list-decimal list-inside space-y-4 text-slate-300">
                        <li className="pl-2">Close this specific browser tab completely.</li>
                        <li className="pl-2">Open a brand new tab.</li>
                        <li className="pl-2">Navigate back to the application.</li>
                    </ol>
                </div>
            </div>
        );
    }

    return (
        <div ref={containerRef} className="fixed inset-0 w-full h-full pointer-events-none" style={{ zIndex: 30 }} />
    );
};

// ---------------------------------------------------------------------------
// 3D ORB REGISTRATOR (Registers to Single Engine)
// ---------------------------------------------------------------------------
const ThreeOrganOrb = ({ organ }) => {
   const mountRef = useRef(null);

   useEffect(() => {
       if (!mountRef.current) return;
       
       const scene = new THREE.Scene();
       const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
       camera.position.z = 5.5;

       const group = new THREE.Group();
       scene.add(group);

       const colorMap = { pink: 0xfbcfe8, red: 0xfca5a5, cyan: 0x67e8f9, amber: 0xfde68a, yellow: 0xfef08a, blue: 0x93c5fd, purple: 0xd8b4fe };
       const organColor = colorMap[organ.colorTheme] || 0xffffff;

       const geometry = new THREE.SphereGeometry(1.6, 64, 64);
       const fallbackMaterial = new THREE.MeshBasicMaterial({ color: organColor, wireframe: true, transparent: true, opacity: 0.3 });
       const mesh = new THREE.Mesh(geometry, fallbackMaterial);
       group.add(mesh);

       const textureLoader = new THREE.TextureLoader();
       let loadedTexture;
       textureLoader.load(organ.textureUrl, (texture) => {
           loadedTexture = texture;
           texture.colorSpace = THREE.SRGBColorSpace;
           const shaderMaterial = new THREE.ShaderMaterial({
               uniforms: { tDiffuse: { value: texture }, colorTint: { value: new THREE.Color(organColor) } },
               vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
               fragmentShader: `
                   uniform sampler2D tDiffuse; uniform vec3 colorTint; varying vec2 vUv;
                   void main() {
                       vec4 c = texture2D(tDiffuse, vUv);
                       float d = distance(c.rgb, vec3(0.0));
                       float a = smoothstep(0.05, 0.25, d);
                       if (a < 0.05) gl_FragColor = vec4(colorTint, 0.05);
                       else gl_FragColor = vec4(mix(c.rgb, colorTint, 0.2), a);
                   }
               `,
               transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide
           });
           mesh.material.dispose();
           mesh.material = shaderMaterial;
           mesh.scale.x = -1; mesh.rotation.y = Math.PI; 
       });

       const ringGeo = new THREE.TorusGeometry(2.0, 0.015, 16, 100);
       const ringMat = new THREE.MeshBasicMaterial({ color: organColor, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending });
       const ring = new THREE.Mesh(ringGeo, ringMat);
       ring.rotation.x = Math.PI / 2.5; group.add(ring);
       
       const ring2Geo = new THREE.TorusGeometry(2.4, 0.008, 16, 100);
       const ring2 = new THREE.Mesh(ring2Geo, ringMat.clone());
       ring2.material.opacity = 0.2; ring2.rotation.y = Math.PI / 3; group.add(ring2);

       let targetRX = 0; let targetRY = Math.PI; let dragging = false; let prevMouse = { x: 0, y: 0 };
       const getClientX = (e) => e.touches && e.touches.length > 0 ? e.touches[0].clientX : e.clientX;
       const getClientY = (e) => e.touches && e.touches.length > 0 ? e.touches[0].clientY : e.clientY;
       const onDown = (e) => { dragging = true; prevMouse = { x: getClientX(e), y: getClientY(e) }; };
       const onMove = (e) => {
           if (dragging) { targetRY += (getClientX(e) - prevMouse.x) * 0.01; targetRX += (getClientY(e) - prevMouse.y) * 0.01; prevMouse = { x: getClientX(e), y: getClientY(e) }; }
       };
       const onUp = () => { dragging = false; };
       
       const el = mountRef.current;
       el.addEventListener('mousedown', onDown);
       el.addEventListener('touchstart', onDown, { passive: true });
       window.addEventListener('mousemove', onMove);
       window.addEventListener('touchmove', onMove, { passive: true });
       window.addEventListener('mouseup', onUp);
       window.addEventListener('touchend', onUp);

       const updateFn = () => {
           if (!dragging) targetRY += 0.002;
           group.rotation.y += (targetRY - group.rotation.y) * 0.1; 
           group.rotation.x += (targetRX - group.rotation.x) * 0.1;
           ring.rotation.z += 0.005; ring2.rotation.z -= 0.003;
           group.position.y = Math.sin(Date.now() * 0.002) * 0.1;
       };

       const id = organ.id;
       globalOrgans.set(id, { el, scene, camera, updateFn });

       return () => {
           window.removeEventListener('mouseup', onUp);
           window.removeEventListener('touchend', onUp);
           window.removeEventListener('mousemove', onMove);
           window.removeEventListener('touchmove', onMove);
           el.removeEventListener('mousedown', onDown);
           el.removeEventListener('touchstart', onDown);
           globalOrgans.delete(id);
           mesh.geometry.dispose(); if (mesh.material.dispose) mesh.material.dispose();
           ringGeo.dispose(); ring2Geo.dispose(); ringMat.dispose(); ring2.material.dispose();
           if (loadedTexture) loadedTexture.dispose();
       };
   }, [organ]);

   return <div ref={mountRef} className="w-full h-full absolute inset-0 z-10 cursor-grab active:cursor-grabbing" style={{ touchAction: 'none' }} />;
};

// ---------------------------------------------------------------------------
// MAIN PAGE COMPONENT
// ---------------------------------------------------------------------------
export default function HumanBody() {
  const navigate = useNavigate();
  const [selectedOrgan, setSelectedOrgan] = useState(null);
  const [arActive, setArActive] = useState(false);

  useEffect(() => { setArActive(false); }, [selectedOrgan]);

  const cn = (...classes) => classes.filter(Boolean).join(" ");
  const containerRef = useRef(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!containerRef.current) return;
      const { left, top, width, height } = containerRef.current.getBoundingClientRect();
      const x = (e.clientX - left) / width - 0.5;
      const y = (e.clientY - top) / height - 0.5;
      setMousePos({ x, y });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const organs = [
    {
      id: "brain",
      name: "Cerebral Cortex",
      tag: "Neural Engine",
      weight: "1.4 kg",
      function: "Cognitive, Motor Control",
      bloodFlow: "750 ml/min",
      metric: "86B Neurons",
      colorTheme: "pink",
      textureUrl: "/assets/organs/organ_brain_1780044762656.png",
      desc: "The hyper-complex neural processor of the human machine. It synthesizes data, controls motor functions, and generates consciousness through vast electrochemical networks.",
      stats: { "Synapses": "100 Trillion", "Energy Use": "20 Watts", "Signal Speed": "120 m/s" }
    },
    {
      id: "heart",
      name: "Myocardium Core",
      tag: "Circulatory Pump",
      weight: "300 g",
      function: "Blood Circulation",
      bloodFlow: "5 L/min",
      metric: "100K Beats/day",
      colorTheme: "red",
      textureUrl: "/assets/organs/organ_heart_1780044783173.png",
      desc: "The primary biological engine maintaining systemic pressure and delivering oxygen-rich fluid to all biological subsystems without pause for the duration of the organism's lifespan.",
      stats: { "Output": "7,200 L/day", "Pressure": "120/80 mmHg", "Valves": "4 Chambers" }
    },
    {
      id: "lungs",
      name: "Pulmonary System",
      tag: "O2/CO2 Exchange",
      weight: "1.3 kg",
      function: "Respiration",
      bloodFlow: "5 L/min",
      metric: "20K Breaths/day",
      colorTheme: "cyan",
      textureUrl: "/assets/organs/organ_lungs_1780044799792.png",
      desc: "A highly porous dual-chamber gas exchange manifold. It extracts atmospheric oxygen while simultaneously venting toxic carbon dioxide accumulated from cellular combustion.",
      stats: { "Surface Area": "70 sq meters", "Capacity": "6 Liters", "Alveoli": "480 Million" }
    },
    {
      id: "liver",
      name: "Hepatic Filter",
      tag: "Chemical Factory",
      weight: "1.5 kg",
      function: "Detox & Metabolism",
      bloodFlow: "1.5 L/min",
      metric: "500+ Functions",
      colorTheme: "amber",
      textureUrl: "/assets/organs/organ_liver_1780044814941.png",
      desc: "The body's primary biochemical laboratory and filtration plant. It neutralizes toxins, synthesizes vital proteins, and manages nutrient distribution protocols.",
      stats: { "Regeneration": "High", "Bile Prod": "1 L/day", "Storage": "Glycogen & Iron" }
    },
    {
      id: "kidneys",
      name: "Renal Filtration",
      tag: "Fluid Purifier",
      weight: "300 g",
      function: "Waste Extraction",
      bloodFlow: "1.2 L/min",
      metric: "200L Filtered/day",
      colorTheme: "yellow",
      textureUrl: "/assets/organs/organ_kidneys_1780044836641.png",
      desc: "A dual-unit osmotic filtration system. It maintains blood homeostasis by extracting toxic urea and regulating the body's electrolyte balance.",
      stats: { "Nephrons": "2 Million", "Urine Prod": "1.5 L/day", "Control": "Blood Pressure" }
    },
    {
      id: "eyes",
      name: "Optical Sensors",
      tag: "Visual Processing",
      weight: "15 g",
      function: "Light Transduction",
      bloodFlow: "15 ml/min",
      metric: "10M Colors",
      colorTheme: "blue",
      textureUrl: "/assets/organs/organ_eyes_1780044852435.png",
      desc: "High-resolution binaural optical sensors that capture photons, process stereoscopic depth, and stream exabytes of visual data to the neural cortex.",
      stats: { "Rods/Cones": "120M / 6M", "Resolution": "576 Megapixels", "Update": "1000 Hz" }
    },
    {
      id: "nose",
      name: "Olfactory Array",
      tag: "Chemical Sensor",
      weight: "10 g",
      function: "Scent Detection",
      bloodFlow: "50 ml/min",
      metric: "1 Trillion Scents",
      colorTheme: "purple",
      textureUrl: "/assets/organs/organ_nose_1780044868493.png",
      desc: "A sophisticated chemical analysis chamber that detects airborne molecular structures, linking directly to the brain's memory and emotion centers.",
      stats: { "Receptors": "400 Types", "Neurons": "6 Million", "Airflow": "10,000 L/day" }
    }
  ];

  return (
    <div ref={containerRef} className="relative h-[100dvh] bg-[#02050a] text-slate-300 font-sans selection:bg-cyan-500/30 overflow-hidden" style={{ perspective: '1000px' }}>
      
      {/* THE ONLY WEBGL CANVAS ON THIS PAGE */}
      <SingleCanvasEngine isModalOpen={!!selectedOrgan} />

      <div className="fixed inset-0 z-0 pointer-events-none" style={{ transform: `rotateX(${mousePos.y * 5}deg) rotateY(${mousePos.x * -5}deg)`, transition: 'transform 0.1s ease-out' }}>
        <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCI+CjxwYXRoIGQ9Ik0zMCAwIEw2MCAxNSBMMjAgNDUgTDMwIDYwIEwwIDQ1IEwwIDE1IFoiIGZpbGw9InRyYW5zcGFyZW50IiBzdHJva2U9IiM0ZmQxYzUiIHN0cm9rZS13aWR0aD0iMSIvPgo8L3N2Zz4=')] bg-repeat" style={{ backgroundSize: '40px 40px' }}></div>
        <div className="absolute top-0 left-0 w-full h-[2px] bg-cyan-400 shadow-[0_0_20px_#22d3ee] animate-scanline opacity-50"></div>
        <div className="absolute top-1/4 left-1/4 w-[40vw] h-[40vw] bg-cyan-900/20 blur-[120px] rounded-full animate-pulse-slow mix-blend-screen"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[50vw] h-[50vw] bg-pink-900/10 blur-[150px] rounded-full animate-blob mix-blend-screen"></div>
      </div>

      <div className="relative z-10 px-4 md:px-10 py-6 h-full overflow-y-auto custom-scrollbar pb-24 md:pb-6">
        <nav className="flex justify-between items-center max-w-7xl mx-auto backdrop-blur-xl bg-black/40 p-4 rounded-2xl border border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.15)] relative z-50">
          <button onClick={() => navigate(-1)} className="flex items-center gap-3 px-5 py-2 rounded-xl hover:bg-cyan-950/50 transition-all duration-300 group border border-transparent hover:border-cyan-500/50">
            <ArrowLeft className="w-5 h-5 text-cyan-400 group-hover:-translate-x-2 transition-transform" />
            <span className="uppercase tracking-[0.2em] text-xs font-bold text-cyan-100 group-hover:text-cyan-400 transition-colors">Abort Scan</span>
          </button>
          <div className="flex items-center gap-6">
            <div className="hidden md:flex flex-col text-right text-[10px] font-mono text-cyan-500 uppercase tracking-widest">
                <span>Subject: Human_01</span>
                <span className="text-white animate-pulse">Vitals: Optimal</span>
            </div>
            <div className="relative flex items-center justify-center w-12 h-12 rounded-full border border-cyan-500/50 bg-cyan-950/30">
               <Activity className="w-6 h-6 text-cyan-400 animate-pulse" />
               <div className="absolute inset-0 rounded-full border border-cyan-400 animate-ping opacity-20"></div>
            </div>
          </div>
        </nav>

        <header className="mt-16 md:mt-24 text-center max-w-5xl mx-auto relative z-20">
          <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 mb-6">
            <Scan className="w-4 h-4 text-cyan-400" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-300">Biometric Sensor Array Active</span>
          </div>
          <h1 className="text-5xl md:text-[7rem] font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-cyan-100 to-cyan-900 leading-none drop-shadow-[0_0_30px_rgba(6,182,212,0.3)]">
            BIOMETRICS
          </h1>
          <p className="text-cyan-500 uppercase tracking-[0.8em] text-xs md:text-sm font-light mt-6 flex justify-center items-center gap-4">
             <span className="w-12 h-[1px] bg-cyan-500/50"></span> Full Body Diagnostics <span className="w-12 h-[1px] bg-cyan-500/50"></span>
          </p>
        </header>

        <section className="mt-20 md:mt-32 max-w-7xl mx-auto pb-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 md:gap-16">
            {organs.map((organ, index) => (
              <div key={index} onClick={() => setSelectedOrgan(organ)} className="group relative flex flex-col md:flex-row gap-8 p-1 rounded-[2rem] bg-gradient-to-br from-white/5 to-transparent backdrop-blur-md cursor-pointer transition-all duration-700 hover:scale-[1.02]" style={{ transformStyle: 'preserve-3d', boxShadow: '0 30px 60px -20px rgba(0,0,0,0.8), inset 0 0 0 1px rgba(255,255,255,0.1)' }}>
                <div className={`absolute inset-0 rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-transparent via-${organ.colorTheme}-500/50 to-transparent`} style={{ padding: '1px', WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)', maskComposite: 'exclude' }}></div>
                <div className="w-full md:w-[45%] h-64 md:h-80 relative bg-black/40 rounded-[1.8rem] overflow-hidden flex items-center justify-center border border-white/5">
                   
                   <ThreeOrganOrb organ={organ} />
                   
                   <div className={`absolute inset-0 bg-${organ.colorTheme}-500/10 blur-[50px] pointer-events-none`}></div>
                   <div className="absolute top-4 left-4 text-[9px] font-mono text-white/50 uppercase tracking-widest border border-white/10 px-2 py-1 rounded bg-black/50 backdrop-blur-sm z-20 pointer-events-none">ID: {organ.id.toUpperCase()}</div>
                   <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:20px_20px] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none z-20"></div>
                </div>

                <div className="w-full md:w-[55%] flex flex-col justify-center p-6 md:p-8 relative z-20 pointer-events-none">
                  <div className={`inline-block px-3 py-1 rounded-full border border-${organ.colorTheme}-500/30 bg-${organ.colorTheme}-500/10 w-max mb-4`}>
                    <span className={`text-[10px] font-black uppercase tracking-[0.3em] text-${organ.colorTheme}-400`}>{organ.tag}</span>
                  </div>
                  <h3 className="text-4xl md:text-5xl font-black text-white tracking-tight drop-shadow-lg">{organ.name}</h3>
                  <div className="mt-6 space-y-4 border-l-2 border-white/10 pl-6 relative">
                    <div className="flex justify-between items-center text-xs font-mono"><span className="text-slate-500 uppercase tracking-widest">Weight</span> <span className="text-white bg-white/10 px-2 py-1 rounded">{organ.weight}</span></div>
                    <div className="flex justify-between items-center text-xs font-mono"><span className="text-slate-500 uppercase tracking-widest">Primary Func</span> <span className={`text-${organ.colorTheme}-300 truncate ml-2 text-right`}>{organ.function}</span></div>
                  </div>
                  <button className={`mt-8 pointer-events-auto flex items-center justify-between w-full py-4 px-6 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-xs uppercase tracking-widest hover:bg-${organ.colorTheme}-600 hover:border-${organ.colorTheme}-400 transition-all duration-300 relative overflow-hidden`}>
                    <span className="relative z-10">Initialize 3D Scan</span>
                    <Scan className="w-4 h-4 relative z-10" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {selectedOrgan && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center backdrop-blur-3xl bg-black/90">
                <div className="relative w-full h-full md:w-[90vw] md:h-[90vh] bg-[#050b14]/80 border border-cyan-500/30 md:rounded-[3rem] overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 duration-500">
                    <button onClick={() => setSelectedOrgan(null)} className="absolute top-6 right-6 p-4 bg-red-500/10 rounded-full text-red-400 z-[110] cursor-pointer"><X className="w-6 h-6" /></button>
                    <div className={`w-full md:w-3/5 h-1/2 md:h-full relative flex flex-col items-center justify-center p-12`}>
                        <div className="absolute top-8 left-8 z-[110] flex gap-2">
                          <button onClick={(e) => { e.stopPropagation(); setArActive(false); }} className={cn("px-3 py-1.5 rounded-lg text-[10px] font-mono uppercase cursor-pointer", !arActive ? "bg-cyan-500 text-black font-bold" : "bg-white/5 text-slate-400")}>Hologram 3D</button>
                          <button onClick={(e) => { e.stopPropagation(); setArActive(true); }} className={cn("px-3 py-1.5 rounded-lg text-[10px] font-mono uppercase cursor-pointer", arActive ? "bg-cyan-500 text-black font-bold" : "bg-white/5 text-slate-400")}>AR Projection</button>
                        </div>
                        {!arActive ? (
                          <div className="w-full h-full relative z-[110]">
                               {/* Modal uses standalone renderer to not conflict with global engine that is paused */}
                               <StandaloneModalOrb organ={selectedOrgan} />
                          </div>
                        ) : (
                          <div className="w-full h-80 md:h-full relative flex items-center justify-center rounded-3xl overflow-hidden border border-cyan-500/20 bg-cyan-950/10 z-[110]">
                            <model-viewer src="https://modelviewer.dev/shared-assets/models/RobotExpressive.glb" ar camera-controls auto-rotate style={{ width: "100%", height: "100%" }}></model-viewer>
                          </div>
                        )}
                    </div>
                    <div className="w-full md:w-2/5 h-1/2 md:h-full p-8 md:p-16 relative bg-black/40 border-l border-white/5">
                        <h2 className="text-5xl md:text-7xl font-black text-white uppercase">{selectedOrgan.name}</h2>
                        <p className={`text-${selectedOrgan.colorTheme}-400 font-mono text-sm mt-4 uppercase`}>{selectedOrgan.tag}</p>
                        <p className="mt-8 text-slate-300 leading-relaxed text-base">{selectedOrgan.desc}</p>
                    </div>
                </div>
            </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(6, 182, 212, 0.3); border-radius: 10px; }
        @keyframes scanline { 0% { transform: translateY(-100vh); } 100% { transform: translateY(100vh); } }
        .animate-scanline { animation: scanline 8s linear infinite; }
        @keyframes pulse-slow { 0%, 100% { opacity: 0.1; transform: scale(1); } 50% { opacity: 0.2; transform: scale(1.2); } }
        .animate-pulse-slow { animation: pulse-slow 8s infinite ease-in-out; }
      `}} />
    </div>
  );
}

// Minimal Standalone Orb for Modal (So it works while global engine pauses)
const StandaloneModalOrb = ({ organ }) => {
    const containerRef = useRef(null);
    useEffect(() => {
        if (!containerRef.current) return;
        const canvas = document.createElement('canvas');
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        containerRef.current.appendChild(canvas);

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100); camera.position.z = 5.5;
        
        let renderer;
        try {
            renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
        } catch (e) {
            console.error("WebGL limit reached for modal orb");
            return;
        }

        renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
        const geo = new THREE.SphereGeometry(1.6, 64, 64);
        const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.3 });
        const mesh = new THREE.Mesh(geo, mat);
        scene.add(mesh);
        
        // Touch events code
        let targetRX = 0; let targetRY = 0; let dragging = false; let prevMouse = { x: 0, y: 0 };
        const getClientX = (e) => e.touches && e.touches.length > 0 ? e.touches[0].clientX : e.clientX;
        const getClientY = (e) => e.touches && e.touches.length > 0 ? e.touches[0].clientY : e.clientY;
        
        const onDown = (e) => { dragging = true; prevMouse = { x: getClientX(e), y: getClientY(e) }; };
        const onMove = (e) => {
            if(!dragging) return;
            const cx = getClientX(e); const cy = getClientY(e);
            targetRY += (cx - prevMouse.x) * 0.01;
            targetRX += (cy - prevMouse.y) * 0.01;
            prevMouse = { x: cx, y: cy };
        };
        const onUp = () => dragging = false;
        
        const el = containerRef.current;
        if(el) {
            el.addEventListener("mousedown", onDown);
            el.addEventListener("touchstart", onDown, {passive: true});
            window.addEventListener("mousemove", onMove);
            window.addEventListener("touchmove", onMove, {passive: true});
            window.addEventListener("mouseup", onUp);
            window.addEventListener("touchend", onUp);
        }

        let id = requestAnimationFrame(function animate() { 
            id = requestAnimationFrame(animate); 
            mesh.rotation.x = targetRX;
            mesh.rotation.y = targetRY + (Date.now() * 0.0005); // constant rotation + drag
            renderer.render(scene, camera); 
        });

        return () => { 
            cancelAnimationFrame(id); 
            if(el) {
                el.removeEventListener("mousedown", onDown);
                el.removeEventListener("touchstart", onDown);
                window.removeEventListener("mousemove", onMove);
                window.removeEventListener("touchmove", onMove);
                window.removeEventListener("mouseup", onUp);
                window.removeEventListener("touchend", onUp);
            }
            geo.dispose(); mat.dispose();
            if (renderer) {
                const ext = renderer.getContext().getExtension('WEBGL_lose_context');
                if (ext) ext.loseContext();
                renderer.dispose();
            }
            if (el && canvas.parentNode) {
                el.removeChild(canvas);
            }
        };
    }, [organ]);
    return <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" style={{ touchAction: 'none' }} />;
}
