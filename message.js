const Struct = require('struct')
// const dgram = require("dgram");

const HttpResponseStruct = Struct()
    .word16Sle('size')
    .word16Sle('type')
    .chars('body', 8192 - 4)

const FullStateObjectStruct = Struct()
    .word32Sle('id')
    .floatle('x')
    .floatle('y')
    .floatle('a')

const FullStateStruct = Struct()
    .word8Sle('type')
    .word8Sle('padding0')
    .word8Sle('padding1')
    .word8Sle('padding2')
    .array('objects', 64, FullStateObjectStruct)

FullStateStruct.allocate()
const buf = FullStateStruct.buffer()
console.log(buf)
