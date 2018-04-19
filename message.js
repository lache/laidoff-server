const Struct = require('struct')
// const dgram = require("dgram");

/*
Not yet used.
const HttpResponseStruct = Struct()
  .word16Sle('size')
  .word16Sle('type')
  .chars('body', 8192 - 4)
*/

const FullStateObjectStruct = Struct()
  .word32Sle('id')
  .floatle('x')
  .floatle('y')
  .floatle('a')
FullStateObjectStruct.allocate()

const FullStateStruct = Struct()
  .word8Sle('type')
  .word8Sle('padding0')
  .word8Sle('padding1')
  .word8Sle('padding2')
  .array('objects', 64, FullStateObjectStruct)
FullStateStruct.allocate()

const SpawnStruct = Struct()
  .word8Sle('type')
  .word8Sle('padding0')
  .word8Sle('padding1')
  .word8Sle('padding2')
  .chars('id', 64)
  .floatle('x')
  .floatle('y')
SpawnStruct.allocate()

const TravelToStruct = Struct()
  .word8Sle('type')
  .word8Sle('padding0')
  .word8Sle('padding1')
  .word8Sle('padding2')
  .chars('id', 64)
  .floatle('x')
  .floatle('y')
TravelToStruct.allocate()

const TeleportToStruct = Struct()
  .word8Sle('type')
  .word8Sle('padding0')
  .word8Sle('padding1')
  .word8Sle('padding2')
  .chars('id', 64)
  .floatle('x')
  .floatle('y')
TeleportToStruct.allocate()

const SpawnShipStruct = Struct()
  .word8Sle('type')
  .word8Sle('padding0')
  .word8Sle('padding1')
  .word8Sle('padding2')
  .word32Sle('id')
  .chars('name', 64)
  .floatle('x')
  .floatle('y')
SpawnShipStruct.allocate()

const SpawnShipReplyStruct = Struct()
  .word8Sle('type')
  .word8Sle('padding0')
  .word8Sle('padding1')
  .word8Sle('padding2')
  .word32Sle('shipId')
  .word32Sle('port1Id')
  .word32Sle('port2Id')
SpawnShipReplyStruct.allocate()

module.exports = {
  SpawnStruct,
  TravelToStruct,
  TeleportToStruct,
  SpawnShipStruct,
  SpawnShipReplyStruct,
}
