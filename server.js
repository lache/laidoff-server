const Struct = require('struct')
const db = require('./db')
const dgram = require("dgram");

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

db.query(`SELECT
mission_id, reward,
dept.name AS dept_name, dept.x AS dept_x, dept.y AS dept_y,
arvl.name AS arvl_name, arvl.x AS arvl_x, arvl.y AS arvl_y
FROM ttl.mission m
JOIN ttl.region dept ON m.departure_id=dept.region_id
JOIN ttl.region arvl ON m.arrival_id=arvl.region_id`).then(console.log)

const express = require('express');
const app = express();
app.use(express.static('html'));

app.listen(19856, function(){
    console.log('Conneted 19856 port!');
});