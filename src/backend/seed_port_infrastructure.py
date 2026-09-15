#!/usr/bin/env python3
"""
Seed ports, berths, and cranes into the PortMind database.
Run from src/backend/:  python seed_port_infrastructure.py
"""
import json, urllib.request, urllib.error

BASE = "http://localhost:8000"

def post(path, payload):
    data = json.dumps(payload).encode()
    req  = urllib.request.Request(f"{BASE}{path}", data=data,
                                   headers={"Content-Type": "application/json"},
                                   method="POST")
    try:
        with urllib.request.urlopen(req) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        if e.code == 409 or "already" in body.lower():
            return None  # already exists — skip silently
        print(f"  ERROR {e.code} on {path}: {body[:200]}")
        return None

# ── 18 ports used by demo vessels ─────────────────────────────────────────────
PORTS = [
    ("RTM", "Port of Rotterdam",    "Netherlands",      150000, 120000, 500000, 390000, 400, 16, 300000),
    ("HAM", "Port of Hamburg",      "Germany",          120000,  95000, 420000, 310000, 380, 15, 280000),
    ("ANR", "Port of Antwerp",      "Belgium",          130000, 100000, 460000, 350000, 390, 15, 290000),
    ("OSL", "Port of Oslo",         "Norway",            40000,  28000, 150000, 110000, 300, 12, 180000),
    ("LIS", "Port of Lisbon",       "Portugal",          55000,  40000, 200000, 140000, 350, 13, 210000),
    ("DUB", "Port of Dublin",       "Ireland",           45000,  32000, 160000, 115000, 310, 12, 185000),
    ("LON", "Port of London",       "UK",                80000,  60000, 300000, 220000, 360, 14, 250000),
    ("MRS", "Port of Marseille",    "France",            70000,  52000, 260000, 190000, 370, 14, 240000),
    ("BAR", "Port of Barcelona",    "Spain",             65000,  48000, 240000, 175000, 365, 14, 235000),
    ("VAL", "Port of Valencia",     "Spain",             75000,  55000, 270000, 195000, 370, 14, 245000),
    ("PIR", "Port of Piraeus",      "Greece",            90000,  70000, 330000, 250000, 380, 15, 260000),
    ("IST", "Port of Istanbul",     "Turkey",            85000,  65000, 310000, 235000, 375, 14, 255000),
    ("MUM", "Port of Mumbai",       "India",            110000,  88000, 400000, 300000, 390, 15, 285000),
    ("SIN", "Port of Singapore",    "Singapore",        180000, 145000, 650000, 490000, 420, 17, 350000),
    ("HKG", "Port of Hong Kong",    "China SAR",        170000, 135000, 620000, 465000, 415, 17, 340000),
    ("MEL", "Port of Melbourne",    "Australia",         60000,  44000, 220000, 160000, 345, 13, 215000),
    ("LAX", "Port of Los Angeles",  "USA",              160000, 128000, 580000, 430000, 410, 16, 330000),
    ("NYC", "Port of New York",     "USA",              140000, 110000, 510000, 380000, 400, 16, 315000),
]

# ── Seed ports ────────────────────────────────────────────────────────────────
print("Seeding ports...")
port_ids = {}
for (code, name, loc, max_cap, cur_cap, yard_cap, yard_load,
     max_len, max_draft, max_wt) in PORTS:
    p = post("/api/ports", {
        "port_code": code, "port_name": name, "location": loc,
        "max_daily_capacity_tons":  max_cap,
        "current_cargo_tons":       cur_cap,
        "yard_capacity_tons":       yard_cap,
        "current_yard_load_tons":   yard_load,
        "max_vessel_length_m":      max_len,
        "max_vessel_draft_m":       max_draft,
        "max_vessel_weight_tons":   max_wt,
    })
    if p:
        port_ids[code] = p["id"]
        print(f"  Created port {code} → id={p['id']}")
    else:
        print(f"  Skipped {code} (already exists or error)")

# If ports already existed, fetch them
if not port_ids:
    req = urllib.request.Request(f"{BASE}/api/ports")
    with urllib.request.urlopen(req) as r:
        existing = json.loads(r.read())
    port_ids = {p["port_code"]: p["id"] for p in existing}
    print(f"  Loaded {len(port_ids)} existing ports")

# ── Seed berths (2 per port) ──────────────────────────────────────────────────
print("\nSeeding berths...")
berth_ids = {}  # port_code → [berth_id, ...]
for code, pid in port_ids.items():
    berth_ids[code] = []
    for i in (1, 2):
        b = post("/api/berths", {
            "berth_code":          f"{code}-B{i:02d}",
            "port_id":             pid,
            "capacity_tons":       50000 + i * 5000,
            "max_vessel_length_m": 380,
            "max_vessel_draft_m":  16,
            "status":              "operational",
        })
        if b:
            berth_ids[code].append(b["id"])
            print(f"  Berth {code}-B{i:02d} → id={b['id']}")

# ── Seed cranes (2 per port, attached to first berth) ─────────────────────────
print("\nSeeding cranes...")
for code, pid in port_ids.items():
    first_berth_id = berth_ids.get(code, [None])[0]
    for i in (1, 2):
        c = post("/api/cranes", {
            "crane_code":                  f"{code}-CR{i:02d}",
            "port_id":                     pid,
            "berth_id":                    first_berth_id,
            "loading_rate_tons_per_hour":   280 + i * 20,
            "unloading_rate_tons_per_hour": 260 + i * 20,
            "status":                      "operational",
        })
        if c:
            print(f"  Crane {code}-CR{i:02d} → id={c['id']}")

print("\nDone. Ports, berths, and cranes seeded.")
