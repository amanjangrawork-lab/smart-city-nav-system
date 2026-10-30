// Pyodide bridge: runs the Python routing algorithms in the browser.
let pyodidePromise: Promise<any> | null = null;

export async function loadPyodideRuntime() {
  if (pyodidePromise) return pyodidePromise;
  pyodidePromise = (async () => {
    // @ts-ignore
    if (!window.loadPyodide) {
      await new Promise<void>((resolve, reject) => {
        const s = document.createElement("script");
        s.src = "https://cdn.jsdelivr.net/pyodide/v0.26.2/full/pyodide.js";
        s.onload = () => resolve();
        s.onerror = () => reject(new Error("pyodide load failed"));
        document.head.appendChild(s);
      });
    }
    // @ts-ignore
    const py = await window.loadPyodide({ indexURL: "https://cdn.jsdelivr.net/pyodide/v0.26.2/full/" });
    const code = await fetch("/python/nav.py").then((r) => r.text());
    await py.runPythonAsync(code);
    return py;
  })();
  return pyodidePromise;
}

export type RouteResult = {
  algorithm: string;
  mode: string;
  path: string[];
  cost: number | null;
  visited: string[];
  visited_count: number;
};

export async function runRoute(
  nodes: any[],
  edges: any[],
  start: string,
  end: string,
  mode: "shortest" | "fastest" | "eco",
  algorithm: "dijkstra" | "astar",
  traffic: Record<string, number>
): Promise<RouteResult> {
  const py = await loadPyodideRuntime();
  const trafficObj: Record<string, number> = {};
  for (const [k, v] of Object.entries(traffic)) trafficObj[k] = v;
  py.globals.set("NODES_JSON", JSON.stringify(nodes));
  py.globals.set("EDGES_JSON", JSON.stringify(edges));
  py.globals.set("TRAFFIC_JSON", JSON.stringify(trafficObj));
  py.globals.set("START", start);
  py.globals.set("END", end);
  py.globals.set("MODE", mode);
  const fn = algorithm === "astar" ? "astar" : "dijkstra";
  const src = `
import json
nodes = json.loads(NODES_JSON)
edges = json.loads(EDGES_JSON)
traffic_raw = json.loads(TRAFFIC_JSON)
traffic = {frozenset(k.split("|")): v for k,v in traffic_raw.items()}
res = ${fn}(nodes, edges, START, END, MODE, traffic)
import json as _j
_j.dumps(res)
`;
  const out = await py.runPythonAsync(src);
  return JSON.parse(out);
}

export async function buildTraffic(edges: any[], tMinutes: number): Promise<Record<string, number>> {
  const py = await loadPyodideRuntime();
  py.globals.set("EDGES_JSON", JSON.stringify(edges));
  py.globals.set("T", tMinutes);
  const src = `
import json
edges = json.loads(EDGES_JSON)
tr = build_traffic(edges, T)
{ "|".join(sorted([e["from"],e["to"]])): v for e,v in [(e, tr[frozenset((e["from"],e["to"]))]) for e in edges] }
`;
  // Simpler: compute in JS to avoid frozenset keying issues
  const out: Record<string, number> = {};
  edges.forEach((e, i) => {
    const base = 0.25 + 0.35 * (0.5 + 0.5 * Math.sin(i * 1.7 + tMinutes * 0.05));
    const peak = 0.3 * Math.exp(-(((tMinutes % 60) - 30) ** 2) / 200.0);
    out[`${e.from}|${e.to}`] = Math.max(0, Math.min(1, base + peak));
  });
  return out;
}
