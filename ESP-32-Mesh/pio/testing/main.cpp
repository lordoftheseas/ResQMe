#include <Arduino.h>
#include <WiFi.h>
#include <esp_now.h>

// Replace with your two ESP MACs (from Serial prints). Upper/lowercase doesn't matter.
uint8_t MAC_A[] = {0x38, 0x18, 0x2B, 0xB2, 0x23, 0x54}; // ESP #1
uint8_t MAC_B[] = {0x38, 0x18, 0x2B, 0xB2, 0x48, 0xB0}; // ESP #2

typedef struct
{
  uint32_t seq;
  float reading;
} Payload;

Payload tx{}, rx{};
uint8_t peerMac[6];         // will hold "the other device" MAC
esp_now_peer_info_t peer{}; // peer config

// ---- Callbacks ----
void onRecv(const uint8_t *mac, const uint8_t *data, int len)
{
  if (len == sizeof(Payload))
    memcpy(&rx, data, sizeof(rx));
  Serial.print("RX from ");
  for (int i = 0; i < 6; i++)
  {
    if (i)
      Serial.print(':');
    Serial.print(mac[i], HEX);
  }
  Serial.print(" | seq=");
  Serial.print(rx.seq);
  Serial.print(" value=");
  Serial.println(rx.reading);
}

void onSent(const uint8_t *mac, esp_now_send_status_t status)
{
  Serial.print("TX -> ");
  for (int i = 0; i < 6; i++)
  {
    if (i)
      Serial.print(':');
    Serial.print(mac[i], HEX);
  }
  Serial.print(" | status=");
  Serial.println(status == ESP_NOW_SEND_SUCCESS ? "OK" : "FAIL");
}

bool sameMac(const uint8_t *a, const uint8_t *b)
{
  for (int i = 0; i < 6; i++)
    if (a[i] != b[i])
      return false;
  return true;
}

void setup()
{
  Serial.begin(115200);
  WiFi.mode(WIFI_STA);

  // Who am I?
  uint8_t myMac[6];
  WiFi.macAddress(myMac);
  Serial.print("My MAC: ");
  Serial.println(WiFi.macAddress());

  // Decide which peer to use (the other MAC)
  if (sameMac(myMac, MAC_A))
    memcpy(peerMac, MAC_B, 6);
  else if (sameMac(myMac, MAC_B))
    memcpy(peerMac, MAC_A, 6);
  else
  {
    // If this board isn't A or B, default to A as peer.
    memcpy(peerMac, MAC_A, 6);
  }

  if (esp_now_init() != ESP_OK)
  {
    Serial.println("ESP-NOW init failed");
    while (true)
    {
    }
  }

  esp_now_register_recv_cb(onRecv);
  esp_now_register_send_cb(onSent);

  // Add the peer
  memset(&peer, 0, sizeof(peer));
  memcpy(peer.peer_addr, peerMac, 6);
  peer.channel = 0;     // same channel; 0 = current
  peer.encrypt = false; // set true if using encryption keys
  if (esp_now_add_peer(&peer) != ESP_OK)
  {
    Serial.println("Failed to add peer");
    while (true)
    {
    }
  }
}

void loop()
{
  // Send once per second
  tx.seq++;
  tx.reading = millis() / 1000.0;

  esp_err_t r = esp_now_send(peerMac, (uint8_t *)&tx, sizeof(tx));
  if (r != ESP_OK)
    Serial.println("esp_now_send error");

  delay(1000);
}
