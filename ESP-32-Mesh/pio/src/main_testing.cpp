#include <Arduino.h>
#include <WiFi.h>
#include <TinyGPSPlus.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
// #include <BluetoothSerial.h>   // NEW
// #include "esp_bt_main.h"
// #include "esp_bt_device.h"
#include <painlessMesh.h>
#include <WebServer.h>
#include <DNSServer.h>
#include <ArduinoJson.h>
#include <AsyncTCP.h>

#define MESH_PREFIX "ResQMe_Net"
#define MESH_PASSWORD "mesh-password5"
#define MESH_PORT 5555

const char *AP_SSID = "ResQMe_Node";
const char *AP_PASS = "12345678";

const bool IS_MASTER = false; // <-- change to false on client boards
Scheduler userScheduler;
painlessMesh mesh;
uint32_t masterId = 0; // learned by children at runtime (0 = unknown)
const bool DEBUG_SERIAL = false;

IPAddress local_IP(192, 168, 4, 1);      // desired IP
IPAddress gateway(192, 168, 4, 1);       // usually same as local_IP for AP
IPAddress subnet(255, 255, 255, 0);      // standard subnet mask
const uint32_t ALERT_DISPLAY_MS = 30000; // show alerts for 30s (match your buzz)

enum Mode
{
  MODE_MESH,
  MODE_AP
};
Mode currentMode = MODE_MESH;
bool wantAPShutdown = false;
unsigned long apShutdownAt = 0;
String storedValue = "";

// --- AP wait-for-login blink state (non-blocking) ---
bool apHasClient = false; // becomes true when a station connects
bool blinkActive = false; // blinking only while waiting for first client
unsigned long nextBlinkAt = 0;
bool ledState = false; // current LED state during blink

// ================== USER CONFIG ==================
static const char *USER_ID = "USER_001";
uint8_t MASTER_MAC[6] = {0x24, 0x6F, 0x28, 0xAA, 0xBB, 0xCC};
// Pins
#define PIN_GPS_RX 16
#define PIN_GPS_TX 17
#define PIN_LED_BLUE 26
#define PIN_LED_RED 27
#define PIN_BUTTON 14
#define PIN_BUZZER 25
// Buzzer Properties
#define BUZZER_CHANNEL 0
#define BUZZER_FREQ 2000 // 2 kHz tone
#define BUZZER_RES 8     // 8-bit resolution
// OLED
#define OLED_WIDTH 128
#define OLED_HEIGHT 32
#define OLED_ADDR 0x3C
#define OLED_RESET -1
// Button timing (ms)
#define DEBOUNCE_MS 35
#define MULTICLICK_GAP 450
#define LONGPRESS_MS 3000
// Send period
#define SEND_PERIOD_MS 1000
// Bluetooth
// ================== END USER CONFIG ==============

IPAddress apIP(192, 168, 4, 1);

// ======== Global objects ========
WebServer server(80);
DNSServer dnsServer;

// ======== HTML Page ========

// ======== Handlers ========

String USERID = "";
// GPS
HardwareSerial GPS(1);
TinyGPSPlus gps;

// OLED
Adafruit_SSD1306 display(OLED_WIDTH, OLED_HEIGHT, &Wire, OLED_RESET);
void beepLED(int pin, int durationMs, int repeat);
void stopMesh();
void startAP();
void stopAP();
void startMesh();
// State
String modeText = "Mode: Safe mode";
String lastEventText = "";
unsigned long eventTextUntil = 0;
// Button handling
enum ButtonEvent
{
  BTN_NONE,
  BTN_SINGLE,
  BTN_LONG,
  BTN_TRIPLE
};
struct ButtonState
{
  bool lastLevel = HIGH;
  unsigned long lastChange = 0;
  unsigned long pressStart = 0;
  int clickCount = 0;
  bool longReported = false;
} btn;
void buzz(uint16_t ms, uint32_t freq = BUZZER_FREQ);
volatile bool buzzing = false;
uint32_t buzzOffAt = 0;

void startBuzz(uint32_t ms, uint32_t freq = BUZZER_FREQ)
{
  ledcWriteTone(BUZZER_CHANNEL, freq); // start tone immediately
  buzzing = true;
  buzzOffAt = millis() + ms;
}
inline void showAlertOnScreen(const String &msg)
{
  lastEventText = msg;
  eventTextUntil = millis() + ALERT_DISPLAY_MS;
}

void serviceBuzz()
{
  if (buzzing && (int32_t)(millis() - buzzOffAt) >= 0)
  {
    ledcWriteTone(BUZZER_CHANNEL, 0); // stop tone
    buzzing = false;
  }
}
void announceMaster()
{
  if (IS_MASTER)
  {
    String msg = "MASTER:" + String(mesh.getNodeId());
    mesh.sendBroadcast(msg);
    if (DEBUG_SERIAL)
      Serial.printf("[MASTER] Announced: %s\n", msg.c_str());
  }
}
void sendToMaster(const String &payload)
{
  if (IS_MASTER)
  {
    if (DEBUG_SERIAL)
      Serial.println("[MASTER] sendToMaster() called on master; ignoring");
    return;
  }
  if (masterId == 0)
  {
    if (DEBUG_SERIAL)
      Serial.println("[CLIENT] Master unknown; will retry later");
    return;
  }

  StaticJsonDocument<256> doc;
  doc["device_id"] = WiFi.macAddress();
  doc["status"] = "active";
  doc["userid"] = USERID;
  JsonObject sensors = doc.createNestedObject("sensors");
  JsonObject gps_data = sensors.createNestedObject("gps");
  gps_data["latitude"] = gps.location.lat();
  gps_data["longitude"] = gps.location.lng();
  doc["message"] = payload;
  String doc_string;
  serializeJson(doc, doc_string);
  mesh.sendSingle(masterId, doc_string);
  if (DEBUG_SERIAL)
    Serial.printf("[CLIENT] -> master(%u): %s\n", masterId, doc_string.c_str());
}
void askWhoIsMaster()
{
  mesh.sendBroadcast("WHO_IS_MASTER?");
  if (DEBUG_SERIAL)
    Serial.println("[CLIENT] Asked: WHO_IS_MASTER?");
}

void meshReceived(uint32_t from, String &msg)
{
  if (msg == "WHO_IS_MASTER?")
  {
    if (IS_MASTER)
      announceMaster();
    return;
  }
  if (msg.startsWith("MASTER:"))
  {
    masterId = msg.substring(7).toInt();
    if (DEBUG_SERIAL)
      Serial.printf("[RX] Learned masterId=%u from %u\n", masterId, from);
    // lastEventText=msg;
    return;
  }

  if (msg.startsWith("ALERT:"))
  {
    // do something

    lastEventText = msg;

    // display.print(msg);
    // display.display();
    showAlertOnScreen(msg); // or: lastEventText = msg; eventTextUntil = millis() + ALERT_DISPLAY_MS;
    startBuzz(30000);
    return;
  }

  if (IS_MASTER)
  {
    Serial.printf("[MASTER] RX from %u: %s\n", from, msg.c_str());
    mesh.sendSingle(from, String("ACK:") + msg);
    return;
  }
  else
  {
    if (msg.startsWith("ACK:"))
    {
      if (DEBUG_SERIAL)
        Serial.printf("[CLIENT] %s\n", msg.c_str());
      return;
    }
  }
  if (DEBUG_SERIAL)
    Serial.printf("[RX] from %u: %s\n", from, msg.c_str());
}
void buzz(uint16_t ms, uint32_t freq)
{
  ledcWriteTone(BUZZER_CHANNEL, freq); // start tone
  vTaskDelay(ms / portTICK_PERIOD_MS);
  ledcWriteTone(BUZZER_CHANNEL, 0); // stop tone
}
// tasks
Task taskAnnounce(TASK_SECOND * 5, TASK_FOREVER, []()
                  { if (IS_MASTER) announceMaster(); });
Task taskQueryMaster(TASK_SECOND * 3, TASK_FOREVER, []()
                     { if (!IS_MASTER && masterId == 0) askWhoIsMaster(); });
Task taskSendToMaster(TASK_SECOND * 2, TASK_FOREVER, []()
                      {
  if (!IS_MASTER && masterId != 0) {
    String msg;
    if(storedValue != ""){
      msg = storedValue;
      sendToMaster(msg);
      storedValue = "";
    }
  } });
Task taskReport(TASK_SECOND * 5, TASK_FOREVER, []()
                {
  auto nodes = mesh.getNodeList();
 if (DEBUG_SERIAL)  Serial.printf("[Node %u] neighbors (%u): ", mesh.getNodeId(), nodes.size());
  // for (auto &n : nodes) Serial.printf("%u ", n);
 if (DEBUG_SERIAL)  Serial.println(); });

void meshNewConnection(uint32_t nodeId)
{
  Serial.printf("[EVENT] New connection: %u\n", nodeId);
  if (IS_MASTER)
    announceMaster();
  if (!IS_MASTER && masterId == 0)
    askWhoIsMaster();
}

void meshChanged()
{
  if (DEBUG_SERIAL)
    Serial.println("[EVENT] Topology changed");
  if (IS_MASTER)
  {
    announceMaster();
  }
  else if (masterId != 0)
  {
    bool stillThere = false;
    for (auto &n : mesh.getNodeList())
      if (n == masterId)
      {
        stillThere = true;
        break;
      }
    if (!stillThere)
    {
      if (DEBUG_SERIAL)
        Serial.println("[CLIENT] Master lost; rediscovering");
      masterId = 0;
      askWhoIsMaster();
    }
  }
}

// LEDs + buzzer helpers
void setBlue(bool on) { digitalWrite(PIN_LED_BLUE, on); }
void setRed(bool on) { digitalWrite(PIN_LED_RED, on); }

// Draw UI
void drawScreen()
{

  display.clearDisplay();
  display.setTextColor(SSD1306_WHITE);
  display.setTextSize(1);
  display.setCursor(0, 0);
  if (millis() < eventTextUntil && lastEventText.length())
  {
    display.print(lastEventText);
  }
  else
  {
    display.print(modeText);
  }
  if (currentMode == MODE_MESH)
  {
    auto nodes = mesh.getNodeList();
    display.setCursor(0, 12);
    display.printf("Connected to %u node", nodes.size());
    // if (gps.location.isValid()) display.printf("Lat: %.5f", gps.location.lat());
    // else display.print("Lat: ---");
    // display.setCursor(0,22);
    // if (gps.location.isValid()) display.printf("Lon: %.5f", gps.location.lng());
    // else display.print("Lon: ---");
  }
  else
  {
    display.setCursor(0, 12);
    display.print("Connect to ");
    display.print(AP_SSID);
  }
  // something when eifi is active
  static unsigned long lastDraw = 0;
  if (millis() - lastDraw > 200)
  {
    display.display();
    lastDraw = millis();
  }
}

// Report event
void reportEvent(ButtonEvent ev)
{
  switch (ev)
  {
  case BTN_SINGLE: // show status
    lastEventText = "SOS Help Sent";
    sendToMaster("SOS Help Needed");
    beepLED(PIN_LED_RED, 50, 3);
    break;
  case BTN_LONG: // start the wifi for connection
    // Blue beeps until wifi connection is done and then turns off when wifi is off
    lastEventText = "Wifi Pairing Mode On";
    currentMode = MODE_AP;
    stopMesh();
    vTaskDelay(150 / portTICK_PERIOD_MS);
    startAP();
    break;
  case BTN_TRIPLE:
    // send SOS signal
    setBlue(true);
    vTaskDelay(60);
    setBlue(false);
    lastEventText = "ResQMe Node";
    currentMode = MODE_MESH;
    beepLED(PIN_LED_BLUE, 50, 3);
    stopAP();
    vTaskDelay(150 / portTICK_PERIOD_MS);
    startMesh();
    vTaskDelay(300 / portTICK_PERIOD_MS);
    break;
  default:
    return;
  }
  eventTextUntil = millis() + 2000;
}

ButtonEvent pollButton()
{
  ButtonEvent ret = BTN_NONE;
  bool level = digitalRead(PIN_BUTTON);

  if (level != btn.lastLevel && (millis() - btn.lastChange) > DEBOUNCE_MS)
  {
    btn.lastLevel = level;
    btn.lastChange = millis();

    if (level == LOW)
    {
      btn.pressStart = millis();
      btn.longReported = false;
    }
    else
    {
      // release
      unsigned long pressDur = millis() - btn.pressStart;
      if (pressDur < LONGPRESS_MS && btn.clickCount < 3)
      {
        btn.clickCount++;
      }
    }
  }

  // Long press detect
  if (btn.lastLevel == LOW && !btn.longReported &&
      (millis() - btn.pressStart) >= LONGPRESS_MS)
  {
    btn.longReported = true;
    btn.clickCount = 0;
    ret = BTN_LONG;
  }

  // Multi-click detect
  static unsigned long lastReleaseTime = 0;
  if (btn.lastLevel == HIGH && btn.clickCount > 0)
  {
    if (lastReleaseTime == 0)
      lastReleaseTime = btn.lastChange;
    if ((millis() - lastReleaseTime) > MULTICLICK_GAP)
    {
      if (btn.clickCount >= 3)
        ret = BTN_TRIPLE;
      else if (btn.clickCount == 1)
        ret = BTN_SINGLE;
      btn.clickCount = 0;
      lastReleaseTime = 0;
    }
  }
  else if (btn.lastLevel == LOW)
  {
    lastReleaseTime = 0;
  }
  return ret;
}

void pumpGPS()
{
  while (GPS.available())
    gps.encode(GPS.read());
}

// ================== SETUP/LOOP ==================
unsigned long lastSend = 0;

void handleNotFound()
{
  server.sendHeader("Location", String("http://") + apIP.toString(), true);
  server.send(302, "text/plain", "");
}
void handleSubmit()
{
  if (server.hasArg("msg"))
  {
    String msg = server.arg("msg");
    storedValue = server.arg("msg");
    Serial.print("Received input: ");
    Serial.println(msg);
    String response = "<html><body><h2>Message Received:</h2><p>" + msg + "</p><a href='/'>Go Back</a></body></html>";
    server.send(200, "text/html", response);
    wantAPShutdown = true;
    apShutdownAt = millis() + 1500;
  }
  else
  {
    server.send(400, "text/plain", "Missing 'msg' parameter");
  }
}

void handleUserIdSetup()
{
  if (server.hasArg("userid"))
  {
    String userid = server.arg("userid");
    Serial.print("UserId: ");
    Serial.println(userid);
    USERID = userid;
    uint8_t mac[6];
    WiFi.macAddress(mac);
    char macStr[18];
    sprintf(macStr, "%02X:%02X:%02X:%02X:%02X:%02X",
            mac[0], mac[1], mac[2], mac[3], mac[4], mac[5]);
    String res = "{\"userid\":\"" + userid + "\",\"mac\":\"" + String(macStr) + "\"}";
    server.send(200, "text/plain", res);
    // wantAPShutdown = true; // ap shutdown
    //  apShutdownAt = millis() + 500;
  }
  else
  {
    server.send(400, "text/plain", "Missing 'userid' parameter");
  }
}

void startMesh()
{
  if (DEBUG_SERIAL)
    Serial.println("[MESH] init");
  mesh.setDebugMsgTypes(ERROR | STARTUP | CONNECTION);
  mesh.init(MESH_PREFIX, MESH_PASSWORD, &userScheduler, MESH_PORT);
  mesh.onReceive(&meshReceived);
  mesh.onNewConnection(&meshNewConnection);
  mesh.onChangedConnections(&meshChanged);

  userScheduler.addTask(taskReport);
  taskReport.enable();
  userScheduler.addTask(taskAnnounce);
  if (IS_MASTER)
    taskAnnounce.enable();
  userScheduler.addTask(taskQueryMaster);
  if (!IS_MASTER)
    taskQueryMaster.enable();
  userScheduler.addTask(taskSendToMaster);
  if (!IS_MASTER)
    taskSendToMaster.enable();

  if (IS_MASTER)
    announceMaster();
  else
    askWhoIsMaster();
  if (DEBUG_SERIAL)
    Serial.printf("[MESH] nodeId=%u role=%s\n", mesh.getNodeId(), IS_MASTER ? "MASTER" : "CHILD");
}
void startAP()
{
  apHasClient = false;
  blinkActive = true;
  ledState = false;
  nextBlinkAt = millis(); // start blink immediately
  WiFi.mode(WIFI_AP);
  if (!WiFi.softAPConfig(apIP, gateway, subnet))
  {
    if (DEBUG_SERIAL)
      Serial.println("[AP] softAPConfig FAILED");
  }
  WiFi.softAP(AP_SSID, AP_PASS);

  // WiFi.onEvent(WiFiEvent);
  if (DEBUG_SERIAL)
    Serial.println("[AP] Access Point started");
  if (DEBUG_SERIAL)
    Serial.print("[AP] SSID: ");
  if (DEBUG_SERIAL)
    Serial.println(AP_SSID);
  if (DEBUG_SERIAL)
    Serial.print("[AP] URL:  http://");
  if (DEBUG_SERIAL)
    Serial.println(WiFi.softAPIP());

  server.on("/", []()
            {
    String html = R"rawliteral(
            <!DOCTYPE html>
            <html>
                <head>
                <title>ResQMe User Control Panel</title>
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <style>
                body { font-family: Arial; text-align:center; margin-top:20%; }
                input, button { padding:12px; font-size:18px; margin:5px; }
                </style>
                </head>
                <body>
                  <h2>ResQMe User Control Panel</h2>
                  <p>Enter a message and send it to the The Resque team</p>
                  <form action="/submit_sos" method="GET">
                    <input type="text" name="msg" placeholder="Send a message" required>
                    <button type="submit">Send</button>
                  </form>
                </body>
            </html>
                )rawliteral";

    server.send(200, "text/html", html); });
  server.on("/submit_sos", handleSubmit);
  server.on("/set_user_id", handleUserIdSetup);
  server.onNotFound(handleNotFound);
  server.begin();
  if (DEBUG_SERIAL)
    Serial.println("[AP] Web server started");
}
void stopAP()
{
  if (DEBUG_SERIAL)
    Serial.println("[AP] Stopping web server & AP...");
  server.stop();
  WiFi.softAPdisconnect(true);
  WiFi.mode(WIFI_OFF);
  // stop blinking and turn LED off
  blinkActive = false;
  apHasClient = false;
  setBlue(false);
}
void stopMesh()
{
  if (DEBUG_SERIAL)
    Serial.println("[MESH] stop");
  taskReport.disable();
  userScheduler.deleteTask(taskReport);
  taskAnnounce.disable();
  userScheduler.deleteTask(taskAnnounce);
  taskQueryMaster.disable();
  userScheduler.deleteTask(taskQueryMaster);
  taskSendToMaster.disable();
  userScheduler.deleteTask(taskSendToMaster);

  mesh.stop();
  WiFi.disconnect(true, true); // full disconnect, erase config
  WiFi.mode(WIFI_OFF);
  masterId = 0;
}
void WiFiEvent(WiFiEvent_t event, WiFiEventInfo_t info)
{
  switch (event)
  {
  case ARDUINO_EVENT_WIFI_AP_STACONNECTED:
    apHasClient = true;
    blinkActive = false; // stop blink on click
    ledState = LOW;
    digitalWrite(PIN_LED_BLUE, ledState);
    if (DEBUG_SERIAL)
    {
      Serial.printf("[AP] Client connected: %02X:%02X:%02X:%02X:%02X:%02X\n",
                    info.wifi_ap_staconnected.mac[0], info.wifi_ap_staconnected.mac[1],
                    info.wifi_ap_staconnected.mac[2], info.wifi_ap_staconnected.mac[3],
                    info.wifi_ap_staconnected.mac[4], info.wifi_ap_staconnected.mac[5]);
    }
    break;

  case ARDUINO_EVENT_WIFI_AP_STADISCONNECTED:
    //  blick if no neighbors
    if (WiFi.softAPgetStationNum() == 0)
    {
      apHasClient = false;
      blinkActive = true;
      nextBlinkAt = millis();
    }
    if (DEBUG_SERIAL)
    {
      Serial.printf("[AP] Client disconnected: %02X:%02X:%02X:%02X:%02X:%02X\n",
                    info.wifi_ap_stadisconnected.mac[0], info.wifi_ap_stadisconnected.mac[1],
                    info.wifi_ap_stadisconnected.mac[2], info.wifi_ap_stadisconnected.mac[3],
                    info.wifi_ap_stadisconnected.mac[4], info.wifi_ap_stadisconnected.mac[5]);
    }
    break;

  default:
    break;
  }
}

//
void setup()
{
  Serial.begin(115200);
  if (DEBUG_SERIAL)
    Serial.println("Starting Connection...");
  pinMode(PIN_LED_BLUE, OUTPUT);
  pinMode(PIN_LED_RED, OUTPUT);
  ledcSetup(BUZZER_CHANNEL, BUZZER_FREQ, BUZZER_RES);
  ledcAttachPin(PIN_BUZZER, BUZZER_CHANNEL);
  pinMode(PIN_BUTTON, INPUT_PULLUP);
  GPS.begin(9600, SERIAL_8N1, PIN_GPS_RX, PIN_GPS_TX);
  // Add tasks
  startMesh();
  currentMode = MODE_MESH;
  Wire.begin();
  WiFi.onEvent(WiFiEvent);
  if (!display.begin(SSD1306_SWITCHCAPVCC, OLED_ADDR))
  {
    setRed(true);
    while (true)
    {
      vTaskDelay(1000);
    }
  }
  display.setTextWrap(true);

  display.clearDisplay();
  display.display();
}

// --- //
void loop()
{
  ButtonEvent ev = pollButton();
  if (ev != BTN_NONE)
    reportEvent(ev);
  pumpGPS();
  if (millis() - lastSend >= SEND_PERIOD_MS)
  {
    lastSend = millis();
  }
  if (currentMode == MODE_MESH)
    mesh.update();
  else if (currentMode == MODE_AP)
  {
    server.handleClient();

    if (blinkActive && !apHasClient && millis() >= nextBlinkAt)
    {
      ledState = !ledState;
      digitalWrite(PIN_LED_BLUE, ledState);
      nextBlinkAt = millis() + 300;
    }
    // shut down ap after save
    if (wantAPShutdown && millis() >= apShutdownAt)
    {
      stopAP();
      startMesh();
      currentMode = MODE_MESH;
      wantAPShutdown = false;
    }
  }
  // === MASTER SERIAL -> MESH BRIDGE ===
  if (IS_MASTER)
  {
    static String buffer = "";
    while (Serial.available())
    {
      char c = Serial.read();
      if (c == '\n')
      { // message delimiter
        if (buffer.length() > 0)
        {
          mesh.sendBroadcast(buffer);
          buffer = "";
        }
      }
      else if (c >= 32 && c <= 126)
      { // printable only
        buffer += c;
      }
    }
  }
  serviceBuzz();
  drawScreen();
}

void beepLED(int pin, int durationMs, int repeat)
{
  pinMode(pin, OUTPUT);
  for (int i = 0; i < repeat; i++)
  {
    digitalWrite(pin, HIGH);
    vTaskDelay(durationMs / portTICK_PERIOD_MS);
    digitalWrite(pin, LOW);
    vTaskDelay(durationMs / portTICK_PERIOD_MS);
  }
}
