#include <WiFi.h>
#include <WebServer.h>
#include <painlessMesh.h>

// ---------------- Mesh config ----------------
#define MESH_PREFIX "MyMeshNet"
#define MESH_PASSWORD "mesh-password"
#define MESH_PORT 5555

const bool IS_MASTER = true; // set true on master

Scheduler userScheduler;
painlessMesh mesh;
uint32_t masterId = 0; // learned by children at runtime (0 = unknown)

// ------------- AP / Web config ----------------
const char *AP_SSID = "ESP32_Config";
const char *AP_PASS = "12345678";
WebServer server(80);

// ------------- Pins & button ------------------
const int ledpin = 4;
const int btnpin = 18;
const unsigned long holdTime = 3000;
unsigned long pressStart = 0;
bool btnPressed = false;

// ------------- App state ----------------------
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

// ========= Mesh helpers / tasks =========
void announceMaster()
{
    if (IS_MASTER)
    {
        String msg = "MASTER:" + String(mesh.getNodeId());
        mesh.sendBroadcast(msg);
        Serial.printf("[MASTER] Announced: %s\n", msg.c_str());
    }
}

void askWhoIsMaster()
{
    mesh.sendBroadcast("WHO_IS_MASTER?");
    Serial.println("[CLIENT] Asked: WHO_IS_MASTER?");
}

void sendToMaster(const String &payload)
{
    if (IS_MASTER)
    {
        Serial.println("[MASTER] sendToMaster() called on master; ignoring");
        return;
    }
    if (masterId == 0)
    {
        Serial.println("[CLIENT] Master unknown; will retry later");
        return;
    }
    mesh.sendSingle(masterId, payload);
    Serial.printf("[CLIENT] -> master(%u): %s\n", masterId, payload.c_str());
}

// tasks
Task taskAnnounce(TASK_SECOND * 5, TASK_FOREVER, []()
                  { if (IS_MASTER) announceMaster(); });
Task taskQueryMaster(TASK_SECOND * 3, TASK_FOREVER, []()
                     { if (!IS_MASTER && masterId == 0) askWhoIsMaster(); });
Task taskSendToMaster(TASK_SECOND * 2, TASK_FOREVER, []()
                      {
  if (!IS_MASTER && masterId != 0) {
    String msg = "DATA seq=" + String(millis()/1000);
    sendToMaster(msg);
  } });
Task taskReport(TASK_SECOND * 5, TASK_FOREVER, []()
                {
  auto nodes = mesh.getNodeList();
  Serial.printf("[Node %u] neighbors (%u): ", mesh.getNodeId(), nodes.size());
  for (auto &n : nodes) Serial.printf("%u ", n);
  Serial.println(); });

// mesh callbacks
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
        Serial.printf("[RX] Learned masterId=%u from %u\n", masterId, from);
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
            Serial.printf("[CLIENT] %s\n", msg.c_str());
            return;
        }
    }

    Serial.printf("[RX] from %u: %s\n", from, msg.c_str());
}

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
            Serial.println("[CLIENT] Master lost; rediscovering");
            masterId = 0;
            askWhoIsMaster();
        }
    }
}

// ========= AP / Web =========
void startAP()
{
    apHasClient = false;
    blinkActive = true;
    ledState = false;
    nextBlinkAt = millis(); // start blink immediately

    WiFi.mode(WIFI_AP);
    WiFi.softAP(AP_SSID, AP_PASS);
    Serial.println("[AP] Access Point started");
    Serial.print("[AP] SSID: ");
    Serial.println(AP_SSID);
    Serial.print("[AP] URL:  http://");
    Serial.println(WiFi.softAPIP());

    server.on("/", []()
              {
    String html = R"rawliteral(
      <!DOCTYPE html><html><head>
        <title>ESP32 Config</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { font-family: sans-serif; margin: 40px; background: #f4f4f4; }
          input { padding: 10px; width: 80%; margin-top: 10px; }
          button { padding: 10px 20px; margin-top: 10px; }
        </style>
      </head><body>
        <h2>ESP32 Config Page</h2>
        <form action="/save" method="GET">
          <label>Enter value to store:</label><br>
          <input type="text" name="data" placeholder="Type something..."><br>
          <button type="submit">Save</button>
        </form>
        <p>Last stored value: %VALUE%</p>
      </body></html>
    )rawliteral";
    html.replace("%VALUE%", storedValue);
    server.send(200, "text/html", html); });

    server.on("/save", []()
              {
    if (server.hasArg("data")) {
      storedValue = server.arg("data");
      Serial.printf("[AP] Saved value: %s\n", storedValue.c_str());
      server.sendHeader("Location", "/");
      server.send(303);
      wantAPShutdown = true;             // ap shutdown
      apShutdownAt = millis() + 500;
    } else {
      server.send(400, "text/plain", "Missing 'data' parameter");
    } });

    server.begin();
    Serial.println("[AP] Web server started");
}

void stopAP()
{
    Serial.println("[AP] Stopping web server & AP...");
    server.stop();
    WiFi.softAPdisconnect(true);
    WiFi.mode(WIFI_OFF);
    // stop blinking and turn LED off
    blinkActive = false;
    apHasClient = false;
    digitalWrite(ledpin, LOW);
}

// ========= Wi-Fi events (new core API) =========
void WiFiEvent(WiFiEvent_t event, arduino_event_info_t info)
{
    switch (event)
    {
    case ARDUINO_EVENT_WIFI_AP_STACONNECTED:
        apHasClient = true;
        blinkActive = false; // stop blink on click
        ledState = LOW;
        digitalWrite(ledpin, ledState);
        Serial.printf("[AP] Client connected: %02X:%02X:%02X:%02X:%02X:%02X\n",
                      info.wifi_ap_staconnected.mac[0], info.wifi_ap_staconnected.mac[1],
                      info.wifi_ap_staconnected.mac[2], info.wifi_ap_staconnected.mac[3],
                      info.wifi_ap_staconnected.mac[4], info.wifi_ap_staconnected.mac[5]);
        break;

    case ARDUINO_EVENT_WIFI_AP_STADISCONNECTED:
        //  blick if no neighbors
        if (WiFi.softAPgetStationNum() == 0)
        {
            apHasClient = false;
            blinkActive = true;
            nextBlinkAt = millis();
        }
        Serial.printf("[AP] Client disconnected: %02X:%02X:%02X:%02X:%02X:%02X\n",
                      info.wifi_ap_stadisconnected.mac[0], info.wifi_ap_stadisconnected.mac[1],
                      info.wifi_ap_stadisconnected.mac[2], info.wifi_ap_stadisconnected.mac[3],
                      info.wifi_ap_stadisconnected.mac[4], info.wifi_ap_stadisconnected.mac[5]);
        break;

    default:
        break;
    }
}

// ========= Mode switches =========
void startMesh()
{
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
    Serial.printf("[MESH] nodeId=%u role=%s\n", mesh.getNodeId(), IS_MASTER ? "MASTER" : "CHILD");
}

void stopMesh()
{
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
    WiFi.disconnect(true);
    WiFi.mode(WIFI_OFF);
    masterId = 0;
}

// ========= Button (short / long) =========
int checkBTNPress()
{
    bool pressed = (digitalRead(btnpin) == LOW);

    if (pressed && !btnPressed)
    {
        pressStart = millis();
        btnPressed = true;
    }

    if (pressed && btnPressed)
    {
        if (millis() - pressStart >= holdTime)
        {
            btnPressed = false;
            Serial.println("[BTN] Long press");
            if (currentMode == MODE_MESH)
            {
                stopMesh();
                startAP(); // blink led until ap access
                currentMode = MODE_AP;
            }
            return 1;
        }
    }

    if (!pressed && btnPressed)
    {
        btnPressed = false;
        Serial.println("[BTN] Short press");
        if (currentMode == MODE_MESH && !IS_MASTER)
        {
            sendToMaster("BUTTON:SHORT");
            sendToMaster(storedValue); // send val on btn click
        }
        else
        {
            // quick ack when in AP
            digitalWrite(ledpin, HIGH);
            delay(80);
            digitalWrite(ledpin, LOW);
        }
        return 2;
    }

    return 0;
}

// ================= Basic Start =================
void setup()
{
    Serial.begin(115200);
    pinMode(ledpin, OUTPUT);
    digitalWrite(ledpin, LOW);
    pinMode(btnpin, INPUT_PULLUP);
    WiFi.onEvent(WiFiEvent);

    // start in mesh
    startMesh();
    currentMode = MODE_MESH;
}

void loop()
{
    if (currentMode == MODE_MESH)
    {
        mesh.update();
    }
    else
    { // ap mode
        server.handleClient();

        if (blinkActive && !apHasClient && millis() >= nextBlinkAt)
        {
            ledState = !ledState;
            digitalWrite(ledpin, ledState);
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

    (void)checkBTNPress();
    delay(5);
}
