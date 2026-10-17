import pg from 'pg';
import { readFileSync } from 'fs';

const connectionString = 'postgresql://postgres:8jYTdYd3nETYV5T8@db.pzitspclrudmaothdzzx.supabase.co:5432/postgres';

// Load projects from src/data/projects.ts
// We can parse or import them
async function main() {
  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  console.log('Connected to Supabase for seeding...');

  // 1. Hardware components library
  const components = [
    {
      id: 'arduino-uno-r3',
      name: 'Arduino Uno R3',
      category: 'Microcontroller',
      pin_count: 28,
      pins: ['5V', '3.3V', 'GND', 'VIN', 'RESET', 'A0', 'A1', 'A2', 'A3', 'A4', 'A5', 'D0', 'D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8', 'D9', 'D10', 'D11', 'D12', 'D13', 'AREF'],
      operating_voltage: '5V DC (USB/Barrel)',
      description: 'ATmega328P 8-bit AVR RISC microcontroller clocked at 16 MHz with 14 digital I/O pins and 6 analog inputs.',
      svg_render_type: 'arduino-uno'
    },
    {
      id: 'esp32-devkit-v1',
      name: 'ESP32 NodeMCU DevKit V1',
      category: 'Microcontroller',
      pin_count: 30,
      pins: ['3V3', 'GND', 'EN', 'VP', 'VN', 'D34', 'D35', 'D32', 'D33', 'D25', 'D26', 'D27', 'D14', 'D12', 'D13', 'D23', 'D22', 'TX0', 'RX0', 'D21', 'D19', 'D18', 'D5', 'D17', 'D16', 'D4', 'D0', 'D2', 'D15', 'VIN'],
      operating_voltage: '3.3V Logic / 5V VIN',
      description: 'Tensilica Xtensa Dual-Core 32-bit LX6 microprocessor at 240 MHz with built-in 802.11 b/g/n Wi-Fi and Bluetooth v4.2 BR/EDR and BLE.',
      svg_render_type: 'esp32'
    },
    {
      id: 'ultrasonic-hc-sr04',
      name: 'HC-SR04 Ultrasonic Distance Sensor',
      category: 'Sensor',
      pin_count: 4,
      pins: ['VCC', 'TRIG', 'ECHO', 'GND'],
      operating_voltage: '5V DC',
      description: '40 kHz sonar transducer module measuring distance from 2 cm to 400 cm with 3 mm accuracy.',
      svg_render_type: 'ultrasonic'
    },
    {
      id: 'dht11-dht22',
      name: 'DHT11 / DHT22 Digital Temperature & Humidity Sensor',
      category: 'Sensor',
      pin_count: 3,
      pins: ['VCC', 'DATA', 'GND'],
      operating_voltage: '3.3V - 5V DC',
      description: 'Capacitive humidity sensing element and high-precision thermistor with calibrated digital signal output.',
      svg_render_type: 'dht11'
    },
    {
      id: 'pir-hc-sr501',
      name: 'HC-SR501 Passive Infrared (PIR) Motion Sensor',
      category: 'Sensor',
      pin_count: 3,
      pins: ['VCC', 'OUT', 'GND'],
      operating_voltage: '4.5V - 20V DC',
      description: 'Pyroelectric sensor detecting human and animal infrared motion with adjustable sensitivity and delay.',
      svg_render_type: 'pir'
    },
    {
      id: 'mq2-mq135',
      name: 'MQ-2 / MQ-135 Gas & Air Quality Sensor',
      category: 'Sensor',
      pin_count: 4,
      pins: ['VCC', 'GND', 'DO', 'AO'],
      operating_voltage: '5V DC',
      description: 'Tin dioxide (SnO2) electro-chemical gas sensor sensitive to smoke, LPG, CO, alcohol, and airborne pollutants.',
      svg_render_type: 'mq-gas'
    },
    {
      id: 'mpu-6050-imu',
      name: 'MPU-6050 6-DOF IMU (Accelerometer + Gyroscope)',
      category: 'Sensor',
      pin_count: 8,
      pins: ['VCC', 'GND', 'SCL', 'SDA', 'XDA', 'XCL', 'AD0', 'INT'],
      operating_voltage: '3.3V - 5V (on-board LDO)',
      description: 'Triple-axis MEMS accelerometer and triple-axis MEMS gyroscope with Digital Motion Processor (DMP).',
      svg_render_type: 'mpu6050'
    },
    {
      id: 'oled-ssd1306',
      name: '0.96-inch OLED Display SSD1306 (128x64 I2C)',
      category: 'Display',
      pin_count: 4,
      pins: ['GND', 'VCC', 'SCL', 'SDA'],
      operating_voltage: '3.3V - 5V DC',
      description: 'High-contrast monochrome OLED display module driven by SSD1306 over 400 kHz I2C bus.',
      svg_render_type: 'oled'
    },
    {
      id: 'relay-module-5v',
      name: '5V 10A Optocoupler Relay Module',
      category: 'Actuator',
      pin_count: 6,
      pins: ['VCC', 'IN', 'GND', 'COM', 'NO', 'NC'],
      operating_voltage: '5V DC coil / 250V AC 10A contacts',
      description: 'Galvanically isolated electromechanical relay module for switching mains electricity and heavy DC motors.',
      svg_render_type: 'relay'
    },
    {
      id: 'servo-sg90',
      name: 'TowerPro SG90 Micro Servo Motor 9g',
      category: 'Actuator',
      pin_count: 3,
      pins: ['GND (Brown)', 'VCC (Red)', 'PWM (Orange)'],
      operating_voltage: '4.8V - 6V DC',
      description: '180-degree rotary actuator with built-in potentiometer and PID feedback loop for positioning.',
      svg_render_type: 'servo'
    },
    {
      id: 'soil-moisture-capacitive',
      name: 'Capacitive Soil Moisture Sensor v1.2',
      category: 'Sensor',
      pin_count: 3,
      pins: ['VCC', 'GND', 'AOUT'],
      operating_voltage: '3.3V - 5V DC',
      description: 'Corrosion-resistant capacitive soil sensor measuring soil dielectric permittivity without galvanic corrosion.',
      svg_render_type: 'soil'
    },
    {
      id: 'stepper-28byj48-uln2003',
      name: '28BYJ-48 5V Stepper Motor + ULN2003 Driver',
      category: 'Actuator',
      pin_count: 6,
      pins: ['IN1', 'IN2', 'IN3', 'IN4', '5V', 'GND'],
      operating_voltage: '5V DC',
      description: '4-phase 5-wire geared stepper motor providing 2048 steps per revolution via Darlington transistor array.',
      svg_render_type: 'stepper'
    },
    {
      id: 'battery-pack-4xaa',
      name: '4x AA / 9V DC Battery Power Pack',
      category: 'Power',
      pin_count: 2,
      pins: ['(+) Positive (Red)', '(-) Negative (Black)'],
      operating_voltage: '6V - 9V DC',
      description: 'Dedicated external battery pack supplying isolated power to high-current actuators and water pumps.',
      svg_render_type: 'battery'
    }
  ];

  for (const comp of components) {
    await client.query(`
      INSERT INTO public.hardware_components (id, name, category, pin_count, pins, operating_voltage, description, svg_render_type)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        category = EXCLUDED.category,
        pin_count = EXCLUDED.pin_count,
        pins = EXCLUDED.pins,
        operating_voltage = EXCLUDED.operating_voltage,
        description = EXCLUDED.description,
        svg_render_type = EXCLUDED.svg_render_type;
    `, [
      comp.id,
      comp.name,
      comp.category,
      comp.pin_count,
      JSON.stringify(comp.pins),
      comp.operating_voltage,
      comp.description,
      comp.svg_render_type
    ]);
  }
  console.log(`Seeded ${components.length} hardware components!`);

  await client.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
