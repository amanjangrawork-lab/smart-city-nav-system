/**
 * Mutable scene state.
 * GSAP (scroll) writes; R3F (useFrame) reads. Deliberately outside React so a
 * 60fps scroll never triggers a re-render.
 */
export interface SceneState {
  progress: number;
  pointer: { x: number; y: number };
  reduced: boolean;
  selectedStart: string | null;
  selectedEnd: string | null;
  trafficOn: boolean;
  algorithm: "dijkstra" | "astar";
  visited: string[];
  route: string[];
}

export const sceneState: SceneState = {
  progress: 0,
  pointer: { x: 0, y: 0 },
  reduced: false,
  selectedStart: null,
  selectedEnd: null,
  trafficOn: false,
  algorithm: "dijkstra",
  visited: [],
  route: [],
};

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

export function windowProgress(progress: number, start: number, end: number): number {
  if (end <= start) return progress >= end ? 1 : 0;
  return clamp01((progress - start) / (end - start));
}
