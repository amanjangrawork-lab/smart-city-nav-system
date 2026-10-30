export type Node = { id: string; name: string; x: number; z: number; tier: 1 | 2 | 3 };
export type Edge = { from: string; to: string; km: number; speed: number; lanes: number };

export const NODES: Node[] = [
  { id: "cp", name: "Connaught Place", x: 0, z: 0, tier: 1 },
  { id: "ig", name: "India Gate", x: 1.2, z: 1.0, tier: 2 },
  { id: "kg", name: "Karol Bagh", x: -1.6, z: -0.6, tier: 2 },
  { id: "ln", name: "Lajpat Nagar", x: 2.0, z: 1.6, tier: 2 },
  { id: "sk", name: "Saket", x: 1.4, z: 3.2, tier: 2 },
  { id: "rk", name: "Rohini", x: -2.4, z: -2.6, tier: 2 },
  { id: "dw", name: "Dwarka", x: -3.6, z: 1.4, tier: 2 },
  { id: "igia", name: "IGI Airport", x: -4.2, z: 2.6, tier: 1 },
  { id: "ng", name: "Nehru Place", x: 2.6, z: 2.4, tier: 2 },
  { id: "ok", name: "Okhla", x: 3.2, z: 3.0, tier: 3 },
  { id: "noi", name: "Noida Sec 18", x: 5.0, z: 1.0, tier: 1 },
  { id: "ghz", name: "Ghaziabad", x: 6.2, z: -1.2, tier: 2 },
  { id: "frb", name: "Faridabad", x: 3.0, z: 4.6, tier: 2 },
  { id: "ggn", name: "Gurugram Cyber City", x: -2.0, z: 3.4, tier: 1 },
  { id: "ggn2", name: "Gurugram Sec 29", x: -2.8, z: 4.2, tier: 2 },
  { id: "man", name: "Manesar", x: -4.0, z: 5.0, tier: 3 },
  { id: "pit", name: "Pitampura", x: -1.0, z: -2.0, tier: 2 },
  { id: "jan", name: "Janakpuri", x: -2.6, z: 0.2, tier: 2 },
  { id: "utt", name: "Uttam Nagar", x: -3.0, z: -0.4, tier: 3 },
  { id: "shd", name: "Shahdara", x: 4.6, z: -2.4, tier: 2 },
  { id: "annd", name: "Anand Vihar", x: 4.0, z: -0.6, tier: 2 },
  { id: "may", name: "Mayur Vihar", x: 3.6, z: 0.4, tier: 2 },
  { id: "vas", name: "Vasundhara", x: 5.4, z: -0.2, tier: 3 },
  { id: "gre", name: "Greater Noida", x: 6.6, z: 2.4, tier: 3 },
  { id: "bad", name: "Badarpur", x: 2.4, z: 4.0, tier: 3 },
];

const E: [string, string, number, number, number][] = [
  ["cp","ig",2.5,40,4],["cp","kg",3.0,35,3],["cp","ln",4.0,40,4],
  ["cp","pit",5.5,50,4],["cp","jan",6.0,45,3],
  ["ig","ln",3.0,40,3],["ig","ng",4.5,50,4],["ig","sk",5.0,45,3],
  ["kg","rk",6.0,50,4],["kg","pit",4.0,45,3],["kg","jan",3.5,40,3],
  ["ln","ng",2.5,40,3],["ln","sk",4.0,45,3],["ln","bad",3.5,40,3],
  ["sk","ng",3.0,40,3],["sk","frb",8.0,60,4],["sk","bad",2.0,35,2],
  ["rk","pit",3.0,45,3],["rk","dw",7.0,55,4],
  ["dw","jan",4.0,45,3],["dw","igia",5.0,55,4],["dw","ggn",9.0,65,4],
  ["igia","ggn",12.0,70,4],["igia","man",18.0,80,4],
  ["ng","ok",2.0,35,2],["ng","may",3.0,40,3],["ng","frb",6.0,50,4],
  ["ok","frb",5.0,45,3],["ok","bad",2.5,35,2],
  ["noi","annd",4.0,45,3],["noi","may",5.0,50,4],["noi","gre",8.0,60,4],
  ["ghz","shd",4.0,45,3],["ghz","annd",5.0,50,4],["ghz","vas",3.0,40,3],
  ["shd","annd",3.5,40,3],["shd","cp",7.0,55,4],
  ["annd","may",2.5,40,3],["may","cp",5.0,45,4],
  ["vas","gre",4.0,45,3],["vas","noi",6.0,50,4],
  ["ggn","ggn2",3.0,40,3],["ggn","dw",9.0,60,4],["ggn2","man",6.0,55,4],
  ["frb","bad",3.0,40,3],
];
export const EDGES: Edge[] = E.map(([from, to, km, speed, lanes]) => ({ from, to, km, speed, lanes }));

export const nodeById = (id: string) => NODES.find((n) => n.id === id)!;
export const adjacency = () => {
  const m = new Map<string, { to: string; km: number; speed: number; lanes: number }[]>();
  for (const n of NODES) m.set(n.id, []);
  for (const e of EDGES) {
    m.get(e.from)!.push({ to: e.to, km: e.km, speed: e.speed, lanes: e.lanes });
    m.get(e.to)!.push({ to: e.from, km: e.km, speed: e.speed, lanes: e.lanes });
  }
  return m;
};
