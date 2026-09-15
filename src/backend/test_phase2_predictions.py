"""
Phase 2 prediction integration tests.
Run against the live server: python test_phase2_predictions.py

Tests:
  1. GET  /api/health         — still works
  2. GET  /api/predictions/model-info — model status
  3. POST /api/predictions/delay      — valid full input
  4. POST /api/predictions/delay      — minimal input (all nulls, imputed)
  5. POST /api/predictions/delay      — bad cog value (>=360) → 422
  6. GET  /api/vessels        — existing CRUD unaffected
"""
import asyncio
import httpx

BASE = "http://localhost:8000/api"
results: list[str] = []


def ok(label: str, cond: bool, detail: str = "") -> None:
    tag = "PASS" if cond else "FAIL"
    results.append(f"[{tag}] {label}" + (f" — {detail}" if detail else ""))


async def run() -> None:
    async with httpx.AsyncClient(timeout=15) as c:

        # 1. Health still works
        r = await c.get(f"{BASE}/health")
        ok("GET /health -> 200", r.status_code == 200)
        body = r.json()
        ok("Health response shape", body.get("success") is True and body.get("status") == "healthy")

        # 2. Model info endpoint
        r = await c.get(f"{BASE}/predictions/model-info")
        ok("GET /predictions/model-info -> 200", r.status_code == 200)
        info = r.json()
        ok("model-info has 'available' key", "available" in info)
        ok("model-info has 'model' key", "model" in info)

        model_available = info.get("available", False)
        print(f"\n  [info] Model available: {model_available}")
        if not model_available:
            print(f"  [info] Reason: {info.get('error', 'unknown')}")

        # 3. Full valid prediction request
        full_payload = {
            "lat": 51.9,
            "long": 4.5,
            "sog": 12.5,
            "cog": 245.0,
            "hdg": 248.0,
            "eta_gap_min": 15.0,
            "etd_gap_min": 0.0,
            "lead_time_min": 180.0,
            "snapshot_hour": 14,
            "snapshot_dow": 2,
            "snapshot_month": 7,
            "eta_hour": 17,
            "eta_dow": 2,
            "eta_month": 7,
            "dep_port": "NLRTM",
            "arr_port": "DEHAM",
        }
        r = await c.post(f"{BASE}/predictions/delay", json=full_payload)
        if model_available:
            ok("POST /predictions/delay (full) -> 200", r.status_code == 200, r.text[:120])
            pred = r.json()
            ok("Response has congestion_risk_label", "congestion_risk_label" in pred)
            ok("Response has congestion_risk_flag",  "congestion_risk_flag"  in pred)
            ok("Response has congestion_risk_score", "congestion_risk_score" in pred)
            ok("Response has threshold",             "threshold"             in pred)
            ok(
                "congestion_risk_flag is 0 or 1",
                pred.get("congestion_risk_flag") in (0, 1),
            )
            ok(
                "congestion_risk_score in [0,1]",
                0.0 <= pred.get("congestion_risk_score", -1) <= 1.0,
            )
            ok(
                "congestion_risk_label is valid",
                pred.get("congestion_risk_label") in ("Normal", "Congestion Risk"),
            )
        else:
            ok(
                "POST /predictions/delay (model absent) -> 503",
                r.status_code == 503,
                r.text[:120],
            )

        # 4. Minimal payload — all feature fields omitted (imputed by pipeline)
        r = await c.post(f"{BASE}/predictions/delay", json={})
        if model_available:
            ok("POST /predictions/delay (all-null) -> 200", r.status_code == 200, r.text[:80])
        else:
            ok("POST /predictions/delay (all-null, model absent) -> 503", r.status_code == 503)

        # 5. Validation error: cog must be < 360
        r = await c.post(f"{BASE}/predictions/delay", json={"cog": 370.0})
        ok("POST /predictions/delay (cog=370) -> 422", r.status_code == 422, r.text[:80])

        # 6. Existing vessels endpoint unaffected
        r = await c.get(f"{BASE}/vessels")
        ok("GET /api/vessels -> 200", r.status_code == 200)

    passed = sum(1 for r in results if r.startswith("[PASS]"))
    total  = len(results)
    print("\n" + "\n".join(results))
    print(f"\n=== {passed}/{total} PASSED  |  {total - passed} FAILED ===")


asyncio.run(run())
