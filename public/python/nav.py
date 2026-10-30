import json, heapq, math

def build_graph(nodes, edges):
    adj = {n["id"]: [] for n in nodes}
    for e in edges:
        adj[e["from"]].append({"to": e["to"], "km": e["km"], "speed": e["speed"], "lanes": e["lanes"]})
        adj[e["to"]].append({"to": e["from"], "km": e["km"], "speed": e["speed"], "lanes": e["lanes"]})
    pos = {n["id"]: (n["x"], n["z"]) for n in nodes}
    return adj, pos

def weight(edge, traffic, mode):
    km = edge["km"]
    if mode == "shortest":
        return km
    if mode == "fastest":
        cong = traffic.get(edge_key(edge), 0.0)
        speed = edge["speed"] * (1 - cong * 0.6)
        speed = max(speed, 5)
        return km / speed * 60.0  # minutes
    if mode == "eco":
        # prefer fewer lanes congestion: cost = km * (1 + congestion)
        cong = traffic.get(edge_key(edge), 0.0)
        return km * (1 + cong)
    return km

def edge_key(e):
    a, b = sorted([e["from"], e["to"]]) if "from" in e else (e.get("_a"), e.get("_b"))
    return f"{a}|{b}"

def dijkstra(nodes, edges, start, end, mode="shortest", traffic=None):
    traffic = traffic or {}
    adj, pos = build_graph(nodes, edges)
    # attach from/to to edges for keying
    emap = {}
    for e in edges:
        emap[frozenset((e["from"], e["to"]))] = e
    def w(u, v, e):
        km = e["km"]
        if mode == "shortest":
            return km
        cong = traffic.get(frozenset((u, v)), 0.0)
        if mode == "fastest":
            speed = e["speed"] * (1 - cong * 0.6)
            speed = max(speed, 5)
            return km / speed * 60.0
        if mode == "eco":
            return km * (1 + cong)
        return km
    INF = float("inf")
    dist = {n["id"]: INF for n in nodes}
    prev = {n["id"]: None for n in nodes}
    visited = []
    pq = [(0.0, start)]
    dist[start] = 0.0
    while pq:
        d, u = heapq.heappop(pq)
        if d > dist[u]:
            continue
        visited.append(u)
        if u == end:
            break
        for nb in adj[u]:
            v = nb["to"]
            e = emap[frozenset((u, v))]
            nd = d + w(u, v, e)
            if nd < dist[v]:
                dist[v] = nd
                prev[v] = u
                heapq.heappush(pq, (nd, v))
    # reconstruct
    path = []
    cur = end
    while cur is not None:
        path.append(cur)
        cur = prev[cur]
    path.reverse()
    if not path or path[0] != start:
        path = []
    return {"algorithm": "dijkstra", "mode": mode, "path": path,
            "cost": (dist[end] if dist[end] != INF else None),
            "visited": visited, "visited_count": len(visited)}

def astar(nodes, edges, start, end, mode="shortest", traffic=None):
    traffic = traffic or {}
    adj, pos = build_graph(nodes, edges)
    emap = {}
    for e in edges:
        emap[frozenset((e["from"], e["to"]))] = e
    def w(u, v, e):
        km = e["km"]
        if mode == "shortest":
            return km
        cong = traffic.get(frozenset((u, v)), 0.0)
        if mode == "fastest":
            speed = e["speed"] * (1 - cong * 0.6)
            speed = max(speed, 5)
            return km / speed * 60.0
        if mode == "eco":
            return km * (1 + cong)
        return km
    def h(u):
        x1, z1 = pos[u]; x2, z2 = pos[end]
        return math.hypot(x1 - x2, z1 - z2)  # euclidean in world units ~ km-ish
    INF = float("inf")
    g = {n["id"]: INF for n in nodes}
    f = {n["id"]: INF for n in nodes}
    prev = {n["id"]: None for n in nodes}
    visited = []
    g[start] = 0.0
    f[start] = h(start)
    pq = [(f[start], start)]
    closed = set()
    while pq:
        _, u = heapq.heappop(pq)
        if u in closed:
            continue
        closed.add(u)
        visited.append(u)
        if u == end:
            break
        for nb in adj[u]:
            v = nb["to"]
            if v in closed:
                continue
            e = emap[frozenset((u, v))]
            ng = g[u] + w(u, v, e)
            if ng < g[v]:
                g[v] = ng
                f[v] = ng + h(v)
                prev[v] = u
                heapq.heappush(pq, (f[v], v))
    path = []
    cur = end
    while cur is not None:
        path.append(cur)
        cur = prev[cur]
    path.reverse()
    if not path or path[0] != start:
        path = []
    return {"algorithm": "astar", "mode": mode, "path": path,
            "cost": (g[end] if g[end] != INF else None),
            "visited": visited, "visited_count": len(visited)}

def floyd(nodes, edges, traffic=None):
    traffic = traffic or {}
    ids = [n["id"] for n in nodes]
    idx = {nid: i for i, nid in enumerate(ids)}
    N = len(ids)
    INF = float("inf")
    D = [[INF]*N for _ in range(N)]
    for i in range(N):
        D[i][i] = 0.0
    emap = {}
    for e in edges:
        i, j = idx[e["from"]], idx[e["to"]]
        cong = traffic.get(frozenset((e["from"], e["to"])), 0.0)
        km = e["km"]
        D[i][j] = min(D[i][j], km * (1 + cong))
        D[j][i] = min(D[j][i], km * (1 + cong))
    for k in range(N):
        for i in range(N):
            if D[i][k] == INF: continue
            for j in range(N):
                if D[i][k] + D[k][j] < D[i][j]:
                    D[i][j] = D[i][k] + D[k][j]
    return {"algorithm": "floyd", "matrix": {ids[i]: {ids[j]: (None if D[i][j]==INF else round(D[i][j],2)) for j in range(N)} for i in range(N)}}

def traffic_curve(road_index, t_minutes):
    # deterministic congestion 0..1
    import math
    base = 0.25 + 0.35 * (0.5 + 0.5 * math.sin(road_index * 1.7 + t_minutes * 0.05))
    peak = 0.3 * math.exp(-((t_minutes % 60) - 30) ** 2 / 200.0)
    return max(0.0, min(1.0, base + peak))

def build_traffic(edges, t_minutes):
    out = {}
    for i, e in enumerate(edges):
        out[frozenset((e["from"], e["to"]))] = traffic_curve(i, t_minutes)
    return out
