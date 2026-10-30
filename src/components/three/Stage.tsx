"use client";

import { Canvas } from "@react-three/fiber";
import { Scene } from "./Scene";

export function Stage() {
  return (
    <Canvas
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: false }}
      camera={{ position: [0, 0, 13], fov: 45, near: 0.1, far: 100 }}
      className="h-full w-full"
    >
      <Scene />
    </Canvas>
  );
}
