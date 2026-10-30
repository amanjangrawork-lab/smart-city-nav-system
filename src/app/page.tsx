"use client";

import dynamic from "next/dynamic";
import { Fragment, Suspense, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { NODES, EDGES } from "@/lib/graph";
import { RouteMap } from "@/components/RouteMap";
import { sceneState } from "@/lib/scroll-state";
import { loadPyodideRuntime, runRoute, buildTraffic } from "@/lib/pyodide";

const Stage = dynamic(() => import("@/components/three/Stage").then((m) => m.Stage), { ssr: false });

export default function Home() {
  const root = useRef<HTMLElement>(null);
  const [start, setStart] = useState(NODES[0].id);
  const [end, setEnd] = useState(NODES[4].id);
  const [mode, setMode] = useState<"shortest" | "fastest" | "eco">("shortest");
  const [algo, setAlgo] = useState<"dijkstra" | "astar">("dijkstra");
  const [trafficOn, setTrafficOn] = useState(false);
  const [routeInfo, setRouteInfo] = useState<any>(null);
  const [pyReady, setPyReady] = useState(false);
  const [computing, setComputing] = useState(false);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) => {
        gsap.fromTo(el, { opacity: 0, y: 42 }, { opacity: 1, y: 0, duration: 0.9, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 86%", once: true } });
      });
      gsap.utils.toArray<HTMLElement>("[data-split]").forEach((el) => {
        const words = el.querySelectorAll("[data-word]");
        if (!words.length) return;
        gsap.fromTo(words, { opacity: 0.12, y: 24, filter: "blur(6px)" }, { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.85, ease: "power3.out", stagger: 0.045, scrollTrigger: { trigger: el, start: "top 82%", once: true } });
      });
      gsap.to("[data-canvas]", { opacity: 0.3, scale: 0.95, ease: "none", scrollTrigger: { trigger: "[data-app]", start: "top bottom", end: "top center", scrub: true } });
    }, root);
    ScrollTrigger.refresh();
    return () => ctx.revert();
  }, []);

  // warm up pyodide
  useEffect(() => { loadPyodideRuntime().then(() => setPyReady(true)).catch(() => setPyReady(false)); }, []);

  // sync traffic state to scene
  useEffect(() => { sceneState.trafficOn = trafficOn; }, [trafficOn]);

  const compute = async () => {
    setComputing(true);
    const t = trafficOn ? 30 : 0;
    const traffic = await buildTraffic(
      EDGES.map((e) => ({ from: e.from, to: e.to })),
      t
    );
    const res = await runRoute(
      NODES.map((n) => ({ id: n.id, x: n.x, z: n.z })),
      EDGES.map((e) => ({ from: e.from, to: e.to, km: e.km, speed: e.speed, lanes: e.lanes })),
      start, end, mode, algo, traffic
    );
    sceneState.route = res.path || [];
    sceneState.visited = res.visited || [];
    setRouteInfo(res);
    setComputing(false);
  };

  useEffect(() => { if (pyReady) compute(); /* eslint-disable-next-line */ }, [pyReady, start, end, mode, algo, trafficOn]);

  const words = (s: string) => s.split(" ").map((w, i, a) => (
    <Fragment key={i}>
      <span className="inline-block overflow-hidden pb-1"><span data-word className="inline-block">{w}</span></span>
      {i < a.length - 1 ? " " : ""}
    </Fragment>
  ));

  return (
    <main ref={root} className="relative min-h-screen bg-[#05070d] text-white">
      <div data-canvas className="fixed inset-0 z-0 h-full w-full">
        <Suspense fallback={null}>
          <Stage />
        </Suspense>
      </div>

      {/* Hero */}
      <section className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,rgba(5,7,13,0.82)_0%,rgba(5,7,13,0.55)_45%,rgba(5,7,13,0)_75%)]" />
        <p className="mb-5 text-[11px] uppercase tracking-[0.42em] text-cyan-300/70" data-reveal>Smart city navigation</p>
        <h1 data-split className="max-w-5xl font-display text-[clamp(2.6rem,8vw,6.5rem)] leading-[0.95] tracking-tight [text-wrap:balance]">
          {words("Navigate the city like a system, not a guess.")}
        </h1>
        <p data-reveal className="mt-8 max-w-xl text-[15px] leading-relaxed text-slate-300/85">
          Route planning, live traffic and Python-powered pathfinding for Delhi NCR — Dijkstra, A* and more, running
          in your browser. Watch the search expand node by node.
        </p>
        <div data-reveal className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <a href="#planner" className="rounded-full bg-cyan-400 px-6 py-3 text-sm font-medium text-[#05070d] transition hover:bg-cyan-300">Plan a route</a>
          <a href="#algorithms" className="rounded-full border border-white/15 px-6 py-3 text-sm text-white/80 transition hover:border-white/40">See algorithms</a>
        </div>
      </section>

      {/* Network */}
      <section className="relative z-10 flex min-h-screen items-center px-6 md:px-12">
        <div data-reveal className="max-w-xl">
          <p className="mb-3 text-[11px] uppercase tracking-[0.42em] text-cyan-300/70">The network</p>
          <h2 className="font-display text-[clamp(2rem,5vw,4rem)] leading-[1.05] tracking-tight [text-wrap:balance]">
            Delhi NCR as a weighted graph.
          </h2>
          <p className="mt-6 text-[15px] leading-relaxed text-slate-300/85">
            {NODES.length} intersections and { EDGES.length } road links. Every edge carries
            distance, speed limit, lanes and live congestion. Nothing here is decoration — every line is a weighted edge
            the search can traverse.
          </p>
        </div>
      </section>

      {/* Planner */}
      <section id="planner" data-app className="relative z-10 flex min-h-screen items-center px-6 md:px-12">
        <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-black/40 p-6 backdrop-blur">
          <h2 className="font-display text-2xl">Plan a route</h2>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="text-sm text-slate-300">
              Start
              <select value={start} onChange={(e) => setStart(e.target.value)} className="mt-1 w-full rounded-lg bg-white/5 px-3 py-2">
                {NODES.map((n) => <option key={n.id} value={n.id}>{n.name}</option>)}
              </select>
            </label>
            <label className="text-sm text-slate-300">
              Destination
              <select value={end} onChange={(e) => setEnd(e.target.value)} className="mt-1 w-full rounded-lg bg-white/5 px-3 py-2">
                {NODES.map((n) => <option key={n.id} value={n.id}>{n.name}</option>)}
              </select>
            </label>
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            {(["shortest","fastest","eco"] as const).map((m) => (
              <button key={m} onClick={() => setMode(m)} className={`rounded-full px-3 py-1 ${mode===m?"bg-cyan-400 text-[#05070d]":"border border-white/15 text-white/70"}`}>{m}</button>
            ))}
            <span className="mx-2 text-white/30">|</span>
            {(["dijkstra","astar"] as const).map((a) => (
              <button key={a} onClick={() => setAlgo(a)} className={`rounded-full px-3 py-1 ${algo===a?"bg-white/20 text-white":"border border-white/15 text-white/70"}`}>{a}</button>
            ))}
            <button onClick={() => setTrafficOn((v) => !v)} className={`rounded-full px-3 py-1 ${trafficOn?"bg-amber-400 text-[#05070d]":"border border-white/15 text-white/70"}`}>
              Traffic {trafficOn ? "on" : "off"}
            </button>
            <button onClick={() => { compute(); document.getElementById("map")?.scrollIntoView({behavior:"smooth"}); }} className="rounded-full bg-cyan-400 px-3 py-1 text-[#05070d]">See route</button>
          </div>
          <div className="mt-4 text-sm text-slate-300">
            {computing ? "Computing…" : pyReady ? (
              routeInfo?.path?.length ? (
                <span>Route: {routeInfo.path.map((id: string) => NODES.find((n) => n.id === id)?.name).join(" → ")} · {routeInfo.cost?.toFixed(1)} · {routeInfo.visited_count} visited</span>
              ) : "Pick a start and destination."
            ) : "Loading Python runtime…"}
          </div>
        </div>
      </section>

      {/* Algorithms */}
      <section id="algorithms" className="relative z-10 flex min-h-screen items-center px-6 md:px-12">
        <div data-reveal className="max-w-2xl">
          <p className="mb-3 text-[11px] uppercase tracking-[0.42em] text-cyan-300/70">Algorithms</p>
          <h2 className="font-display text-[clamp(2rem,5vw,4rem)] leading-[1.05] tracking-tight [text-wrap:balance]">
            Python, in your browser.
          </h2>
          <p className="mt-6 text-[15px] leading-relaxed text-slate-300/85">
            Dijkstra and A* run through Pyodide. The search expands node by node on the 3D graph — visited nodes glow,
            the frontier pulses, and the winning path draws itself in gold. Switch algorithms and watch the visited count change.
          </p>
          <ul className="mt-6 space-y-2 text-sm text-slate-300/80">
            <li>· Dijkstra — optimal, explores by distance</li>
            <li>· A* — heuristic-guided, fewer visited nodes</li>
            <li>· Floyd–Warshall — all-pairs, precomputed matrix</li>
            <li>· Traffic-aware weighting — fastest ≠ shortest</li>
          </ul>
        </div>
      </section>

      {/* Coverage */}
      <section className="relative z-10 flex min-h-screen items-center px-6 md:px-12">
        <div data-reveal className="max-w-xl">
          <p className="mb-3 text-[11px] uppercase tracking-[0.42em] text-cyan-300/70">Coverage</p>
          <h2 className="font-display text-[clamp(2rem,5vw,4rem)] leading-[1.05] tracking-tight [text-wrap:balance]">
            {NODES.length} nodes · Delhi NCR.
          </h2>
          <p className="mt-6 text-[15px] leading-relaxed text-slate-300/85">
            From IGI Airport to Greater Noida, Dwarka to Ghaziabad — a connected, weighted, traffic-aware network.
          </p>
        </div>
      </section>

      <section id="map" className="relative z-10 px-6 py-12 md:px-12">
        <div className="mx-auto max-w-5xl">
          <p className="mb-3 text-[11px] uppercase tracking-[0.42em] text-cyan-300/70">Route map</p>
          <h2 className="font-display text-[clamp(2rem,5vw,3.5rem)] leading-[1.05] tracking-tight [text-wrap:balance]">Your route on the map.</h2>
          <p className="mt-4 mb-6 text-[15px] leading-relaxed text-slate-300/85">Every node on the journey, with per-leg distances and the total.</p>
          <RouteMap route={routeInfo?.path || []} start={start} end={end} />
        </div>
      </section>

      <footer className="relative z-10 px-6 py-12 text-sm text-slate-400">
        <div className="mx-auto max-w-5xl border-t border-white/10 pt-6">
          Smart City Navigation System · Next.js · react-three-fiber · GSAP · Lenis · Python (Pyodide) · Tailwind
        </div>
      </footer>
    </main>
  );
}
