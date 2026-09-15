"""
Comprehensive Production Integration Verification Script for PortMind.
Tests all backend API routes directly using FastAPI ASGI transport.
"""
import asyncio
import httpx
from app.main import app
from app.db.database import init_db

async def run_tests():
    print("\n" + "="*70)
    print("PORTMIND PRODUCTION INTEGRATION VERIFICATION")
    print("="*70 + "\n")

    # Ensure DB is initialized
    await init_db()

    passed = 0
    total = 0

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:

        # 1. Health
        total += 1
        r = await client.get("/api/health")
        assert r.status_code == 200, f"Health failed: {r.text}"
        print(f"✓ 1. Health check OK -> {r.json()}")
        passed += 1

        # 2. Predictions Model Info (ML Ensemble)
        total += 1
        r = await client.get("/api/predictions/model-info")
        assert r.status_code == 200
        info = r.json()
        assert info.get("available") is True, f"ML Model not available: {info}"
        print(f"✓ 2. ML Model Info OK -> {info.get('model')}")
        passed += 1

        # 3. Predictions Delay Inference (ML Ensemble)
        total += 1
        r = await client.post("/api/predictions/delay", json={
            "sog": 14.5,
            "cog": 210.0,
            "hdg": 208.0,
            "eta_gap_min": 45.0,
            "lead_time_min": 320.0,
        })
        assert r.status_code == 200, f"Prediction failed: {r.text}"
        pred = r.json()
        print(f"✓ 3. ML Congestion Inference OK -> Flag: {pred.get('congestion_risk_flag')}, Label: {pred.get('congestion_risk_label')}, Score: {pred.get('congestion_risk_score')}")
        passed += 1

        # 4. Vessels list
        total += 1
        r = await client.get("/api/vessels")
        assert r.status_code == 200
        vessels = r.json()
        vessel_id = vessels[0]["id"] if vessels else 1
        print(f"✓ 4. Vessels List OK -> {len(vessels)} vessels tracked (using vessel ID: {vessel_id})")
        passed += 1

        # 5. Reschedule Propose (Gemini / Deterministic Fallback with Constraints)
        total += 1
        r = await client.post("/api/reschedule/propose", json={
            "vessel_id": vessel_id,
            "operational_notes": "Heavy swell and high yard occupancy"
        })
        assert r.status_code == 200, f"Reschedule propose failed: {r.text}"
        prop = r.json()
        print(f"✓ 5. Reschedule Propose OK -> Provider: {prop.get('ai_provider')}, Berth: {prop.get('berth_code')}, Valid: {prop.get('is_constraint_valid')}")
        passed += 1

        # 6. Reschedule Apply (Database Write + History + Notification)
        total += 1
        r = await client.post("/api/reschedule/apply", json={
            "vessel_id": vessel_id,
            "recommended_eta": prop.get("recommended_eta"),
            "berth_code": prop.get("berth_code"),
            "assigned_cranes": prop.get("assigned_cranes"),
            "reason": prop.get("reason"),
        })
        assert r.status_code == 200, f"Reschedule apply failed: {r.text}"
        applied = r.json()
        assert applied.get("success") is True
        print(f"✓ 6. Reschedule Apply OK -> {applied.get('message')}")
        passed += 1

        # 7. Alerts List
        total += 1
        r = await client.get("/api/alerts")
        assert r.status_code == 200
        alerts = r.json()
        print(f"✓ 7. Alerts List OK -> {len(alerts)} alerts in database")
        passed += 1

        # 8. Notifications List
        total += 1
        r = await client.get("/api/notifications")
        assert r.status_code == 200
        notifs = r.json()
        print(f"✓ 8. Notifications List OK -> {len(notifs)} notifications in database")
        passed += 1

        # 9. Audit History List
        total += 1
        r = await client.get("/api/history")
        assert r.status_code == 200
        hist = r.json()
        print(f"✓ 9. Audit History OK -> {len(hist)} operational event logs")
        passed += 1

        # 10. Operator Profile GET & PUT
        total += 1
        r = await client.get("/api/profile")
        assert r.status_code == 200
        prof = r.json()
        print(f"✓ 10a. Profile GET OK -> {prof.get('full_name')} ({prof.get('role')})")

        r = await client.put("/api/profile", json={
            "full_name": prof.get("full_name"),
            "email": prof.get("email"),
            "mobile": prof.get("mobile"),
            "role": "Chief Port Operations Controller",
            "language": "en",
            "notify_email": True,
            "notify_browser": True,
            "notify_high_risk": True,
        })
        assert r.status_code == 200
        print(f"✓ 10b. Profile PUT OK -> Updated role to Chief Port Operations Controller")
        passed += 1

        # 11. Domain-Guarded Chatbot (Maritime Query vs Non-Maritime Query)
        total += 1
        # 11a: Maritime query
        r = await client.post("/api/chat", json={
            "message": "What is the congestion status and which vessels are delayed?",
            "history": []
        })
        assert r.status_code == 200
        chat_res = r.json()
        print(f"✓ 11a. Maritime Chat OK -> Reply preview: {chat_res.get('reply')[:80]}...")

        # 11b: Non-maritime query (Domain Guard Refusal)
        r = await client.post("/api/chat", json={
            "message": "Write a poem about sunflowers in spring",
            "history": []
        })
        assert r.status_code == 200
        guard_res = r.json()
        assert "port operations" in guard_res.get("reply", "").lower() or "maritime" in guard_res.get("reply", "").lower() or "apologize" in guard_res.get("reply", "").lower(), f"Guard didn't refuse: {guard_res}"
        print(f"✓ 11b. Chatbot Domain Guard OK -> Correctly refused non-maritime query: {guard_res.get('reply')[:60]}...")
        passed += 1

        # 12. Reports Analytics
        total += 1
        r = await client.get("/api/reports/analytics")
        assert r.status_code == 200
        rep = r.json()
        fleet = rep.get("fleet", {})
        print(f"✓ 12. Reports Analytics OK -> Fleet: {fleet.get('total_vessels')} total, {fleet.get('high_risk')} high risk. Berth util: {rep.get('berth_utilization_pct')}%")
        passed += 1

        # 13. Operations 72-Hour Plan
        total += 1
        r = await client.get("/api/operations/plan")
        assert r.status_code == 200
        plan = r.json()
        windows = plan.get("windows", [])
        print(f"✓ 13. Operations 72-Hour Plan OK -> {len(windows)} time windows scheduled")
        passed += 1

    print("\n" + "="*70)
    print(f"ALL {passed}/{total} INTEGRATION TESTS PASSED PERFECTLY!")
    print("="*70 + "\n")

if __name__ == "__main__":
    asyncio.run(run_tests())
