// just a list of all available register (InfoRegister.java)

const byIdMap = {
  0x01: 'MECHANICAL_SWITCH',
  0x02: 'LED',
  0x03: 'ACCELEROMETER',
  0x04: 'TEMPERATURE',
  0x05: 'GPIO',
  0x06: 'NEO_PIXEL',
  0x07: 'IBEACON',
  0x08: 'HAPTIC',
  0x09: 'DATA_PROCESSOR',
  0x0a: 'EVENT',
  0x0b: 'LOGGING',
  0x0c: 'TIMER',
  0x0d: 'I2C',
  0x0f: 'MACRO',
  0x10: 'GSR',
  0x11: 'SETTINGS',
  0x12: 'BAROMETER',
  0x13: 'GYRO',
  0x14: 'AMBIENT_LIGHT',
  0x15: 'MAGNETOMETER',
  0x19: 'SENSORFUSION',
  0xfe: 'DEBUG',
};

const byNameMap = {};

for (let id in byIdMap) {
  let name = byIdMap[id];

  byNameMap[name] = id;
  byNameMap[name] = id;
}

export const byId = byIdMap;
export const byName = byNameMap;
