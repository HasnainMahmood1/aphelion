"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

// name EN, name AR, semi-major axis (AU), period (years), drawn radius (not to scale), colour
const P = [
  ["Mercury", "عطارد", 0.387, 0.241, 0.05, "#9a9a9a"], ["Venus", "الزهرة", 0.723, 0.615, 0.09, "#d8b27a"],
  ["Earth", "الأرض", 1, 1, 0.095, "#5b9bd5"], ["Mars", "المريخ", 1.524, 1.881, 0.07, "#c1673f"],
  ["Jupiter", "المشتري", 5.204, 11.86, 0.28, "#d9a55b"], ["Saturn", "زحل", 9.582, 29.46, 0.24, "#e3cf9b"],
  ["Uranus", "أورانوس", 19.2, 84.0, 0.17, "#6fc3d0"], ["Neptune", "نبتون", 30.05, 164.8, 0.17, "#4a6fd0"],
] as const;
const RMAX = 10; // scene units for Neptune; other radii scale with √distance, as in the 2D view

function label(text: string) {
  const c = document.createElement("canvas"); c.width = 256; c.height = 64;
  const x = c.getContext("2d")!; x.font = "600 28px Inter, 'Segoe UI', Tahoma, sans-serif"; x.textAlign = "center"; x.textBaseline = "middle";
  x.fillStyle = "#8b96a8"; x.fillText(text, 128, 32);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false }));
  s.scale.set(2, 0.5, 1); return s;
}

export default function Orbit3D({ lang }: { lang: "en" | "ar" }) {
  const host = useRef<HTMLDivElement>(null);
  const speed = useRef(typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 0.5);

  useEffect(() => {
    const el = host.current!;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.domElement.setAttribute("aria-label", lang === "ar" ? "نموذج ثلاثي الأبعاد للنظام الشمسي" : "3D model of the Solar System");
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 300); camera.position.set(0, 9, 17);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; controls.minDistance = 3; controls.maxDistance = 45;

    scene.add(new THREE.AmbientLight(0xffffff, 0.35));
    scene.add(new THREE.PointLight(0xfff1d6, 3, 0, 0));
    scene.add(new THREE.Mesh(new THREE.SphereGeometry(0.45, 32, 16), new THREE.MeshBasicMaterial({ color: "#ffd9a0" })));

    const stars = new Float32Array(900 * 3);
    for (let i = 0; i < 900; i++) { const v = new THREE.Vector3().randomDirection().multiplyScalar(80 + Math.random() * 40); stars.set([v.x, v.y, v.z], i * 3); }
    const sg = new THREE.BufferGeometry(); sg.setAttribute("position", new THREE.BufferAttribute(stars, 3));
    scene.add(new THREE.Points(sg, new THREE.PointsMaterial({ color: "#8b96a8", size: 0.25, sizeAttenuation: true })));

    const bodies = P.map(([en, ar, a, per, size, color], i) => {
      const r = Math.sqrt(a / 30.05) * RMAX;
      const ring = new THREE.BufferGeometry().setFromPoints(Array.from({ length: 160 }, (_, k) => new THREE.Vector3(Math.cos((k / 160) * 2 * Math.PI) * r, 0, Math.sin((k / 160) * 2 * Math.PI) * r)));
      scene.add(new THREE.LineLoop(ring, new THREE.LineBasicMaterial({ color: "#2a3a55" })));
      const m = new THREE.Mesh(new THREE.SphereGeometry(size, 24, 16), new THREE.MeshStandardMaterial({ color, roughness: 0.9 }));
      if (en === "Saturn") { const rg = new THREE.Mesh(new THREE.RingGeometry(size * 1.4, size * 2.2, 48), new THREE.MeshBasicMaterial({ color: "#c9b88a", side: THREE.DoubleSide, transparent: true, opacity: 0.7 })); rg.rotation.x = Math.PI / 2.4; m.add(rg); }
      const l = label(lang === "ar" ? ar : en); l.position.set(0, size + 0.35, 0); m.add(l);
      scene.add(m);
      return { m, r, per, phase: i * 1.1 };
    });

    const resize = () => { const w = el.clientWidth, h = el.clientHeight; renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix(); };
    const ro = new ResizeObserver(resize); ro.observe(el); resize();

    let raf = 0, yr = 0, last = performance.now();
    const tick = (now: number) => {
      yr += ((now - last) / 1000) * speed.current; last = now;
      for (const b of bodies) { const th = b.phase + (2 * Math.PI * yr) / b.per; b.m.position.set(b.r * Math.cos(th), 0, b.r * Math.sin(th)); }
      controls.update(); renderer.render(scene, camera); raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf); ro.disconnect(); controls.dispose();
      scene.traverse((o: any) => { o.geometry?.dispose?.(); const mt = o.material; if (mt) { mt.map?.dispose?.(); mt.dispose?.(); } });
      renderer.dispose(); renderer.domElement.remove();
    };
  }, [lang]);

  return (<>
    <div ref={host} style={{ width: "100%", height: "min(70vh, 560px)", border: "1px solid var(--line)", borderRadius: 4, background: "#070b13", touchAction: "none" }} />
    <label className="meta" style={{ display: "flex", alignItems: "center", gap: ".6rem" }}>
      {lang === "ar" ? "السرعة" : "Speed"}
      <input type="range" min={0} max={4} step={0.1} defaultValue={speed.current} onChange={(e) => (speed.current = +e.target.value)} style={{ width: 200 }} />
    </label>
  </>);
}
