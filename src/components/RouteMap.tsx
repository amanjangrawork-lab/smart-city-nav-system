"use client";

import { useMemo } from "react";
import { NODES, EDGES } from "@/lib/graph";

type Props = { route: string[]; start: string; end: string };

export function RouteMap({ route, start, end }: Props) {
  const { xs, zs, path, segments, total } = useMemo(() => {
    const xs = NODES.map((n) => n.x);
    const zs = NODES.map((n) => n.z);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minZ = Math.min(...zs), maxZ = Math.max(...zs);
    const pad = 0.6;
    const vb = { minX: minX - pad, maxX: maxX + pad, minZ: minZ - pad, maxZ: maxZ + pad };

    const edgeMap = new Map<string, number>();
    for (const e of EDGES) {
      edgeMap.set(`${e.from}|${e.to}`, e.km);
      edgeMap.set(`${e.to}|${e.from}`, e.km);
    }

    const segments: { from: string; to: string; km: number }[] = [];
    let total = 0;
    for (let i = 0; i < route.length - 1; i++) {
      const km = edgeMap.get(`${route[i]}|${route[i + 1]}`) ?? 0;
      segments.push({ from: route[i], to: route[i + 1], km });
      total += km;
    }

    return { xs, zs, vb, path: route, segments, total };
  }, [route]);

  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minZ = Math.min(...zs), maxZ = Math.max(...zs);
  const pad = 0.6;
  const vbX = minX - pad, vbY = minZ - pad;
  const vbW = maxX - minX + pad * 2, vbH = maxZ - minZ + pad * 2;

  const nodeById = (id: string) => NODES.find((n) => n.id === id)!;
  const onRoute = new Set(route);

  return (
    <div className="w-full">
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/40">
        <svg viewBox={`${vbX} ${vbY} ${vbW} ${vbH}`} className="h-[420px] w-full" preserveAspectRatio="xMidYMid meet">
          {/* all edges */}
          {EDGES.map((e, i) => {
            const a = nodeById(e.from), b = nodeById(e.to);
            return (
              <line key={i} x1={a.x} y1={a.z} x2={b.x} y2={b.z}
                stroke="rgba(255,255,255,0.08)" strokeWidth={0.04} />
            );
          })}
          {/* route edges */}
          {segments.map((s, i) => {
            const a = nodeById(s.from), b = nodeById(s.to);
            return (
              <line key={`r${i}`} x1={a.x} y1={a.z} x2={b.x} y2={b.z}
                stroke="#ffd98a" strokeWidth={0.12} strokeLinecap="round" />
            );
          })}
          {/* nodes */}
          {NODES.map((n) => {
            const isRoute = onRoute.has(n.id);
            const isStart = n.id === start;
            const isEnd = n.id === end;
            const r = n.tier === 1 ? 0.18 : n.tier === 2 ? 0.13 : 0.09;
            const fill = isStart ? "#ffd98a" : isEnd ? "#4fbfae" : isRoute ? "#7fe3d2" : "#e8b75a";
            return (
              <g key={n.id}>
                <circle cx={n.x} cy={n.z} r={r} fill={fill} opacity={isRoute ? 1 : 0.5} />
                {isRoute && (
                  <text x={n.x} y={n.z - 0.22} textAnchor="middle" fontSize={0.16} fill="#fff" style={{ pointerEvents: "none" }}>
                    {n.name}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {route.length > 1 && (
        <div className="mt-4 rounded-2xl border border-white/10 bg-black/40 p-5">
          <div className="mb-3 text-sm font-medium text-white">Journey</div>
          <ol className="space-y-1 text-sm text-slate-300">
            {route.map((id, i) => {
              const n = nodeById(id);
              const seg = i < segments.length ? segments[i] : null;
              return (
                <li key={id} className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2">
                    <span className="inline-block h-2 w-2 rounded-full bg-cyan-400" />
                    {n.name}
                  </span>
                  {seg && <span className="text-xs text-slate-400">{seg.km} km →</span>}
                </li>
              );
            })}
          </ol>
          <div className="mt-3 border-t border-white/10 pt-3 text-sm font-medium text-cyan-300">
            Total: {total} km · {route.length - 1} legs
          </div>
        </div>
      )}
      {route.length <= 1 && (
        <p className="mt-4 text-sm text-slate-400">Set a start and destination in the planner, then click "See route".</p>
      )}
    </div>
  );
}
