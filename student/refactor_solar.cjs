const fs = require('fs');
const file = 'C:/Users/krosh/OneDrive/Desktop/E-commerce website/student/src/pages/science/SolarSystem.jsx';
let content = fs.readFileSync(file, 'utf8');

const engineCode = `
// ---------------------------------------------------------------------------
// GLOBAL SCISSOR ENGINE (Single WebGL Context to prevent crashes)
// ---------------------------------------------------------------------------
const globalPlanets = new Map();

const SingleCanvasEngine = ({ isModalOpen }) => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        let renderer;
        try {
            renderer = new THREE.WebGLRenderer({ 
                canvas: canvas, 
                alpha: true, 
                antialias: true,
                powerPreference: "high-performance"
            });
        } catch (e) {
            console.error("WebGL setup failed:", e);
            if (window.handleFatalGpuCrash) window.handleFatalGpuCrash();
            return;
        }
        
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        renderer.setScissorTest(true);
        renderer.setClearColor(0x000000, 0);

        const handleContextLost = (e) => {
            e.preventDefault();
            if (window.handleFatalGpuCrash) window.handleFatalGpuCrash();
        };
        canvas.addEventListener('webglcontextlost', handleContextLost, false);

        const handleResize = () => {
            renderer.setSize(window.innerWidth, window.innerHeight, false);
        };
        handleResize();
        window.addEventListener('resize', handleResize);

        let animationId;
        const animate = () => {
            animationId = requestAnimationFrame(animate);
            
            renderer.setScissorTest(false);
            renderer.clear();
            renderer.setScissorTest(true);

            if (isModalOpen) return;

            const height = window.innerHeight;
            const width = window.innerWidth;

            globalPlanets.forEach((planetData) => {
                const { el, scene, camera, updateFn } = planetData;
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
            canvas.removeEventListener('webglcontextlost', handleContextLost);
            if (renderer) {
                const ext = renderer.getContext().getExtension('WEBGL_lose_context');
                if (ext) ext.loseContext();
                renderer.dispose();
            }
        };
    }, [isModalOpen]);

    return (
        <canvas ref={canvasRef} className="fixed inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }} />
    );
};
`;

// Insert the engine right before ThreePlanet
content = content.replace('// 3D textured planet component (Large detailed view inside Modal)', engineCode + '\n// 3D textured planet component (Large detailed view inside Modal)');

// Modify GridPlanet3D
// 1. Remove renderer creation
content = content.replace(/let renderer;\s*try \{[\s\S]*?\} catch \(e\) \{[\s\S]*?return;\s*\}/, '');

// 2. Modify the animation loop to be an updateFn
const animLoopRegex = /\/\/\s*Animation Loop[\s\S]*?animate\(\);[\s\S]*?const handleResize[\s\S]*?window\.addEventListener\("resize", handleResize\);/m;
const newUpdateFn = `
    const clock = new THREE.Clock();
    const updateFn = () => {
      const elapsed = clock.getElapsedTime();
      dragGroup.rotation.y = rotY;
      dragGroup.rotation.x = rotX;
      planetMesh.rotation.y = elapsed * 0.08;
      if (ringsMesh) {
        if (planetName === "Saturn") ringsMesh.rotation.z = elapsed * 0.015;
        else ringsMesh.rotation.z = -elapsed * 0.008;
      }
      if (coronaMesh && outerCoronaMesh) {
        const pulse1 = Math.sin(elapsed * 2.0) * 0.02;
        const pulse2 = Math.cos(elapsed * 1.5) * 0.03;
        coronaMesh.scale.set(1 + pulse1, 1 + pulse1, 1 + pulse1);
        outerCoronaMesh.scale.set(1 + pulse2, 1 + pulse2, 1 + pulse2);
        coronaMesh.material.opacity = 0.35 + Math.sin(elapsed * 1.0) * 0.05;
        outerCoronaMesh.material.opacity = 0.18 + Math.cos(elapsed * 0.8) * 0.04;
      }
    };
    const id = planetName + (isSun ? "-sun" : "-planet");
    globalPlanets.set(id, { el: element, scene, camera, updateFn });
`;
content = content.replace(animLoopRegex, newUpdateFn);

// 3. Modify cleanup
const cleanupRegex = /return \(\) => \{[\s\S]*?cancelAnimationFrame\(animId\);([\s\S]*?)window\.removeEventListener\("resize", handleResize\);([\s\S]*?)if \(renderer\) \{[\s\S]*?renderer\.dispose\(\);\s*\}\s*\};/;
const newCleanup = `return () => {
$1
      globalPlanets.delete(id);
$2
    };`;
content = content.replace(cleanupRegex, newCleanup);

// 4. Change canvas to div
content = content.replace(/return <canvas ref=\{mountRef\} className="w-full h-full cursor-grab active:cursor-grabbing relative z-10" \/>;/, 'return <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing relative z-10" style={{ touchAction: \'none\' }} />;');

// Inject the <SingleCanvasEngine> into SolarSystem
content = content.replace('<div className="min-h-screen bg-black text-white flex flex-col font-sans overflow-hidden relative">', '<div className="min-h-screen bg-black text-white flex flex-col font-sans overflow-hidden relative">\n      {!fatalGpuCrash && <SingleCanvasEngine isModalOpen={!!selectedPlanet} />}');

fs.writeFileSync(file, content);
console.log('Successfully refactored SolarSystem.jsx');
