import os
from supabase import create_client, Client
import serial, time, re
import ast

ser = serial.Serial('COM5', 115200, timeout=1)
time.sleep(2) 

supabaseUrl : str = '';
supabaseAnonKey : str = '';
supabase: Client = create_client(supabaseUrl, supabaseAnonKey)

response = (supabase.table("sos_alerts")).select("*").order("created_at", desc=True).execute()

last = response.data[0]["id"]

while True:
    new_response = (supabase.table("sos_alerts")).select("*").order("created_at", desc=True).execute()
    if last == new_response.data[0]["id"]:
        pass
    else:
        ser.write(new_response.data[0]["message"])
        last = new_response.data[0]["id"]
        
    

    
