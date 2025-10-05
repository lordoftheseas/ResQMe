import os
import time
import json
import re
import threading
import serial
from uuid import UUID
from supabase import create_client, Client

# ------------------ CONFIG ------------------
PORT = "COM5"
BAUD = 115200

SUPABASE_URL = "https://rpwjnihpvrhhknnzvhav.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwd2puaWhwdnJoaGtubnp2aGF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1NDk1NzAsImV4cCI6MjA3NTEyNTU3MH0.SE-NNz7nj49qkCsBfUMfUchV6gbvcf03Pm80H6_P3zw"

SIGNALS_TABLE = "esp_signals"
ALERTS_TABLE  = "sos_alerts"
UPSERT_BY_DEVICE_ID = False
# --------------------------------------------

ser = serial.Serial(PORT, BAUD, timeout=1)
time.sleep(2)
print(f"Connected to port {PORT} at {BAUD} baud.\n")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
ser_lock = threading.Lock()

# keep your original regex exactly
ORIG_PATTERN = r'{"device_id":.*"message".*}'

def parse_json_line(line: str):
    line = line.strip()
    print(line)
    if not line:
        return None
    matches = re.findall(ORIG_PATTERN, line)
    if not matches:
        return None
    try:
        return json.loads(matches[0])
    except json.JSONDecodeError:
        return None

def uuid_or_none(val):
    """Return a string UUID if valid, else None (so DB gets NULL)."""
    if not val:   # handles "" and None
        return None
    try:
        return str(UUID(str(val)))
    except Exception:
        return None

def serial_reader_loop():
    while True:
        try:
            if ser.in_waiting > 0:
                raw = ser.readline().decode("utf-8", errors="ignore").strip()
                if not raw:
                    continue

                parsed = parse_json_line(raw)
                if not parsed:
                    continue
                # Extract fields safely
                device_id = parsed.get("device_id")
                status    = parsed.get("status")
                user_id   = uuid_or_none(parsed.get("userid") or parsed.get("user_id"))
                sensors   = (parsed.get("sensors") or {}).get("gps") or {}
                lat       = sensors.get("latitude")
                lon       = sensors.get("longitude")
                message   = parsed.get("message")

                # Build payload; include user_id even if None (NULL in DB)
                
                

                payload = {
                    "device_id": device_id,
                    "status": status,
                    "user_id": user_id,
                    "sensors": {
                        "gps": {
                            "latitude":  lat,
                            "longitude": lon,
                        }
                    },
                    "message": message,
                }
                if not user_id:
                    resp = False
                else:
                    # print("nog1")
                    resp = (
                        supabase.table(SIGNALS_TABLE)
                        .insert(payload)
                        .execute()
                    )
                    # print("log")

                if resp and getattr(resp, "data", None):
                    print("Inserted:", resp.data)
                else:
                    print("Insert attempted.")

            time.sleep(0.02)
        except Exception as e:
            print("Serial read loop error:", e)
            time.sleep(0.5)

def get_latest_alert():
    try:
        resp = (
            supabase.table(ALERTS_TABLE)
            .select("id,message,created_at")
            .order("created_at", desc=True)
            .order("id", desc=True)
            .limit(1)
            .execute()
        )
        return resp.data[0] if resp.data else None
    except Exception as e:
        print("Supabase fetch failed:", e)
        return None

def alerts_poller_loop(poll_interval=0.5):
    last_id = None
    first = get_latest_alert()
    if first:
        last_id = first["id"]

    while True:
        try:
            latest = get_latest_alert()
            if latest and latest["id"] != last_id:
                msg = latest.get("message") or ""
                with ser_lock:
                    ser.write((str(msg) + "\n").encode("utf-8"))
                print("Sent to serial:", repr(msg))
                last_id = latest["id"]
            time.sleep(poll_interval)
        except Exception as e:
            print("Alerts poller error:", e)
            time.sleep(1.0)

def main():
    t_reader = threading.Thread(target=serial_reader_loop, daemon=True)
    t_poller = threading.Thread(target=alerts_poller_loop, daemon=True)
    t_reader.start()
    t_poller.start()

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nExiting…")
    finally:
        try:
            ser.close()
        except Exception:
            pass

if __name__ == "__main__":
    main()
