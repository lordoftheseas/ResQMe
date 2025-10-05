import os
from supabase import create_client, Client
import serial, time, re
import ast


PORT = "COM5"
BAUD = 115200

ser = serial.Serial(PORT, BAUD, timeout=1)
time.sleep(2)

supabaseUrl : str = 'https://rpwjnihpvrhhknnzvhav.supabase.co/';
supabaseAnonKey : str = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwd2puaWhwdnJoaGtubnp2aGF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1NDk1NzAsImV4cCI6MjA3NTEyNTU3MH0.SE-NNz7nj49qkCsBfUMfUchV6gbvcf03Pm80H6_P3zw';
supabase: Client = create_client(supabaseUrl, supabaseAnonKey)

print(f"Connected to port {PORT} at {BAUD} baud. \n")

try:
    while True:
        if ser.in_waiting >0:
            line = ser.readline().decode("utf-8", errors="ignore", ).strip()
            json = re.findall(r'{"device_id":.*"message".*}', line)
            # if (len(json) > 0):
            #     with open("data.json", "a") as f:
            #         f.write(json[0] + "\n")

            if line:
                
                if len(json) > 0:
                    parsed = ast.literal_eval(json[0])
                    print(parsed)
                    
                
                    
                    response = (
                        supabase.table("esp_signals")
                        .insert({"device_id": parsed["device_id"],"status": parsed["status"], "user_id": parsed["userid"] , "sensors": {"gps": {"latitude":parsed["sensors"]["gps"]["latitude"], "longitude":parsed["sensors"]["gps"]["longitude"]}}, "message":parsed["message"]})
                        .execute()
    )
                    
                    # response = supabase.table("esp_signals").select("*").execute()
                    print(response)
    

                    print(f"got: {json}")
                    


except KeyboardInterrupt:
    print("\nexiting")