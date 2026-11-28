import React, { useEffect, useRef, useState } from "react";
import { parseStl, MAX_SCAN_BYTES } from "../cadcam.js";

/** Opens a scan (.stl) from this device and shows it in 3D: drag to turn, scroll or pinch to zoom. Nothing is uploaded. */
export default function StlViewer({ onLoaded }) {
  const mount = useRef(null);
  const sceneRef = useRef(null);
  const [state, setState] = useState({ status: "idle", message: "" });

  useEffect(() => () => sceneRef.current?.dispose(), []);

  const open = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!/\.stl$/i.test(file.name)) return setState({ status: "error", message: "Choose an .stl file. Export the scan as STL from your scanner software" });
    if (file.size > MAX_SCAN_BYTES) return setState({ status: "error", message: "This file is over 200 MB. Export a lighter scan" });
    setState({ status: "loading", message: "Opening scan" });
    try {
      const parsed = parseStl(await file.arrayBuffer());
      if (parsed.error) return setState({ status: "error", message: parsed.error });
      const THREE = await import("three");
      const { OrbitControls } = await import("three/examples/jsm/controls/OrbitControls.js");
      sceneRef.current?.dispose();
      const el = mount.current;
      const w = el.clientWidth || 320, h = 320;
      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(w, h);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setClearColor(0xf1f5f9);
      el.replaceChildren(renderer.domElement);
      const scene = new THREE.Scene();
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(parsed.positions, 3));
      geo.computeVertexNormals();
      geo.center();
      geo.computeBoundingSphere();
      const r = geo.boundingSphere.radius || 1;
      const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0xe8e2d4, roughness: 0.6, metalness: 0.05, side: THREE.DoubleSide }));
      scene.add(mesh, new THREE.HemisphereLight(0xffffff, 0x8899aa, 1.1));
      const key = new THREE.DirectionalLight(0xffffff, 1.4);
      key.position.set(r, r * 2, r * 3);
      scene.add(key);
      const camera = new THREE.PerspectiveCamera(40, w / h, r / 100, r * 100);
      camera.position.set(0, 0, r * 3);
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      let raf = 0;
      const tick = () => { controls.update(); renderer.render(scene, camera); raf = requestAnimationFrame(tick); };
      tick();
      sceneRef.current = { dispose: () => { cancelAnimationFrame(raf); controls.dispose(); geo.dispose(); mesh.material.dispose(); renderer.dispose(); } };
      setState({ status: "ready", message: `${file.name}: ${parsed.triangles.toLocaleString("en-IN")} triangles` });
      onLoaded?.({ name: file.name, bytes: file.size, triangles: parsed.triangles });
    } catch {
      setState({ status: "error", message: "This device could not show the scan in 3D. Try another browser or a lighter file" });
    }
  };

  return (
    <div className="space-y-2" data-testid="stl-viewer">
      <label className="inline-block px-3 py-1.5 rounded-lg border border-rule bg-white text-xs font-bold text-slate-700 cursor-pointer hover:bg-slate-50">
        Open scan file (.stl)
        <input type="file" accept=".stl" className="sr-only" aria-label="Open scan file" onChange={open} />
      </label>
      <p className="text-[11px] text-slate-500">The file stays on this device and is not uploaded.</p>
      <div ref={mount} className="w-full rounded-lg overflow-hidden bg-slate-100" style={{ minHeight: state.status === "ready" ? 320 : 0 }} aria-label="3D scan" />
      {state.message && <p role={state.status === "error" ? "alert" : "status"} className={`text-xs font-medium ${state.status === "error" ? "text-rose-700" : "text-slate-600"}`}>{state.message}</p>}
    </div>
  );
}
