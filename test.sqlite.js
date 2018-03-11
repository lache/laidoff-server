const Sqlite3 = require('better-sqlite3')
const db = new Sqlite3('ttl.sqlite3.db')
const fs = require('fs')

const schemaSql = fs.readFileSync('./ttl.schema.sqlite3.sql', 'utf8')
db.exec(schemaSql)

const q = db.prepare(
  `SELECT
            mission_id, reward,
            dept.name AS dept_name, dept.x AS dept_x, dept.y AS dept_y,
            arvl.name AS arvl_name, arvl.x AS arvl_x, arvl.y AS arvl_y
        FROM mission m
            JOIN region dept ON m.departure_id=dept.region_id
            JOIN region arvl ON m.arrival_id=arvl.region_id`
)
console.log(q.all())
