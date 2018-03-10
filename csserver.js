
const db = require('./db')
const express = require('express')
const app = express()
app.use(express.static('html'))
app.set('view engine', 'pug')

db.query(`SELECT
mission_id, reward,
dept.name AS dept_name, dept.x AS dept_x, dept.y AS dept_y,
arvl.name AS arvl_name, arvl.x AS arvl_x, arvl.y AS arvl_y
FROM ttl.mission m
JOIN ttl.region dept ON m.departure_id=dept.region_id
JOIN ttl.region arvl ON m.arrival_id=arvl.region_id`).then(console.log)

app.get('/', function (req, res) {
    res.render('mission', { title: 'Hey', message: 'Hello there!' })
  })

app.listen(3001, function(){
    console.log('Conneted 3001 port!')
})
