import Config from './config/sensorFusion';
import Core from './core';
import Accelerometer from './accelerometer';
import Gyro from './gyro';
import Magnetometer from './magnetometer';

export const MODULE_OPCODE = 0x19;

export const W_OFFSET = 0;
export const X_OFFSET = 4;
export const Y_OFFSET = 8;
export const Z_OFFSET = 12;

export const ENABLE = 0x1;
export const MODE = 0x2;
export const OUTPUT_ENABLE = 0x3;
export const CORRECTED_ACC = 0x4;
export const CORRECTED_GYRO = 0x5;
export const CORRECTED_MAG = 0x6;
export const QUATERNION = 0x7;
export const EULER_ANGLES = 0x8;
export const GRAVITY_VECTOR = 0x9;
export const LINEAR_ACC = 0xa;

/* Data sources */

export const DATA_CORRECTED_ACC = 0;
export const DATA_CORRECTED_GYRO = 1;
export const DATA_CORRECTED_MAG = 2;
export const DATA_QUATERNION = 3;
export const DATA_EULER_ANGLE = 4;
export const DATA_GRAVITY_VECTOR = 5;
export const DATA_LINEAR_ACC = 6;

export const SensorFusion = function (device) {
  this.device = device;
  this.config = new Config();
  this.dataSourceMask = 0x0;
  this.accelerometer = new Accelerometer(device);
  this.gyro = new Gyro(device);
  this.magnetometer = new Magnetometer(device);
};

SensorFusion.prototype.enableData = function (data_source) {
  this.dataSourceMask = 0x0;
  // eslint-disable-next-line no-bitwise
  this.dataSourceMask |= 0x1 << data_source;
};

SensorFusion.prototype.clearEnabledMask = function () {
  this.dataSourceMask = 0x0;
};

SensorFusion.prototype.writeConfig = function () {
  var buffer = new Uint8Array(4);
  buffer[0] = MODULE_OPCODE;
  buffer[1] = MODE;
  buffer[2] = this.config.mode;
  buffer[3] = this.config.getConfigMask();
  this.device.send(buffer);

  this.accelerometer.setAxisSamplingRange(
    parseInt(
      Object.keys(this.accelerometer.ACC_RANGE)[this.config.acc_range],
      10,
    ),
  );

  switch (this.config.mode) {
    case Config.MODE.NDOF:
    case Config.MODE.IMU_PLUS:
      this.accelerometer.setOutputDataRate(100);
      break;
  }
  this.accelerometer.setConfig(); // TODO refactor the name to be consistent

  //dirty hack !!!
  switch (this.config.mode) {
    case Config.MODE.NDOF:
    case Config.MODE.IMU_PLUS:
      this.gyro.config.setRate(100);
      break;
  }
  this.gyro.config.range = this.config.gyro_range;
  this.gyro.commitConfig(); // TODO refactor the name to be consistent

  //dirty hack !! use constants instead !!
  this.magnetometer.writeConfig(9, 15, 0x6);
};

SensorFusion.prototype.subscribe = function (output_type) {
  console.log('sub', output_type);
  
  var buffer = new Uint8Array(3);
  buffer[0] = MODULE_OPCODE;
  buffer[1] = output_type;
  buffer[2] = 0x1;
  this.device.send(buffer);
};

SensorFusion.prototype.start = function () {
  console.log('conf mode', this.config.mode, Config.MODE.NDOF);

  switch (this.config.mode) {
    case Config.MODE.NDOF:
      this.accelerometer.enableAxisSampling();
      console.log('this.accelerometer.enableAxisSampling();');
      this.gyro.enableAxisSampling();
      console.log('this.gyro.enableAxisSampling();');
      this.magnetometer.enableAxisSampling();
      console.log('this.magnetometer.enableAxisSampling();');
      this.accelerometer.start();
      console.log('this.accelerometer.start();');
      this.gyro.start();
      console.log('this.gyro.start();');
      this.magnetometer.start();
      console.log('this.magnetometer.start();');
      break;
  }
  var buffer = new Uint8Array(4);
  buffer[0] = MODULE_OPCODE;
  buffer[1] = OUTPUT_ENABLE;
  buffer[2] = this.dataSourceMask;
  buffer[3] = 0x0;
  this.device.send(buffer);

  buffer = new Uint8Array(3);
  buffer[0] = MODULE_OPCODE;
  buffer[1] = ENABLE;
  buffer[2] = 0x1;

  this.device.send(buffer);
};

SensorFusion.prototype.stop = function () {
  var buffer = new Uint8Array(3);
  buffer[0] = MODULE_OPCODE;
  buffer[1] = ENABLE;
  buffer[2] = 0x0;

  buffer = new Uint8Array(4);
  buffer[0] = MODULE_OPCODE;
  buffer[1] = OUTPUT_ENABLE;
  buffer[2] = 0x0;
  buffer[3] = 0x7f;
  this.device.send(buffer);

  switch (this.config.mode) {
    case Config.MODE.NDOF:
      this.accelerometer.stop();
      this.gyro.stop();
      this.magnetometer.stop();
      this.accelerometer.disableAxisSampling();
      this.gyro.disableAxisSampling();
      this.magnetometer.disableAxisSampling();
      break;
  }
};

SensorFusion.prototype.unsubscribe = function (output_type) {
  var buffer = new Uint8Array(3);
  buffer[0] = MODULE_OPCODE;
  buffer[1] = output_type;
  buffer[2] = 0x0;
  this.device.send(buffer);
};

SensorFusion.prototype.onChange = function (callback) {
  this.device.emitter.on([MODULE_OPCODE, QUATERNION], function (buffer) {
    var quaternion = new Core.Quaternion(
      Math.round(buffer.readFloatLE(W_OFFSET) * 1000) / 1000,
      Math.round(buffer.readFloatLE(X_OFFSET) * 1000) / 1000,
      Math.round(buffer.readFloatLE(Y_OFFSET) * 1000) / 1000,
      Math.round(buffer.readFloatLE(Z_OFFSET) * 1000) / 1000,
    );
    callback(quaternion);
  });
};

export default SensorFusion;
