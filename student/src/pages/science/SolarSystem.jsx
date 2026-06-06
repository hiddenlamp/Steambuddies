import React, { useState, useEffect, useRef } from "react";
import * as THREE from "three";
import {
  ArrowLeft, Satellite, Activity, X
} from "lucide-react";
import { useNavigate } from "react-router-dom";

// Procedural texture generator (Instant load fallback if network is slow)
function createPlanetTexture(name) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  
  if (name === "The Sun") {
    // Detailed swirly plasma texture for the Sun
    ctx.fillStyle = "#ff1a00";
    ctx.fillRect(0, 0, 512, 256);
    
    // Draw 300 plasma cells with warm gradients
    for (let i = 0; i < 300; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 256;
      const r = 8 + Math.random() * 22;
      const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0, "rgba(255, 240, 100, 0.95)");
      grad.addColorStop(0.3, "rgba(255, 140, 0, 0.55)");
      grad.addColorStop(1, "rgba(230, 0, 0, 0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Darker active sunspot zones
    ctx.fillStyle = "rgba(80, 0, 0, 0.65)";
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      ctx.arc(Math.random() * 512, Math.random() * 256, 3 + Math.random() * 6, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (name === "Mercury") {
    ctx.fillStyle = "#4b5563";
    ctx.fillRect(0, 0, 512, 256);
    ctx.fillStyle = "#374151";
    for (let i = 0; i < 30; i++) {
      ctx.beginPath();
      ctx.arc(Math.random() * 512, Math.random() * 256, 4 + Math.random() * 8, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (name === "Venus") {
    ctx.fillStyle = "#b45309";
    ctx.fillRect(0, 0, 512, 256);
    ctx.fillStyle = "rgba(251,191,36,0.15)";
    for (let i = 0; i < 8; i++) {
      ctx.fillRect(0, Math.random() * 256, 512, 10 + Math.random() * 20);
    }
  } else if (name === "Earth") {
    ctx.fillStyle = "#1d4ed8";
    ctx.fillRect(0, 0, 512, 256);
    ctx.fillStyle = "#15803d";
    ctx.beginPath();
    ctx.arc(150, 120, 50, 0, Math.PI * 2);
    ctx.arc(360, 100, 60, 0, Math.PI * 2);
    ctx.fill();
  } else if (name === "Mars") {
    ctx.fillStyle = "#b91c1c";
    ctx.fillRect(0, 0, 512, 256);
    ctx.fillStyle = "#7f1d1d";
    ctx.beginPath();
    ctx.ellipse(250, 120, 80, 20, 0.1, 0, Math.PI * 2);
    ctx.fill();
  } else if (name === "Jupiter") {
    for (let y = 0; y < 256; y += 4) {
      const colors = ["#d97706", "#f59e0b", "#78350f", "#451a03"];
      ctx.fillStyle = colors[Math.floor(y / 15) % colors.length];
      ctx.fillRect(0, y, 512, 4);
    }
  } else if (name === "Saturn") {
    ctx.fillStyle = "#ca8a04";
    ctx.fillRect(0, 0, 512, 256);
  } else if (name === "Uranus") {
    // Beautiful pale cyan Uranus bands
    ctx.fillStyle = "#38bdf8"; // Light sky blue base
    ctx.fillRect(0, 0, 512, 256);
    
    // Smooth atmospheric streaks
    for (let y = 0; y < 256; y += 2) {
      const opacity = 0.06 + 0.14 * Math.sin(y * 0.18);
      ctx.fillStyle = `rgba(224, 242, 254, ${opacity})`;
      ctx.fillRect(0, y, 512, 2);
    }
    
    // Polar shading
    const polarGrad = ctx.createLinearGradient(0, 0, 0, 256);
    polarGrad.addColorStop(0, "rgba(7, 89, 133, 0.4)"); // North pole dark shading
    polarGrad.addColorStop(0.35, "rgba(255, 255, 255, 0)");
    polarGrad.addColorStop(0.65, "rgba(255, 255, 255, 0)");
    polarGrad.addColorStop(1, "rgba(7, 89, 133, 0.4)"); // South pole dark shading
    ctx.fillStyle = polarGrad;
    ctx.fillRect(0, 0, 512, 256);
  } else if (name === "Neptune") {
    ctx.fillStyle = "#1d4ed8";
    ctx.fillRect(0, 0, 512, 256);
  } else if (name === "Pluto") {
    ctx.fillStyle = "#78350f";
    ctx.fillRect(0, 0, 512, 256);
    ctx.fillStyle = "#fed7aa";
    ctx.beginPath();
    ctx.arc(256, 128, 20, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = "#4b5563";
    ctx.fillRect(0, 0, 512, 256);
  }

  return new THREE.CanvasTexture(canvas);
}


// ---------------------------------------------------------------------------
// GLOBAL SCISSOR ENGINE (Single WebGL Context to prevent crashes)
// ---------------------------------------------------------------------------
const globalPlanets = new Map();

const SingleCanvasEngine = ({ isModalOpen }) => {
    const containerRef = useRef(null);
    const modalOpenRef = useRef(isModalOpen);

    useEffect(() => {
        modalOpenRef.current = isModalOpen;
    }, [isModalOpen]);

    useEffect(() => {
        if (!containerRef.current) return;
        
        const canvas = document.createElement('canvas');
        canvas.style.display = 'block';
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
            
            renderer.setScissorTest(false);
            renderer.clear();
            renderer.setScissorTest(true);

            if (modalOpenRef.current) return; // Pause rendering if modal is open

            const height = canvas.clientHeight;
            const width = canvas.clientWidth;

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
            if (renderer) {
                const ext = renderer.getContext().getExtension('WEBGL_lose_context');
                if (ext) ext.loseContext();
                renderer.dispose();
            }
            if (containerRef.current && canvas.parentNode) {
                containerRef.current.removeChild(canvas);
            }
        };
    }, []); // Empty dependency array ensures context is only created once!

    return (
        <div ref={containerRef} className="fixed inset-0 w-full h-full pointer-events-none" style={{ zIndex: 30 }} />
    );
};

// 3D textured planet component (Large detailed view inside Modal)
function ThreePlanet({ planetName, isSun = false, theme }) {
  const mountRef = useRef(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    mountRef.current.appendChild(canvas);

    const width = mountRef.current.clientWidth || 320;
    const height = mountRef.current.clientHeight || 320;

    const scene = new THREE.Scene();
    
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 0, planetName === "Saturn" ? 4.4 : 4.0);

    let renderer;
    try {
        renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            alpha: true,
            antialias: true
        });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        renderer.setClearColor(0x000000, 0);
        
        canvas.addEventListener('webglcontextlost', (e) => {
            e.preventDefault();
            if (window.handleFatalGpuCrash) window.handleFatalGpuCrash();
        }, false);
    } catch (e) {
        console.error("WebGL limit reached for planet", planetName);
        if (window.handleFatalGpuCrash) window.handleFatalGpuCrash();
        return;
    }

    const tiltGroup = new THREE.Group();
    scene.add(tiltGroup);

    const dragGroup = new THREE.Group();
    tiltGroup.add(dragGroup);

    const sphereGeom = new THREE.SphereGeometry(1.15, 64, 64);
    const fallbackTexture = createPlanetTexture(planetName);
    
    let sphereMat = new THREE.MeshStandardMaterial({
      map: fallbackTexture,
      roughness: 0.6,
      metalness: 0.1,
    });
    
    const planetMesh = new THREE.Mesh(sphereGeom, sphereMat);
    dragGroup.add(planetMesh);

    let loadedTexture = null;
    const loader = new THREE.TextureLoader();
    const textureMap = {
      "The Sun": "/textures/planets/2k_sun.jpg",
      "Mercury": "/textures/planets/2k_mercury.jpg",
      "Venus": "/textures/planets/2k_venus_surface.jpg",
      "Earth": "/textures/planets/2k_earth_daymap.jpg",
      "Mars": "/textures/planets/2k_mars.jpg",
      "Jupiter": "/textures/planets/2k_jupiter.jpg",
      "Saturn": "/textures/planets/2k_saturn.jpg",
      "Uranus": "/textures/planets/2k_uranus.jpg",
      "Neptune": "/textures/planets/2k_neptune.jpg",
      "Pluto": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Pluto_Color_Map.jpg/1024px-Pluto_Color_Map.jpg"
    };

    if (textureMap[planetName]) {
      loader.load(textureMap[planetName], (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        loadedTexture = tex;
        planetMesh.material.map = tex;
        planetMesh.material.needsUpdate = true;
      });
    }

    let ringsMesh = null;
    if (planetName === "Saturn" || planetName === "Uranus") {
      const isSaturn = planetName === "Saturn";
      const inner = isSaturn ? 1.4 : 1.8;
      const outer = isSaturn ? 2.8 : 2.0;
      const ringGeom = new THREE.RingGeometry(inner, outer, 64);
      const pos = ringGeom.attributes.position;
      const uvs = ringGeom.attributes.uv;
      for (let i = 0; i < pos.count; i++) {
        const v = new THREE.Vector3().fromBufferAttribute(pos, i);
        uvs.setXY(i, v.length() < (inner + outer) / 2 ? 0 : 1, 1);
      }
      
      const ringMat = new THREE.MeshBasicMaterial({
        color: isSaturn ? 0xeaddcf : 0xa5f3fc,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: isSaturn ? 0.8 : 0.3,
        wireframe: !isSaturn
      });
      
      ringsMesh = new THREE.Mesh(ringGeom, ringMat);
      ringsMesh.rotation.x = Math.PI / 2;
      dragGroup.add(ringsMesh);

      tiltGroup.rotation.z = isSaturn ? 0.46 : Math.PI / 2;
    }

    let coronaMesh = null;
    let outerCoronaMesh = null;
    if (isSun) {
      const coronaGeom = new THREE.SphereGeometry(1.25, 32, 32);
      const coronaMat = new THREE.MeshBasicMaterial({
        color: 0xff4400,
        transparent: true,
        opacity: 0.3,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending
      });
      coronaMesh = new THREE.Mesh(coronaGeom, coronaMat);
      dragGroup.add(coronaMesh);

      const outerGeom = new THREE.SphereGeometry(1.4, 32, 32);
      const outerMat = new THREE.MeshBasicMaterial({
        color: 0xffaa00,
        transparent: true,
        opacity: 0.15,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending
      });
      outerCoronaMesh = new THREE.Mesh(outerGeom, outerMat);
      dragGroup.add(outerCoronaMesh);
    }

    const ambientLight = new THREE.AmbientLight(0xffffff, isSun ? 1.0 : 0.4);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 1.5);
    sunLight.position.set(5, 3, 5);
    scene.add(sunLight);

    let rotX = 0;
    let rotY = 0;
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;

    const onMouseDown = (e) => {
      isDragging = true;
      prevMouseX = e.touches && e.touches.length > 0 ? e.touches[0].clientX : e.clientX;
      prevMouseY = e.touches && e.touches.length > 0 ? e.touches[0].clientY : e.clientY;
    };

    const onMouseMove = (e) => {
      if (!isDragging) return;
      const clientX = e.touches && e.touches.length > 0 ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches && e.touches.length > 0 ? e.touches[0].clientY : e.clientY;
      const dX = clientX - prevMouseX;
      const dY = clientY - prevMouseY;
      rotY += dX * 0.007;
      rotX += dY * 0.007;
      prevMouseX = clientX;
      prevMouseY = clientY;
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const element = mountRef.current;
    element.addEventListener("mousedown", onMouseDown);
    element.addEventListener("touchstart", onMouseDown, { passive: true });
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("touchmove", onMouseMove, { passive: true });
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("touchend", onMouseUp);

    let animId;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
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

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animId);
      element.removeEventListener("mousedown", onMouseDown);
      element.removeEventListener("touchstart", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("touchmove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("touchend", onMouseUp);
      window.removeEventListener("resize", handleResize);

      sphereGeom.dispose();
      sphereMat.dispose();
      if (fallbackTexture) fallbackTexture.dispose();
      if (loadedTexture) loadedTexture.dispose();
      if (ringsMesh) {
        ringsMesh.geometry.dispose();
        if (Array.isArray(ringsMesh.material)) {
          ringsMesh.material.forEach(m => m.dispose());
        } else {
          ringsMesh.material.dispose();
        }
      }
      if (renderer) {
        const extension = renderer.getContext().getExtension('WEBGL_lose_context');
        if (extension) extension.loseContext();
        renderer.dispose();
      }
      if (mountRef.current && canvas.parentNode) {
          mountRef.current.removeChild(canvas);
      }
    };
  }, [planetName, isSun, theme]);

  return <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing relative z-10" />;
}

// 3D textured planet component for the main grid (Small interactive preview)
function GridPlanet3D({ planetName, isSun = false, theme }) {
  const mountRef = useRef(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth || 220;
    const height = mountRef.current.clientHeight || 220;

    const scene = new THREE.Scene();
    
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 0, planetName === "Saturn" ? 4.4 : 4.0);

    // Group hierarchy: scene -> tiltGroup -> dragGroup -> meshes
    const tiltGroup = new THREE.Group();
    scene.add(tiltGroup);

    const dragGroup = new THREE.Group();
    tiltGroup.add(dragGroup);

    // Moderated geometry segment counts for grid rendering efficiency
    const sphereGeom = new THREE.SphereGeometry(1.15, 32, 32);
    const fallbackTexture = createPlanetTexture(planetName);
    
    let sphereMat = new THREE.MeshStandardMaterial({
      map: fallbackTexture,
      roughness: 0.85,
      metalness: 0.15
    });

    if (isSun) {
      sphereMat = new THREE.MeshBasicMaterial({
        map: fallbackTexture
      });
    }

    const planetMesh = new THREE.Mesh(sphereGeom, sphereMat);
    dragGroup.add(planetMesh);

    // Apply scientific axial tilts and camera perspective tilts matching reference image
    if (planetName === "Uranus") {
      tiltGroup.rotation.x = Math.PI / 7;
      tiltGroup.rotation.z = Math.PI / 2.25; // Render vertical rings
      tiltGroup.rotation.y = Math.PI / 8;
    } else if (planetName === "Saturn") {
      tiltGroup.rotation.x = Math.PI / 5; // Look slightly from above
      tiltGroup.rotation.z = -Math.PI / 7; // Tilt sideways (bottom-left to top-right)
    } else {
      tiltGroup.rotation.x = Math.PI / 10;
      if (planetName === "Earth") {
        tiltGroup.rotation.z = 23.4 * (Math.PI / 180);
      } else if (planetName === "Mars") {
        tiltGroup.rotation.z = 25.2 * (Math.PI / 180);
      } else if (planetName === "Neptune") {
        tiltGroup.rotation.z = 28.3 * (Math.PI / 180);
      }
    }

    // Tilted ring configurations (added to dragGroup so they rotate with user drag!)
    let ringsMesh;
    if (planetName === "Saturn") {
      // Wide striped rings with Cassini Division
      const ringGeom = new THREE.RingGeometry(1.4, 2.5, 64);
      const ringCanvas = document.createElement("canvas");
      ringCanvas.width = 16;
      ringCanvas.height = 256; // Vary along the Y-axis (V coordinate)
      const rCtx = ringCanvas.getContext("2d");
      rCtx.clearRect(0, 0, 16, 256);
      
      const ringGrad = rCtx.createLinearGradient(0, 0, 0, 256); // Linear gradient along the Y-axis (radial V direction!)
      ringGrad.addColorStop(0.0, "rgba(40, 35, 30, 0.0)"); // Near planet (transparent gap)
      ringGrad.addColorStop(0.05, "rgba(100, 90, 80, 0.1)");
      ringGrad.addColorStop(0.15, "rgba(165, 150, 130, 0.65)"); // C Ring
      ringGrad.addColorStop(0.35, "rgba(180, 165, 140, 0.85)"); // B Ring
      ringGrad.addColorStop(0.55, "rgba(225, 210, 190, 0.95)"); // B Ring bright part
      ringGrad.addColorStop(0.62, "rgba(20, 18, 15, 0.05)"); // Cassini Division Gap
      ringGrad.addColorStop(0.66, "rgba(20, 18, 15, 0.05)");
      ringGrad.addColorStop(0.70, "rgba(175, 160, 140, 0.88)"); // A Ring
      ringGrad.addColorStop(0.90, "rgba(145, 130, 110, 0.75)");
      ringGrad.addColorStop(0.95, "rgba(80, 75, 70, 0.1)"); // F Ring gap
      ringGrad.addColorStop(1.0, "rgba(0, 0, 0, 0)"); // Fade out
      
      rCtx.fillStyle = ringGrad;
      rCtx.fillRect(0, 0, 16, 256);

      const ringTexture = new THREE.CanvasTexture(ringCanvas);
      ringTexture.needsUpdate = true;
      const ringMat = new THREE.MeshBasicMaterial({
        map: ringTexture,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.9
      });
      
      ringsMesh = new THREE.Mesh(ringGeom, ringMat);
      ringsMesh.rotation.x = Math.PI / 2; // Lie flat along equator of planetGroup
      dragGroup.add(ringsMesh);
    } else if (planetName === "Uranus") {
      // Extremely thin vertical ring (solid sky-blue color, no texture to prevent radial spoke artifacts)
      const ringGeom = new THREE.RingGeometry(1.48, 1.52, 64);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xbae6fd, // Sky-blue/white bright loop
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.6
      });
      ringsMesh = new THREE.Mesh(ringGeom, ringMat);
      ringsMesh.rotation.x = Math.PI / 2; // Lie flat along equator of planetGroup
      dragGroup.add(ringsMesh);
    }

    // Glowing Corona Shells for the Sun
    let coronaMesh;
    let outerCoronaMesh;
    if (isSun) {
      const coronaGeom = new THREE.SphereGeometry(1.18, 32, 32);
      const coronaMat = new THREE.MeshBasicMaterial({
        color: 0xffaa44,
        transparent: true,
        opacity: 0.4,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide
      });
      coronaMesh = new THREE.Mesh(coronaGeom, coronaMat);
      scene.add(coronaMesh);

      const outerCoronaGeom = new THREE.SphereGeometry(1.26, 32, 32);
      const outerCoronaMat = new THREE.MeshBasicMaterial({
        color: 0xff3300,
        transparent: true,
        opacity: 0.2,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide
      });
      outerCoronaMesh = new THREE.Mesh(outerCoronaGeom, outerCoronaMat);
      scene.add(outerCoronaMesh);
    }

    const textureUrls = {
      "The Sun": "/textures/planets/2k_sun.jpg",
      "Mercury": "/textures/planets/2k_mercury.jpg",
      "Venus": "/textures/planets/2k_venus_surface.jpg",
      "Earth": "/textures/planets/2k_earth_daymap.jpg",
      "Mars": "/textures/planets/2k_mars.jpg",
      "Jupiter": "/textures/planets/2k_jupiter.jpg",
      "Saturn": "/textures/planets/2k_saturn.jpg",
      "Uranus": "/textures/planets/2k_uranus.jpg",
      "Neptune": "/textures/planets/2k_neptune.jpg",
      "Pluto": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Pluto_Color_Map.jpg/1024px-Pluto_Color_Map.jpg"
    };

    let loadedTexture = null;
    const mapUrl = textureUrls[planetName];
    if (mapUrl) {
      const loader = new THREE.TextureLoader();
      loader.setCrossOrigin("anonymous");
      loader.load(
        mapUrl,
        (loadedTex) => {
          loadedTex.colorSpace = THREE.SRGBColorSpace;
          sphereMat.map = loadedTex;
          sphereMat.needsUpdate = true;
          loadedTexture = loadedTex;
        },
        undefined,
        (err) => console.warn(`Fallback texture active for grid card: ${planetName}`)
      );
    }

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, isSun ? 1.0 : 0.4);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 1.5);
    sunLight.position.set(5, 3, 5);
    scene.add(sunLight);

    // Interactive Drag controls
    let rotX = 0;
    let rotY = 0;
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;

    const onMouseDown = (e) => {
      isDragging = true;
      prevMouseX = e.touches && e.touches.length > 0 ? e.touches[0].clientX : e.clientX;
      prevMouseY = e.touches && e.touches.length > 0 ? e.touches[0].clientY : e.clientY;
    };

    const onMouseMove = (e) => {
      if (!isDragging) return;
      const clientX = e.touches && e.touches.length > 0 ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches && e.touches.length > 0 ? e.touches[0].clientY : e.clientY;
      const dX = clientX - prevMouseX;
      const dY = clientY - prevMouseY;
      rotY += dX * 0.007;
      rotX += dY * 0.007;
      prevMouseX = clientX;
      prevMouseY = clientY;
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const element = mountRef.current;
    element.addEventListener("mousedown", onMouseDown);
    element.addEventListener("touchstart", onMouseDown, { passive: true });
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("touchmove", onMouseMove, { passive: true });
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("touchend", onMouseUp);

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

    return () => {
      element.removeEventListener("mousedown", onMouseDown);
      element.removeEventListener("touchstart", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("touchmove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("touchend", onMouseUp);

      globalPlanets.delete(id);

      // Clean up WebGL resources
      sphereGeom.dispose();
      sphereMat.dispose();
      if (fallbackTexture) fallbackTexture.dispose();
      if (loadedTexture) loadedTexture.dispose();
      if (ringsMesh) {
        ringsMesh.geometry.dispose();
        if (Array.isArray(ringsMesh.material)) {
          ringsMesh.material.forEach(m => m.dispose());
        } else {
          ringsMesh.material.dispose();
        }
      }
    };
  }, [planetName, isSun, theme]);

  return <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing relative z-10" style={{ touchAction: 'none' }} />;
}

export default function SolarSystem() {
  const navigate = useNavigate();
  const [selectedPlanet, setSelectedPlanet] = useState(null);
  const [arActive, setArActive] = useState(false);
  const [fatalGpuCrash, setFatalGpuCrash] = useState(false);

  const [activeTab, setActiveTab] = useState("telemetry");

  const dragStartRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    setArActive(false);
    setActiveTab("telemetry");
  }, [selectedPlanet]);

  const cn = (...s) => s.filter(Boolean).join(" ");

  const handleMouseDown = (e) => {
    dragStartRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = (e, planet) => {
    const diffX = Math.abs(e.clientX - dragStartRef.current.x);
    const diffY = Math.abs(e.clientY - dragStartRef.current.y);
    // If movement is very small, register it as a click and open detailed modal
    if (diffX < 6 && diffY < 6) {
      setSelectedPlanet(planet);
    }
  };

  const planets = [
    {
      name: "The Sun",
      tag: "Yellow Dwarf Star",
      spacecraft: "Parker Solar Probe",
      spacecraftYear: "2018-Present",
      distance: "0 KM",
      distanceAu: "0 AU",
      temp: "5,500 °C",
      velocity: "220 km/s",
      pressure: "3.4 × 10¹¹ bar",
      gravity: "274 m/s²",
      moons: "0",
      orbit: "N/A (Center of System)",
      rotation: "25-35 Earth Days",
      composition: "74% Hydrogen, 24% Helium, 1% Oxygen",
      color: "radial-gradient(circle at center, #ffaa00 0%, #ff5500 50%, #cc0000 100%)",
      size: "w-64 h-64",
      accent: "text-amber-400",
      glow: "shadow-[0_0_100px_rgba(255,165,0,0.6)]",
      desc: "The heart of our solar system, providing gravity, light, and energy that sustains all life across the orbits."
    },
    {
      name: "Mercury",
      tag: "The Iron Planet",
      spacecraft: "Messenger",
      spacecraftYear: "2011-2015",
      distance: "57.9M KM",
      distanceAu: "0.39 AU",
      temp: "167 °C",
      velocity: "47.4 km/s",
      pressure: "Trace (Exosphere)",
      gravity: "3.7 m/s²",
      moons: "0",
      orbit: "88 Earth Days",
      rotation: "59 Earth Days",
      composition: "70% Metallic Iron, 30% Silicate rock",
      color: "radial-gradient(circle at 30% 30%, #94a3b8, #475569 40%, #0f172a 90%)",
      size: "w-24 h-24",
      accent: "text-slate-400",
      desc: "The smallest planet in our solar system and the closest to the Sun, moving at speeds of 47 km/s."
    },
    {
      name: "Venus",
      tag: "Earth's Acid Twin",
      spacecraft: "Magellan",
      spacecraftYear: "1990-1992",
      distance: "108.2M KM",
      distanceAu: "0.72 AU",
      temp: "464 °C",
      velocity: "35.0 km/s",
      pressure: "92 bar",
      gravity: "8.87 m/s²",
      moons: "0",
      orbit: "224.7 Earth Days",
      rotation: "243 Earth Days (Retrograde)",
      composition: "96.5% Carbon Dioxide, 3.5% Nitrogen",
      color: "radial-gradient(circle at 30% 30%, #fde047, #ca8a04 50%, #713f12 100%)",
      size: "w-32 h-32",
      accent: "text-yellow-500",
      desc: "Spinning slowly in the opposite direction from most planets, under a crushing carbon dioxide atmosphere."
    },
    {
      name: "Earth",
      tag: "The Blue Cradle",
      spacecraft: "S-NPP VIIRS",
      spacecraftYear: "2015",
      distance: "149.6M KM",
      distanceAu: "1.00 AU",
      temp: "15 °C",
      velocity: "29.8 km/s",
      pressure: "1.01 bar",
      gravity: "9.81 m/s²",
      moons: "1 (The Moon)",
      orbit: "365.25 Days",
      rotation: "24 Hours",
      composition: "78% Nitrogen, 21% Oxygen, 1% Argon",
      color: "radial-gradient(circle at 30% 30%, #60a5fa, #2563eb 30%, #1d4ed8 70%, #090d16 100%)",
      size: "w-40 h-40",
      accent: "text-blue-500",
      glow: "shadow-[0_0_50px_rgba(37,99,235,0.4)]",
      desc: "Our home planet and the only world in the solar system currently known to harbor life."
    },
    {
      name: "Mars",
      tag: "The Rust Frontier",
      spacecraft: "Mars Mosaiced Image Model",
      spacecraftYear: "2014",
      distance: "227.9M KM",
      distanceAu: "1.52 AU",
      temp: "-65 °C",
      velocity: "24.1 km/s",
      pressure: "0.006 bar",
      gravity: "3.71 m/s²",
      moons: "2 (Phobos, Deimos)",
      orbit: "687 Earth Days",
      rotation: "24.6 Hours",
      composition: "95% Carbon Dioxide, 2.6% Nitrogen, 1.9% Argon",
      color: "radial-gradient(circle at 30% 30%, #fca5a5, #ea580c 50%, #431407 100%)",
      size: "w-28 h-28",
      accent: "text-orange-500",
      desc: "A dusty, cold, desert world with a very thin atmosphere containing signs of ancient liquid water flow."
    },
    {
      name: "Jupiter",
      tag: "Gas Titan King",
      spacecraft: "Hubble Space Telescope",
      spacecraftYear: "2015",
      distance: "778.5M KM",
      distanceAu: "5.20 AU",
      temp: "-110 °C",
      velocity: "13.1 km/s",
      pressure: "Infinite (Gas Core)",
      gravity: "24.79 m/s²",
      moons: "95 (Io, Europa, Ganymede...)",
      orbit: "11.86 Earth Years",
      rotation: "9.9 Hours",
      composition: "90% Hydrogen, 10% Helium",
      color: "linear-gradient(180deg, #d97706, #fbbf24, #d97706, #b45309)",
      size: "w-52 h-52",
      accent: "text-amber-500",
      desc: "Twice as massive as all other planets combined, Jupiter holds a giant red storm larger than Earth."
    },
    {
      name: "Saturn",
      tag: "Jewel of Solaris",
      spacecraft: "Cassini-Huygen",
      spacecraftYear: "2000 (planet) / 2007 (rings)",
      distance: "1.4B KM",
      distanceAu: "9.58 AU",
      temp: "-140 °C",
      velocity: "9.7 km/s",
      pressure: "Infinite (Gas Core)",
      gravity: "10.44 m/s²",
      moons: "146 (Titan, Enceladus...)",
      orbit: "29.45 Earth Years",
      rotation: "10.7 Hours",
      composition: "96% Hydrogen, 3% Helium, 1% trace gases",
      color: "radial-gradient(circle at 30% 30%, #fef08a, #d97706 60%, #451a03 100%)",
      size: "w-48 h-48",
      accent: "text-yellow-600",
      hasRings: true,
      desc: "Adorned with a complex, stunning system of icy rings spanning thousands of kilometers across."
    },
    {
      name: "Uranus",
      tag: "The Emerald Ice Giant",
      spacecraft: "Keck Observatory",
      spacecraftYear: "2011-2012",
      distance: "2.87B KM",
      distanceAu: "19.2 AU",
      temp: "-195 °C",
      velocity: "6.8 km/s",
      pressure: "1.3 bar",
      gravity: "8.69 m/s²",
      moons: "28 (Titania, Oberon...)",
      orbit: "84 Earth Years",
      rotation: "17.2 Hours (Retrograde)",
      composition: "83% Hydrogen, 15% Helium, 2% Methane",
      color: "radial-gradient(circle at 30% 30%, #bae6fd, #0ea5e9 50%, #0369a1 100%)",
      size: "w-38 h-38",
      accent: "text-sky-300",
      desc: "An ice giant rotating on a unique 98-degree tilt, rolling sideways around the Sun."
    },
    {
      name: "Neptune",
      tag: "The Storm Manifold",
      spacecraft: "Voyager",
      spacecraftYear: "1989",
      distance: "4.5B KM",
      distanceAu: "30.1 AU",
      temp: "-200 °C",
      velocity: "5.4 km/s",
      pressure: "1.5 bar",
      gravity: "11.15 m/s²",
      moons: "16 (Triton, Nereid...)",
      orbit: "164.8 Earth Years",
      rotation: "16.1 Hours",
      composition: "80% Hydrogen, 19% Helium, 1% Methane",
      color: "radial-gradient(circle at 30% 30%, #93c5fd, #2563eb 50%, #172554 100%)",
      size: "w-36 h-36",
      accent: "text-blue-400",
      desc: "The most distant planet in our system, experiencing supersonic winds up to 2,100 km/h."
    },
    {
      name: "Pluto",
      tag: "The Dwarf Frontier",
      spacecraft: "New Horizons",
      spacecraftYear: "2015",
      distance: "5.9B KM",
      distanceAu: "39.5 AU",
      temp: "-225 °C",
      velocity: "4.7 km/s",
      pressure: "10 microbar",
      gravity: "0.62 m/s²",
      moons: "5 (Charon, Styx...)",
      orbit: "248 Earth Years",
      rotation: "6.4 Earth Days",
      composition: "70% Rock, 30% Water Ice & Nitrogen Ice",
      color: "radial-gradient(circle at 30% 30%, #fed7aa, #7c2d12 50%, #220700 100%)",
      size: "w-22 h-22",
      accent: "text-orange-700",
      desc: "Famous for its massive heart-shaped nitrogen ice glacier (Sputnik Planitia), Pluto is the largest dwarf planet in the Kuiper Belt."
    }
  ];

  const sunData = planets.find(p => p.name === "The Sun");
  const planetList = planets.filter(p => p.name !== "The Sun");

  // Crash screen removed as SingleCanvasEngine prevents context limit crashes.

  return (
    <div className="relative min-h-screen flex flex-col bg-[#000000] text-slate-300 font-sans selection:bg-cyan-500/30 overflow-hidden pb-10">
      <SingleCanvasEngine isModalOpen={selectedPlanet !== null} />
      
      {/* Background stars */}
      <div className="fixed inset-0 z-[30] pointer-events-none">
        
        {/* Shooting Stars */}
        <div className="absolute inset-0 overflow-hidden">
            {[...Array(5)].map((_, i) => (
                <div key={i} className={`meteor meteor-${i+1}`} />
            ))}
        </div>

        {/* Floating Satellites */}
        <Satellite className="absolute top-20 left-10 text-cyan-400/10 w-8 h-8 animate-float-slow" />
        <Satellite className="absolute bottom-40 right-20 text-white/5 w-12 h-12 animate-float-fast" />

        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"></div>
        
        {/* Distant Stars */}
        {[...Array(120)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white animate-pulse"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              width: `${Math.random() * 2.5}px`,
              height: `${Math.random() * 2.5}px`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          />
        ))}

        <div className="absolute top-[-20%] left-[-10%] w-[80%] h-[80%] bg-blue-900/5 blur-[140px] rounded-full"></div>
      </div>

      {/* UI Layer */}
      <div className="relative z-10 px-4 md:px-10 py-6 flex-1 overflow-y-auto pb-24 md:pb-6">
        
        <nav className="flex justify-between items-center max-w-7xl mx-auto backdrop-blur-md bg-white/5 p-4 rounded-3xl border border-white/10 shadow-lg">
          <button onClick={() => navigate("/home")} className="flex items-center gap-3 px-5 py-2 rounded-2xl hover:bg-white/10 transition group">
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition" />
            <span className="uppercase tracking-[0.2em] text-xs font-bold">Exit Terminal</span>
          </button>
          <div className="flex items-center gap-6">
            <div className="hidden md:block text-right text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                <p className="text-cyan-400">Solaris Orbital Network</p>
                <p>Telemetry: ACTIVE</p>
            </div>
            <Activity className="w-6 h-6 text-cyan-400 animate-pulse" />
          </div>
        </nav>

        <header className="mt-20 text-center max-w-5xl mx-auto">
          <h1 className="text-7xl md:text-[8rem] font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-slate-800 leading-none drop-shadow-2xl">
            SOLARIS
          </h1>
          <p className="text-cyan-400 uppercase tracking-[0.6em] text-xs md:text-sm font-light mt-4">Interactive 3D Orbital Mechanics</p>
        </header>

        {/* Central Sun/Star Segment */}
        {sunData && (
          <section className="mt-24 max-w-7xl mx-auto">
            <h2 className="text-xl font-bold uppercase tracking-[0.3em] text-amber-500 mb-6 border-l-4 border-amber-500 pl-4 animate-pulse">
              Center Star
            </h2>
            <div 
              onMouseDown={handleMouseDown}
              onMouseUp={(e) => handleMouseUp(e, sunData)}
              className="group relative flex flex-col lg:flex-row items-center justify-between p-8 md:p-12 rounded-[2.5rem] bg-[#020202] border border-amber-500/10 hover:border-amber-500/30 transition-all duration-500 cursor-pointer overflow-hidden shadow-2xl"
            >
              <div className="flex flex-col z-20 pointer-events-none lg:max-w-md">
                <span className="text-[10px] font-mono tracking-[0.4em] uppercase text-amber-500">
                  {sunData.tag}
                </span>
                <h2 className="text-5xl md:text-6xl font-black text-white mt-2 group-hover:text-amber-400 transition-colors">
                  {sunData.name}
                </h2>
                <div className="mt-4 space-y-1">
                  <p className="text-xs font-mono text-slate-400">
                    Telemetry Source: <span className="text-slate-300 font-bold">{sunData.spacecraft}</span>
                  </p>
                  <p className="text-[10px] font-mono text-slate-500">
                    Mission Duration: {sunData.spacecraftYear}
                  </p>
                </div>
                <p className="mt-6 text-slate-400 text-sm leading-relaxed">
                  {sunData.desc}
                </p>
                <div className="mt-8 grid grid-cols-2 gap-4 border-t border-white/5 pt-6">
                  <div className="text-xs font-mono">
                    <span className="text-slate-500 block uppercase tracking-wide">Surface Temp</span> 
                    <span className="text-amber-400 font-bold text-base">{sunData.temp}</span>
                  </div>
                  <div className="text-xs font-mono">
                    <span className="text-slate-500 block uppercase tracking-wide">Solar Gravity</span> 
                    <span className="text-white font-bold text-base">{sunData.gravity}</span>
                  </div>
                </div>
              </div>

              <div className="w-full lg:w-[350px] h-[300px] flex items-center justify-center relative mt-8 lg:mt-0">
                <div className="absolute inset-0 rounded-full blur-[80px] opacity-15 bg-amber-500"></div>
                <GridPlanet3D planetName={sunData.name} isSun={true} theme="dark" />
              </div>
            </div>
          </section>
        )}

        {/* Planets Grid matching the reference image layout */}
        <section className="mt-20 max-w-7xl mx-auto">
          <h2 className="text-xl font-bold uppercase tracking-[0.3em] text-cyan-400 mb-8 border-l-4 border-cyan-400 pl-4 animate-pulse">
            Planetary System
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {planetList.map((planet, index) => (
              <div 
                key={index}
                onMouseDown={handleMouseDown}
                onMouseUp={(e) => handleMouseUp(e, planet)}
                className="group relative flex flex-col p-6 rounded-[2rem] bg-black border border-white/5 hover:border-cyan-500/20 transition-all duration-500 cursor-pointer overflow-hidden shadow-2xl h-[340px]"
              >
                {/* Telemetry labels absolute positioned in top-left */}
                <div className="absolute top-6 left-6 z-20 pointer-events-none flex flex-col">
                  <h3 className="text-3xl font-black text-white group-hover:text-cyan-400 transition-colors leading-none">
                    {planet.name}
                  </h3>
                  <span className="text-[10px] font-mono text-slate-400 mt-2 uppercase tracking-wide">
                    {planet.spacecraft}
                  </span>
                  <span className="text-[9px] font-mono text-slate-500 tracking-wider">
                    {planet.spacecraftYear}
                  </span>
                </div>

                {/* Interactive 3D Planet Preview */}
                <div className="w-full h-full flex items-center justify-center relative mt-6">
                  <div className="absolute inset-0 rounded-full blur-[60px] opacity-0 group-hover:opacity-10 transition-opacity duration-700 bg-cyan-500"></div>
                  <GridPlanet3D planetName={planet.name} isSun={false} theme="dark" />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 3D TEXTURED DIALOG MODAL */}
        {selectedPlanet && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-2xl bg-black/85 overflow-y-auto">
                <div className="relative w-full max-w-5xl bg-[#070b12]/90 border border-white/10 rounded-[3rem] overflow-hidden animate-in zoom-in duration-300 shadow-[0_0_100px_rgba(6,182,212,0.15)] my-8">
                    
                    {/* Close button */}
                    <button onClick={() => setSelectedPlanet(null)} className="absolute top-6 right-6 md:top-8 md:right-8 p-4 bg-white/5 hover:bg-white/10 rounded-full text-white z-50 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-12">
                        
                        {/* LEFT: 3D Visualizer */}
                        <div className="lg:col-span-6 p-8 md:p-12 flex flex-col items-center justify-center bg-black/50 relative border-b lg:border-b-0 lg:border-r border-white/10 min-h-[380px] lg:min-h-0">
                             
                             {/* HUD Decorations */}
                             <div className="absolute top-6 left-6 w-10 h-10 border-t-2 border-l-2 border-cyan-500/40"></div>
                             <div className="absolute top-6 right-6 w-10 h-10 border-t-2 border-r-2 border-cyan-500/40"></div>
                             <div className="absolute bottom-6 left-6 w-10 h-10 border-b-2 border-l-2 border-cyan-500/40"></div>
                             <div className="absolute bottom-6 right-6 w-10 h-10 border-b-2 border-r-2 border-cyan-500/40"></div>

                             {/* AR Projector Toggle */}
                             <div className="absolute top-8 left-8 z-50 flex gap-2">
                               <button 
                                 onClick={() => setArActive(false)}
                                 className={cn("px-3 py-1.5 rounded-lg text-[10px] font-mono uppercase transition-all", !arActive ? "bg-cyan-500 text-black font-bold" : "bg-white/5 text-slate-400 hover:bg-white/10")}
                               >
                                 3D Hologram
                               </button>
                               <button 
                                 onClick={() => setArActive(true)}
                                 className={cn("px-3 py-1.5 rounded-lg text-[10px] font-mono uppercase transition-all", arActive ? "bg-cyan-500 text-black font-bold" : "bg-white/5 text-slate-400 hover:bg-white/10")}
                               >
                                 AR Projector
                               </button>
                             </div>

                             {!arActive ? (
                               <div className="w-full flex flex-col items-center space-y-4">
                                 <ThreePlanet 
                                   planetName={selectedPlanet.name} 
                                   isSun={selectedPlanet.name === "The Sun"} 
                                   theme="dark" 
                                 />
                                 <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                                    360° Drag rotation | Scroll to zoom
                                 </div>
                               </div>
                             ) : (
                               <div className="w-full h-72 md:h-96 relative flex items-center justify-center rounded-3xl overflow-hidden border border-cyan-500/20 bg-cyan-950/10">
                                 <model-viewer
                                   src="https://modelviewer.dev/shared-assets/models/Astronaut.glb"
                                   ar
                                   ar-modes="webxr scene-viewer quick-look"
                                   camera-controls
                                   auto-rotate
                                   shadow-intensity="1"
                                   style={{ width: "100%", height: "100%" }}
                                 >
                                   <button slot="ar-button" className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-cyan-500 hover:bg-cyan-600 text-black text-xs font-bold py-2.5 px-6 rounded-full shadow-lg border-none pointer-events-auto transition">
                                     👋 Place Planet Orb in AR
                                   </button>
                                 </model-viewer>
                               </div>
                             )}
                        </div>

                        {/* RIGHT: Stats and Tabs */}
                        <div className="lg:col-span-6 p-8 md:p-12 flex flex-col justify-between">
                            <div>
                                <span className={`text-[10px] font-mono tracking-widest uppercase ${selectedPlanet.accent}`}>{selectedPlanet.tag}</span>
                                <h2 className="text-4xl md:text-5xl font-black text-white mt-1 leading-none">{selectedPlanet.name}</h2>
                                <p className="mt-6 text-slate-400 text-sm leading-relaxed">{selectedPlanet.desc}</p>
                                
                                {/* Science Navigation Tabs */}
                                <div className="mt-8 flex gap-2 border-b border-white/10 pb-2">
                                  <button 
                                    onClick={() => setActiveTab("telemetry")}
                                    className={cn("pb-2 text-xs font-mono uppercase tracking-wider transition-all", activeTab === "telemetry" ? "text-cyan-400 border-b-2 border-cyan-400 font-bold" : "text-slate-500 hover:text-slate-300")}
                                  >
                                    Orbit & Space
                                  </button>
                                  <button 
                                    onClick={() => setActiveTab("atmosphere")}
                                    className={cn("pb-2 text-xs font-mono uppercase tracking-wider transition-all ml-4", activeTab === "atmosphere" ? "text-cyan-400 border-b-2 border-cyan-400 font-bold" : "text-slate-500 hover:text-slate-300")}
                                  >
                                    Atmosphere
                                  </button>
                                </div>

                                {/* Tab Content */}
                                <div className="mt-6">
                                  {activeTab === "telemetry" && (
                                    <div className="grid grid-cols-2 gap-4 animate-in fade-in duration-200">
                                      <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                                        <p className="text-[9px] text-slate-500 uppercase">Orbit Period</p>
                                        <p className="text-white font-mono text-sm font-bold mt-1">{selectedPlanet.orbit}</p>
                                      </div>
                                      <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                                        <p className="text-[9px] text-slate-500 uppercase">Day Length</p>
                                        <p className="text-white font-mono text-sm font-bold mt-1">{selectedPlanet.rotation}</p>
                                      </div>
                                      <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                                        <p className="text-[9px] text-slate-500 uppercase">Gravity</p>
                                        <p className="text-white font-mono text-sm font-bold mt-1">{selectedPlanet.gravity}</p>
                                      </div>
                                      <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                                        <p className="text-[9px] text-slate-500 uppercase">Moons</p>
                                        <p className="text-white font-mono text-sm font-bold mt-1">{selectedPlanet.moons}</p>
                                      </div>
                                      <div className="p-3 bg-white/5 rounded-xl border border-white/5 col-span-2">
                                        <p className="text-[9px] text-slate-500 uppercase">Mean distance to sun</p>
                                        <p className="text-cyan-400 font-mono text-sm font-bold mt-1">{selectedPlanet.distance} ({selectedPlanet.distanceAu})</p>
                                      </div>
                                    </div>
                                  )}

                                  {activeTab === "atmosphere" && (
                                    <div className="grid grid-cols-1 gap-4 animate-in fade-in duration-200">
                                      <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                                        <p className="text-[9px] text-slate-500 uppercase font-mono">Atmospheric Pressure</p>
                                        <p className="text-white font-mono text-sm font-bold mt-1">{selectedPlanet.pressure}</p>
                                      </div>
                                      <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                                        <p className="text-[9px] text-slate-500 uppercase font-mono">Atmospheric Composition</p>
                                        <p className="text-white font-mono text-sm font-bold mt-1">{selectedPlanet.composition}</p>
                                      </div>
                                      <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                                        <p className="text-[9px] text-slate-500 uppercase font-mono">Mean Temperature</p>
                                        <p className="text-orange-400 font-mono text-sm font-bold mt-1">{selectedPlanet.temp}</p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                            </div>
                            
                            <button className="mt-8 w-full py-4.5 bg-cyan-600 hover:bg-cyan-500 text-white font-black uppercase rounded-2xl shadow-lg shadow-cyan-950/20 text-xs tracking-widest transition">
                                Launch Probe Mission
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}

      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .meteor {
            position: absolute; width: 2.5px; height: 120px;
            background: linear-gradient(to top, rgba(255,255,255,0) 0%, rgba(255,255,255,1) 100%);
            opacity: 0; transform: rotate(45deg);
            animation: meteor-anim 6s infinite;
        }
        .meteor-1 { top: 5%; left: 20%; animation-delay: 1.5s; }
        .meteor-2 { top: 15%; left: 75%; animation-delay: 3.5s; }
        .meteor-3 { top: 40%; left: 35%; animation-delay: 6s; }
        .meteor-4 { top: 25%; left: 90%; animation-delay: 8s; }
        @keyframes meteor-anim {
            0% { opacity: 0; transform: rotate(45deg) translateY(-500px); }
            4% { opacity: 1; }
            12% { opacity: 0; transform: rotate(45deg) translateY(500px); }
            100% { opacity: 0; }
        }
        @keyframes float-slow {
            0%, 100% { transform: translate(0, 0) rotate(0deg); }
            50% { transform: translate(15px, 30px) rotate(8deg); }
        }
        .animate-float-slow { animation: float-slow 14s infinite ease-in-out; }
      `}} />
    </div>
  );
}