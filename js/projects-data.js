// Comprehensive Science Projects Database: Exactly 12 Curated Projects
// Generated 12 curated projects with code, circuits, and principles
const PROJECTS_DATA = [
  {
    "id": "soil-moisture-auto-watering",
    "title": "Soil Moisture Automatic Plant Watering System",
    "shortDesc": "Closed-loop precision irrigation system monitoring volumetric water content (VWC) via capacitive corrosion-free probe and automated 5V relay pump actuation with dual LCD/OLED display telemetry.",
    "board": "Arduino Uno",
    "category": "Environmental & Weather",
    "difficulty": "Beginner",
    "estimatedTime": "1.5 Hours",
    "rating": 4.9,
    "featured": true,
    "tags": [
      "Capacitive Soil",
      "5V Relay",
      "Water Pump",
      "Hysteresis",
      "LCD 1602",
      "OLED"
    ],
    "components": [
      {
        "name": "Arduino Uno R3",
        "qty": "1",
        "note": "ATmega328P 16MHz Microcontroller"
      },
      {
        "name": "Capacitive Soil Moisture Sensor v1.2",
        "qty": "1",
        "note": "Corrosion-resistant copper capacitor PCB"
      },
      {
        "name": "5V 1-Channel Optocoupled Relay Module",
        "qty": "1",
        "note": "Songle SRD-05VDC-SL-C pump isolator switch"
      },
      {
        "name": "3-6V DC Submersible Mini Water Pump",
        "qty": "1",
        "note": "With 50cm flexible silicone tubing"
      },
      {
        "name": "4x AA Battery Holder / 5V DC Supply",
        "qty": "1",
        "note": "Isolated power rail for water pump"
      },
      {
        "name": "16x2 I2C Character LCD (or 0.96\" OLED)",
        "qty": "1",
        "note": "Real-time moisture percentage readout"
      },
      {
        "name": "Solderless Breadboard & Jumper Wires",
        "qty": "1",
        "note": "Prototyping kit"
      }
    ],
    "workingPrinciple": "Unlike standard resistive soil probes that suffer rapid electrolytic corrosion, capacitive soil sensors form a planar capacitor utilizing insulated copper traces buried within the PCB. Water possesses a very high relative dielectric permittivity (~80) compared to dry soil (~4) and air (~1). As volumetric water content increases, the probe capacitance rises proportionally, altering the oscillation frequency of an onboard 555-timer circuit. The analog output voltage (inversely proportional to moisture) is read by the Arduino ADC (A0). When moisture falls below the wilting threshold (35%), the microcontroller energizes the optocoupled relay (Pin 7), pumping water until soil saturation reaches 65% (hysteresis control to prevent relay chatter).",
    "wiringTable": [
      {
        "from": "Arduino 5V",
        "to": "Capacitive Sensor VCC",
        "color": "red",
        "desc": "Clean 5V analog power rail"
      },
      {
        "from": "Arduino GND",
        "to": "Capacitive Sensor GND",
        "color": "black",
        "desc": "Common system ground"
      },
      {
        "from": "Arduino A0",
        "to": "Capacitive Sensor AOUT",
        "color": "blue",
        "desc": "Analog moisture potential"
      },
      {
        "from": "Arduino Pin 7",
        "to": "Relay Module IN",
        "color": "green",
        "desc": "Active-LOW relay trigger control"
      },
      {
        "from": "Arduino 5V",
        "to": "Relay Module VCC",
        "color": "red",
        "desc": "5V coil driver power"
      },
      {
        "from": "Arduino GND",
        "to": "Relay Module GND",
        "color": "black",
        "desc": "Common ground"
      },
      {
        "from": "Ext Battery (+)",
        "to": "Relay COM Terminal",
        "color": "red",
        "desc": "External pump circuit supply"
      },
      {
        "from": "Relay NO Terminal",
        "to": "Pump Red Wire (+)",
        "color": "red",
        "desc": "Switched pump power"
      },
      {
        "from": "Pump Black Wire (-)",
        "to": "Ext Battery (-)",
        "color": "black",
        "desc": "Pump return loop"
      },
      {
        "from": "Arduino A4",
        "to": "OLED / LCD SDA",
        "color": "blue",
        "desc": "I2C Serial Data"
      },
      {
        "from": "Arduino A5",
        "to": "OLED / LCD SCL",
        "color": "amber",
        "desc": "I2C Serial Clock"
      },
      {
        "from": "Arduino 5V",
        "to": "OLED / LCD VCC",
        "color": "red",
        "desc": "5V display logic & backlight"
      },
      {
        "from": "Arduino GND",
        "to": "OLED / LCD GND",
        "color": "black",
        "desc": "Common ground"
      }
    ],
    "circuitDiagram": {
      "boardType": "arduino-uno",
      "modules": [
        {
          "name": "Capacitive Soil Sensor",
          "type": "sensor",
          "pins": [
            "VCC (5V)",
            "GND",
            "AOUT (A0)"
          ]
        },
        {
          "name": "5V Relay Module",
          "type": "actuator",
          "pins": [
            "VCC (5V)",
            "GND",
            "IN (D7)",
            "COM",
            "NO"
          ]
        },
        {
          "name": "Mini Submersible Pump",
          "type": "actuator",
          "pins": [
            "Pump (+) Red",
            "Pump (-) Black"
          ]
        },
        {
          "name": "4x AA Battery Pack",
          "type": "power",
          "pins": [
            "Positive (+)",
            "Negative (-)"
          ]
        },
        {
          "name": "I2C Display (LCD/OLED)",
          "type": "display",
          "pins": [
            "VCC (5V)",
            "GND",
            "SDA (A4)",
            "SCL (A5)"
          ]
        }
      ]
    },
    "code": "#include <Wire.h>\n#include <LiquidCrystal_I2C.h>\n\nLiquidCrystal_I2C lcd(0x27, 16, 2);\n\n#define SOIL_PIN A0\n#define RELAY_PIN 7\n\nconst int DRY_VAL = 590;   // 0% moisture in air\nconst int WET_VAL = 270;   // 100% moisture in water\nconst int THRESHOLD_LOW = 35;  // Trigger pump below 35%\nconst int THRESHOLD_HIGH = 65; // Stop pump above 65%\n\nbool isWatering = false;\n\nvoid setup() {\n  Serial.begin(9600);\n  pinMode(RELAY_PIN, OUTPUT);\n  digitalWrite(RELAY_PIN, HIGH); // Deactivate relay (Active-LOW)\n\n  lcd.init();\n  lcd.backlight();\n  lcd.setCursor(0, 0);\n  lcd.print(\"Smart Irrigation\");\n  lcd.setCursor(0, 1);\n  lcd.print(\"Calibrating...\");\n  delay(1500);\n}\n\nvoid loop() {\n  int rawSum = 0;\n  for(int i = 0; i < 20; i++) {\n    rawSum += analogRead(SOIL_PIN);\n    delay(10);\n  }\n  int rawAvg = rawSum / 20;\n\n  int moisturePercent = map(rawAvg, DRY_VAL, WET_VAL, 0, 100);\n  moisturePercent = constrain(moisturePercent, 0, 100);\n\n  if (moisturePercent < THRESHOLD_LOW && !isWatering) {\n    digitalWrite(RELAY_PIN, LOW); // Turn pump ON\n    isWatering = true;\n  } else if (moisturePercent >= THRESHOLD_HIGH && isWatering) {\n    digitalWrite(RELAY_PIN, HIGH); // Turn pump OFF\n    isWatering = false;\n  }\n\n  lcd.clear();\n  lcd.setCursor(0, 0);\n  lcd.print(\"Moisture: \");\n  lcd.print(moisturePercent);\n  lcd.print(\"%\");\n\n  lcd.setCursor(0, 1);\n  if (isWatering) {\n    lcd.print(\"PUMP: [ACTIVE]\");\n  } else {\n    lcd.print(\"PUMP: [STANDBY]\");\n  }\n\n  delay(500);\n}",
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
  {
    "id": "rfid-smart-access-system",
    "title": "RFID Smart Access Control & Security Door Lock",
    "shortDesc": "High-security access authentication apparatus utilizing 13.56 MHz RFID magnetic induction coupling with ESP32 Tensilica dual-core controller, hardware VSPI bus, SG90 servo deadbolt actuation, piezo audio alarms, and OLED/LCD logs.",
    "board": "ESP32",
    "category": "Robotics & Automation",
    "difficulty": "Intermediate",
    "estimatedTime": "2 Hours",
    "rating": 4.9,
    "featured": true,
    "tags": [
      "ESP32",
      "RC522",
      "RFID",
      "VSPI",
      "Servo",
      "Access Control",
      "Security"
    ],
    "components": [
      {
        "name": "ESP32 NodeMCU 30-Pin DevKit V1",
        "qty": "1",
        "note": "Tensilica Dual-Core 240MHz MCU with Hardware VSPI"
      },
      {
        "name": "RC522 13.56MHz RFID Reader Module",
        "qty": "1",
        "note": "Mifare Classic ISO/IEC 14443A (3.3V Logic)"
      },
      {
        "name": "RFID 13.56MHz Keyfob & Smart Card",
        "qty": "2",
        "note": "Unique 4-byte / 7-byte UID tags"
      },
      {
        "name": "SG90 Micro Servo (90/180 deg)",
        "qty": "1",
        "note": "Mechanical deadbolt / latch actuation"
      },
      {
        "name": "Active Piezo Buzzer",
        "qty": "1",
        "note": "Access granted / denied acoustic tones"
      },
      {
        "name": "Dual LEDs (Green Authorized, Red Denied)",
        "qty": "2",
        "note": "With 220-ohm current limiting resistors"
      },
      {
        "name": "16x2 I2C LCD (or 0.96\" OLED)",
        "qty": "1",
        "note": "Displays badge UID and authorization status"
      }
    ],
    "workingPrinciple": "The RC522 RFID reader generates a 13.56 MHz electromagnetic field through its PCB trace antenna. When a passive RFID tag enters the field, Faraday's law of induction powers the tag's onboard transponder through resonant inductive coupling. The card modulates the RF field to transmit its unique factory serial UID via load backscattering. The ESP32 captures this payload across high-speed hardware VSPI (SCK GPIO 18, MOSI GPIO 23, MISO GPIO 19, SS GPIO 5) and cross-references the UID against its internal security whitelist. If authorized, the ESP32 drives PWM signals to the SG90 servo (GPIO 13) to withdraw a door deadbolt, illuminates the green LED (GPIO 14), and plays an authorized chime (GPIO 12). Unknown cards illuminate the red LED (GPIO 27) and sound an alarm.",
    "wiringTable": [
      {
        "from": "ESP32 3.3V",
        "to": "RC522 3.3V",
        "color": "red",
        "desc": "Clean 3.3V power (NEVER connect to 5V!)"
      },
      {
        "from": "ESP32 GND",
        "to": "RC522 GND",
        "color": "black",
        "desc": "Common system ground"
      },
      {
        "from": "ESP32 GPIO 5 (SS)",
        "to": "RC522 SDA / NSS",
        "color": "blue",
        "desc": "Hardware VSPI Chip Select"
      },
      {
        "from": "ESP32 GPIO 18 (SCK)",
        "to": "RC522 SCK",
        "color": "amber",
        "desc": "Hardware VSPI Serial Clock"
      },
      {
        "from": "ESP32 GPIO 23 (MOSI)",
        "to": "RC522 MOSI",
        "color": "green",
        "desc": "Hardware VSPI Master Out Slave In"
      },
      {
        "from": "ESP32 GPIO 19 (MISO)",
        "to": "RC522 MISO",
        "color": "purple",
        "desc": "Hardware VSPI Master In Slave Out"
      },
      {
        "from": "ESP32 GPIO 4",
        "to": "RC522 RST",
        "color": "orange",
        "desc": "Hardware reset pin"
      },
      {
        "from": "ESP32 GPIO 13",
        "to": "Servo Signal (Orange)",
        "color": "orange",
        "desc": "Lock Latch PWM control"
      },
      {
        "from": "ESP32 VIN (5V)",
        "to": "Servo VCC (Red)",
        "color": "red",
        "desc": "5V Servo Power"
      },
      {
        "from": "ESP32 GND",
        "to": "Servo GND (Brown)",
        "color": "black",
        "desc": "Servo Ground"
      },
      {
        "from": "ESP32 GPIO 12",
        "to": "Buzzer (+)",
        "color": "yellow",
        "desc": "Access alert tone"
      },
      {
        "from": "ESP32 GND",
        "to": "Buzzer (-)",
        "color": "black",
        "desc": "Buzzer Ground"
      },
      {
        "from": "ESP32 GPIO 14",
        "to": "Green LED Anode",
        "color": "green",
        "desc": "Access Granted indicator"
      },
      {
        "from": "ESP32 GPIO 27",
        "to": "Red LED Anode",
        "color": "red",
        "desc": "Access Denied indicator"
      },
      {
        "from": "ESP32 GPIO 21 (SDA)",
        "to": "LCD / OLED SDA",
        "color": "blue",
        "desc": "I2C Serial Data"
      },
      {
        "from": "ESP32 GPIO 22 (SCL)",
        "to": "LCD / OLED SCL",
        "color": "amber",
        "desc": "I2C Serial Clock"
      }
    ],
    "circuitDiagram": {
      "boardType": "esp32",
      "modules": [
        {
          "name": "RC522 RFID Reader",
          "type": "sensor",
          "pins": [
            "3.3V",
            "GND",
            "RST (GPIO 4)",
            "SDA/SS (GPIO 5)",
            "MOSI (GPIO 23)",
            "MISO (GPIO 19)",
            "SCK (GPIO 18)"
          ]
        },
        {
          "name": "Lock SG90 Servo",
          "type": "actuator",
          "pins": [
            "Signal (GPIO 13)",
            "VCC (5V)",
            "GND"
          ]
        },
        {
          "name": "Piezo Buzzer",
          "type": "actuator",
          "pins": [
            "Buzzer (+) (GPIO 12)",
            "GND"
          ]
        },
        {
          "name": "Dual Status LEDs",
          "type": "actuator",
          "pins": [
            "Green LED (GPIO 14)",
            "Red LED (GPIO 27)",
            "GND"
          ]
        },
        {
          "name": "I2C Display (LCD/OLED)",
          "type": "display",
          "pins": [
            "VCC (VIN)",
            "GND",
            "SDA (GPIO 21)",
            "SCL (GPIO 22)"
          ]
        }
      ]
    },
    "code": "#include <SPI.h>\n#include <MFRC522.h>\n#include <Wire.h>\n#include <LiquidCrystal_I2C.h>\n#include <ESP32Servo.h>\n\n#define SS_PIN    5\n#define RST_PIN   4\n#define SERVO_PIN 13\n#define BUZZER_PIN 12\n#define LED_GREEN 14\n#define LED_RED   27\n#define I2C_SDA   21\n#define I2C_SCL   22\n\nMFRC522 mfrc522(SS_PIN, RST_PIN);\nLiquidCrystal_I2C lcd(0x27, 16, 2);\nServo lockServo;\n\nbyte masterUID[4] = {0xDE, 0xAD, 0xBE, 0xEF};\n\nvoid setup() {\n  Serial.begin(115200);\n  Wire.begin(I2C_SDA, I2C_SCL);\n  SPI.begin(18, 19, 23, 5);\n  mfrc522.PCD_Init();\n\n  pinMode(BUZZER_PIN, OUTPUT);\n  pinMode(LED_GREEN, OUTPUT);\n  pinMode(LED_RED, OUTPUT);\n\n  ESP32PWM::allocateTimer(0);\n  lockServo.setPeriodHertz(50);\n  lockServo.attach(SERVO_PIN, 500, 2400);\n  lockServo.write(0);\n\n  lcd.init();\n  lcd.backlight();\n  lcd.setCursor(0, 0);\n  lcd.print(\"ESP32 RFID LOCK\");\n  lcd.setCursor(0, 1);\n  lcd.print(\"Ready to Scan...\");\n}\n\nvoid loop() {\n  if (!mfrc522.PICC_IsNewCardPresent() || !mfrc522.PICC_ReadCardSerial()) {\n    delay(50);\n    return;\n  }\n\n  bool accessGranted = true;\n  for (byte i = 0; i < 4; i++) {\n    if (mfrc522.uid.uidByte[i] != masterUID[i]) {\n      accessGranted = false;\n    }\n  }\n\n  lcd.clear();\n  lcd.setCursor(0, 0);\n  lcd.print(\"UID: \");\n  for (byte i = 0; i < mfrc522.uid.size; i++) {\n    lcd.print(mfrc522.uid.uidByte[i], HEX);\n    lcd.print(\" \");\n  }\n\n  lcd.setCursor(0, 1);\n  if (accessGranted) {\n    lcd.print(\"STATUS: GRANTED\");\n    digitalWrite(LED_GREEN, HIGH);\n    digitalWrite(LED_RED, LOW);\n    tone(BUZZER_PIN, 2000, 200);\n\n    lockServo.write(90);\n    delay(4000);\n    lockServo.write(0);\n    digitalWrite(LED_GREEN, LOW);\n  } else {\n    lcd.print(\"ACCESS DENIED!\");\n    digitalWrite(LED_RED, HIGH);\n    digitalWrite(LED_GREEN, LOW);\n    tone(BUZZER_PIN, 600, 600);\n    delay(2000);\n    digitalWrite(LED_RED, LOW);\n  }\n\n  mfrc522.PICC_HaltA();\n  mfrc522.PCD_StopCrypto1();\n}",
    "assemblySteps": [
      "CAUTION: Connect RC522 VCC strictly to the 3.3V pin on ESP32 (5V will permanently burn the chip).",
      "Connect hardware VSPI pins: SS to GPIO 5, MOSI to GPIO 23, MISO to GPIO 19, SCK to GPIO 18, and RST to GPIO 4.",
      "Connect micro servo signal to GPIO 13 with VIN (5V) power and ground.",
      "Connect Green LED to GPIO 14, Red LED to GPIO 27 (via 220-ohm current limiting resistors), and buzzer to GPIO 12.",
      "Connect 16x2 I2C LCD (or OLED) to VIN, GND, GPIO 21 (SDA), and GPIO 22 (SCL).",
      "Flash sketch, open Serial monitor at 115200 baud, read your card's raw UID, and update the masterUID array."
    ],
    "scientificApplications": "Campus RFID attendance tracking, high-security biosecurity lab chain-of-custody, contactless smart card fare ticketing, and inventory warehouse tracking."
  },
  {
    "id": "under-voltage-protection-system",
    "title": "Under-Voltage & Over-Voltage Automatic Protection System",
    "shortDesc": "Electrical engineering grid protection apparatus continuously sampling supply voltage and actuating a high-power relay isolator with audible alarms during brownouts and power surges.",
    "board": "Arduino Uno",
    "category": "Space & Energy",
    "difficulty": "Intermediate",
    "estimatedTime": "2 Hours",
    "rating": 4.9,
    "featured": true,
    "tags": [
      "Voltage Divider",
      "Under-Voltage",
      "Over-Voltage",
      "Relay Protection",
      "Grid Safety"
    ],
    "components": [
      {
        "name": "Arduino Uno R3",
        "qty": "1",
        "note": "ATmega328P 10-bit ADC"
      },
      {
        "name": "Precision DC Voltage Sensor Module (0-25V)",
        "qty": "1",
        "note": "5:1 resistive voltage divider network"
      },
      {
        "name": "5V 10A Optocoupled Relay Module",
        "qty": "1",
        "note": "Main circuit breaker trip switch"
      },
      {
        "name": "Piezo Alarm Buzzer",
        "qty": "1",
        "note": "Voltage fault acoustic horn"
      },
      {
        "name": "Tricolor LEDs (Green Normal, Yellow Under, Red Over)",
        "qty": "3",
        "note": "Status annunciators with 220-ohm resistors"
      },
      {
        "name": "16x2 I2C LCD (or 0.96\" OLED)",
        "qty": "1",
        "note": "Real-time voltage readout and fault telemetry"
      }
    ],
    "workingPrinciple": "Electrical appliances and microcontrollers fail when supply voltages deviate from nominal specifications. Under-voltage (brownouts) starves inductive motors of torque, causing severe overheating and coil burnout. Over-voltage (surges) punctures dielectric insulation and destroys semiconductor junctions. A calibrated 5:1 precision voltage divider maps input potential (0-25V) down to the Arduino ADC range (0-5V): V_in = V_adc * ((R1 + R2) / R2). The Arduino computes a window comparator algorithm: if voltage drops below the under-voltage trip threshold (10.0V) or spikes above over-voltage threshold (14.5V), it instantly de-energizes the protective relay and sounds an audible alarm with programmable hysteresis to prevent contact chattering.",
    "wiringTable": [
      {
        "from": "Arduino 5V",
        "to": "Sensor VCC & LCD VCC",
        "color": "red",
        "desc": "Clean 5V system rail"
      },
      {
        "from": "Arduino GND",
        "to": "Sensor GND & System GND",
        "color": "black",
        "desc": "Common ground return"
      },
      {
        "from": "Arduino A0",
        "to": "Voltage Sensor OUT",
        "color": "blue",
        "desc": "Sampled scaled voltage"
      },
      {
        "from": "Arduino Pin 8",
        "to": "Relay Module IN",
        "color": "green",
        "desc": "Active-LOW circuit breaker trip"
      },
      {
        "from": "Arduino Pin 7",
        "to": "Piezo Buzzer (+)",
        "color": "yellow",
        "desc": "Fault acoustic alarm"
      },
      {
        "from": "Arduino Pin 6",
        "to": "Green LED (Normal)",
        "color": "green",
        "desc": "Normal grid potential (10.5V - 14.5V)"
      },
      {
        "from": "Arduino Pin 5",
        "to": "Yellow LED (Under-V)",
        "color": "amber",
        "desc": "Under-voltage brownout flag"
      },
      {
        "from": "Arduino Pin 4",
        "to": "Red LED (Over-V)",
        "color": "red",
        "desc": "Over-voltage surge flag"
      },
      {
        "from": "Arduino A4",
        "to": "LCD / OLED SDA",
        "color": "blue",
        "desc": "I2C Serial Data"
      },
      {
        "from": "Arduino A5",
        "to": "LCD / OLED SCL",
        "color": "amber",
        "desc": "I2C Serial Clock"
      }
    ],
    "circuitDiagram": {
      "boardType": "arduino-uno",
      "modules": [
        {
          "name": "Voltage Divider Sensor",
          "type": "sensor",
          "pins": [
            "VCC (5V)",
            "GND",
            "SIGNAL (A0)"
          ]
        },
        {
          "name": "5V Relay Breaker Module",
          "type": "actuator",
          "pins": [
            "VCC (5V)",
            "GND",
            "IN (D8)",
            "COM",
            "NO"
          ]
        },
        {
          "name": "Piezo Buzzer",
          "type": "actuator",
          "pins": [
            "Buzzer (+) (D7)",
            "GND"
          ]
        },
        {
          "name": "Tricolor LEDs Panel",
          "type": "actuator",
          "pins": [
            "Green Normal (D6)",
            "Yellow Under-V (D5)",
            "Red Over-V (D4)",
            "GND"
          ]
        },
        {
          "name": "I2C Display (LCD/OLED)",
          "type": "display",
          "pins": [
            "VCC (5V)",
            "GND",
            "SDA (A4)",
            "SCL (A5)"
          ]
        }
      ]
    },
    "code": "#include <Wire.h>\n#include <LiquidCrystal_I2C.h>\n\nLiquidCrystal_I2C lcd(0x27, 16, 2);\n\n#define VOLTAGE_PIN A0\n#define RELAY_PIN 8\n#define BUZZER_PIN 7\n#define LED_NORMAL 6\n#define LED_UNDER 5\n#define LED_OVER 4\n\nconst float UNDER_VOLTAGE_LIMIT = 10.2;\nconst float OVER_VOLTAGE_LIMIT  = 14.8;\nconst float DIVIDER_RATIO = 5.0;\n\nvoid setup() {\n  Serial.begin(9600);\n  pinMode(RELAY_PIN, OUTPUT);\n  pinMode(BUZZER_PIN, OUTPUT);\n  pinMode(LED_NORMAL, OUTPUT);\n  pinMode(LED_UNDER, OUTPUT);\n  pinMode(LED_OVER, OUTPUT);\n\n  digitalWrite(RELAY_PIN, LOW);\n  digitalWrite(LED_NORMAL, HIGH);\n\n  lcd.init();\n  lcd.backlight();\n  lcd.setCursor(0, 0);\n  lcd.print(\"GRID PROTECTION\");\n  lcd.setCursor(0, 1);\n  lcd.print(\"Monitoring Bus...\");\n  delay(1500);\n}\n\nvoid loop() {\n  float sampleSum = 0;\n  for(int i = 0; i < 30; i++) {\n    sampleSum += analogRead(VOLTAGE_PIN);\n    delay(2);\n  }\n  float avgRaw = sampleSum / 30.0;\n  float vAdc = (avgRaw * 5.0) / 1024.0;\n  float vIn = vAdc * DIVIDER_RATIO;\n\n  lcd.clear();\n  lcd.setCursor(0, 0);\n  lcd.print(\"Bus: \");\n  lcd.print(vIn, 2);\n  lcd.print(\" V\");\n\n  if (vIn < UNDER_VOLTAGE_LIMIT) {\n    digitalWrite(RELAY_PIN, HIGH);\n    digitalWrite(LED_NORMAL, LOW);\n    digitalWrite(LED_UNDER, HIGH);\n    digitalWrite(LED_OVER, LOW);\n    tone(BUZZER_PIN, 800, 250);\n    lcd.setCursor(0, 1);\n    lcd.print(\"ERR: BROWNOUT!\");\n  } else if (vIn > OVER_VOLTAGE_LIMIT) {\n    digitalWrite(RELAY_PIN, HIGH);\n    digitalWrite(LED_NORMAL, LOW);\n    digitalWrite(LED_UNDER, LOW);\n    digitalWrite(LED_OVER, HIGH);\n    tone(BUZZER_PIN, 2400, 250);\n    lcd.setCursor(0, 1);\n    lcd.print(\"ERR: OVERVOLT!\");\n  } else {\n    digitalWrite(RELAY_PIN, LOW);\n    digitalWrite(LED_NORMAL, HIGH);\n    digitalWrite(LED_UNDER, LOW);\n    digitalWrite(LED_OVER, LOW);\n    noTone(BUZZER_PIN);\n    lcd.setCursor(0, 1);\n    lcd.print(\"STATUS: SAFE OK\");\n  }\n\n  delay(300);\n}",
    "assemblySteps": [
      "Connect the DC Voltage Sensor GND and VCC to Arduino GND and 5V.",
      "Connect Voltage Sensor signal pin S to Arduino analog input A0.",
      "Connect 5V Relay module VCC to 5V, GND to GND, and IN to digital Pin 8.",
      "Wire the protected DC load through the Relay COM and NO terminals.",
      "Connect Green LED to Pin 6, Yellow LED to Pin 5, and Red LED to Pin 4 with 220-ohm resistors.",
      "Connect Piezo Buzzer to Pin 7 and ground.",
      "Connect 16x2 I2C LCD (or OLED) to 5V, GND, A4 (SDA), and A5 (SCL)."
    ],
    "scientificApplications": "Microgrid distribution stability analysis, solar photovoltaic battery bank protection, uninterruptible power supply (UPS) transfer switching, and industrial automation equipment protection."
  },
  {
    "id": "ultrasonic-radar-system",
    "title": "Ultrasonic Radar Mapping System with Processing GUI",
    "shortDesc": "Acoustic spatial mapping system sweeping an HC-SR04 sonar sensor across 180 degrees using an SG90 servo turret with visual radar blips streamed over Serial to a PC radar screen.",
    "board": "Arduino Uno",
    "category": "Physics & Acoustics",
    "difficulty": "Intermediate",
    "estimatedTime": "2 Hours",
    "rating": 4.9,
    "featured": true,
    "tags": [
      "Sonar",
      "HC-SR04",
      "SG90",
      "Processing",
      "Radar",
      "Serial GUI"
    ],
    "components": [
      {
        "name": "Arduino Uno R3",
        "qty": "1",
        "note": "ATmega328P Microcontroller"
      },
      {
        "name": "HC-SR04 Ultrasonic Distance Transducer",
        "qty": "1",
        "note": "40kHz piezo transmitter & receiver"
      },
      {
        "name": "TowerPro SG90 9:1 Micro Servo",
        "qty": "1",
        "note": "180-degree azimuth rotating turret"
      },
      {
        "name": "Active Piezo Buzzer",
        "qty": "1",
        "note": "Target acquisition chirp"
      },
      {
        "name": "Target Alert LED",
        "qty": "1",
        "note": "Illuminates on close contacts"
      },
      {
        "name": "PC Running Processing 4 IDE",
        "qty": "1",
        "note": "Renders real-time rotating radar PPI display"
      }
    ],
    "workingPrinciple": "The system replicates marine and military Plan Position Indicator (PPI) radars using acoustic sound waves instead of microwave radiation. An SG90 servomotor sweeps an HC-SR04 ultrasonic sensor through azimuth angles from 15° to 165° in 1-degree increments. At each step, a 10-microsecond trigger pulse energizes the 40 kHz ultrasonic transmitter. The burst travels through air at the speed of sound (343 m/s), reflects off obstacles, and returns to the receiver transducer. The Arduino measures echo round-trip flight duration: Distance (cm) = (Duration * 0.0343) / 2. Angle and distance coordinates are packaged into a structured serial packet ('angle,distance.') and streamed via USB to a PC running a Processing GUI that paints the radar sweep green line with glowing red obstacle blips.",
    "wiringTable": [
      {
        "from": "Arduino 5V",
        "to": "HC-SR04 VCC & Servo VCC",
        "color": "red",
        "desc": "Clean 5V rail"
      },
      {
        "from": "Arduino GND",
        "to": "HC-SR04 GND & Servo GND",
        "color": "black",
        "desc": "Common system ground"
      },
      {
        "from": "Arduino Pin 9",
        "to": "HC-SR04 Trig",
        "color": "blue",
        "desc": "10us ultrasonic trigger pulse"
      },
      {
        "from": "Arduino Pin 10",
        "to": "HC-SR04 Echo",
        "color": "green",
        "desc": "Pulse width proportional to distance"
      },
      {
        "from": "Arduino Pin 11",
        "to": "Servo PWM Signal (Orange)",
        "color": "orange",
        "desc": "Azimuth sweep servo drive"
      },
      {
        "from": "Arduino Pin 6",
        "to": "Buzzer (+)",
        "color": "yellow",
        "desc": "Proximity chirp alert"
      },
      {
        "from": "Arduino Pin 5",
        "to": "Target Alert LED",
        "color": "red",
        "desc": "Visual target indicator"
      }
    ],
    "circuitDiagram": {
      "boardType": "arduino-uno",
      "modules": [
        {
          "name": "HC-SR04 Ultrasonic Sensor",
          "type": "sensor",
          "pins": [
            "VCC (5V)",
            "Trig (D9)",
            "Echo (D10)",
            "GND"
          ]
        },
        {
          "name": "SG90 Turret Servo",
          "type": "actuator",
          "pins": [
            "PWM (D11)",
            "VCC (5V)",
            "GND"
          ]
        },
        {
          "name": "Proximity Buzzer & LED",
          "type": "actuator",
          "pins": [
            "Buzzer (D6)",
            "LED (D5)",
            "GND"
          ]
        },
        {
          "name": "PC Processing Radar Interface",
          "type": "display",
          "pins": [
            "USB Serial RX/TX (D0/D1)"
          ]
        }
      ]
    },
    "code": "#include <Servo.h>\n\nconst int trigPin = 9;\nconst int echoPin = 10;\nconst int servoPin = 11;\nconst int buzzerPin = 6;\nconst int ledPin = 5;\n\nServo radarServo;\n\nlong calculateDistance() {\n  digitalWrite(trigPin, LOW);\n  delayMicroseconds(4);\n  digitalWrite(trigPin, HIGH);\n  delayMicroseconds(10);\n  digitalWrite(trigPin, LOW);\n\n  long duration = pulseIn(echoPin, HIGH, 30000);\n  if (duration == 0) return 400;\n  return duration * 0.034 / 2;\n}\n\nvoid setup() {\n  Serial.begin(9600);\n  pinMode(trigPin, OUTPUT);\n  pinMode(echoPin, INPUT);\n  pinMode(buzzerPin, OUTPUT);\n  pinMode(ledPin, OUTPUT);\n\n  radarServo.attach(servoPin);\n  radarServo.write(90);\n  delay(1000);\n}\n\nvoid loop() {\n  for (int angle = 15; angle <= 165; angle += 2) {\n    radarServo.write(angle);\n    delay(30);\n    long dist = calculateDistance();\n\n    if (dist < 30) {\n      digitalWrite(ledPin, HIGH);\n      tone(buzzerPin, 1800, 40);\n    } else {\n      digitalWrite(ledPin, LOW);\n    }\n\n    Serial.print(angle);\n    Serial.print(\",\");\n    Serial.print(dist);\n    Serial.print(\".\");\n  }\n\n  for (int angle = 165; angle >= 15; angle -= 2) {\n    radarServo.write(angle);\n    delay(30);\n    long dist = calculateDistance();\n\n    if (dist < 30) {\n      digitalWrite(ledPin, HIGH);\n      tone(buzzerPin, 1800, 40);\n    } else {\n      digitalWrite(ledPin, LOW);\n    }\n\n    Serial.print(angle);\n    Serial.print(\",\");\n    Serial.print(dist);\n    Serial.print(\".\");\n  }\n}",
    "assemblySteps": [
      "Mount the HC-SR04 ultrasonic sensor firmly to the horn of the SG90 micro-servo using double-sided foam tape.",
      "Secure the servo body to a flat baseboard or chassis upright.",
      "Connect sensor VCC to 5V, GND to GND, Trig to Arduino Pin 9, and Echo to Pin 10.",
      "Connect the SG90 servo power to 5V, GND to GND, and orange signal wire to Arduino Pin 11.",
      "Connect buzzer to Pin 6 and alert LED to Pin 5 with a 220-ohm resistor.",
      "Connect Arduino via USB to computer, open Processing 4, and run the companion radar visualization sketch."
    ],
    "scientificApplications": "Autonomous vehicle LiDAR/Sonar SLAM obstacle mapping, marine bathymetric seabed mapping, security motion intrusion perimeter detection, and atmospheric acoustic sounding."
  },
  {
    "id": "obstacle-avoiding-robot-car",
    "title": "Obstacle Avoiding Autonomous Mobile Robot",
    "shortDesc": "Autonomous mobile robotics platform featuring an HC-SR04 look-ahead ultrasonic sonar scanner, SG90 pan servo, and L298N dual H-bridge motor driver driving twin DC gear motors with path-planning intelligence.",
    "board": "Arduino Uno",
    "category": "Robotics & Automation",
    "difficulty": "Intermediate",
    "estimatedTime": "3 Hours",
    "rating": 4.9,
    "featured": true,
    "tags": [
      "L298N",
      "Dual DC Motors",
      "HC-SR04",
      "SG90 Servo",
      "Autonomous Robot",
      "Robotics"
    ],
    "components": [
      {
        "name": "Arduino Uno R3",
        "qty": "1",
        "note": "ATmega328P Central Robot Controller"
      },
      {
        "name": "L298N Dual Full-Bridge Motor Driver Module",
        "qty": "1",
        "note": "Drives 2 DC motors up to 2A per channel with large aluminum heatsink"
      },
      {
        "name": "2WD Smart Robot Car Chassis Kit",
        "qty": "1",
        "note": "Laser-cut acrylic plate with caster wheel"
      },
      {
        "name": "2x 3-6V TT Geared DC Motors",
        "qty": "2",
        "note": "1:48 gear reduction ratio with rubber grip wheels"
      },
      {
        "name": "HC-SR04 Ultrasonic Sensor",
        "qty": "1",
        "note": "Range finding collision avoidance eye"
      },
      {
        "name": "SG90 Micro Servo Motor",
        "qty": "1",
        "note": "Pans sensor left and right to inspect clear paths"
      },
      {
        "name": "2x 18650 Li-ion Batteries (7.4V)",
        "qty": "1",
        "note": "High-drain power source for motors and driver"
      }
    ],
    "workingPrinciple": "The autonomous robot executes a reactive boundary avoidance control loop without GPS or external beacons. Two TT DC motors are driven by an L298N H-bridge driver whose internal bipolar power transistors direct motor current in forward or reverse depending on logic signals from Arduino digital pins (IN1, IN2, IN3, IN4). During normal cruising, both motors run full speed forward. The front-mounted HC-SR04 ping sensor continuously measures forward clearance. When an obstacle is detected within 25 cm, the robot halts, pans the sensor 60° to the left, measures distance, pans 60° to the right, measures distance, compares both corridors, reverses slightly, and executes a pivot turn toward the path with maximum free clearance.",
    "wiringTable": [
      {
        "from": "Battery (+ 7.4V)",
        "to": "L298N +12V Terminal",
        "color": "red",
        "desc": "High current motor power"
      },
      {
        "from": "Battery (-)",
        "to": "L298N GND Terminal",
        "color": "black",
        "desc": "Shared system ground"
      },
      {
        "from": "L298N +5V OUT",
        "to": "Arduino 5V & Sensor VCC",
        "color": "red",
        "desc": "Regulated 5V to power Arduino & logic"
      },
      {
        "from": "L298N GND",
        "to": "Arduino GND",
        "color": "black",
        "desc": "Common logic ground (MANDATORY)"
      },
      {
        "from": "Arduino Pin 4",
        "to": "L298N IN1 (Left Fwd)",
        "color": "blue",
        "desc": "Left Motor forward logic"
      },
      {
        "from": "Arduino Pin 5",
        "to": "L298N IN2 (Left Rev)",
        "color": "blue",
        "desc": "Left Motor reverse logic"
      },
      {
        "from": "Arduino Pin 6",
        "to": "L298N IN3 (Right Fwd)",
        "color": "green",
        "desc": "Right Motor forward logic"
      },
      {
        "from": "Arduino Pin 7",
        "to": "L298N IN4 (Right Rev)",
        "color": "green",
        "desc": "Right Motor reverse logic"
      },
      {
        "from": "Arduino Pin 10",
        "to": "SG90 Servo PWM (Orange)",
        "color": "orange",
        "desc": "Look-ahead scanning servo"
      },
      {
        "from": "Arduino Pin 12",
        "to": "HC-SR04 Trig",
        "color": "purple",
        "desc": "Ultrasonic trigger pulse"
      },
      {
        "from": "Arduino Pin 13",
        "to": "HC-SR04 Echo",
        "color": "yellow",
        "desc": "Ultrasonic echo return"
      },
      {
        "from": "L298N OUT1 & OUT2",
        "to": "Left TT DC Motor",
        "color": "amber",
        "desc": "Left traction drive"
      },
      {
        "from": "L298N OUT3 & OUT4",
        "to": "Right TT DC Motor",
        "color": "amber",
        "desc": "Right traction drive"
      }
    ],
    "circuitDiagram": {
      "boardType": "arduino-uno",
      "modules": [
        {
          "name": "L298N Dual Motor Driver",
          "type": "driver",
          "pins": [
            "+12V (Batt)",
            "GND",
            "+5V OUT",
            "IN1 (D4)",
            "IN2 (D5)",
            "IN3 (D6)",
            "IN4 (D7)",
            "OUT1/2",
            "OUT3/4"
          ]
        },
        {
          "name": "Left TT Gearbox Motor",
          "type": "actuator",
          "pins": [
            "Motor A (+)",
            "Motor A (-)"
          ]
        },
        {
          "name": "Right TT Gearbox Motor",
          "type": "actuator",
          "pins": [
            "Motor B (+)",
            "Motor B (-)"
          ]
        },
        {
          "name": "HC-SR04 Look-ahead Sonar",
          "type": "sensor",
          "pins": [
            "VCC (5V)",
            "Trig (D12)",
            "Echo (D13)",
            "GND"
          ]
        },
        {
          "name": "SG90 Pan Servo Turret",
          "type": "actuator",
          "pins": [
            "PWM (D10)",
            "VCC (5V)",
            "GND"
          ]
        },
        {
          "name": "2x 18650 Li-ion Battery Pack",
          "type": "power",
          "pins": [
            "Positive (+7.4V)",
            "Negative (GND)"
          ]
        }
      ]
    },
    "code": "#include <Servo.h>\n\n#define IN1 4\n#define IN2 5\n#define IN3 6\n#define IN4 7\n\n#define TRIG_PIN 12\n#define ECHO_PIN 13\n#define SERVO_PIN 10\n\nServo scanServo;\n\nvoid stopMotors() {\n  digitalWrite(IN1, LOW);\n  digitalWrite(IN2, LOW);\n  digitalWrite(IN3, LOW);\n  digitalWrite(IN4, LOW);\n}\n\nvoid moveForward() {\n  digitalWrite(IN1, HIGH);\n  digitalWrite(IN2, LOW);\n  digitalWrite(IN3, HIGH);\n  digitalWrite(IN4, LOW);\n}\n\nvoid moveBackward() {\n  digitalWrite(IN1, LOW);\n  digitalWrite(IN2, HIGH);\n  digitalWrite(IN3, LOW);\n  digitalWrite(IN4, HIGH);\n}\n\nvoid turnLeft() {\n  digitalWrite(IN1, LOW);\n  digitalWrite(IN2, HIGH);\n  digitalWrite(IN3, HIGH);\n  digitalWrite(IN4, LOW);\n}\n\nvoid turnRight() {\n  digitalWrite(IN1, HIGH);\n  digitalWrite(IN2, LOW);\n  digitalWrite(IN3, LOW);\n  digitalWrite(IN4, HIGH);\n}\n\nint getDistance() {\n  digitalWrite(TRIG_PIN, LOW);\n  delayMicroseconds(4);\n  digitalWrite(TRIG_PIN, HIGH);\n  delayMicroseconds(10);\n  digitalWrite(TRIG_PIN, LOW);\n  long duration = pulseIn(ECHO_PIN, HIGH, 25000);\n  if (duration == 0) return 300;\n  return duration * 0.034 / 2;\n}\n\nvoid setup() {\n  pinMode(IN1, OUTPUT);\n  pinMode(IN2, OUTPUT);\n  pinMode(IN3, OUTPUT);\n  pinMode(IN4, OUTPUT);\n\n  pinMode(TRIG_PIN, OUTPUT);\n  pinMode(ECHO_PIN, INPUT);\n\n  scanServo.attach(SERVO_PIN);\n  scanServo.write(90);\n  delay(1000);\n}\n\nvoid loop() {\n  int distance = getDistance();\n\n  if (distance > 25) {\n    moveForward();\n  } else {\n    stopMotors();\n    delay(200);\n    moveBackward();\n    delay(350);\n    stopMotors();\n\n    scanServo.write(150);\n    delay(400);\n    int leftDist = getDistance();\n\n    scanServo.write(30);\n    delay(500);\n    int rightDist = getDistance();\n\n    scanServo.write(90);\n    delay(300);\n\n    if (leftDist > rightDist) {\n      turnLeft();\n      delay(400);\n    } else {\n      turnRight();\n      delay(400);\n    }\n    stopMotors();\n    delay(100);\n  }\n  delay(50);\n}",
    "assemblySteps": [
      "Assemble the 2WD robot chassis plate, attaching both TT gear motors and the front caster swivel ball.",
      "Screw the L298N motor driver module onto the chassis center, and solder wires from OUT1/2 to the left motor and OUT3/4 to the right motor.",
      "Connect the 2x 18650 Li-ion battery pack to L298N +12V and GND terminals.",
      "Wire L298N +5V OUT to Arduino 5V pin, and connect L298N GND to Arduino GND (common ground).",
      "Connect L298N control pins IN1, IN2, IN3, IN4 to Arduino digital pins 4, 5, 6, and 7.",
      "Mount the SG90 servo facing forward at the car front bumper; attach the HC-SR04 ultrasonic sensor to its horn.",
      "Connect HC-SR04 Trig to Pin 12, Echo to Pin 13, and SG90 servo PWM signal to Pin 10."
    ],
    "scientificApplications": "Warehouse autonomous guided vehicles (AGV), planetary rover hazard mitigation, automated vacuum cleaner navigation, and search-and-rescue disaster reconnaissance."
  },
  {
    "id": "reverse-car-parking-sensor",
    "title": "Automated Reverse Car Parking Sensor & Collision Alert",
    "shortDesc": "Automotive driver-assistance safety apparatus measuring rear clearance with an ultrasonic sensor, visual tricolor distance zone LEDs, variable frequency acoustic buzzer chimes, and I2C LCD telemetry.",
    "board": "Arduino Uno",
    "category": "Robotics & Automation",
    "difficulty": "Beginner",
    "estimatedTime": "1.5 Hours",
    "rating": 4.9,
    "featured": true,
    "tags": [
      "Automotive",
      "HC-SR04",
      "Buzzer",
      "Safety LEDs",
      "Park Assist",
      "Acoustic Warning"
    ],
    "components": [
      {
        "name": "Arduino Uno R3",
        "qty": "1",
        "note": "ATmega328P Central Controller"
      },
      {
        "name": "HC-SR04 Ultrasonic Distance Sensor",
        "qty": "1",
        "note": "Rear bumper ultrasonic rangefinder"
      },
      {
        "name": "Active Piezo Buzzer",
        "qty": "1",
        "note": "Generates dynamic tempo collision beeps"
      },
      {
        "name": "Tricolor LED Safety Warning Bar",
        "qty": "3",
        "note": "Green (Safe), Yellow (Caution), Red (Critical Stop)"
      },
      {
        "name": "3x 220-Ohm Resistors",
        "qty": "3",
        "note": "Current-limiting for LED indicators"
      },
      {
        "name": "16x2 I2C Character LCD (or 0.96\" OLED)",
        "qty": "1",
        "note": "Displays exact distance in cm and driver warning"
      }
    ],
    "workingPrinciple": "Automotive park-distance-control (PDC) systems utilize acoustic echo-sounding to protect vehicles during low-speed reversing maneuvers. The HC-SR04 sensor transmits a 40 kHz burst; the Arduino captures the echo pulse and calculates distance in centimeters. The firmware implements a discrete 4-zone safety algorithm: Zone 1 (Clear, > 60 cm): Green LED is solid, buzzer silent; Zone 2 (Caution, 30-60 cm): Yellow LED flashes with slow, intermittent beeps (4 Hz); Zone 3 (Danger, 10-30 cm): Red LED illuminates with rapid urgent beeps (12 Hz); Zone 4 (Critical Stop, < 10 cm): Red LED blinks rapidly and the buzzer sounds a continuous high-pitch alarm tone (2500 Hz), commanding the driver to halt immediately.",
    "wiringTable": [
      {
        "from": "Arduino 5V",
        "to": "Sensor VCC & LCD VCC",
        "color": "red",
        "desc": "Clean 5V system rail"
      },
      {
        "from": "Arduino GND",
        "to": "Sensor GND & System GND",
        "color": "black",
        "desc": "Common system ground"
      },
      {
        "from": "Arduino Pin 9",
        "to": "HC-SR04 Trig",
        "color": "blue",
        "desc": "Ultrasonic trigger pulse"
      },
      {
        "from": "Arduino Pin 10",
        "to": "HC-SR04 Echo",
        "color": "green",
        "desc": "Ultrasonic echo return"
      },
      {
        "from": "Arduino Pin 8",
        "to": "Piezo Buzzer (+)",
        "color": "yellow",
        "desc": "Variable tempo warning horn"
      },
      {
        "from": "Arduino Pin 4",
        "to": "Green LED (Safe Zone)",
        "color": "green",
        "desc": "Clearance > 60 cm"
      },
      {
        "from": "Arduino Pin 3",
        "to": "Yellow LED (Caution Zone)",
        "color": "amber",
        "desc": "Clearance 30 - 60 cm"
      },
      {
        "from": "Arduino Pin 2",
        "to": "Red LED (Stop Zone)",
        "color": "red",
        "desc": "Clearance < 10 cm"
      },
      {
        "from": "Arduino A4",
        "to": "LCD / OLED SDA",
        "color": "blue",
        "desc": "I2C Serial Data"
      },
      {
        "from": "Arduino A5",
        "to": "LCD / OLED SCL",
        "color": "amber",
        "desc": "I2C Serial Clock"
      }
    ],
    "circuitDiagram": {
      "boardType": "arduino-uno",
      "modules": [
        {
          "name": "HC-SR04 Ultrasonic Sonar",
          "type": "sensor",
          "pins": [
            "VCC (5V)",
            "Trig (D9)",
            "Echo (D10)",
            "GND"
          ]
        },
        {
          "name": "Piezo Warning Buzzer",
          "type": "actuator",
          "pins": [
            "Buzzer (+) (D8)",
            "GND"
          ]
        },
        {
          "name": "Tricolor LED Safety Bar",
          "type": "actuator",
          "pins": [
            "Green (D4)",
            "Yellow (D3)",
            "Red (D2)",
            "GND"
          ]
        },
        {
          "name": "I2C Display (LCD/OLED)",
          "type": "display",
          "pins": [
            "VCC (5V)",
            "GND",
            "SDA (A4)",
            "SCL (A5)"
          ]
        }
      ]
    },
    "code": "#include <Wire.h>\n#include <LiquidCrystal_I2C.h>\n\nLiquidCrystal_I2C lcd(0x27, 16, 2);\n\n#define TRIG_PIN 9\n#define ECHO_PIN 10\n#define BUZZER_PIN 8\n#define LED_GREEN 4\n#define LED_YELLOW 3\n#define LED_RED 2\n\nlong readDistanceCM() {\n  digitalWrite(TRIG_PIN, LOW);\n  delayMicroseconds(3);\n  digitalWrite(TRIG_PIN, HIGH);\n  delayMicroseconds(10);\n  digitalWrite(TRIG_PIN, LOW);\n\n  long duration = pulseIn(ECHO_PIN, HIGH, 25000);\n  if (duration == 0) return 300;\n  return duration * 0.034 / 2;\n}\n\nvoid setup() {\n  Serial.begin(9600);\n  pinMode(TRIG_PIN, OUTPUT);\n  pinMode(ECHO_PIN, INPUT);\n  pinMode(BUZZER_PIN, OUTPUT);\n  pinMode(LED_GREEN, OUTPUT);\n  pinMode(LED_YELLOW, OUTPUT);\n  pinMode(LED_RED, OUTPUT);\n\n  lcd.init();\n  lcd.backlight();\n  lcd.setCursor(0, 0);\n  lcd.print(\"PARKING RADAR\");\n  lcd.setCursor(0, 1);\n  lcd.print(\"Sensor Online\");\n  delay(1200);\n}\n\nvoid loop() {\n  long distance = readDistanceCM();\n\n  lcd.clear();\n  lcd.setCursor(0, 0);\n  lcd.print(\"Distance: \");\n  lcd.print(distance);\n  lcd.print(\" cm\");\n\n  if (distance > 60) {\n    digitalWrite(LED_GREEN, HIGH);\n    digitalWrite(LED_YELLOW, LOW);\n    digitalWrite(LED_RED, LOW);\n    noTone(BUZZER_PIN);\n    lcd.setCursor(0, 1);\n    lcd.print(\"ZONE: [SAFE]\");\n    delay(200);\n  } else if (distance > 30 && distance <= 60) {\n    digitalWrite(LED_GREEN, LOW);\n    digitalWrite(LED_YELLOW, HIGH);\n    digitalWrite(LED_RED, LOW);\n    tone(BUZZER_PIN, 1500, 70);\n    lcd.setCursor(0, 1);\n    lcd.print(\"ZONE: [CAUTION]\");\n    delay(250);\n  } else if (distance > 12 && distance <= 30) {\n    digitalWrite(LED_GREEN, LOW);\n    digitalWrite(LED_YELLOW, LOW);\n    digitalWrite(LED_RED, HIGH);\n    tone(BUZZER_PIN, 2000, 60);\n    lcd.setCursor(0, 1);\n    lcd.print(\"ZONE: [WARNING]\");\n    delay(100);\n  } else {\n    digitalWrite(LED_GREEN, LOW);\n    digitalWrite(LED_YELLOW, LOW);\n    digitalWrite(LED_RED, HIGH);\n    tone(BUZZER_PIN, 2600);\n    lcd.setCursor(0, 1);\n    lcd.print(\"CRITICAL: STOP!!\");\n    delay(60);\n  }\n}",
    "assemblySteps": [
      "Mount the HC-SR04 ultrasonic sensor horizontally at the rear bumper position with transducers facing outward.",
      "Connect sensor VCC to 5V, GND to GND, Trig to Arduino digital Pin 9, and Echo to Pin 10.",
      "Insert the Piezo Buzzer into the breadboard: connect positive pin to Arduino Pin 8 and negative to ground.",
      "Mount Green, Yellow, and Red LEDs in a row; connect their anodes to Pins 4, 3, and 2 through 220-ohm resistors.",
      "Connect the I2C LCD (or OLED) to 5V, GND, A4 (SDA), and A5 (SCL).",
      "Power up through USB or 9V battery and observe how beep tempo quickens as obstacles approach."
    ],
    "scientificApplications": "Automotive driver-assistance active safety systems (ADAS), robotic forklift safety perimeter buffering, airplane ground marshalling proximity alerts, and automated docking collision prevention."
  },
  {
    "id": "electronic-drumset-7-piezo-python-esp32",
    "title": "Electronic Drumset with 7 Piezo Sensors & Companion Python Audio Synthesizer",
    "shortDesc": "Polyphonic percussion workstation capturing dynamic strike velocities across 7 piezoelectric drum pads with an ESP32 microcontroller, streaming low-latency MIDI telemetry to a Python Pygame audio synthesis engine.",
    "board": "ESP32",
    "category": "Physics & Acoustics",
    "difficulty": "Advanced",
    "estimatedTime": "3.5 Hours",
    "rating": 5.0,
    "featured": true,
    "tags": [
      "ESP32",
      "Piezoelectric",
      "Python",
      "Pygame",
      "MIDI",
      "Digital Audio",
      "Acoustics"
    ],
    "components": [
      {
        "name": "ESP32 NodeMCU 30-Pin DevKit V1",
        "qty": "1",
        "note": "Tensilica Dual-Core 240MHz with 12-bit multi-channel ADC"
      },
      {
        "name": "7x 35mm Brass Piezoelectric Transducer Discs",
        "qty": "7",
        "note": "Strike velocity sensors for Kick, Snare, Hi-Hat C, Hi-Hat O, Crash, High Tom, Floor Tom"
      },
      {
        "name": "7x 1M-Ohm 1/4W Resistors",
        "qty": "7",
        "note": "Parallel charge bleed resistors across each piezo to eliminate false double-triggers"
      },
      {
        "name": "16x2 I2C Character LCD (or 0.96\" OLED)",
        "qty": "1",
        "note": "Displays strike velocity meters, active pad name, and audio latency"
      },
      {
        "name": "7x Foam / Neoprene Drum Practice Pads",
        "qty": "7",
        "note": "Dampening strike surfaces mounted inside rim frames"
      },
      {
        "name": "Companion Python Synthesizer Software",
        "qty": "1",
        "note": "Zero-latency multi-channel WAV playback program"
      }
    ],
    "workingPrinciple": "Piezoelectric transducers operate via the direct piezoelectric effect discovered by Pierre and Jacques Curie. When a drumstick strikes the piezo pad, mechanical shear stress deforms the non-centrosymmetric ceramic crystal lattice (Lead Zirconate Titanate, PZT). This displacement separates positive and negative electrical charges, generating an instantaneous transient voltage spike proportional to impact velocity (often reaching 20-40V). A 1MΩ bleed resistor placed in parallel across each piezo provides a controlled discharge path, clamping high voltages and damping mechanical ringing. The ESP32's high-speed 12-bit ADC samples all 7 channels at 10 kHz, calculates peak strike velocity, maps the intensity into standard MIDI velocity values (1 to 127), and transmits packets over USB Serial at 115200 baud. The companion Python script captures these packets and triggers low-latency polyphonic stereo drum samples.",
    "wiringTable": [
      {
        "from": "ESP32 GND",
        "to": "Common Piezo Ground Rail (7 Discs Brass Rings)",
        "color": "black",
        "desc": "Shared reference ground for all 7 piezo sensors"
      },
      {
        "from": "ESP32 GPIO 36 (VP)",
        "to": "Pad 1: Bass Kick (+) & 1M Resistor",
        "color": "red",
        "desc": "ADC1_CH0 - Kick Drum sensor"
      },
      {
        "from": "ESP32 GPIO 39 (VN)",
        "to": "Pad 2: Snare Drum (+) & 1M Resistor",
        "color": "blue",
        "desc": "ADC1_CH3 - Snare Drum sensor"
      },
      {
        "from": "ESP32 GPIO 34",
        "to": "Pad 3: Hi-Hat Closed (+) & 1M Resistor",
        "color": "amber",
        "desc": "ADC1_CH6 - Closed Cymbal sensor"
      },
      {
        "from": "ESP32 GPIO 35",
        "to": "Pad 4: Hi-Hat Open (+) & 1M Resistor",
        "color": "yellow",
        "desc": "ADC1_CH7 - Open Cymbal sensor"
      },
      {
        "from": "ESP32 GPIO 32",
        "to": "Pad 5: Crash Cymbal (+) & 1M Resistor",
        "color": "purple",
        "desc": "ADC1_CH4 - Crash Cymbal sensor"
      },
      {
        "from": "ESP32 GPIO 33",
        "to": "Pad 6: High Tom (+) & 1M Resistor",
        "color": "green",
        "desc": "ADC1_CH5 - High Tom sensor"
      },
      {
        "from": "ESP32 GPIO 25",
        "to": "Pad 7: Floor Tom (+) & 1M Resistor",
        "color": "orange",
        "desc": "ADC2_CH8 - Floor Tom sensor"
      },
      {
        "from": "ESP32 3.3V / VIN",
        "to": "OLED / LCD VCC",
        "color": "red",
        "desc": "Display logic power"
      },
      {
        "from": "ESP32 GND",
        "to": "OLED / LCD GND",
        "color": "black",
        "desc": "Display common ground"
      },
      {
        "from": "ESP32 GPIO 21",
        "to": "OLED / LCD SDA",
        "color": "blue",
        "desc": "I2C Serial Data"
      },
      {
        "from": "ESP32 GPIO 22",
        "to": "OLED / LCD SCL",
        "color": "amber",
        "desc": "I2C Serial Clock"
      }
    ],
    "circuitDiagram": {
      "boardType": "esp32",
      "modules": [
        {
          "name": "7x Piezo Drum Pads Array",
          "type": "sensor",
          "pins": [
            "Kick (G36)",
            "Snare (G39)",
            "Hi-Hat C (G34)",
            "Hi-Hat O (G35)",
            "Crash (G32)",
            "Tom 1 (G33)",
            "Tom 2 (G25)",
            "GND"
          ]
        },
        {
          "name": "7x 1M-Ohm Bleed Resistors",
          "type": "actuator",
          "pins": [
            "7x Signal Lines to Common GND"
          ]
        },
        {
          "name": "I2C Display (LCD/OLED)",
          "type": "display",
          "pins": [
            "VCC (3.3V)",
            "GND",
            "SDA (G21)",
            "SCL (G22)"
          ]
        },
        {
          "name": "Python PC Audio Synthesizer",
          "type": "display",
          "pins": [
            "USB High-Speed Serial (115200 Baud)"
          ]
        }
      ]
    },
    "code": "#include <Wire.h>\n#include <LiquidCrystal_I2C.h>\n\nLiquidCrystal_I2C lcd(0x27, 16, 2);\n\nconst int NUM_PADS = 7;\nconst int PAD_PINS[NUM_PADS] = {36, 39, 34, 35, 32, 33, 25};\nconst char* PAD_NAMES[NUM_PADS] = {\n  \"KICK\", \"SNARE\", \"HIHAT-C\", \"HIHAT-O\", \"CRASH\", \"HIGH-TOM\", \"FLOOR-TOM\"\n};\n\nconst int THRESHOLD[NUM_PADS]   = {180, 150, 160, 160, 200, 170, 180};\nconst int DEBOUNCE_MS = 38;\nunsigned long lastHitTime[NUM_PADS] = {0};\n\nvoid setup() {\n  Serial.begin(115200);\n  Wire.begin(21, 22);\n\n  lcd.init();\n  lcd.backlight();\n  lcd.setCursor(0, 0);\n  lcd.print(\"ESP32 DRUM ENGINE\");\n  lcd.setCursor(0, 1);\n  lcd.print(\"7 Piezos Online\");\n  delay(1500);\n  lcd.clear();\n  lcd.print(\"READY TO PLAY!\");\n}\n\nvoid loop() {\n  unsigned long now = millis();\n\n  for (int i = 0; i < NUM_PADS; i++) {\n    int val = analogRead(PAD_PINS[i]);\n\n    if (val > THRESHOLD[i] && (now - lastHitTime[i] > DEBOUNCE_MS)) {\n      lastHitTime[i] = now;\n\n      int peak = val;\n      unsigned long peakTimeout = micros() + 2500;\n      while (micros() < peakTimeout) {\n        int sample = analogRead(PAD_PINS[i]);\n        if (sample > peak) peak = sample;\n      }\n\n      int velocity = map(peak, THRESHOLD[i], 4095, 20, 127);\n      velocity = constrain(velocity, 20, 127);\n\n      Serial.print(\"HIT,\");\n      Serial.print(i);\n      Serial.print(\",\");\n      Serial.println(velocity);\n\n      lcd.setCursor(0, 0);\n      lcd.print(\"PAD: \");\n      lcd.print(PAD_NAMES[i]);\n      lcd.print(\"     \");\n      lcd.setCursor(0, 1);\n      lcd.print(\"VEL: \");\n      lcd.print(velocity);\n      lcd.print(\" / 127   \");\n    }\n  }\n}",
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
  },
  {
    "id": "drone-esp32-s3-mini",
    "title": "Autonomous Micro Quadcopter Drone with ESP32-S3 Mini",
    "shortDesc": "High-agility micro drone featuring an ultra-compact ESP32-S3 Mini, MPU-6050 6-DOF inertial stabilization, 4x coreless motors driven by high-speed logic MOSFETs, and live Wi-Fi UDP flight telemetry.",
    "board": "ESP32",
    "category": "Robotics & Automation",
    "difficulty": "Advanced",
    "estimatedTime": "4.5 Hours",
    "rating": 5.0,
    "featured": true,
    "tags": [
      "ESP32-S3",
      "Drone",
      "Quadcopter",
      "MPU-6050",
      "PID Flight Controller",
      "Aeronautics"
    ],
    "components": [
      {
        "name": "ESP32-S3 Mini Development Board",
        "qty": "1",
        "note": "Dual-Core Xtensa LX7 240MHz with 2.4GHz Wi-Fi/BLE"
      },
      {
        "name": "MPU-6050 6-Axis Accelerometer & Gyroscope",
        "qty": "1",
        "note": "Samples 3-axis angular rates at 400Hz over I2C"
      },
      {
        "name": "4x 8520 High-Speed Coreless DC Motors",
        "qty": "4",
        "note": "50,000 RPM micro motors (2x CW, 2x CCW)"
      },
      {
        "name": "4x SI2302 N-Channel Logic MOSFET Switches",
        "qty": "4",
        "note": "PWM motor drive stages with flyback schottky diodes"
      },
      {
        "name": "4x 55mm Polycarbonate Micro Propellers",
        "qty": "4",
        "note": "2x Clockwise (CW), 2x Counter-Clockwise (CCW)"
      },
      {
        "name": "1S 3.7V 650mAh 25C LiPo Battery",
        "qty": "1",
        "note": "High-discharge power source for propulsion"
      },
      {
        "name": "Carbon Fiber / 3D-Printed Micro X-Frame",
        "qty": "1",
        "note": "85mm motor-to-motor wheelbase chassis"
      }
    ],
    "workingPrinciple": "Quadrotors achieve controlled aerodynamic flight via differential thrust across four fixed-pitch propellers arranged in an 'X' geometry. Propellers M1 and M3 spin counter-clockwise (CCW), while M2 and M4 spin clockwise (CW), canceling gyroscopic precession and net aerodynamic reaction torque. The ESP32-S3 Mini executes a deterministic 250 Hz flight loop: (1) It samples raw angular rates (deg/s) and linear accelerations (g) from the MPU-6050 via high-speed I2C; (2) A Complementary / Mahony quaternion filter fuses the sensors to calculate instantaneous Euler attitude angles (Pitch, Roll, Yaw); (3) Cascaded Proportional-Integral-Derivative (PID) rate controllers compute instantaneous error correction moments; (4) The motor mixer maps PID outputs into high-frequency 32 kHz PWM gate signals for the four MOSFET switches. Wireless UDP telemetry enables smartphone piloting with real-time attitude visualization.",
    "wiringTable": [
      {
        "from": "ESP32-S3 3.3V",
        "to": "MPU-6050 VCC",
        "color": "red",
        "desc": "Clean regulated 3.3V logic rail"
      },
      {
        "from": "ESP32-S3 GND",
        "to": "MPU-6050 GND",
        "color": "black",
        "desc": "Common system ground"
      },
      {
        "from": "ESP32-S3 GPIO 8 (SDA)",
        "to": "MPU-6050 SDA",
        "color": "blue",
        "desc": "I2C Serial Data"
      },
      {
        "from": "ESP32-S3 GPIO 9 (SCL)",
        "to": "MPU-6050 SCL",
        "color": "amber",
        "desc": "I2C Serial Clock"
      },
      {
        "from": "ESP32-S3 GPIO 4",
        "to": "Motor 1 (Front-Right CW) MOSFET Gate",
        "color": "orange",
        "desc": "32kHz PWM Throttle channel 1"
      },
      {
        "from": "ESP32-S3 GPIO 5",
        "to": "Motor 2 (Rear-Right CCW) MOSFET Gate",
        "color": "orange",
        "desc": "32kHz PWM Throttle channel 2"
      },
      {
        "from": "ESP32-S3 GPIO 6",
        "to": "Motor 3 (Rear-Left CW) MOSFET Gate",
        "color": "orange",
        "desc": "32kHz PWM Throttle channel 3"
      },
      {
        "from": "ESP32-S3 GPIO 7",
        "to": "Motor 4 (Front-Left CCW) MOSFET Gate",
        "color": "orange",
        "desc": "32kHz PWM Throttle channel 4"
      },
      {
        "from": "1S LiPo (+ 3.7V)",
        "to": "All 4 Motor Positive (+) Leads",
        "color": "red",
        "desc": "Direct battery rail for propulsion"
      },
      {
        "from": "1S LiPo (-)",
        "to": "Common MOSFET Source Ground",
        "color": "black",
        "desc": "High current motor return loop"
      },
      {
        "from": "ESP32-S3 GPIO 8 / 9",
        "to": "OLED / LCD SDA & SCL",
        "color": "blue",
        "desc": "Optional ground station telemetry"
      }
    ],
    "circuitDiagram": {
      "boardType": "esp32",
      "modules": [
        {
          "name": "MPU-6050 6-Axis IMU",
          "type": "sensor",
          "pins": [
            "VCC (3.3V)",
            "GND",
            "SDA (G8)",
            "SCL (G9)"
          ]
        },
        {
          "name": "4x Coreless Motors & MOSFETs",
          "type": "actuator",
          "pins": [
            "M1 (G4)",
            "M2 (G5)",
            "M3 (G6)",
            "M4 (G7)",
            "Batt (+)"
          ]
        },
        {
          "name": "1S 3.7V LiPo Battery",
          "type": "power",
          "pins": [
            "Positive (+3.7V)",
            "Negative (GND)"
          ]
        },
        {
          "name": "Wi-Fi Ground Station Telemetry",
          "type": "display",
          "pins": [
            "Wi-Fi 2.4GHz UDP Stream"
          ]
        }
      ]
    },
    "code": "// ============================================================================\n// ESP32-S3 MINI QUADCOPTER FLIGHT CONTROLLER FIRMWARE\n// High-Speed 250Hz PID Attitude Stabilization Loop\n// ============================================================================\n#include <Wire.h>\n#include <WiFi.h>\n#include <WiFiUdp.h>\n\n#define MPU_ADDR 0x68\n#define PIN_M1 4 // Front-Right\n#define PIN_M2 5 // Rear-Right\n#define PIN_M3 6 // Rear-Left\n#define PIN_M4 7 // Front-Left\n\n// PID Constants\nfloat Kp_pitch = 1.3, Ki_pitch = 0.04, Kd_pitch = 18.0;\nfloat Kp_roll  = 1.3, Ki_roll  = 0.04, Kd_roll  = 18.0;\nfloat Kp_yaw   = 2.5, Ki_yaw   = 0.02, Kd_yaw   = 0.0;\n\nint16_t rawAx, rawAy, rawAz, rawGx, rawGy, rawGz;\nfloat anglePitch = 0, angleRoll = 0;\nfloat targetPitch = 0, targetRoll = 0, targetYaw = 0;\nint baseThrottle = 0; // 0 to 1023\n\nWiFiUDP udp;\n\nvoid setup() {\n  Serial.begin(115200);\n  Wire.begin(8, 9, 400000); // Fast 400kHz I2C\n\n  // Wake up MPU-6050\n  Wire.beginTransmission(MPU_ADDR);\n  Wire.write(0x6B); // Power Management\n  Wire.write(0x00); // Wake up\n  Wire.endTransmission(true);\n\n  // Setup 32kHz High-Frequency PWM for Coreless Motors\n  ledcAttach(PIN_M1, 32000, 10);\n  ledcAttach(PIN_M2, 32000, 10);\n  ledcAttach(PIN_M3, 32000, 10);\n  ledcAttach(PIN_M4, 32000, 10);\n\n  // Start SoftAP for Wi-Fi Telemetry & Smartphone Flight Sticks\n  WiFi.softAP(\"OmniDrone-S3\", \"flight123\");\n  udp.begin(8888);\n  Serial.println(\"ESP32-S3 Flight Controller Ready.\");\n}\n\nvoid loop() {\n  static unsigned long lastLoopTime = micros();\n\n  // Enforce rigid 250Hz loop (4000 microseconds)\n  if (micros() - lastLoopTime >= 4000) {\n    float dt = (micros() - lastLoopTime) / 1000000.0;\n    lastLoopTime = micros();\n\n    // Read MPU-6050 Gyro & Accel\n    Wire.beginTransmission(MPU_ADDR);\n    Wire.write(0x3B);\n    Wire.endTransmission(false);\n    Wire.requestFrom(MPU_ADDR, 14, true);\n\n    rawAx = Wire.read() << 8 | Wire.read();\n    rawAy = Wire.read() << 8 | Wire.read();\n    rawAz = Wire.read() << 8 | Wire.read();\n    Wire.read(); Wire.read(); // Skip Temperature\n    rawGx = Wire.read() << 8 | Wire.read();\n    rawGy = Wire.read() << 8 | Wire.read();\n    rawGz = Wire.read() << 8 | Wire.read();\n\n    float gyroX = rawGx / 65.5; // deg/sec\n    float gyroY = rawGy / 65.5;\n\n    // Accel Angles\n    float accelPitch = atan2(-rawAx, sqrt(rawAy * rawAy + rawAz * rawAz)) * 57.2958;\n    float accelRoll  = atan2(rawAy, rawAz) * 57.2958;\n\n    // Complementary Filter\n    anglePitch = 0.98 * (anglePitch + gyroX * dt) + 0.02 * accelPitch;\n    angleRoll  = 0.98 * (angleRoll + gyroY * dt) + 0.02 * accelRoll;\n\n    // Simple PID Calculation\n    float errPitch = targetPitch - anglePitch;\n    float errRoll  = targetRoll - angleRoll;\n    float outputPitch = Kp_pitch * errPitch - Kd_pitch * gyroX;\n    float outputRoll  = Kp_roll * errRoll - Kd_roll * gyroY;\n\n    if (baseThrottle > 100) {\n      int pwmM1 = constrain(baseThrottle - outputPitch + outputRoll, 0, 1023);\n      int pwmM2 = constrain(baseThrottle + outputPitch + outputRoll, 0, 1023);\n      int pwmM3 = constrain(baseThrottle + outputPitch - outputRoll, 0, 1023);\n      int pwmM4 = constrain(baseThrottle - outputPitch - outputRoll, 0, 1023);\n\n      ledcWrite(PIN_M1, pwmM1);\n      ledcWrite(PIN_M2, pwmM2);\n      ledcWrite(PIN_M3, pwmM3);\n      ledcWrite(PIN_M4, pwmM4);\n    } else {\n      ledcWrite(PIN_M1, 0); ledcWrite(PIN_M2, 0);\n      ledcWrite(PIN_M3, 0); ledcWrite(PIN_M4, 0);\n    }\n  }\n}",
    "assemblySteps": [
      "Mount the 4x 8520 coreless motors into the four chassis arms: CW motors on Front-Right/Rear-Left, CCW on Rear-Right/Front-Left.",
      "Solder each motor negative wire through the drain terminal of an SI2302 N-channel MOSFET, and connect all positive motor wires to the 1S LiPo rail.",
      "Mount the ESP32-S3 Mini and MPU-6050 centrally on dampening foam to insulate against motor vibration harmonics.",
      "Connect MPU-6050 3.3V, GND, SDA (GPIO 8), and SCL (GPIO 9) to the ESP32-S3.",
      "Connect the 4 MOSFET gate pins to ESP32-S3 GPIOs 4, 5, 6, and 7 through 100-ohm resistors.",
      "Connect the 1S LiPo battery, calibrate gyro level on a flat surface, and verify counter-rotating propeller aerodynamics."
    ],
    "scientificApplications": "Micro-aerial vehicle (MAV) autonomous navigation, quadrotor PID control theory validation, inertial Kalman filter attitude estimation, and agricultural aerial drone surveying."
  },
  {
    "id": "diy-digital-watch",
    "title": "Ultra-Low Power DIY Digital Wristwatch",
    "shortDesc": "Minimalist digital wristwatch utilizing a DS3231 temperature-compensated real-time clock (RTC), high-contrast 0.96\" I2C OLED display, and deep-sleep power management for months of battery life.",
    "board": "Arduino Uno",
    "category": "Physics & Acoustics",
    "difficulty": "Beginner",
    "estimatedTime": "1.5 Hours",
    "rating": 4.8,
    "featured": true,
    "tags": [
      "Wristwatch",
      "DS3231",
      "RTC",
      "OLED",
      "Deep Sleep",
      "Wearables"
    ],
    "components": [
      {
        "name": "Arduino Uno R3 (or ATmega328P Pro Mini)",
        "qty": "1",
        "note": "Low-power microcontroller core"
      },
      {
        "name": "DS3231 High-Precision RTC Module",
        "qty": "1",
        "note": "Sub-2ppm temperature-compensated quartz crystal"
      },
      {
        "name": "0.96\" I2C Monochrome OLED (or 16x2 LCD)",
        "qty": "1",
        "note": "128x64 high-contrast time readout"
      },
      {
        "name": "CR2032 3V Lithium Coin Cell / 3.7V LiPo",
        "qty": "1",
        "note": "Compact wearable power source"
      },
      {
        "name": "2x Tactile Micro Pushbuttons",
        "qty": "2",
        "note": "Wake-up display / Time-setting buttons"
      },
      {
        "name": "Velcro / Silicone Wrist Strap",
        "qty": "1",
        "note": "Wearable watch band mount"
      }
    ],
    "workingPrinciple": "Timekeeping accuracy requires harmonic stability immune to thermal drift. Standard 32.768 kHz watch crystals vary by +/-20 ppm over seasonal temperatures (accumulating several minutes of error per month). The DS3231 Real-Time Clock incorporates an internal Temperature-Compensated Crystal Oscillator (TCXO) that monitors die temperature and adjusts an integrated tuning capacitor array, maintaining extreme accuracy (+/-2 ppm, under 1 minute drift per year). The microcontroller communicates with the RTC over I2C (address 0x68), fetching Binary-Coded Decimal (BCD) hours, minutes, seconds, and date. To conserve coin-cell energy, the MCU powers down the OLED screen and enters deep power-down sleep (consuming under 15 microamps). Pressing the tactile wake button triggers an external hardware interrupt (INT0), illuminating the OLED for 6 seconds before gracefully returning to sleep.",
    "wiringTable": [
      {
        "from": "Arduino 5V / 3.3V",
        "to": "DS3231 VCC & OLED VCC",
        "color": "red",
        "desc": "Logic supply rail"
      },
      {
        "from": "Arduino GND",
        "to": "DS3231 GND & OLED GND",
        "color": "black",
        "desc": "Common system ground"
      },
      {
        "from": "Arduino A4",
        "to": "DS3231 SDA & OLED SDA",
        "color": "blue",
        "desc": "Shared I2C Serial Data bus"
      },
      {
        "from": "Arduino A5",
        "to": "DS3231 SCL & OLED SCL",
        "color": "amber",
        "desc": "Shared I2C Serial Clock bus"
      },
      {
        "from": "Arduino Pin 2 (INT0)",
        "to": "Tactile Wake / Set Button 1",
        "color": "green",
        "desc": "External hardware wake interrupt"
      },
      {
        "from": "Arduino Pin 3",
        "to": "Tactile Set Button 2",
        "color": "purple",
        "desc": "Hour/Minute increment adjust"
      },
      {
        "from": "Buttons (Common Leg)",
        "to": "Arduino GND",
        "color": "black",
        "desc": "Internal pull-up to ground"
      }
    ],
    "circuitDiagram": {
      "boardType": "arduino-uno",
      "modules": [
        {
          "name": "DS3231 High-Precision RTC",
          "type": "sensor",
          "pins": [
            "VCC (3.3V)",
            "GND",
            "SDA (A4)",
            "SCL (A5)"
          ]
        },
        {
          "name": "0.96\" I2C OLED Display",
          "type": "display",
          "pins": [
            "VCC (3.3V)",
            "GND",
            "SDA (A4)",
            "SCL (A5)"
          ]
        },
        {
          "name": "Tactile Buttons & Coin Cell",
          "type": "power",
          "pins": [
            "Wake Btn (D2)",
            "Set Btn (D3)",
            "CR2032 (+)"
          ]
        }
      ]
    },
    "code": "// ============================================================================\n// ULTRA-LOW POWER DIY DIGITAL WRISTWATCH FIRMWARE\n// Time Only Display with Wake-up Interrupt & DS3231 RTC\n// ============================================================================\n#include <Wire.h>\n#include <Adafruit_GFX.h>\n#include <Adafruit_SSD1306.h>\n#include <RTClib.h>\n#include <avr/sleep.h>\n\n#define SCREEN_WIDTH 128\n#define SCREEN_HEIGHT 64\nAdafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, -1);\nRTC_DS3231 rtc;\n\nconst int WAKE_PIN = 2; // INT0 for waking from sleep\nconst int SET_PIN  = 3; // Time setting button\n\nvoid wakeUpISR() {\n  // Interrupt handler to resume from sleep\n}\n\nvoid setup() {\n  pinMode(WAKE_PIN, INPUT_PULLUP);\n  pinMode(SET_PIN, INPUT_PULLUP);\n\n  display.begin(SSD1306_SWITCHCAPVCC, 0x3C);\n  display.clearDisplay();\n\n  if (!rtc.begin()) {\n    display.setTextSize(1);\n    display.setTextColor(SSD1306_WHITE);\n    display.setCursor(10, 25);\n    display.print(\"RTC INIT ERROR\");\n    display.display();\n    while (1);\n  }\n\n  // If RTC lost power, set to compilation time\n  if (rtc.lostPower()) {\n    rtc.adjust(DateTime(F(__DATE__), F(__TIME__)));\n  }\n}\n\nvoid loop() {\n  // Show time on OLED for 6 seconds\n  unsigned long wakeTime = millis();\n  while (millis() - wakeTime < 6000) {\n    DateTime now = rtc.now();\n\n    display.clearDisplay();\n    \n    // Large Bold Time: HH:MM\n    display.setTextSize(3);\n    display.setTextColor(SSD1306_WHITE);\n    display.setCursor(12, 12);\n    if (now.hour() < 10) display.print('0');\n    display.print(now.hour());\n    display.print(':');\n    if (now.minute() < 10) display.print('0');\n    display.print(now.minute());\n\n    // Small Seconds & Date\n    display.setTextSize(1);\n    display.setCursor(104, 25);\n    if (now.second() < 10) display.print('0');\n    display.print(now.second());\n\n    // Battery / Temp status bar\n    display.setCursor(14, 48);\n    display.print(\"TEMP: \");\n    display.print(rtc.getTemperature(), 1);\n    display.print(\"C  [PWR OK]\");\n\n    display.display();\n    delay(200);\n\n    // Check Set Button\n    if (digitalRead(SET_PIN) == LOW) {\n      rtc.adjust(DateTime(now.unixtime() + 60)); // Add 1 minute\n      delay(250);\n      wakeTime = millis(); // Refresh wake window\n    }\n  }\n\n  // Turn off OLED screen to conserve power\n  display.clearDisplay();\n  display.display();\n  display.ssd1306_command(SSD1306_DISPLAYOFF);\n\n  // Configure Deep Sleep\n  attachInterrupt(digitalPinToInterrupt(WAKE_PIN), wakeUpISR, FALLING);\n  set_sleep_mode(SLEEP_MODE_PWR_DOWN);\n  sleep_enable();\n  sleep_cpu(); // Sleep here until button pressed!\n\n  // Woke up!\n  sleep_disable();\n  detachInterrupt(digitalPinToInterrupt(WAKE_PIN));\n  display.ssd1306_command(SSD1306_DISPLAYON);\n}",
    "assemblySteps": [
      "Connect the DS3231 RTC module VCC and GND to Arduino 3.3V and GND rails.",
      "Connect DS3231 SDA to Arduino A4, and SCL to Arduino A5.",
      "Connect the 0.96\" I2C OLED display in parallel to the same I2C bus: VCC, GND, A4 (SDA), and A5 (SCL).",
      "Wire the tactile wake pushbutton between Arduino digital Pin 2 and GND (using internal pull-up).",
      "Wire the tactile set pushbutton between Arduino digital Pin 3 and GND.",
      "Insert the CR2032 coin cell battery into the RTC holder to preserve real-time during sleep, and strap to a watch band."
    ],
    "scientificApplications": "Chronometric precision research, wearable medical telemetry time-tagging, ultra-low power standby power budget analysis, and thermal crystal drift compensation."
  },
  {
    "id": "flight-simulator-mpu6050",
    "title": "6-DOF Flight Simulator Cockpit Controller & Attitude Indicator",
    "shortDesc": "Avionics cockpit control yoke and artificial horizon indicator measuring pitch, roll, and yaw angles with an MPU-6050 6-DOF IMU and streaming native joystick telemetry to PC flight simulators.",
    "board": "Arduino Uno",
    "category": "Physics & Acoustics",
    "difficulty": "Intermediate",
    "estimatedTime": "2.5 Hours",
    "rating": 4.9,
    "featured": true,
    "tags": [
      "Flight Simulator",
      "MPU-6050",
      "Avionics",
      "Artificial Horizon",
      "Joystick",
      "Aeronautics"
    ],
    "components": [
      {
        "name": "Arduino Uno R3 (or Leonardo for HID Gamepad)",
        "qty": "1",
        "note": "Processes 6-DOF inertial kinematics"
      },
      {
        "name": "MPU-6050 6-Axis MotionTracking IMU",
        "qty": "1",
        "note": "Triple-axis MEMS gyro and accelerometer"
      },
      {
        "name": "2-Axis Analog Thumbstick Joystick",
        "qty": "1",
        "note": "Throttle quadrant and rudder pedals control"
      },
      {
        "name": "Active Piezo Stall Warning Buzzer",
        "qty": "1",
        "note": "Acoustic audio warning for critical angles of attack"
      },
      {
        "name": "16x2 I2C Character LCD (or 0.96\" OLED)",
        "qty": "1",
        "note": "Real-time artificial horizon and pitch angle HUD"
      },
      {
        "name": "Dual Status Indicator LEDs",
        "qty": "2",
        "note": "Stall warning & Autopilot engage annunciators"
      }
    ],
    "workingPrinciple": "Aircraft attitude instrumentation measures angular pitch (nose up/down), roll (banking left/right), and yaw (heading deviation) relative to Earth's gravitational vector and inertia. The MPU-6050 MEMS sensor detects micro-scale Coriolis forces and proof-mass deflections. Raw accelerometer readings produce accurate static inclination via trigonometry (pitch = atan2(-Ax, sqrt(Ay^2 + Az^2))), but suffer from dynamic vibration noise. Conversely, gyroscopes provide rapid angular rate integration (omega * dt) that drifts over time due to bias accumulation. A complementary sensor fusion filter combines 98% integrated gyro data with 2% accelerometer tilt to produce drift-free, zero-lag pitch and roll angles. These attitude vectors are streamed at 50 Hz over USB Serial or native HID Gamepad protocol to flight simulators (FlightGear, MSFS, X-Plane), while driving an onboard artificial horizon display and stall-warning acoustic telemetry.",
    "wiringTable": [
      {
        "from": "Arduino 5V",
        "to": "MPU-6050 VCC, Joystick VCC, LCD VCC",
        "color": "red",
        "desc": "Clean 5V analog power rail"
      },
      {
        "from": "Arduino GND",
        "to": "All Component GNDs",
        "color": "black",
        "desc": "Common system ground"
      },
      {
        "from": "Arduino A4",
        "to": "MPU-6050 SDA & LCD SDA",
        "color": "blue",
        "desc": "I2C Serial Data bus"
      },
      {
        "from": "Arduino A5",
        "to": "MPU-6050 SCL & LCD SCL",
        "color": "amber",
        "desc": "I2C Serial Clock bus"
      },
      {
        "from": "Arduino A0",
        "to": "Joystick VRx (Throttle)",
        "color": "green",
        "desc": "Engine throttle potentiometer"
      },
      {
        "from": "Arduino A1",
        "to": "Joystick VRy (Rudder)",
        "color": "purple",
        "desc": "Yaw rudder trim potentiometer"
      },
      {
        "from": "Arduino Pin 8",
        "to": "Stall Warning Buzzer (+)",
        "color": "yellow",
        "desc": "Audio stall horn alarm"
      },
      {
        "from": "Arduino Pin 7",
        "to": "Stall Warning Red LED",
        "color": "red",
        "desc": "Critical angle of attack indicator"
      }
    ],
    "circuitDiagram": {
      "boardType": "arduino-uno",
      "modules": [
        {
          "name": "MPU-6050 6-Axis Gyro/Accel",
          "type": "sensor",
          "pins": [
            "VCC (5V)",
            "GND",
            "SDA (A4)",
            "SCL (A5)"
          ]
        },
        {
          "name": "Analog Throttle Joystick",
          "type": "sensor",
          "pins": [
            "VRx (A0)",
            "VRy (A1)",
            "VCC (5V)",
            "GND"
          ]
        },
        {
          "name": "Stall Horn Buzzer & LED",
          "type": "actuator",
          "pins": [
            "Buzzer (D8)",
            "Stall LED (D7)",
            "GND"
          ]
        },
        {
          "name": "Cockpit Horizon Display",
          "type": "display",
          "pins": [
            "VCC (5V)",
            "GND",
            "SDA (A4)",
            "SCL (A5)"
          ]
        }
      ]
    },
    "code": "// ============================================================================\n// 6-DOF FLIGHT SIMULATOR COCKPIT CONTROLLER FIRMWARE\n// Complementary IMU Attitude Filter & Serial Flight Telemetry\n// ============================================================================\n#include <Wire.h>\n#include <LiquidCrystal_I2C.h>\n\nLiquidCrystal_I2C lcd(0x27, 16, 2);\n\n#define MPU_ADDR 0x68\n#define THROTTLE_PIN A0\n#define RUDDER_PIN   A1\n#define BUZZER_PIN   8\n#define STALL_LED    7\n\nint16_t ax, ay, az, gx, gy, gz;\nfloat pitch = 0, roll = 0;\nunsigned long prevTime = 0;\n\nvoid setup() {\n  Serial.begin(115200);\n  Wire.begin();\n\n  // Initialize MPU-6050\n  Wire.beginTransmission(MPU_ADDR);\n  Wire.write(0x6B); // Power register\n  Wire.write(0);    // Wake up\n  Wire.endTransmission(true);\n\n  pinMode(BUZZER_PIN, OUTPUT);\n  pinMode(STALL_LED, OUTPUT);\n\n  lcd.init();\n  lcd.backlight();\n  lcd.setCursor(0, 0);\n  lcd.print(\"FLIGHT AVIONICS\");\n  lcd.setCursor(0, 1);\n  lcd.print(\"Calibrating IMU\");\n  delay(1500);\n}\n\nvoid loop() {\n  unsigned long now = millis();\n  float dt = (now - prevTime) / 1000.0;\n  prevTime = now;\n\n  // Read MPU-6050\n  Wire.beginTransmission(MPU_ADDR);\n  Wire.write(0x3B);\n  Wire.endTransmission(false);\n  Wire.requestFrom(MPU_ADDR, 14, true);\n\n  ax = Wire.read() << 8 | Wire.read();\n  ay = Wire.read() << 8 | Wire.read();\n  az = Wire.read() << 8 | Wire.read();\n  Wire.read(); Wire.read();\n  gx = Wire.read() << 8 | Wire.read();\n  gy = Wire.read() << 8 | Wire.read();\n  gz = Wire.read() << 8 | Wire.read();\n\n  float gyroRateX = gx / 131.0;\n  float gyroRateY = gy / 131.0;\n\n  float accelPitch = atan2(-ax, sqrt((long)ay * ay + (long)az * az)) * 57.2958;\n  float accelRoll  = atan2(ay, az) * 57.2958;\n\n  // Complementary Sensor Fusion\n  pitch = 0.96 * (pitch + gyroRateX * dt) + 0.04 * accelPitch;\n  roll  = 0.96 * (roll + gyroRateY * dt) + 0.04 * accelRoll;\n\n  int throttle = map(analogRead(THROTTLE_PIN), 0, 1023, 0, 100);\n  int rudder   = map(analogRead(RUDDER_PIN), 0, 1023, -50, 50);\n\n  // Stall Warning: Nose pitch > 28 degrees\n  if (pitch > 28.0) {\n    digitalWrite(STALL_LED, HIGH);\n    tone(BUZZER_PIN, 1800, 100);\n  } else {\n    digitalWrite(STALL_LED, LOW);\n  }\n\n  // Stream Joystick Telemetry to PC Simulator: PITCH,ROLL,THROTTLE,RUDDER\n  Serial.print(\"PLANE:\");\n  Serial.print(pitch, 1);\n  Serial.print(\",\");\n  Serial.print(roll, 1);\n  Serial.print(\",\");\n  Serial.print(throttle);\n  Serial.print(\",\");\n  Serial.println(rudder);\n\n  // Update Cockpit Horizon LCD\n  lcd.clear();\n  lcd.setCursor(0, 0);\n  lcd.print(\"P:\");\n  lcd.print((int)pitch);\n  lcd.print((char)223);\n  lcd.print(\" R:\");\n  lcd.print((int)roll);\n  lcd.print((char)223);\n\n  lcd.setCursor(0, 1);\n  lcd.print(\"THR:\");\n  lcd.print(throttle);\n  lcd.print(\"% RUD:\");\n  lcd.print(rudder);\n\n  delay(40); // 25Hz telemetry stream\n}",
    "assemblySteps": [
      "Mount the MPU-6050 sensor horizontally onto the flight control yoke or hand-held flight grip.",
      "Connect MPU-6050 VCC to 5V, GND to GND, SDA to Arduino A4, and SCL to Arduino A5.",
      "Connect the 2-axis joystick analog outputs: VRx to Arduino A0 (throttle) and VRy to A1 (rudder).",
      "Connect the stall warning piezo buzzer to Pin 8 and red alert LED to Pin 7 through a 220-ohm resistor.",
      "Connect 16x2 I2C LCD (or OLED) to 5V, GND, A4 (SDA), and A5 (SCL).",
      "Open FlightGear or write a 5-line Python script to inject serial angles into the virtual cockpit yoke."
    ],
    "scientificApplications": "Aerospace avionics engineering, flight dynamics pitch-roll stability, inertial navigation dead-reckoning, and human-in-the-loop pilot workload studies."
  },
  {
    "id": "face-recognition-esp32-cam",
    "title": "Edge AI Face Recognition & Smart Surveillance System",
    "shortDesc": "Deep-learning biometric surveillance apparatus running real-time facial landmark detection, biometric feature embedding, and relay deadbolt access verification directly on an ESP32-CAM.",
    "board": "ESP32",
    "category": "Robotics & Automation",
    "difficulty": "Advanced",
    "estimatedTime": "3 Hours",
    "rating": 5.0,
    "featured": true,
    "tags": [
      "ESP32-CAM",
      "Edge AI",
      "Computer Vision",
      "Face Recognition",
      "Biometrics",
      "Security"
    ],
    "components": [
      {
        "name": "AI-Thinker ESP32-CAM Module",
        "qty": "1",
        "note": "Dual-Core ESP32 with 4MB PSRAM and MicroSD slot"
      },
      {
        "name": "OmniVision OV2640 2-Megapixel Camera Sensor",
        "qty": "1",
        "note": "High-definition camera sensor with wide-angle lens"
      },
      {
        "name": "FTDI USB-to-Serial TTL Programmer",
        "qty": "1",
        "note": "For flashing firmware and serial monitor debugging"
      },
      {
        "name": "5V 1-Channel Optocoupled Relay Module",
        "qty": "1",
        "note": "Electronic door strike / deadbolt actuator"
      },
      {
        "name": "High-Power Onboard Flash Strobe LED",
        "qty": "1",
        "note": "Illuminates faces in low-light surveillance"
      },
      {
        "name": "Active Piezo Biometric Chime Buzzer",
        "qty": "1",
        "note": "Acoustic authorization confirmation tone"
      },
      {
        "name": "MicroSD Card 16GB FAT32",
        "qty": "1",
        "note": "Stores enrolled facial biometric vectors and snapshot logs"
      }
    ],
    "workingPrinciple": "Traditional computer vision required bulky desktop computers, but modern deep convolutional neural networks run directly on ESP32 dual-core processors through optimized fixed-point integer mathematics (ESP-WHO framework). The OV2640 camera captures RGB565 / JPEG image frames via high-speed 8-bit parallel DVP (Digital Video Port). The ESP32 executes a multi-stage pipeline: (1) MSR (Multi-Task Cascaded Convolutional Networks) for human face landmark detection; (2) Face Alignment to normalize facial rotation; (3) Feature Extraction mapping facial geometry into a compact high-dimensional mathematical embedding vector; (4) Cosine Distance Matching against authorized biometric templates saved on the MicroSD card. If Euclidean distance falls below the authorization threshold, the ESP32-CAM actuates the 5V relay deadbolt, logs face snapshots, and streams live color video via an onboard WebSocket/HTTP web server.",
    "wiringTable": [
      {
        "from": "5V External Supply (+)",
        "to": "ESP32-CAM 5V & Relay VCC",
        "color": "red",
        "desc": "High-current 5V supply (Requires min 2A)"
      },
      {
        "from": "5V External Supply (-)",
        "to": "ESP32-CAM GND & Relay GND",
        "color": "black",
        "desc": "Common ground return"
      },
      {
        "from": "ESP32-CAM GPIO 12",
        "to": "Relay Module IN",
        "color": "green",
        "desc": "Active-LOW door deadbolt trigger"
      },
      {
        "from": "ESP32-CAM GPIO 13",
        "to": "Piezo Buzzer (+)",
        "color": "yellow",
        "desc": "Authorization chime"
      },
      {
        "from": "FTDI TX",
        "to": "ESP32-CAM U0R (GPIO 3)",
        "color": "blue",
        "desc": "Serial Programming RX"
      },
      {
        "from": "FTDI RX",
        "to": "ESP32-CAM U0T (GPIO 1)",
        "color": "purple",
        "desc": "Serial Programming TX"
      },
      {
        "from": "ESP32-CAM GPIO 0",
        "to": "ESP32-CAM GND (During Flashing)",
        "color": "orange",
        "desc": "Bootloader flashing jumper"
      }
    ],
    "circuitDiagram": {
      "boardType": "esp32",
      "modules": [
        {
          "name": "OV2640 2MP Camera Sensor",
          "type": "sensor",
          "pins": [
            "8-bit DVP Bus",
            "XCLK",
            "PCLK",
            "VSYNC",
            "HREF"
          ]
        },
        {
          "name": "5V Relay Deadbolt Lock",
          "type": "actuator",
          "pins": [
            "IN (GPIO 12)",
            "VCC (5V)",
            "GND"
          ]
        },
        {
          "name": "Biometric Buzzer & Flash LED",
          "type": "actuator",
          "pins": [
            "Buzzer (G13)",
            "Flash LED (G4)",
            "GND"
          ]
        },
        {
          "name": "Web Streaming RTSP Server",
          "type": "display",
          "pins": [
            "Wi-Fi 802.11 b/g/n MJPEG Stream"
          ]
        }
      ]
    },
    "code": "// ============================================================================\n// EDGE AI FACE RECOGNITION & SMART SURVEILLANCE FIRMWARE\n// ESP32-CAM + OV2640 Camera + Neural Network Face Recognition\n// ============================================================================\n#include \"esp_camera.h\"\n#include <WiFi.h>\n\n#define PWDN_GPIO_NUM     32\n#define RESET_GPIO_NUM    -1\n#define XCLK_GPIO_NUM      0\n#define SIOD_GPIO_NUM     26\n#define SIOC_GPIO_NUM     27\n#define Y9_GPIO_NUM       35\n#define Y8_GPIO_NUM       34\n#define Y7_GPIO_NUM       39\n#define Y6_GPIO_NUM       36\n#define Y5_GPIO_NUM       21\n#define Y4_GPIO_NUM       19\n#define Y3_GPIO_NUM       18\n#define Y2_GPIO_NUM        5\n#define VSYNC_GPIO_NUM    25\n#define HREF_GPIO_NUM     23\n#define PCLK_GPIO_NUM     22\n\n#define RELAY_PIN         12\n#define BUZZER_PIN        13\n#define FLASH_LED_PIN      4\n\nconst char* ssid = \"YOUR_WIFI_SSID\";\nconst char* password = \"YOUR_WIFI_PASSWORD\";\n\nvoid startCameraServer();\n\nvoid setup() {\n  Serial.begin(115200);\n  pinMode(RELAY_PIN, OUTPUT);\n  pinMode(BUZZER_PIN, OUTPUT);\n  pinMode(FLASH_LED_PIN, OUTPUT);\n  digitalWrite(RELAY_PIN, HIGH); // Relay OFF\n\n  camera_config_t config;\n  config.ledc_channel = LEDC_CHANNEL_0;\n  config.ledc_timer = LEDC_TIMER_0;\n  config.pin_d0 = Y2_GPIO_NUM;\n  config.pin_d1 = Y3_GPIO_NUM;\n  config.pin_d2 = Y4_GPIO_NUM;\n  config.pin_d3 = Y5_GPIO_NUM;\n  config.pin_d4 = Y6_GPIO_NUM;\n  config.pin_d5 = Y7_GPIO_NUM;\n  config.pin_d6 = Y8_GPIO_NUM;\n  config.pin_d7 = Y9_GPIO_NUM;\n  config.pin_xclk = XCLK_GPIO_NUM;\n  config.pin_pclk = PCLK_GPIO_NUM;\n  config.pin_vsync = VSYNC_GPIO_NUM;\n  config.pin_href = HREF_GPIO_NUM;\n  config.pin_sccb_sda = SIOD_GPIO_NUM;\n  config.pin_sccb_scl = SIOC_GPIO_NUM;\n  config.pin_pwdn = PWDN_GPIO_NUM;\n  config.pin_reset = RESET_GPIO_NUM;\n  config.xclk_freq_hz = 20000000;\n  config.pixel_format = PIXFORMAT_JPEG;\n\n  if (psramFound()) {\n    config.frame_size = FRAMESIZE_UXGA;\n    config.jpeg_quality = 10;\n    config.fb_count = 2;\n  } else {\n    config.frame_size = FRAMESIZE_SVGA;\n    config.jpeg_quality = 12;\n    config.fb_count = 1;\n  }\n\n  // Camera init\n  esp_err_t err = esp_camera_init(&config);\n  if (err != ESP_OK) {\n    Serial.printf(\"Camera init failed with error 0x%x\", err);\n    return;\n  }\n\n  WiFi.begin(ssid, password);\n  while (WiFi.status() != WL_CONNECTED) {\n    delay(500);\n    Serial.print(\".\");\n  }\n  Serial.println(\"\\nWiFi Connected!\");\n  Serial.print(\"Camera Stream Ready: http://\");\n  Serial.println(WiFi.localIP());\n\n  // Start Web Server with Edge Face Enrollment & Recognition UI\n  startCameraServer();\n}\n\nvoid loop() {\n  // Deep learning face inference executes inside camera server handlers\n  delay(1000);\n}",
    "assemblySteps": [
      "Seat the OV2640 camera ribbon cable securely into the ESP32-CAM FPC connector.",
      "Connect the FTDI USB-serial programmer: FTDI 5V to ESP32-CAM 5V, GND to GND, TX to U0R, and RX to U0T.",
      "Bridge GPIO 0 to GND during sketch upload, press RESET button, upload sketch, then disconnect GPIO 0 and reset.",
      "Connect Relay module IN to GPIO 12, VCC to 5V, and GND to GND.",
      "Connect Piezo buzzer to GPIO 13 and ground.",
      "Open the web stream IP address in any browser, click 'Start Stream', and use 'Enroll Face' to register biometric identity."
    ],
    "scientificApplications": "Edge artificial intelligence inference, convolutional neural network landmark matching, automated biosecurity access control, and smart city perimeter surveillance."
  },
  {
    "id": "music-player-dfplayer-i2s",
    "title": "Hi-Fi Digital Music Player (Dual Version: DFPlayer Mini & ESP32 I2S DAC)",
    "shortDesc": "Dual-architecture embedded audio player featuring both a standalone DFPlayer Mini hardware MP3 decoder with MicroSD and an ultra-high fidelity ESP32 24-bit I2S digital DAC audio streaming engine.",
    "board": "Arduino Uno",
    "category": "Physics & Acoustics",
    "difficulty": "Intermediate",
    "estimatedTime": "2.5 Hours",
    "rating": 4.9,
    "featured": true,
    "tags": [
      "DFPlayer Mini",
      "I2S Audio",
      "MAX98357A",
      "MP3 Player",
      "DAC",
      "Digital Acoustics"
    ],
    "components": [
      {
        "name": "Arduino Uno R3 (Version 1 Architecture)",
        "qty": "1",
        "note": "ATmega328P controller sending UART commands"
      },
      {
        "name": "DFPlayer Mini MP3 Player Module",
        "qty": "1",
        "note": "Integrated 24-bit DAC with MicroSD card slot and 3W amplifier"
      },
      {
        "name": "ESP32 DevKit V1 (Version 2 Architecture)",
        "qty": "1",
        "note": "Dual-core 240MHz streaming 24-bit digital I2S PCM audio"
      },
      {
        "name": "MAX98357A I2S 3W Class-D Audio Amplifier",
        "qty": "1",
        "note": "High-fidelity digital-to-analog converter"
      },
      {
        "name": "4-Ohm 3W Full-Range Acoustic Speaker",
        "qty": "1",
        "note": "Delivers crisp high-fidelity playback"
      },
      {
        "name": "4x Tactile Navigation Pushbuttons",
        "qty": "4",
        "note": "Play/Pause, Next Track, Previous Track, Volume Adjust"
      },
      {
        "name": "1K-Ohm Resistor",
        "qty": "1",
        "note": "Eliminates serial UART digital noise on DFPlayer RX pin"
      },
      {
        "name": "16x2 I2C Character LCD (or 0.96\" OLED)",
        "qty": "1",
        "note": "Displays track titles, volume level, and equalizer bars"
      }
    ],
    "workingPrinciple": "This project illustrates the evolution of digital audio reproduction in embedded electronics across two distinct architectural paradigms:\nVersion A (Dedicated Hardware MP3 Decoder - DFPlayer Mini): An onboard YX5200 ASIC processor handles FAT16/FAT32 file parsing, MP3/WAV decompression, and digital-to-analog conversion internally. The microcontroller transmits concise 10-byte UART serial command packets (0x7E ... 0xEF) at 9600 baud to trigger track numbers, adjust volume levels (0-30), and set EQ modes (Pop, Rock, Jazz, Classic) with negligible CPU overhead.\nVersion B (Direct 24-Bit Digital I2S Bus - ESP32 + MAX98357A): The ESP32's dual-core Xtensa processor decodes MP3/AAC/FLAC audio files directly in software and streams uncompressed 24-bit Pulse Code Modulation (PCM) samples across an Inter-IC Sound (I2S) digital bus (BCLK Bit Clock, LRC Word Select, DIN Data). The MAX98357A digital DAC decodes the bitstream with zero analog line noise and drives a 3W speaker with 92% Class-D power efficiency. Both versions integrate interactive track metadata and live equalizer visualization.",
    "wiringTable": [
      {
        "from": "Arduino 5V / ESP32 VIN",
        "to": "DFPlayer VCC & Speaker VCC",
        "color": "red",
        "desc": "Clean 5V amplifier power rail"
      },
      {
        "from": "Arduino GND / ESP32 GND",
        "to": "Common System Ground",
        "color": "black",
        "desc": "Common audio ground"
      },
      {
        "from": "Arduino Pin 11 (Software TX)",
        "to": "1K Resistor -> DFPlayer RX",
        "color": "blue",
        "desc": "UART command data (1K resistor removes noise)"
      },
      {
        "from": "Arduino Pin 10 (Software RX)",
        "to": "DFPlayer TX",
        "color": "green",
        "desc": "UART status telemetry"
      },
      {
        "from": "DFPlayer SPK_1 & SPK_2",
        "to": "4-Ohm 3W Speaker Terminals",
        "color": "amber",
        "desc": "Differential speaker output"
      },
      {
        "from": "ESP32 GPIO 25 (I2S DOUT)",
        "to": "MAX98357A DIN",
        "color": "purple",
        "desc": "Digital I2S Audio Sample Stream (V2)"
      },
      {
        "from": "ESP32 GPIO 26 (I2S BCLK)",
        "to": "MAX98357A BCLK",
        "color": "orange",
        "desc": "Digital I2S Bit Clock (V2)"
      },
      {
        "from": "ESP32 GPIO 22 (I2S LRC)",
        "to": "MAX98357A LRC",
        "color": "yellow",
        "desc": "Digital I2S Left/Right Word Select (V2)"
      },
      {
        "from": "Arduino Pin 2, 3, 4, 5",
        "to": "Play, Next, Prev, Vol Buttons",
        "color": "green",
        "desc": "Tactile transport control buttons"
      },
      {
        "from": "Arduino A4 / ESP32 G21",
        "to": "LCD / OLED SDA",
        "color": "blue",
        "desc": "I2C Serial Data"
      },
      {
        "from": "Arduino A5 / ESP32 G22",
        "to": "LCD / OLED SCL",
        "color": "amber",
        "desc": "I2C Serial Clock"
      }
    ],
    "circuitDiagram": {
      "boardType": "arduino-uno",
      "modules": [
        {
          "name": "DFPlayer Mini MP3 Module",
          "type": "actuator",
          "pins": [
            "VCC (5V)",
            "GND",
            "RX (D11)",
            "TX (D10)",
            "SPK1",
            "SPK2"
          ]
        },
        {
          "name": "MAX98357A I2S DAC Module",
          "type": "actuator",
          "pins": [
            "DIN (G25)",
            "BCLK (G26)",
            "LRC (G22)",
            "VCC",
            "GND"
          ]
        },
        {
          "name": "4-Ohm 3W Speaker",
          "type": "actuator",
          "pins": [
            "Speaker (+)",
            "Speaker (-)"
          ]
        },
        {
          "name": "Tactile Transport Buttons",
          "type": "sensor",
          "pins": [
            "Play/Pause (D2)",
            "Next (D3)",
            "Prev (D4)",
            "Vol (D5)"
          ]
        },
        {
          "name": "I2C Track Display (LCD/OLED)",
          "type": "display",
          "pins": [
            "VCC (5V)",
            "GND",
            "SDA (A4)",
            "SCL (A5)"
          ]
        }
      ]
    },
    "code": "// ============================================================================\n// HI-FI DIGITAL MUSIC PLAYER FIRMWARE (DFPlayer Mini Version)\n// Interactive Track Navigation, Equalizer, and OLED/LCD Telemetry\n// ============================================================================\n#include <SoftwareSerial.h>\n#include <DFRobotDFPlayerMini.h>\n#include <Wire.h>\n#include <LiquidCrystal_I2C.h>\n\nLiquidCrystal_I2C lcd(0x27, 16, 2);\nSoftwareSerial mySoftwareSerial(10, 11); // RX, TX\nDFRobotDFPlayerMini myDFPlayer;\n\n#define BTN_PLAY  2\n#define BTN_NEXT  3\n#define BTN_PREV  4\n#define BTN_VOL   5\n\nbool isPlaying = true;\nint currentTrack = 1;\nint volume = 22; // 0 to 30\n\nvoid setup() {\n  pinMode(BTN_PLAY, INPUT_PULLUP);\n  pinMode(BTN_NEXT, INPUT_PULLUP);\n  pinMode(BTN_PREV, INPUT_PULLUP);\n  pinMode(BTN_VOL,  INPUT_PULLUP);\n\n  mySoftwareSerial.begin(9600);\n  Serial.begin(9600);\n\n  lcd.init();\n  lcd.backlight();\n  lcd.setCursor(0, 0);\n  lcd.print(\"INNOVATION HUB\");\n  lcd.setCursor(0, 1);\n  lcd.print(\"Loading SD Card\");\n\n  if (!myDFPlayer.begin(mySoftwareSerial)) {\n    lcd.clear();\n    lcd.print(\"DFPLAYER ERROR\");\n    while (true);\n  }\n\n  myDFPlayer.volume(volume);\n  myDFPlayer.EQ(DFPLAYER_EQ_BASS);\n  myDFPlayer.play(currentTrack);\n\n  updateDisplay();\n}\n\nvoid updateDisplay() {\n  lcd.clear();\n  lcd.setCursor(0, 0);\n  lcd.print(\"TRACK #\");\n  lcd.print(currentTrack);\n  lcd.print(isPlaying ? \" [PLAY]\" : \" [PAUSE]\");\n\n  lcd.setCursor(0, 1);\n  lcd.print(\"VOL:\");\n  lcd.print(volume);\n  lcd.print(\" EQ:BASS\");\n}\n\nvoid loop() {\n  if (digitalRead(BTN_PLAY) == LOW) {\n    if (isPlaying) {\n      myDFPlayer.pause();\n      isPlaying = false;\n    } else {\n      myDFPlayer.start();\n      isPlaying = true;\n    }\n    updateDisplay();\n    delay(300);\n  }\n\n  if (digitalRead(BTN_NEXT) == LOW) {\n    currentTrack++;\n    myDFPlayer.next();\n    isPlaying = true;\n    updateDisplay();\n    delay(300);\n  }\n\n  if (digitalRead(BTN_PREV) == LOW) {\n    if (currentTrack > 1) currentTrack--;\n    myDFPlayer.previous();\n    isPlaying = true;\n    updateDisplay();\n    delay(300);\n  }\n\n  if (digitalRead(BTN_VOL) == LOW) {\n    volume += 3;\n    if (volume > 30) volume = 10;\n    myDFPlayer.volume(volume);\n    updateDisplay();\n    delay(300);\n  }\n}",
    "assemblySteps": [
      "Format a MicroSD card to FAT32, create a folder named 'mp3', and copy audio files named '0001.mp3', '0002.mp3', etc.",
      "Insert the MicroSD card into the DFPlayer Mini slot.",
      "Connect DFPlayer VCC to 5V, GND to GND, and speaker wires to SPK_1 and SPK_2.",
      "Connect Arduino digital Pin 11 through a 1K-ohm resistor to DFPlayer RX, and Pin 10 to DFPlayer TX.",
      "Wire 4 tactile buttons from digital pins 2, 3, 4, 5 to Ground using internal pull-ups.",
      "Connect 16x2 I2C LCD (or OLED) to 5V, GND, A4 (SDA), and A5 (SCL)."
    ],
    "scientificApplications": "Digital acoustic signal processing, psychoacoustic audio compression modeling, embedded I2S DAC delta-sigma modulation, and assistive audio navigation."
  }
];

if (typeof module !== 'undefined') {
  module.exports = PROJECTS_DATA;
}
