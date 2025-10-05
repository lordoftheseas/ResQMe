#include <painlessMesh.h>
#include <WebServer.h>

#define MESH_PREFIX "MyMeshNet"
#define MESH_PASSWORD "mesh-password"
#define MESH_PORT 5555

// ====== set true on the master device, false on all others ======
const bool IS_MASTER = false; // <-- change to false on client boards
const int buttonPin = 4;

Scheduler userScheduler;
painlessMesh mesh;




uint32_t masterId = 0; // 0 = unknown (clients only)

// ---------- helpers ----------
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
}

// ---------- tasks ----------
Task taskAnnounce(TASK_SECOND * 5, TASK_FOREVER, []()
                  { announceMaster(); });

Task taskQueryMaster(TASK_SECOND * 3, TASK_FOREVER, []()
                     {
  if (!IS_MASTER && masterId == 0) askWhoIsMaster(); });

// Example: once we know the master, send it a ping every 2s
Task taskSendToMaster(TASK_SECOND * 2, TASK_FOREVER, []()
                      {
  if (!IS_MASTER && masterId != 0) {
    String msg = "PING:" + String(millis());
    Serial.printf("[CLIENT] -> master(%u): %s\n", masterId, msg.c_str());
    mesh.sendSingle(masterId, msg);
  } });

// See neighbors periodically (helps verify links)
Task taskReport(TASK_SECOND * 5, TASK_FOREVER, []()
                {
  auto nodes = mesh.getNodeList();
  Serial.printf("[Node %u] neighbors (%u): ", mesh.getNodeId(), nodes.size());
  for (auto &n : nodes) Serial.printf("%u ", n);
  Serial.println(); });

// ---------- callbacks ----------
void receivedCallback(uint32_t from, String &msg)
{
    if (msg == "WHO_IS_MASTER?")
    {
        Serial.printf("[RX] WHO_IS_MASTER? from %u\n", from);
        if (IS_MASTER)
            announceMaster();
        return;
    }

    if (msg.startsWith("MASTER:"))
    {
        uint32_t id = msg.substring(7).toInt();
        masterId = id;
        Serial.printf("[RX] Learned masterId=%u from %u\n", masterId, from);
        return;
    }

    // Simple PING/ACK demo
    if (msg.startsWith("PING:"))
    {
        Serial.printf("[RX] PING from %u: %s\n", from, msg.c_str());
        if (IS_MASTER)
        {
            mesh.sendSingle(from, String("ACK:") + msg.substring(5));
        }
        return;
    }
    if (msg.startsWith("ACK:"))
    {
        Serial.printf("[RX] ACK from %u: %s\n", from, msg.c_str());
        return;
    }

    // Fallback log
    Serial.printf("[RX] from %u: %s\n", from, msg.c_str());
}

void newConnectionCallback(uint32_t nodeId)
{
    Serial.printf("[EVENT] New connection: %u\n", nodeId);
    if (IS_MASTER)
        announceMaster();
    if (!IS_MASTER && masterId == 0)
        askWhoIsMaster();
}

void changedConnectionCallback()
{
    Serial.println("[EVENT] Topology changed");

    if (!IS_MASTER && masterId != 0)
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
            Serial.println("[CLIENT] Master lost; clearing and rediscovering");
            masterId = 0;
            askWhoIsMaster();
        }
    }

    if (IS_MASTER)
        announceMaster();
}
// Example: call this whenever you want to send a message to the master
void sendToMasterTest(const String &payload)
{
    if (IS_MASTER)
    {
        Serial.println("[MASTER] sendToMaster() called on master; ignoring");
        return;
    }
    if (masterId == 0)
    {
        Serial.println("[CLIENT] Master unknown yet; discovery still running...");
        return;
    }
    mesh.sendSingle(masterId, payload);
    Serial.printf("[CLIENT] Sent to master(%u): %s\n", masterId, payload.c_str());
}

void setup()
{
    Serial.begin(115200);
    delay(200);
    pinMode(buttonPin, INPUT_PULLUP);

    mesh.setDebugMsgTypes(ERROR | STARTUP | CONNECTION);
    mesh.init(MESH_PREFIX, MESH_PASSWORD, &userScheduler, MESH_PORT);

    mesh.onReceive(&receivedCallback);
    mesh.onNewConnection(&newConnectionCallback);
    mesh.onChangedConnections(&changedConnectionCallback);

    // Add tasks
    userScheduler.addTask(taskReport);
    taskReport.enable();

    userScheduler.addTask(taskAnnounce);
    userScheduler.addTask(taskQueryMaster);
    userScheduler.addTask(taskSendToMaster);

    if (IS_MASTER)
    {
        taskAnnounce.enable();
    }
    else
    {
        taskQueryMaster.enable();
        taskSendToMaster.enable();
    }

    // Kickstart immediately
    if (IS_MASTER)
        announceMaster();
    else
        askWhoIsMaster();

    Serial.printf("[BOOT] My nodeId: %u  (master=%s)\n",
                  mesh.getNodeId(), IS_MASTER ? "yes" : "no");
}

void loop()
{
    mesh.update();
    int buttonState = digitalRead(buttonPin);

    if (buttonState == LOW)
    {
        Serial.println("Button PRESSED");

        sendToMasterTest("Hello master, button pressed!");

        delay(500);
    }
    else
    {
    }
}
