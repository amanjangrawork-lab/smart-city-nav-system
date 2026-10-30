"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { NODES, EDGES } from "@/lib/graph";
import { sceneState } from "@/lib/scroll-state";

export function CityGraph3D() {
  const groupRef = useRef<THREE.Group>(null);
  const nodeMeshes = useRef<THREE.Mesh[]>([]);
  const edgeMeshes = useRef<THREE.Mesh[]>([]);

  useMemo(() => {
    // build once
    const g = new THREE.Group();
    const nmeshes: THREE.Mesh[] = [];
    const emeshes: THREE.Mesh[] = [];

    for (const e of EDGES) {
      const a = NODES.find((n) => n.id === e.from)!;
      const b = NODES.find((n) => n.id === e.to)!;
      const va = new THREE.Vector3(a.x, 0.1, a.z);
      const vb = new THREE.Vector3(b.x, 0.1, b.z);
      const mid = va.clone().lerp(vb, 0.5);
      mid.y += 0.35 + Math.hypot(a.x - b.x, a.z - b.z) * 0.12;
      const curve = new THREE.QuadraticBezierCurve3(va, mid, vb);
      const geo = new THREE.TubeGeometry(curve, 10, 0.05, 6, false);
      const mat = new THREE.MeshStandardMaterial({
        color: 0x4fbfae, emissive: 0x4fbfae, emissiveIntensity: 0.2,
        transparent: true, opacity: 0.6,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.userData = { from: e.from, to: e.to };
      g.add(mesh);
      emeshes.push(mesh);
    }

    for (const n of NODES) {
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(n.tier === 1 ? 0.2 : n.tier === 2 ? 0.14 : 0.1, 16, 16),
        new THREE.MeshStandardMaterial({ color: 0xe8b75a, emissive: 0xe8b75a, emissiveIntensity: 0.5 })
      );
      mesh.position.set(n.x, n.tier === 1 ? 1.0 : n.tier === 2 ? 0.7 : 0.45, n.z);
      mesh.userData = { id: n.id };
      g.add(mesh);
      nmeshes.push(mesh);
    }

    // store via closure refs set later
    (g as any).__nmeshes = nmeshes;
    (g as any).__emeshes = emeshes;
    return g;
  }, []);

  // assign refs after first render
  if (groupRef.current && nodeMeshes.current.length === 0) {
    const g: any = groupRef.current;
    // group children: edges first (EDGES.length), then nodes
    edgeMeshes.current = g.children.slice(0, EDGES.length) as THREE.Mesh[];
    nodeMeshes.current = g.children.slice(EDGES.length) as THREE.Mesh[];
  }

  useFrame(() => {
    const trafficOn = sceneState.trafficOn;
    const route = sceneState.route;
    const visited = sceneState.visited;
    const start = sceneState.selectedStart;
    const end = sceneState.selectedEnd;

    edgeMeshes.current.forEach((m: any, i) => {
      const e = EDGES[i];
      const cong = trafficOn
        ? 0.2 + 0.5 * Math.abs(Math.sin(sceneState.progress * 6 + i * 0.7))
        : 0.12;
      const onRoute = route.length > 1 && route.includes(e.from) && route.includes(e.to) &&
        Math.abs(route.indexOf(e.from) - route.indexOf(e.to)) === 1;
      const c = onRoute ? new THREE.Color(0xffd98a) : new THREE.Color().lerpColors(new THREE.Color(0x4fbfae), new THREE.Color(0xd1552a), cong);
      m.material.color.copy(c);
      m.material.emissive.copy(c);
      m.material.opacity = onRoute ? 0.95 : 0.5 + cong * 0.35;
    });

    nodeMeshes.current.forEach((m: any, i) => {
      const n = NODES[i];
      let color = 0xe8b75a;
      if (n.id === start) color = 0xffd98a;
      else if (n.id === end) color = 0x4fbfae;
      else if (visited.includes(n.id)) color = 0x7fe3d2;
      m.material.color.setHex(color);
      m.material.emissive.setHex(color);
      const pulse = 1 + Math.sin(sceneState.progress * 4 + i) * 0.08;
      m.scale.setScalar(visited.includes(n.id) ? 1.25 * pulse : pulse);
    });
  });

  const group = useMemo(() => {
    const g = new THREE.Group();
    // edges
    for (const e of EDGES) {
      const a = NODES.find((n) => n.id === e.from)!;
      const b = NODES.find((n) => n.id === e.to)!;
      const va = new THREE.Vector3(a.x, 0.1, a.z);
      const vb = new THREE.Vector3(b.x, 0.1, b.z);
      const mid = va.clone().lerp(vb, 0.5);
      mid.y += 0.35 + Math.hypot(a.x - b.x, a.z - b.z) * 0.12;
      const curve = new THREE.QuadraticBezierCurve3(va, mid, vb);
      const geo = new THREE.TubeGeometry(curve, 10, 0.05, 6, false);
      const mat = new THREE.MeshStandardMaterial({ color: 0x4fbfae, emissive: 0x4fbfae, emissiveIntensity: 0.2, transparent: true, opacity: 0.6 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.userData = { from: e.from, to: e.to };
      g.add(mesh);
    }
    // nodes
    for (const n of NODES) {
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(n.tier === 1 ? 0.2 : n.tier === 2 ? 0.14 : 0.1, 16, 16),
        new THREE.MeshStandardMaterial({ color: 0xe8b75a, emissive: 0xe8b75a, emissiveIntensity: 0.5 })
      );
      mesh.position.set(n.x, n.tier === 1 ? 1.0 : n.tier === 2 ? 0.7 : 0.45, n.z);
      mesh.userData = { id: n.id };
      g.add(mesh);
    }
    return g;
  }, []);

  // populate refs on first frame
  const assigned = useRef(false);
  useFrame(() => {
    if (!assigned.current && groupRef.current) {
      edgeMeshes.current = groupRef.current.children.slice(0, EDGES.length) as THREE.Mesh[];
      nodeMeshes.current = groupRef.current.children.slice(EDGES.length) as THREE.Mesh[];
      assigned.current = true;
    }
  });

  return <primitive object={group} ref={groupRef} />;
}
