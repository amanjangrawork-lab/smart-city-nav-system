"use client";

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { sceneState, windowProgress } from "@/lib/scroll-state";

export function CameraRig() {
  const { camera, size } = useThree();
  const target = useRef(new THREE.Vector3(0, 0, 12));

  useFrame((_, dt) => {
    const p = sceneState.progress;
    const reveal = windowProgress(p, 0.08, 0.35);
    const core = windowProgress(p, 0.3, 0.6);
    const settle = windowProgress(p, 0.62, 0.9);

    const aspect = size.width / Math.max(1, size.height);
    const portraitBoost = aspect < 1 ? 1 + (1 - aspect) * 0.9 : 1;

    const z = THREE.MathUtils.lerp(THREE.MathUtils.lerp(13, 9.5, reveal), 11, settle) * portraitBoost;
    const orbit = core * 0.9 * (1 - settle * 0.5);
    const x = Math.sin(orbit) * 2.4;
    const y = Math.cos(orbit * 0.7) * 0.9;

    const heroDrop = THREE.MathUtils.lerp(-1.6, -0.2, reveal) * (aspect < 1 ? 1.2 : 1);
    const sideShift =
      windowProgress(p, 0.08, 0.28) * (1 - windowProgress(p, 0.82, 1)) * 2.6 * (aspect < 1 ? 0.3 : 1);

    const px = sceneState.pointer.x * 0.2;
    const py = sceneState.pointer.y * 0.14;
    target.current.set(x + sideShift + px, y + heroDrop + py, z);

    const k = sceneState.reduced ? 1 : 1 - Math.exp(-2.6 * dt);
    camera.position.lerp(target.current, k);
    camera.lookAt(sideShift * 0.6, heroDrop * 0.4, 0);
  });

  return null;
}
