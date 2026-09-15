"""Phase 2 CRUD + validation integration tests (run against live server)."""
import asyncio
import sqlite3
import httpx

BASE = "http://localhost:8000/api"
results = []


def ok(label, cond, detail=""):
    status = "PASS" if cond else "FAIL"
    results.append(f"[{status}] {label}" + (f" — {detail}" if detail else ""))


async def run():
    async with httpx.AsyncClient(timeout=10) as c:

        # ── Health ──────────────────────────────────────────────────────────
        r = await c.get(f"{BASE}/health")
        ok("GET /health -> 200", r.status_code == 200)

        # ── Port CRUD ───────────────────────────────────────────────────────
        r = await c.post(f"{BASE}/ports", json={
            "port_code": "SGSIN", "port_name": "Port of Singapore",
            "location": "Singapore",
            "max_daily_capacity_tons": 100000, "current_cargo_tons": 40000,
            "yard_capacity_tons": 50000, "current_yard_load_tons": 20000,
            "max_vessel_length_m": 400, "max_vessel_draft_m": 17,
            "max_vessel_weight_tons": 250000,
        })
        ok("POST /ports -> 201", r.status_code == 201, r.text[:80])
        port = r.json()
        pid = port["id"]

        r = await c.get(f"{BASE}/ports")
        ok("GET /ports -> list has 1", r.status_code == 200 and len(r.json()) >= 1)

        r = await c.get(f"{BASE}/ports/{pid}")
        ok("GET /ports/{id} -> 200", r.status_code == 200)
        ok("Port detail has berths+cranes", "berths" in r.json() and "cranes" in r.json())

        r = await c.put(f"{BASE}/ports/{pid}", json={"location": "SG, Singapore"})
        ok("PUT /ports/{id} -> 200", r.status_code == 200)
        ok("Location updated", r.json()["location"] == "SG, Singapore")

        # ── Port validation ─────────────────────────────────────────────────
        r = await c.post(f"{BASE}/ports", json={
            "port_code": "SGSIN", "port_name": "Dup",
            "max_daily_capacity_tons": 0, "current_cargo_tons": 0,
            "yard_capacity_tons": 0, "current_yard_load_tons": 0,
        })
        ok("Duplicate port_code -> 409", r.status_code == 409)

        r = await c.post(f"{BASE}/ports", json={
            "port_code": "BAD1", "port_name": "Bad",
            "max_daily_capacity_tons": 100, "current_cargo_tons": 9999,
            "yard_capacity_tons": 0, "current_yard_load_tons": 0,
        })
        ok("cargo > capacity -> 422", r.status_code == 422)

        r = await c.post(f"{BASE}/ports", json={
            "port_code": "BAD2", "port_name": "Bad2",
            "max_daily_capacity_tons": 100, "current_cargo_tons": 0,
            "yard_capacity_tons": 50, "current_yard_load_tons": 9999,
        })
        ok("yard_load > yard_capacity -> 422", r.status_code == 422)

        # ── Berth CRUD ──────────────────────────────────────────────────────
        r = await c.post(f"{BASE}/berths", json={
            "berth_code": "B-01", "port_id": pid, "capacity_tons": 5000,
            "max_vessel_length_m": 300, "max_vessel_draft_m": 14,
            "status": "operational",
        })
        ok("POST /berths B-01 -> 201", r.status_code == 201, r.text[:80])
        bid1 = r.json()["id"]

        r = await c.post(f"{BASE}/berths", json={
            "berth_code": "B-02", "port_id": pid,
            "capacity_tons": 6000, "status": "operational",
        })
        ok("POST /berths B-02 -> 201", r.status_code == 201)
        bid2 = r.json()["id"]

        r = await c.get(f"{BASE}/berths?port_id={pid}")
        ok("GET /berths?port_id -> 2 berths", r.status_code == 200 and len(r.json()) == 2)

        r = await c.get(f"{BASE}/berths?status=operational")
        ok("GET /berths?status filter", r.status_code == 200 and len(r.json()) >= 2)

        r = await c.put(f"{BASE}/berths/{bid1}", json={"status": "occupied"})
        ok("PUT /berths/{id} status -> occupied", r.status_code == 200 and r.json()["status"] == "occupied")

        r = await c.post(f"{BASE}/berths", json={
            "berth_code": "B-01", "port_id": pid,
            "capacity_tons": 0, "status": "operational",
        })
        ok("Duplicate berth_code in port -> 409", r.status_code == 409)

        r = await c.post(f"{BASE}/berths", json={
            "berth_code": "B-03", "port_id": pid,
            "capacity_tons": 0, "status": "flying",
        })
        ok("Invalid berth status -> 422", r.status_code == 422)

        r = await c.post(f"{BASE}/berths", json={
            "berth_code": "B-99", "port_id": 99999,
            "capacity_tons": 0, "status": "operational",
        })
        ok("Berth to nonexistent port -> 404", r.status_code == 404)

        # ── Crane CRUD ──────────────────────────────────────────────────────
        r = await c.post(f"{BASE}/cranes", json={
            "crane_code": "CR-01", "port_id": pid, "berth_id": bid1,
            "loading_rate_tons_per_hour": 50,
            "unloading_rate_tons_per_hour": 45,
            "status": "operational",
        })
        ok("POST /cranes CR-01 -> 201", r.status_code == 201, r.text[:80])
        cid1 = r.json()["id"]

        r = await c.post(f"{BASE}/cranes", json={
            "crane_code": "CR-02", "port_id": pid, "berth_id": None,
            "loading_rate_tons_per_hour": 60,
            "unloading_rate_tons_per_hour": 55,
            "status": "operational",
        })
        ok("POST /cranes CR-02 (no berth) -> 201", r.status_code == 201)
        cid2 = r.json()["id"]

        r = await c.get(f"{BASE}/cranes?port_id={pid}")
        ok("GET /cranes?port_id -> 2 cranes", r.status_code == 200 and len(r.json()) == 2)

        r = await c.get(f"{BASE}/cranes?berth_id={bid1}")
        ok("GET /cranes?berth_id -> 1 crane", r.status_code == 200 and len(r.json()) == 1)

        r = await c.put(f"{BASE}/cranes/{cid1}", json={"status": "maintenance"})
        ok("PUT /cranes/{id} -> maintenance", r.status_code == 200 and r.json()["status"] == "maintenance")

        r = await c.post(f"{BASE}/cranes", json={
            "crane_code": "CR-BAD", "port_id": pid,
            "loading_rate_tons_per_hour": 0,
            "unloading_rate_tons_per_hour": 10,
            "status": "operational",
        })
        ok("Crane rate=0 -> 422", r.status_code == 422)

        r = await c.post(f"{BASE}/cranes", json={
            "crane_code": "CR-01", "port_id": pid,
            "loading_rate_tons_per_hour": 5,
            "unloading_rate_tons_per_hour": 5,
            "status": "operational",
        })
        ok("Duplicate crane_code in port -> 409", r.status_code == 409)

        r = await c.post(f"{BASE}/cranes", json={
            "crane_code": "CR-X", "port_id": 99999,
            "loading_rate_tons_per_hour": 5,
            "unloading_rate_tons_per_hour": 5,
            "status": "operational",
        })
        ok("Crane to nonexistent port -> 404", r.status_code == 404)

        # Cross-port berth assignment
        r2 = await c.post(f"{BASE}/ports", json={
            "port_code": "NLRTM", "port_name": "Port of Rotterdam",
            "max_daily_capacity_tons": 200000, "current_cargo_tons": 0,
            "yard_capacity_tons": 80000, "current_yard_load_tons": 0,
        })
        pid2 = r2.json()["id"]
        r = await c.post(f"{BASE}/cranes", json={
            "crane_code": "CR-CROSS", "port_id": pid2, "berth_id": bid1,
            "loading_rate_tons_per_hour": 5,
            "unloading_rate_tons_per_hour": 5,
            "status": "operational",
        })
        ok("Crane berth in wrong port -> 422", r.status_code == 422)

        # ── Delete ──────────────────────────────────────────────────────────
        r = await c.delete(f"{BASE}/cranes/{cid1}")
        ok("DELETE /cranes/{id} -> 204", r.status_code == 204)

        r = await c.delete(f"{BASE}/berths/{bid2}")
        ok("DELETE /berths/{id} -> 204", r.status_code == 204)

        r = await c.delete(f"{BASE}/ports/{pid2}")
        ok("DELETE /ports/{id} -> 204", r.status_code == 204)

        r = await c.get(f"{BASE}/berths?port_id={pid}")
        ok("1 berth remains after delete", len(r.json()) == 1)

        r = await c.get(f"{BASE}/cranes?port_id={pid}")
        ok("1 crane remains after delete", len(r.json()) == 1)

        # Cascade delete port -> removes all berths + cranes
        r = await c.delete(f"{BASE}/ports/{pid}")
        ok("Port cascade delete -> 204", r.status_code == 204)

        r = await c.get(f"{BASE}/berths")
        ok("Berths empty after cascade", len(r.json()) == 0)
        r = await c.get(f"{BASE}/cranes")
        ok("Cranes empty after cascade", len(r.json()) == 0)

        # ── DB tables ───────────────────────────────────────────────────────
        conn = sqlite3.connect("port_congestion.db")
        tables = {row[0] for row in conn.execute(
            "SELECT name FROM sqlite_master WHERE type='table'"
        ).fetchall()}
        conn.close()
        ok("DB has 'ports' table",  "ports"  in tables)
        ok("DB has 'berths' table", "berths" in tables)
        ok("DB has 'cranes' table", "cranes" in tables)

    passed = sum(1 for r in results if r.startswith("[PASS]"))
    total  = len(results)
    print("\n".join(results))
    print(f"\n=== {passed}/{total} PASSED  |  {total - passed} FAILED ===")


asyncio.run(run())
