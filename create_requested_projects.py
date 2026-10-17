# -*- coding: utf-8 -*-
"""
Generate the exact 7 requested science projects for OmniLab:
1. Soil Moisture Auto Watering
2. RFID Smart Access System
3. Under-Voltage / Over-Voltage Protection System
4. Ultrasonic Radar System
5. Obstacle Avoiding Robot Car
6. Reverse Car Parking Sensor
7. Electronic Drumset with 7 Piezo Sensors + Python Program & ESP32
"""

import json
import os

projects = [
    # 1. Soil Moisture Auto Watering
    {
        "id": "soil-moisture-auto-watering",
        "title": "Soil Moisture Automatic Plant Watering System",
        "shortDesc": "Closed-loop precision irrigation system monitoring soil volumetric water content (VWC) via capacitive corrosion-free sensing and automated 5V relay pump actuation with dual LCD/OLED display support.",
        "board": "Arduino Uno",
        "category": "Environmental & Weather",
        "difficulty": "Beginner",
        "estimatedTime": "1.5 Hours",
        "rating": 4.9,
        "featured": True,
        "tags": ["Capacitive Soil", "5V Relay", "Water Pump", "Hysteresis", "LCD 1602", "OLED"],
        "components": [
            {"name": "Arduino Uno R3", "qty": "1", "note": "ATmega328P Microcontroller"},
            {"name": "Capacitive Soil Moisture Sensor v1.2", "qty": "1", "note": "Corrosion-resistant copper capacitor PCB"},
            {"name": "5V 1-Channel Optocoupled Relay Module", "qty": "1", "note": "High-current pump isolation switch"},
            {"name": "3-6V DC Submersible Mini Water Pump", "qty": "1", "note": "With 50cm flexible silicone tubing"},
            {"name": "16x2 I2C Character LCD (or 0.96\" OLED)", "qty": "1", "note": "Real-time moisture percentage readout"},
            {"name": "4x AA Battery Holder / 5V DC Supply", "qty": "1", "note": "Isolated power rail for water pump"},
            {"name": "Solderless Breadboard & Jumper Wires", "qty": "1", "note": "Standard prototyping kit"}
        ],
        "workingPrinciple": "Unlike standard resistive soil probes that suffer rapid electrolytic corrosion, capacitive soil sensors form a planar capacitor utilizing insulated copper traces buried within the PCB. Water possesses a very high relative dielectric permittivity (~80) compared to dry soil (~4) and air (~1). As volumetric water content increases, the probe capacitance rises proportionally, altering the oscillation frequency of an onboard 555-timer circuit. The analog output voltage (inversely proportional to moisture) is read by the Arduino ADC. When moisture falls below the wilting threshold (35%), the microcontroller energizes the optocoupled relay, pumping water until soil saturation reaches 65% (hysteresis control to prevent relay chatter).",
        "wiringTable": [
            {"from": "Arduino 5V", "to": "Capacitive Sensor VCC", "color": "red", "desc": "Clean 5V analog power rail"},
            {"from": "Arduino GND", "to": "Capacitive Sensor GND", "color": "black", "desc": "Common system ground"},
            {"from": "Arduino A0", "to": "Capacitive Sensor AOUT", "color": "blue", "desc": "Analog moisture potential"},
            {"from": "Arduino Pin 7", "to": "Relay Module IN", "color": "green", "desc": "Active-LOW relay trigger control"},
            {"from": "Arduino 5V", "to": "Relay Module VCC", "color": "red", "desc": "5V coil driver power"},
            {"from": "Arduino GND", "to": "Relay Module GND", "color": "black", "desc": "Common ground"},
            {"from": "Arduino A4", "to": "OLED / LCD SDA", "color": "blue", "desc": "I2C Serial Data"},
            {"from": "Arduino A5", "to": "OLED / LCD SCL", "color": "amber", "desc": "I2C Serial Clock"},
            {"from": "Arduino 5V", "to": "OLED / LCD VCC", "color": "red", "desc": "5V display logic & backlight"},
            {"from": "Arduino GND", "to": "OLED / LCD GND", "color": "black", "desc": "Common ground"},
            {"from": "Ext Battery (+)", "to": "Relay COM Terminal", "color": "red", "desc": "External pump circuit supply"},
            {"from": "Relay NO Terminal", "to": "Pump Red Wire (+)", "color": "red", "desc": "Switched pump power"},
            {"from": "Pump Black Wire (-)", "to": "Ext Battery (-)", "color": "black", "desc": "Pump return loop"}
        ],
        "circuitDiagram": {
            "boardType": "arduino-uno",
            "modules": [
                {"name": "Capacitive Soil Sensor", "type": "sensor", "pins": ["VCC (5V)", "GND", "AOUT (A0)"]},
                {"name": "5V Relay Module & Pump", "type": "actuator", "pins": ["VCC (5V)", "GND", "IN (D7)", "COM", "NO"]}
            ]
        },
        "code": """#include <Wire.h>
#include <LiquidCrystal_I2C.h>

// 16x2 I2C LCD Display (Address 0x27)
LiquidCrystal_I2C lcd(0x27, 16, 2);

#define SOIL_PIN A0
#define RELAY_PIN 7

// Calibration values (Dry in air vs submerged in water)
const int DRY_VAL = 590;   // 0% moisture in air
const int WET_VAL = 270;   // 100% moisture in water
const int THRESHOLD_LOW = 35;  // Trigger pump below 35%
const int THRESHOLD_HIGH = 65; // Stop pump above 65%

bool isWatering = false;

void setup() {
  Serial.begin(9600);
  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, HIGH); // Deactivate relay (Active-LOW)

  lcd.init();
  lcd.backlight();
  lcd.setCursor(0, 0);
  lcd.print("Smart Irrigation");
  lcd.setCursor(0, 1);
  lcd.print("Calibrating...");
  delay(1500);
}

void loop() {
  int rawSum = 0;
  for(int i = 0; i < 20; i++) {
    rawSum += analogRead(SOIL_PIN);
    delay(10);
  }
  int rawAvg = rawSum / 20;

  int moisturePercent = map(rawAvg, DRY_VAL, WET_VAL, 0, 100);
  moisturePercent = constrain(moisturePercent, 0, 100);

  // Closed-loop Hysteresis Control
  if (moisturePercent < THRESHOLD_LOW && !isWatering) {
    digitalWrite(RELAY_PIN, LOW); // Turn pump ON
    isWatering = true;
  } else if (moisturePercent >= THRESHOLD_HIGH && isWatering) {
    digitalWrite(RELAY_PIN, HIGH); // Turn pump OFF
    isWatering = false;
  }

  // Update LCD Readout
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Moisture: ");
  lcd.print(moisturePercent);
  lcd.print("%");

  lcd.setCursor(0, 1);
  if (isWatering) {
    lcd.print("PUMP: [ACTIVE]");
  } else {
    lcd.print("PUMP: [STANDBY]");
  }

  Serial.print("Raw: ");
  Serial.print(rawAvg);
  Serial.print(" | Moisture: ");
  Serial.print(moisturePercent);
  Serial.print("% | Pump: ");
  Serial.println(isWatering ? "ON" : "OFF");

  delay(500);
}""",
        "assemblySteps": [
            "Insert the capacitive soil probe vertically into the potted plant root zone up to the white indicator line.",
            "Connect probe VCC to 5V, GND to GND, and AOUT to Arduino analog pin A0.",
            "Connect Relay module VCC to 5V, GND to GND, and control pin IN to Arduino digital pin 7.",
            "Wire the 4x AA battery pack through the Relay COM and NO terminals to the pump motor.",
            "Connect the I2C LCD (or OLED) to 5V, GND, A4 (SDA), and A5 (SCL).",
            "Place the water pump in a fresh water reservoir with tubing secured at the plant base."
        ],
        "scientificApplications": "Plant physiology water retention research, precision deficit irrigation in agricultural agronomy, automated drought stress telemetry, and hydroponic nutrient solution management."
    },

    # 2. RFID Smart Access System
    {
        "id": "rfid-smart-access-system",
        "title": "RFID Smart Access Control & Security Door Lock",
        "shortDesc": "Security engineering system authenticating personnel using 13.56 MHz RFID magnetic near-field coupling with servo lock latching, buzzer telemetry, and display logs.",
        "board": "Arduino Uno",
        "category": "Robotics & Automation",
        "difficulty": "Intermediate",
        "estimatedTime": "2 Hours",
        "rating": 4.9,
        "featured": True,
        "tags": ["RC522", "RFID", "SPI", "Servo", "Access Control", "Security"],
        "components": [
            {"name": "Arduino Uno R3", "qty": "1", "note": "ATmega328P SPI Master"},
            {"name": "RC522 13.56MHz RFID Reader Module", "qty": "1", "note": "Mifare Classic ISO/IEC 14443A"},
            {"name": "RFID 13.56MHz Keyfob & Smart Card", "qty": "2", "note": "Unique 4-byte / 7-byte UID tags"},
            {"name": "SG90 Micro Servo (90/180 deg)", "qty": "1", "note": "Mechanical deadbolt / latch actuation"},
            {"name": "Active Piezo Buzzer", "qty": "1", "note": "Access granted / denied acoustic tones"},
            {"name": "Dual LEDs (Green Authorized, Red Denied)", "qty": "2", "note": "With 220-ohm resistors"},
            {"name": "16x2 I2C LCD (or 0.96\" OLED)", "qty": "1", "note": "Displays badge UID and grant status"}
        ],
        "workingPrinciple": "The RC522 RFID reader generates a 13.56 MHz alternating electromagnetic field through its PCB trace loop antenna. When a passive RFID tag enters the field, Faraday's law of induction powers the tag's onboard microchip through resonant inductive coupling. The card modulates the RF field to transmit its unique factory serial UID via load backscattering. The Arduino verifies this UID against an internal security whitelist. If authorized, it triggers a 90° servo rotation to withdraw a door deadbolt, illuminates the green LED, and plays a high-pitch welcome chime. Unknown cards trigger a red LED and harsh alarm tone.",
        "wiringTable": [
            {"from": "Arduino 3.3V", "to": "RC522 3.3V", "color": "red", "desc": "Regulated 3.3V power (NEVER connect to 5V!)"},
            {"from": "Arduino GND", "to": "RC522 GND", "color": "black", "desc": "Common system ground"},
            {"from": "Arduino Pin 10 (SS)", "to": "RC522 SDA / NSS", "color": "blue", "desc": "SPI Slave Select chip enable"},
            {"from": "Arduino Pin 13 (SCK)", "to": "RC522 SCK", "color": "amber", "desc": "SPI Master Clock"},
            {"from": "Arduino Pin 11 (MOSI)", "to": "RC522 MOSI", "color": "green", "desc": "SPI Master Out Slave In"},
            {"from": "Arduino Pin 12 (MISO)", "to": "RC522 MISO", "color": "purple", "desc": "SPI Master In Slave Out"},
            {"from": "Arduino Pin 9", "to": "RC522 RST", "color": "orange", "desc": "Hardware reset pin"},
            {"from": "Arduino Pin 6", "to": "Servo Signal (Orange)", "color": "orange", "desc": "Lock Latch PWM control"},
            {"from": "Arduino Pin 5", "to": "Buzzer (+)", "color": "yellow", "desc": "Access alert tone"},
            {"from": "Arduino Pin 4", "to": "Green LED Anode", "color": "green", "desc": "Access Granted indicator"},
            {"from": "Arduino Pin 3", "to": "Red LED Anode", "color": "red", "desc": "Access Denied indicator"},
            {"from": "Arduino A4", "to": "LCD / OLED SDA", "color": "blue", "desc": "I2C Data"},
            {"from": "Arduino A5", "to": "LCD / OLED SCL", "color": "amber", "desc": "I2C Clock"}
        ],
        "circuitDiagram": {
            "boardType": "arduino-uno",
            "modules": [
                {"name": "RC522 RFID Module", "type": "sensor", "pins": ["3.3V", "GND", "RST (D9)", "SDA (D10)", "MOSI (D11)", "MISO (D12)", "SCK (D13)"]},
                {"name": "Lock Servo & Alarm", "type": "actuator", "pins": ["Servo PWM (D6)", "Buzzer (D5)", "Green LED (D4)", "Red LED (D3)"]}
            ]
        },
        "code": """#include <SPI.h>
#include <MFRC522.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <Servo.h>

#define SS_PIN 10
#define RST_PIN 9
#define SERVO_PIN 6
#define BUZZER_PIN 5
#define LED_GREEN 4
#define LED_RED 3

MFRC522 mfrc522(SS_PIN, RST_PIN);
LiquidCrystal_I2C lcd(0x27, 16, 2);
Servo lockServo;

// Authorized Master Card UID: Change to match your card!
byte masterUID[4] = {0xDE, 0xAD, 0xBE, 0xEF};

void setup() {
  Serial.begin(9600);
  SPI.begin();
  mfrc522.PCD_Init();

  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(LED_GREEN, OUTPUT);
  pinMode(LED_RED, OUTPUT);

  lockServo.attach(SERVO_PIN);
  lockServo.write(0); // 0 degrees = Locked

  lcd.init();
  lcd.backlight();
  lcd.setCursor(0, 0);
  lcd.print("RFID SECURITY");
  lcd.setCursor(0, 1);
  lcd.print("Scan ID Badge...");
}

void loop() {
  // Check for card presence
  if (!mfrc522.PICC_IsNewCardPresent() || !mfrc522.PICC_ReadCardSerial()) {
    delay(50);
    return;
  }

  // Compare scanned UID
  bool accessGranted = true;
  for (byte i = 0; i < 4; i++) {
    if (mfrc522.uid.uidByte[i] != masterUID[i]) {
      accessGranted = false;
    }
  }

  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("UID: ");
  for (byte i = 0; i < mfrc522.uid.size; i++) {
    lcd.print(mfrc522.uid.uidByte[i], HEX);
    lcd.print(" ");
  }

  lcd.setCursor(0, 1);
  if (accessGranted) {
    lcd.print("STATUS: ACCESS OK");
    digitalWrite(LED_GREEN, HIGH);
    digitalWrite(LED_RED, LOW);
    tone(BUZZER_PIN, 2000, 200);

    lockServo.write(90); // Unlock deadbolt
    delay(4000);         // Hold open for 4 seconds
    lockServo.write(0);  // Re-lock
    digitalWrite(LED_GREEN, LOW);
  } else {
    lcd.print("ACCESS DENIED!");
    digitalWrite(LED_RED, HIGH);
    digitalWrite(LED_GREEN, LOW);
    tone(BUZZER_PIN, 600, 600);
    delay(2000);
    digitalWrite(LED_RED, LOW);
  }

  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("RFID SECURITY");
  lcd.setCursor(0, 1);
  lcd.print("Scan ID Badge...");

  mfrc522.PICC_HaltA();
  mfrc522.PCD_StopCrypto1();
}""",
        "assemblySteps": [
            "CAUTION: Connect RC522 VCC strictly to the 3.3V pin on Arduino Uno (5V will permanently burn the chip).",
            "Connect hardware SPI pins: SS to Pin 10, MOSI to Pin 11, MISO to Pin 12, SCK to Pin 13, and RST to Pin 9.",
            "Connect micro servo signal to digital Pin 6 with 5V power and ground.",
            "Connect Green LED to Pin 4, Red LED to Pin 3 (via 220-ohm resistors), and buzzer to Pin 5.",
            "Connect 16x2 I2C LCD (or OLED) to 5V, GND, A4 (SDA), and A5 (SCL).",
            "Flash sketch, open Serial monitor, read your card's raw UID, and update the masterUID array."
        ],
        "scientificApplications": "Campus RFID attendance tracking, high-security biosecurity lab chain-of-custody, contactless smart card fare ticketing, and inventory warehouse tracking."
    },

    # 3. Under-Voltage / Over-Voltage Protection System
    {
        "id": "under-voltage-protection-system",
        "title": "Under-Voltage & Over-Voltage Automatic Protection System",
        "shortDesc": "Electrical engineering grid protection apparatus continuously sampling supply voltage and actuating a high-power relay isolator with audible alarms during brownouts and power surges.",
        "board": "Arduino Uno",
        "category": "Space & Energy",
        "difficulty": "Intermediate",
        "estimatedTime": "2 Hours",
        "rating": 4.9,
        "featured": True,
        "tags": ["Voltage Divider", "Under-Voltage", "Over-Voltage", "Relay Protection", "Grid Safety"],
        "components": [
            {"name": "Arduino Uno R3", "qty": "1", "note": "ATmega328P 10-bit ADC"},
            {"name": "Precision DC Voltage Sensor Module (0-25V)", "qty": "1", "note": "5:1 resistive voltage divider network"},
            {"name": "5V 10A Optocoupled Relay Module", "qty": "1", "note": "Main circuit breaker trip switch"},
            {"name": "Piezo Alarm Buzzer", "qty": "1", "note": "Voltage fault acoustic horn"},
            {"name": "Tricolor LEDs (Green Normal, Yellow Under, Red Over)", "qty": "3", "note": "Status annunciators"},
            {"name": "16x2 I2C LCD (or 0.96\" OLED)", "qty": "1", "note": "Real-time voltage readout and fault telemetry"}
        ],
        "workingPrinciple": "Electrical appliances and microcontrollers fail when supply voltages deviate from nominal specifications. Under-voltage (brownouts) starves inductive motors of torque, causing severe overheating and coil burnout. Over-voltage (surges) punctures dielectric insulation and destroys semiconductor junctions. A calibrated 5:1 precision voltage divider maps input potential (0-25V) down to the Arduino ADC range (0-5V): V_in = V_adc * ((R1 + R2) / R2). The Arduino computes a window comparator algorithm: if voltage drops below the under-voltage trip threshold (10.0V) or spikes above over-voltage threshold (14.5V), it instantly de-energizes the protective relay and sounds an audible alarm with programmable hysteresis to prevent contact chattering.",
        "wiringTable": [
            {"from": "Arduino 5V", "to": "Sensor VCC & LCD VCC", "color": "red", "desc": "Clean 5V system rail"},
            {"from": "Arduino GND", "to": "Sensor GND & System GND", "color": "black", "desc": "Common ground return"},
            {"from": "Arduino A0", "to": "Voltage Sensor OUT", "color": "blue", "desc": "Sampled scaled voltage"},
            {"from": "Arduino Pin 8", "to": "Relay Module IN", "color": "green", "desc": "Active-LOW circuit breaker trip"},
            {"from": "Arduino Pin 7", "to": "Piezo Buzzer (+)", "color": "yellow", "desc": "Fault acoustic alarm"},
            {"from": "Arduino Pin 6", "to": "Green LED (Normal)", "color": "green", "desc": "Normal grid potential (10.5V - 14.5V)"},
            {"from": "Arduino Pin 5", "to": "Yellow LED (Under-V)", "color": "amber", "desc": "Under-voltage brownout flag"},
            {"from": "Arduino Pin 4", "to": "Red LED (Over-V)", "color": "red", "desc": "Over-voltage surge flag"},
            {"from": "Arduino A4", "to": "LCD / OLED SDA", "color": "blue", "desc": "I2C Serial Data"},
            {"from": "Arduino A5", "to": "LCD / OLED SCL", "color": "amber", "desc": "I2C Serial Clock"}
        ],
        "circuitDiagram": {
            "boardType": "arduino-uno",
            "modules": [
                {"name": "Voltage Divider Sensor", "type": "sensor", "pins": ["VCC (5V)", "GND", "SIGNAL (A0)"]},
                {"name": "Relay Breaker & Alarm", "type": "actuator", "pins": ["Relay IN (D8)", "Buzzer (D7)", "LED Green (D6)", "LED Yellow (D5)", "LED Red (D4)"]}
            ]
        },
        "code": """#include <Wire.h>
#include <LiquidCrystal_I2C.h>

LiquidCrystal_I2C lcd(0x27, 16, 2);

#define VOLTAGE_PIN A0
#define RELAY_PIN 8
#define BUZZER_PIN 7
#define LED_NORMAL 6
#define LED_UNDER 5
#define LED_OVER 4

// Voltage Trip Limits (For a nominal 12V supply / battery)
const float UNDER_VOLTAGE_LIMIT = 10.2; // Brownout threshold
const float OVER_VOLTAGE_LIMIT  = 14.8; // Overvoltage threshold
const float DIVIDER_RATIO = 5.0;        // 5:1 hardware divider

void setup() {
  Serial.begin(9600);
  pinMode(RELAY_PIN, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(LED_NORMAL, OUTPUT);
  pinMode(LED_UNDER, OUTPUT);
  pinMode(LED_OVER, OUTPUT);

  // Initialize with breaker engaged
  digitalWrite(RELAY_PIN, LOW); // Relay ON (Normal Closed)

  lcd.init();
  lcd.backlight();
  lcd.setCursor(0, 0);
  lcd.print("Grid Protection");
  lcd.setCursor(0, 1);
  lcd.print("System Active");
  delay(1200);
}

void loop() {
  // Read and average analog voltage
  long sum = 0;
  for (int i = 0; i < 25; i++) {
    sum += analogRead(VOLTAGE_PIN);
    delay(5);
  }
  float avgRaw = sum / 25.0;
  float adcVoltage = (avgRaw * 5.0) / 1023.0;
  float measuredVoltage = adcVoltage * DIVIDER_RATIO;

  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Volts: ");
  lcd.print(measuredVoltage, 2);
  lcd.print(" V");

  lcd.setCursor(0, 1);
  if (measuredVoltage < UNDER_VOLTAGE_LIMIT) {
    // Under-Voltage Fault
    lcd.print("FAULT: UNDER-V!");
    digitalWrite(RELAY_PIN, HIGH); // Trip breaker (Disconnect load)
    digitalWrite(LED_UNDER, HIGH);
    digitalWrite(LED_NORMAL, LOW);
    digitalWrite(LED_OVER, LOW);
    tone(BUZZER_PIN, 1200, 200);
  } else if (measuredVoltage > OVER_VOLTAGE_LIMIT) {
    // Over-Voltage Fault
    lcd.print("FAULT: OVER-V!!");
    digitalWrite(RELAY_PIN, HIGH); // Trip breaker (Disconnect load)
    digitalWrite(LED_OVER, HIGH);
    digitalWrite(LED_NORMAL, LOW);
    digitalWrite(LED_UNDER, LOW);
    tone(BUZZER_PIN, 2800, 300);
  } else {
    // Normal Safe Grid State
    lcd.print("STATUS: SAFE OK");
    digitalWrite(RELAY_PIN, LOW); // Connect load
    digitalWrite(LED_NORMAL, HIGH);
    digitalWrite(LED_UNDER, LOW);
    digitalWrite(LED_OVER, LOW);
    noTone(BUZZER_PIN);
  }

  Serial.print("Voltage: ");
  Serial.print(measuredVoltage, 2);
  Serial.println(" V");

  delay(300);
}""",
        "assemblySteps": [
            "Connect the DC voltage sensor module signal pin to Arduino analog pin A0, and ground to GND.",
            "Connect the test power source (0-20V DC variable supply or battery) to the voltage sensor screw terminals.",
            "Connect Relay module VCC to 5V, GND to GND, and IN to digital Pin 8.",
            "Connect Green LED to Pin 6, Yellow LED to Pin 5, Red LED to Pin 4, and buzzer to Pin 7.",
            "Wire the 16x2 I2C LCD (or OLED) to A4 (SDA) and A5 (SCL).",
            "Adjust supply voltage between 8V and 16V to observe automated trip breaker shutdown."
        ],
        "scientificApplications": "Solar micro-grid battery bank overcharge/deep-discharge protection, industrial motor brownout prevention, domestic appliance surge protection, and power grid quality auditing."
    },

    # 4. Ultrasonic Radar System
    {
        "id": "ultrasonic-radar-system",
        "title": "180° Panoramic Ultrasonic Radar & Sonar Target Mapper",
        "shortDesc": "Acoustic echolocation radar sweeping a 180° panoramic arc using an SG90 servo and HC-SR04 transducer with real-time polar coordinate plotting.",
        "board": "Arduino Uno",
        "category": "Physics & Acoustics",
        "difficulty": "Intermediate",
        "estimatedTime": "2.5 Hours",
        "rating": 4.9,
        "featured": True,
        "tags": ["HC-SR04", "SG90 Servo", "Sonar Radar", "Echolocation", "Python Visualizer"],
        "components": [
            {"name": "Arduino Uno R3", "qty": "1", "note": "Hardware PWM and microsecond timer"},
            {"name": "HC-SR04 Ultrasonic Transducer Module", "qty": "1", "note": "40 kHz piezoelectric transmitter and receiver"},
            {"name": "SG90 Micro Servo (180 deg)", "qty": "1", "note": "Panoramic scanner azimuth motor"},
            {"name": "Sensor Pan Bracket / 3D Printed Horn", "qty": "1", "note": "Secures ultrasonic module to servo horn"},
            {"name": "16x2 I2C LCD (or 0.96\" OLED)", "qty": "1", "note": "Angle and target distance readout"},
            {"name": "Python Radar Script (PC Display)", "qty": "1", "note": "Renders real-time green military sonar PPI radar"}
        ],
        "workingPrinciple": "This project models active submarine SONAR (Sound Navigation and Ranging) and air traffic radar systems. The SG90 micro servo rotates continuously from 15° to 165° in 1-degree steps. At each angular azimuth, the Arduino transmits a 10µs ultrasonic trigger pulse causing the HC-SR04 to emit eight 40 kHz acoustic sound wavefronts. When wavefronts bounce off an obstacle, the echo return pulse width measures time-of-flight: r = (v_sound * t) / 2. The Arduino transmits polar coordinates (r, theta) over USB serial at 115200 baud to a companion Python visualizer, which converts polar to Cartesian (x = r*cos(theta), y = r*sin(theta)) and renders a glowing sonar radar sweep.",
        "wiringTable": [
            {"from": "Arduino 5V", "to": "HC-SR04 VCC", "color": "red", "desc": "5V Transducer power"},
            {"from": "Arduino GND", "to": "HC-SR04 GND", "color": "black", "desc": "System Ground"},
            {"from": "Arduino Pin 9", "to": "HC-SR04 Trig", "color": "blue", "desc": "10µs ultrasonic trigger pulse"},
            {"from": "Arduino Pin 10", "to": "HC-SR04 Echo", "color": "green", "desc": "Return echo pulse input"},
            {"from": "Arduino Pin 11 (PWM)", "to": "Servo Signal (Orange)", "color": "orange", "desc": "Azimuth sweep servo PWM"},
            {"from": "Arduino 5V", "to": "Servo VCC (Red)", "color": "red", "desc": "Servo 5V power"},
            {"from": "Arduino GND", "to": "Servo GND (Brown)", "color": "black", "desc": "Common ground"},
            {"from": "Arduino A4", "to": "LCD / OLED SDA", "color": "blue", "desc": "I2C Serial Data"},
            {"from": "Arduino A5", "to": "LCD / OLED SCL", "color": "amber", "desc": "I2C Serial Clock"}
        ],
        "circuitDiagram": {
            "boardType": "arduino-uno",
            "modules": [
                {"name": "HC-SR04 Ultrasonic", "type": "sensor", "pins": ["VCC (5V)", "Trig (D9)", "Echo (D10)", "GND"]},
                {"name": "SG90 Sweep Servo", "type": "actuator", "pins": ["5V", "GND", "PWM (D11)"]}
            ]
        },
        "code": """#include <Servo.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>

LiquidCrystal_I2C lcd(0x27, 16, 2);
Servo radarServo;

#define TRIG_PIN 9
#define ECHO_PIN 10
#define SERVO_PIN 11

long calculateDistance() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  long duration = pulseIn(ECHO_PIN, HIGH, 25000); // 25ms timeout (~4m)
  if (duration == 0) return 200; // No obstacle
  return duration * 0.034 / 2;
}

void setup() {
  Serial.begin(115200);
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);

  radarServo.attach(SERVO_PIN);
  lcd.init();
  lcd.backlight();
  lcd.setCursor(0, 0);
  lcd.print("SONAR RADAR LAB");
  lcd.setCursor(0, 1);
  lcd.print("Scanning 180 Deg");
  delay(1000);
}

void loop() {
  // Sweep Forward: 15 to 165 degrees
  for (int angle = 15; angle <= 165; angle += 2) {
    radarServo.write(angle);
    delay(30);
    int dist = calculateDistance();

    // Stream formatted telemetry for Python PC radar visualizer: "ANGLE,DISTANCE."
    Serial.print(angle);
    Serial.print(",");
    Serial.print(dist);
    Serial.print(".");

    if (angle % 30 == 0) {
      lcd.setCursor(0, 0);
      lcd.print("Angle: "); lcd.print(angle); lcd.print(" deg  ");
      lcd.setCursor(0, 1);
      lcd.print("Dist:  "); lcd.print(dist); lcd.print(" cm   ");
    }
  }

  // Sweep Backward: 165 to 15 degrees
  for (int angle = 165; angle >= 15; angle -= 2) {
    radarServo.write(angle);
    delay(30);
    int dist = calculateDistance();

    Serial.print(angle);
    Serial.print(",");
    Serial.print(dist);
    Serial.print(".");

    if (angle % 30 == 0) {
      lcd.setCursor(0, 0);
      lcd.print("Angle: "); lcd.print(angle); lcd.print(" deg  ");
      lcd.setCursor(0, 1);
      lcd.print("Dist:  "); lcd.print(dist); lcd.print(" cm   ");
    }
  }
}""",
        "assemblySteps": [
            "Affix the SG90 micro servo firmly to a stable base pointing forward.",
            "Mount the HC-SR04 ultrasonic sensor atop the servo horn using double-sided foam tape or bracket.",
            "Connect HC-SR04 VCC to 5V, GND to GND, Trig to Pin 9, and Echo to Pin 10.",
            "Connect the servo orange control line to Pin 11, red to 5V, and brown to GND.",
            "Connect I2C LCD to 5V, GND, A4 (SDA), and A5 (SCL).",
            "Flash firmware and run the companion Python radar visualizer script on your computer."
        ],
        "scientificApplications": "Robotic SLAM (Simultaneous Localization and Mapping), maritime bathymetric sonar exploration, perimeter intrusion radar mapping, and autonomous collision avoidance."
    },

    # 5. Obstacle Avoiding Robot Car
    {
        "id": "obstacle-avoiding-robot-car",
        "title": "Smart Autonomous Obstacle Avoiding Robot Car",
        "shortDesc": "Autonomous mobile robot navigating dynamic environments using dual DC geared motors, an L298N H-bridge driver, and a panning ultrasonic sensor head.",
        "board": "Arduino Uno",
        "category": "Robotics & Automation",
        "difficulty": "Intermediate",
        "estimatedTime": "3 Hours",
        "rating": 4.9,
        "featured": True,
        "tags": ["L298N", "DC Motors", "HC-SR04", "SG90 Servo", "Autonomous", "Robotics"],
        "components": [
            {"name": "Arduino Uno R3", "qty": "1", "note": "Robotic decision controller"},
            {"name": "L298N Dual H-Bridge Motor Driver Module", "qty": "1", "note": "High-current DC motor driver"},
            {"name": "TT Yellow DC Geared Motors (1:48)", "qty": "2", "note": "Left and Right drive wheels"},
            {"name": "HC-SR04 Ultrasonic Distance Sensor", "qty": "1", "note": "Frontal obstacle detector"},
            {"name": "SG90 Micro Servo Motor", "qty": "1", "note": "Sensor look-ahead panning mechanism"},
            {"name": "2WD Acrylic Smart Robot Chassis Kit", "qty": "1", "note": "With front omni-directional caster"},
            {"name": "2x 18650 Li-ion Battery Holder (7.4V)", "qty": "1", "note": "High-current motor power pack"},
            {"name": "16x2 I2C LCD (or 0.96\" OLED)", "qty": "1", "note": "Navigation status display"}
        ],
        "workingPrinciple": "The robot executes autonomous mobile navigation using reactive obstacle avoidance logic. Two DC geared motors are controlled via pulse-width modulation (PWM) and H-bridge direction inputs on the L298N. While cruising forward, the ultrasonic sensor scans for obstacles. If an obstacle is detected within 25 cm, the robot immediately halts, reverses for 300ms, and pans the SG90 servo 45° to the left and 135° to the right. The Arduino compares distance measurements: if distance_left > distance_right, the robot executes a zero-turn spin to the left; otherwise, it spins to the right, avoiding deadlocks in complex mazes.",
        "wiringTable": [
            {"from": "Battery (+ 7.4V)", "to": "L298N 12V In", "color": "red", "desc": "High current motor power"},
            {"from": "Battery (-)", "to": "L298N GND & Arduino GND", "color": "black", "desc": "Common system ground"},
            {"from": "L298N 5V Out", "to": "Arduino 5V & Sensor VCC", "color": "red", "desc": "Regulated 5V logic power"},
            {"from": "Arduino Pin 5 (PWM)", "to": "L298N ENA", "color": "green", "desc": "Left Motor Speed PWM"},
            {"from": "Arduino Pin 6 (PWM)", "to": "L298N ENB", "color": "green", "desc": "Right Motor Speed PWM"},
            {"from": "Arduino Pin 7", "to": "L298N IN1", "color": "blue", "desc": "Left Motor Direction 1"},
            {"from": "Arduino Pin 8", "to": "L298N IN2", "color": "blue", "desc": "Left Motor Direction 2"},
            {"from": "Arduino Pin 9", "to": "L298N IN3", "color": "amber", "desc": "Right Motor Direction 1"},
            {"from": "Arduino Pin 10", "to": "L298N IN4", "color": "amber", "desc": "Right Motor Direction 2"},
            {"from": "Arduino Pin 11", "to": "Servo Signal (Orange)", "color": "orange", "desc": "Look-ahead Servo PWM"},
            {"from": "Arduino Pin 12", "to": "HC-SR04 Trig", "color": "blue", "desc": "Ultrasonic Trigger"},
            {"from": "Arduino Pin 13", "to": "HC-SR04 Echo", "color": "green", "desc": "Ultrasonic Echo"},
            {"from": "Arduino A4", "to": "LCD / OLED SDA", "color": "blue", "desc": "I2C Serial Data"},
            {"from": "Arduino A5", "to": "LCD / OLED SCL", "color": "amber", "desc": "I2C Serial Clock"}
        ],
        "circuitDiagram": {
            "boardType": "arduino-uno",
            "modules": [
                {"name": "HC-SR04 & Look-Ahead Servo", "type": "sensor", "pins": ["Trig (D12)", "Echo (D13)", "Servo PWM (D11)", "5V", "GND"]},
                {"name": "L298N Motor Driver", "type": "actuator", "pins": ["ENA (D5)", "ENB (D6)", "IN1-4 (D7-D10)", "12V Power", "GND"]}
            ]
        },
        "code": """#include <Servo.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>

LiquidCrystal_I2C lcd(0x27, 16, 2);
Servo headServo;

#define ENA 5
#define ENB 6
#define IN1 7
#define IN2 8
#define IN3 9
#define IN4 10

#define SERVO_PIN 11
#define TRIG_PIN  12
#define ECHO_PIN  13

const int MOTOR_SPEED = 180; // PWM speed (0-255)
const int STOP_DIST = 25;    // Stop threshold in cm

int readDistance() {
  digitalWrite(TRIG_PIN, LOW); delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH); delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);
  long duration = pulseIn(ECHO_PIN, HIGH, 25000);
  if (duration == 0) return 200;
  return duration * 0.034 / 2;
}

void moveForward() {
  analogWrite(ENA, MOTOR_SPEED); analogWrite(ENB, MOTOR_SPEED);
  digitalWrite(IN1, HIGH); digitalWrite(IN2, LOW);
  digitalWrite(IN3, HIGH); digitalWrite(IN4, LOW);
}

void moveBackward() {
  analogWrite(ENA, MOTOR_SPEED); analogWrite(ENB, MOTOR_SPEED);
  digitalWrite(IN1, LOW); digitalWrite(IN2, HIGH);
  digitalWrite(IN3, LOW); digitalWrite(IN4, HIGH);
}

void turnLeft() {
  analogWrite(ENA, MOTOR_SPEED); analogWrite(ENB, MOTOR_SPEED);
  digitalWrite(IN1, LOW); digitalWrite(IN2, HIGH);
  digitalWrite(IN3, HIGH); digitalWrite(IN4, LOW);
}

void turnRight() {
  analogWrite(ENA, MOTOR_SPEED); analogWrite(ENB, MOTOR_SPEED);
  digitalWrite(IN1, HIGH); digitalWrite(IN2, LOW);
  digitalWrite(IN3, LOW); digitalWrite(IN4, HIGH);
}

void stopMotors() {
  analogWrite(ENA, 0); analogWrite(ENB, 0);
  digitalWrite(IN1, LOW); digitalWrite(IN2, LOW);
  digitalWrite(IN3, LOW); digitalWrite(IN4, LOW);
}

void setup() {
  pinMode(ENA, OUTPUT); pinMode(ENB, OUTPUT);
  pinMode(IN1, OUTPUT); pinMode(IN2, OUTPUT);
  pinMode(IN3, OUTPUT); pinMode(IN4, OUTPUT);

  pinMode(TRIG_PIN, OUTPUT); pinMode(ECHO_PIN, INPUT);

  headServo.attach(SERVO_PIN);
  headServo.write(90); // Center forward

  lcd.init();
  lcd.backlight();
  lcd.setCursor(0, 0);
  lcd.print("Obstacle Rover");
  lcd.setCursor(0, 1);
  lcd.print("Ready to drive");
  delay(1500);
}

void loop() {
  headServo.write(90);
  int dist = readDistance();

  if (dist > STOP_DIST) {
    moveForward();
    lcd.setCursor(0, 1);
    lcd.print("Path CLEAR: FWD ");
  } else {
    stopMotors();
    lcd.setCursor(0, 1);
    lcd.print("OBSTACLE DETECT!");
    delay(200);

    moveBackward();
    delay(300);
    stopMotors();

    // Look Left
    headServo.write(150);
    delay(400);
    int distLeft = readDistance();

    // Look Right
    headServo.write(30);
    delay(500);
    int distRight = readDistance();

    headServo.write(90); // Return center

    if (distLeft >= distRight) {
      turnLeft();
      delay(450);
    } else {
      turnRight();
      delay(450);
    }
    stopMotors();
  }
  delay(50);
}""",
        "assemblySteps": [
            "Mount the two DC TT gear motors onto the acrylic robot chassis and connect the drive wheels.",
            "Install the L298N motor driver board and Arduino Uno on top plate.",
            "Wire the motor terminal blocks to L298N OUT1/OUT2 (Left) and OUT3/OUT4 (Right).",
            "Mount the SG90 servo and HC-SR04 ultrasonic sensor pointing forward on the chassis front.",
            "Wire L298N inputs ENA, ENB, IN1-IN4 to Arduino pins 5, 6, 7, 8, 9, 10.",
            "Connect the 7.4V Li-ion battery pack to L298N 12V and GND (connect L298N GND to Arduino GND).",
            "Test on floor and observe obstacle detection, scan, and autonomous turn."
        ],
        "scientificApplications": "Automated guided vehicle (AGV) warehouse logistics, planetary rover autonomous navigation, exploratory search-and-rescue robotics, and vacuum cleaner pathfinding."
    },

    # 6. Reverse Car Parking Sensor
    {
        "id": "reverse-car-parking-sensor",
        "title": "Reverse Car Parking Sensor with Multi-Stage Audio & Visual Alert",
        "shortDesc": "Automotive parking assist system measuring rear bumper clearance in centimeters with distance-proportional audio beep frequency and visual 3-stage LED gauge.",
        "board": "Arduino Uno",
        "category": "Robotics & Automation",
        "difficulty": "Beginner",
        "estimatedTime": "1.5 Hours",
        "rating": 4.8,
        "featured": True,
        "tags": ["HC-SR04", "Buzzer", "Automotive", "Parking Sensor", "LED Gauge", "LCD"],
        "components": [
            {"name": "Arduino Uno R3", "qty": "1", "note": "ATmega328P"},
            {"name": "HC-SR04 Ultrasonic Distance Sensor", "qty": "1", "note": "40 kHz acoustic ultrasonic transceiver"},
            {"name": "Active Piezo Buzzer", "qty": "1", "note": "Modulated acoustic beep horn"},
            {"name": "Green LED (Safe Zone > 50cm)", "qty": "1", "note": "With 220-ohm resistor"},
            {"name": "Yellow LED (Warning Zone 20-50cm)", "qty": "1", "note": "With 220-ohm resistor"},
            {"name": "Red LED (Hazard Stop Zone < 20cm)", "qty": "1", "note": "With 220-ohm resistor"},
            {"name": "16x2 I2C Character LCD (or 0.96\" OLED)", "qty": "1", "note": "Distance gauge and warning text"}
        ],
        "workingPrinciple": "This project replicates commercial automotive Parking Distance Control (PDC) systems installed on vehicle rear bumpers. An ultrasonic burst is bounced off approaching walls or vehicles. As the vehicle reverses and obstacle clearance closes, the Arduino dynamically scales the audio beep repetition period: at > 75cm, beep period is 800ms (calm); at 40cm, beep period shortens to 350ms; at 20cm, it intensifies to 150ms; and below 12cm, the buzzer switches to a continuous solid emergency alarm tone with the red hazard LED flashing, preventing rear collisions.",
        "wiringTable": [
            {"from": "Arduino 5V", "to": "HC-SR04 VCC & LCD VCC", "color": "red", "desc": "5V Power Rail"},
            {"from": "Arduino GND", "to": "HC-SR04 GND & System GND", "color": "black", "desc": "Common Ground"},
            {"from": "Arduino Pin 9", "to": "HC-SR04 Trig", "color": "blue", "desc": "Ultrasonic trigger pulse"},
            {"from": "Arduino Pin 10", "to": "HC-SR04 Echo", "color": "green", "desc": "Ultrasonic echo return"},
            {"from": "Arduino Pin 8", "to": "Buzzer (+)", "color": "yellow", "desc": "Acoustic beep output"},
            {"from": "Arduino Pin 5", "to": "Green LED Anode", "color": "green", "desc": "Safe zone indicator (> 50cm)"},
            {"from": "Arduino Pin 4", "to": "Yellow LED Anode", "color": "amber", "desc": "Warning indicator (20-50cm)"},
            {"from": "Arduino Pin 3", "to": "Red LED Anode", "color": "red", "desc": "Hazard stop indicator (< 20cm)"},
            {"from": "Arduino A4", "to": "LCD / OLED SDA", "color": "blue", "desc": "I2C Serial Data"},
            {"from": "Arduino A5", "to": "LCD / OLED SCL", "color": "amber", "desc": "I2C Serial Clock"}
        ],
        "circuitDiagram": {
            "boardType": "arduino-uno",
            "modules": [
                {"name": "HC-SR04 Parking Sensor", "type": "sensor", "pins": ["VCC (5V)", "GND", "Trig (D9)", "Echo (D10)"]},
                {"name": "Buzzer & LED Array", "type": "actuator", "pins": ["Buzzer (D8)", "Green (D5)", "Yellow (D4)", "Red (D3)"]}
            ]
        },
        "code": """#include <Wire.h>
#include <LiquidCrystal_I2C.h>

LiquidCrystal_I2C lcd(0x27, 16, 2);

#define TRIG_PIN 9
#define ECHO_PIN 10
#define BUZZER_PIN 8
#define LED_SAFE 5
#define LED_WARN 4
#define LED_STOP 3

unsigned long lastBeepTime = 0;
bool beepState = false;

long readDistance() {
  digitalWrite(TRIG_PIN, LOW); delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH); delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);
  long duration = pulseIn(ECHO_PIN, HIGH, 25000);
  if (duration == 0) return 200;
  return duration * 0.034 / 2;
}

void setup() {
  Serial.begin(9600);
  pinMode(TRIG_PIN, OUTPUT); pinMode(ECHO_PIN, INPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(LED_SAFE, OUTPUT);
  pinMode(LED_WARN, OUTPUT);
  pinMode(LED_STOP, OUTPUT);

  lcd.init();
  lcd.backlight();
  lcd.setCursor(0, 0);
  lcd.print("PARKING ASSIST");
  lcd.setCursor(0, 1);
  lcd.print("REVERSE SENSOR");
  delay(1200);
}

void loop() {
  int distance = readDistance();

  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Dist: ");
  lcd.print(distance);
  lcd.print(" cm");

  lcd.setCursor(0, 1);

  if (distance > 70) {
    // Safe zone
    lcd.print("ZONE: [SAFE]");
    digitalWrite(LED_SAFE, HIGH);
    digitalWrite(LED_WARN, LOW);
    digitalWrite(LED_STOP, LOW);
    noTone(BUZZER_PIN);
  } else if (distance > 30) {
    // Warning zone
    lcd.print("ZONE: [CAUTION]");
    digitalWrite(LED_SAFE, LOW);
    digitalWrite(LED_WARN, HIGH);
    digitalWrite(LED_STOP, LOW);
    
    // Moderate intermittent beep
    int interval = map(distance, 30, 70, 150, 600);
    if (millis() - lastBeepTime > interval) {
      lastBeepTime = millis();
      tone(BUZZER_PIN, 1800, 40);
    }
  } else if (distance > 12) {
    // Close hazard zone
    lcd.print("ZONE: [HAZARD!]");
    digitalWrite(LED_SAFE, LOW);
    digitalWrite(LED_WARN, LOW);
    digitalWrite(LED_STOP, HIGH);
    
    // Rapid beep
    if (millis() - lastBeepTime > 120) {
      lastBeepTime = millis();
      tone(BUZZER_PIN, 2400, 35);
    }
  } else {
    // Emergency stop zone
    lcd.print("STOP! COLLISION!");
    digitalWrite(LED_SAFE, LOW);
    digitalWrite(LED_WARN, HIGH);
    digitalWrite(LED_STOP, HIGH);
    tone(BUZZER_PIN, 3000); // Continuous tone
  }

  delay(60);
}""",
        "assemblySteps": [
            "Mount the HC-SR04 ultrasonic sensor horizontally facing backwards on your demonstration vehicle bumper.",
            "Connect HC-SR04 VCC to 5V, GND to GND, Trig to Pin 9, and Echo to Pin 10.",
            "Connect buzzer to Pin 8 and GND.",
            "Connect Green LED to Pin 5, Yellow LED to Pin 4, and Red LED to Pin 3 via 220-ohm resistors.",
            "Connect I2C LCD to 5V, GND, A4 (SDA), and A5 (SCL).",
            "Move a flat cardboard obstacle toward the sensor from 150 cm to 5 cm and verify dynamic beep acceleration."
        ],
        "scientificApplications": "Automotive active safety standards (ISO 17386), blind-spot detection systems, industrial forklift collision prevention, and robotic docking."
    },

    # 7. Electronic Drumset with 7 Piezo Sensors + Python Program & ESP32
    {
        "id": "esp32-electronic-drumset-piezo",
        "title": "ESP32 7-Pad Electronic Drum Kit with Piezo Sensors & Python Synthesizer",
        "shortDesc": "Musical acoustics and signal processing instrument using 7 piezo vibration discs, ESP32 microsecond velocity ADC sampling, and a companion Python audio synthesizer script.",
        "board": "ESP32",
        "category": "Physics & Acoustics",
        "difficulty": "Intermediate",
        "estimatedTime": "3 Hours",
        "rating": 5.0,
        "featured": True,
        "tags": ["Piezoelectric", "Python Audio", "MIDI Synthesizer", "ADC", "Acoustics", "ESP32"],
        "components": [
            {"name": "ESP32 NodeMCU Development Board", "qty": "1", "note": "Multi-channel 12-bit ADC with fast sampling"},
            {"name": "27mm Piezoelectric Ceramic Vibration Discs", "qty": "7", "note": "Crash, Ride, Hi-Hat, Snare, Hi-Tom, Low-Tom, Bass/Kick"},
            {"name": "1M Ohm Resistors (1/4W)", "qty": "7", "note": "Discharge bleeders to prevent double triggering"},
            {"name": "5.1V Zener Diodes / 100nF Capacitors", "qty": "7", "note": "Voltage clamping and debounce spike filter"},
            {"name": "Rubber Practice Drum Pads / Foam Mounts", "qty": "7", "note": "Mechanical vibration decoupling"},
            {"name": "USB Cable to PC / Laptop", "qty": "1", "note": "115200 baud low-latency serial link"},
            {"name": "Companion Python Drum Synthesizer Script", "qty": "1", "note": "Pygame audio engine with studio drum samples"}
        ],
        "workingPrinciple": "This project applies the Direct Piezoelectric Effect discovered by the Curie brothers. PZT (Lead Zirconate Titanate) ceramic crystals generate an electrical surface charge when subjected to mechanical stress: V = Q / C. Striking a drum pad sends an elastic stress wave through the disc, generating an instantaneous microsecond voltage pulse whose peak amplitude is directly proportional to drumstick velocity (soft tap vs loud rimshot). A 1M-ohm shunt resistor across each disc drains charge to prevent false re-triggers. The ESP32 continuously scans 7 ADC channels (GPIO 36, 39, 34, 35, 32, 33, 25). When a strike exceeds threshold, it calculates strike velocity and streams formatted packets over USB Serial (`DRUM:PAD_INDEX:VELOCITY`). A companion Python program reads the stream and triggers zero-latency stereo drum samples through PC headphones or speakers.",
        "wiringTable": [
            {"from": "ESP32 GND", "to": "All 7 Piezo Black Wires (Common GND)", "color": "black", "desc": "Common ground bus across all 7 pads"},
            {"from": "ESP32 GPIO 36 (VP)", "to": "Pad 1 Red Wire (Crash Cymbal) + 1M to GND", "color": "blue", "desc": "ADC1_CH0 Velocity Input"},
            {"from": "ESP32 GPIO 39 (VN)", "to": "Pad 2 Red Wire (Ride Cymbal) + 1M to GND", "color": "blue", "desc": "ADC1_CH3 Velocity Input"},
            {"from": "ESP32 GPIO 34", "to": "Pad 3 Red Wire (Hi-Hat) + 1M to GND", "color": "blue", "desc": "ADC1_CH6 Velocity Input"},
            {"from": "ESP32 GPIO 35", "to": "Pad 4 Red Wire (Snare Drum) + 1M to GND", "color": "green", "desc": "ADC1_CH7 Velocity Input"},
            {"from": "ESP32 GPIO 32", "to": "Pad 5 Red Wire (High Tom) + 1M to GND", "color": "amber", "desc": "ADC1_CH4 Velocity Input"},
            {"from": "ESP32 GPIO 33", "to": "Pad 6 Red Wire (Low Tom) + 1M to GND", "color": "amber", "desc": "ADC1_CH5 Velocity Input"},
            {"from": "ESP32 GPIO 25", "to": "Pad 7 Red Wire (Bass / Kick Drum) + 1M to GND", "color": "red", "desc": "ADC2_CH8 Velocity Input"},
            {"from": "ESP32 GPIO 21", "to": "LCD / OLED SDA", "color": "blue", "desc": "I2C Serial Data"},
            {"from": "ESP32 GPIO 22", "to": "LCD / OLED SCL", "color": "amber", "desc": "I2C Serial Clock"},
            {"from": "ESP32 3V3", "to": "LCD / OLED VCC", "color": "red", "desc": "3.3V Display Power"},
            {"from": "ESP32 GND", "to": "LCD / OLED GND", "color": "black", "desc": "Display Ground"}
        ],
        "circuitDiagram": {
            "boardType": "esp32",
            "modules": [
                {"name": "7x Piezo Drum Pads", "type": "sensor", "pins": ["Crash (36)", "Ride (39)", "HiHat (34)", "Snare (35)", "HiTom (32)", "LowTom (33)", "Kick (25)"]},
                {"name": "OLED & USB Audio Link", "type": "display", "pins": ["SDA (21)", "SCL (22)", "USB Serial 115200", "GND"]}
            ]
        },
        "code": """// =========================================================================
// PART 1: ESP32 ARDUINO FIRMWARE (C++)
// Scans 7 Piezo Sensors and streams MIDI velocity packets over USB Serial
// =========================================================================

#include <Wire.h>
#include <LiquidCrystal_I2C.h>

LiquidCrystal_I2C lcd(0x27, 16, 2);

const int NUM_PADS = 7;
// ADC pins connected to the 7 piezo discs
const int padPins[NUM_PADS] = {36, 39, 34, 35, 32, 33, 25};
const char* padNames[NUM_PADS] = {
  "Crash Cymbal", "Ride Cymbal", "Hi-Hat", "Snare Drum", 
  "High Tom", "Low Tom", "Bass Kick"
};

// Velocity thresholds and debounce
const int THRESHOLD = 120; // Ignore subtle mechanical vibrations
const int DEBOUNCE_MS = 35;
unsigned long lastHitTime[NUM_PADS] = {0, 0, 0, 0, 0, 0, 0};

void setup() {
  Serial.begin(115200);

  lcd.init();
  lcd.backlight();
  lcd.setCursor(0, 0);
  lcd.print("7-PAD DRUM KIT");
  lcd.setCursor(0, 1);
  lcd.print("ESP32 + PYTHON");
  delay(1200);
}

void loop() {
  for (int i = 0; i < NUM_PADS; i++) {
    int rawVal = analogRead(padPins[i]);

    if (rawVal > THRESHOLD && (millis() - lastHitTime[i] > DEBOUNCE_MS)) {
      lastHitTime[i] = millis();

      // Measure peak hit amplitude
      int peakVal = rawVal;
      for (int k = 0; k < 15; k++) {
        int sample = analogRead(padPins[i]);
        if (sample > peakVal) peakVal = sample;
        delayMicroseconds(100);
      }

      // Map to standard MIDI velocity range (1 - 127)
      int velocity = map(peakVal, THRESHOLD, 4095, 30, 127);
      velocity = constrain(velocity, 1, 127);

      // Transmit packet to Python audio program: "DRUM:PAD_INDEX:VELOCITY\\n"
      Serial.print("DRUM:");
      Serial.print(i);
      Serial.print(":");
      Serial.println(velocity);

      // Fast display update
      lcd.setCursor(0, 0);
      lcd.print(padNames[i]);
      lcd.print("       ");
      lcd.setCursor(0, 1);
      lcd.print("Velocity: ");
      lcd.print(velocity);
      lcd.print(" / 127  ");
    }
  }
}

/*
// =========================================================================
// PART 2: COMPANION PYTHON PROGRAM (Run on your PC / Laptop)
// Requires: pip install pygame pyserial
// Save as: drum_synthesizer.py and run: python drum_synthesizer.py
// =========================================================================

import serial
import pygame
import sys

# Configure your ESP32 Serial COM port (e.g. 'COM3' on Windows or '/dev/ttyUSB0' on Linux)
SERIAL_PORT = 'COM3'
BAUD_RATE = 115200

pygame.mixer.pre_init(44100, -16, 2, 512)
pygame.init()
pygame.mixer.set_num_channels(16)

# Generate or load 7 drum sounds (WAV audio files)
# Place WAV files in a 'sounds' directory or generate synthesized tones
sounds = [
    pygame.mixer.Sound('sounds/crash.wav'),
    pygame.mixer.Sound('sounds/ride.wav'),
    pygame.mixer.Sound('sounds/hihat.wav'),
    pygame.mixer.Sound('sounds/snare.wav'),
    pygame.mixer.Sound('sounds/tom_hi.wav'),
    pygame.mixer.Sound('sounds/tom_low.wav'),
    pygame.mixer.Sound('sounds/kick.wav')
]

pad_names = ["Crash Cymbal", "Ride Cymbal", "Hi-Hat", "Snare Drum", "High Tom", "Low Tom", "Bass Kick"]

print("======================================================")
print("  OmniLab ESP32 7-Pad Electronic Drum Sound Engine    ")
print("  Connecting to ESP32 on:", SERIAL_PORT)
print("======================================================")

try:
    ser = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=0.1)
    print("Connected! Strike the drum pads to play sounds.")
except Exception as e:
    print(f"Error opening {SERIAL_PORT}: {e}")
    sys.exit(1)

while True:
    if ser.in_waiting:
        line = ser.readline().decode('utf-8', errors='ignore').strip()
        if line.startswith("DRUM:"):
            parts = line.split(":")
            if len(parts) == 3:
                pad_idx = int(parts[1])
                velocity = int(parts[2]) # 1 to 127
                volume = velocity / 127.0

                if 0 <= pad_idx < len(sounds):
                    sounds[pad_idx].set_volume(volume)
                    sounds[pad_idx].play()
                    print(f"[HIT] {pad_names[pad_idx]} | Velocity: {velocity}")
*/""",
        "assemblySteps": [
            "Glue or tape 7 piezoelectric ceramic discs to the underside of 7 mousepads or rubber practice pads.",
            "Connect the negative (outer brass ring / black wire) of all 7 piezos to a shared Ground rail on the ESP32.",
            "Wire each positive (center white ceramic / red wire) to ESP32 ADC pins (GPIO 36, 39, 34, 35, 32, 33, 25).",
            "CRITICAL: Insert a 1M-ohm resistor in parallel across EACH piezo disc (+ to GND) to bleed charge and eliminate double triggers.",
            "Connect the 16x2 I2C LCD (or OLED) to 3.3V, GND, GPIO 21 (SDA), and GPIO 22 (SCL).",
            "Flash the Arduino sketch to the ESP32 via USB.",
            "Install Python prerequisites (`pip install pygame pyserial`) and run the companion script `drum_synthesizer.py` on your computer."
        ],
        "scientificApplications": "Musical acoustics and percussion velocity dynamics, piezoelectric energy harvesting, industrial machine vibration shock monitoring, and bio-mechanical gait impact analysis."
    }
]

output_path = os.path.join("js", "projects-data.js")
with open(output_path, "w", encoding="utf-8") as f:
    f.write("// Comprehensive Science Projects Database: Exactly 7 Curated Projects\n")
    f.write(f"// Generated {len(projects)} curated projects with code, circuits, and principles\n")
    f.write("const PROJECTS_DATA = ")
    json.dump(projects, f, indent=2, ensure_ascii=False)
    f.write(";\n\n")
    f.write("if (typeof module !== 'undefined') {\n  module.exports = PROJECTS_DATA;\n}\n")

print(f"Successfully generated {output_path} with {len(projects)} exact projects!")
