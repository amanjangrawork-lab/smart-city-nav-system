"use client";

import { EffectComposer, Bloom, Vignette, ChromaticAberration } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import * as THREE from "three";

export function PostFX() {
  return (
    <EffectComposer multisampling={0}>
      <Bloom luminanceThreshold={0.2} luminanceSmoothing={0.9} intensity={0.9} />
      <ChromaticAberration offset={new THREE.Vector2(0.0008, 0.0008)} blendFunction={BlendFunction.NORMAL} />
      <Vignette eskil={false} offset={0.15} darkness={0.7} />
    </EffectComposer>
  );
}
