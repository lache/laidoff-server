const Sqlite3 = require('better-sqlite3')
const db = new Sqlite3('ttl.db')

const insertUser = db.prepare(`INSERT INTO user (guid, name) VALUES (?, ?)`)
const insertShip = db.prepare(`INSERT INTO ship (user_id, name) VALUES (?, ?)`)
const findUser = db.prepare(`SELECT
  u.user_id, u.guid, u.name AS user_name, u.gold,
  s.ship_id, s.name AS ship_name, s.x, s.y, s.angle, s.oil
FROM user u
  JOIN ship s ON u.user_id = s.user_id
WHERE u.guid = ?
LIMIT 1`)
const earnGold = db.prepare(`UPDATE user SET gold = gold + ? WHERE guid = ?`)
const findMission = db.prepare(`SELECT
  mission_id, reward,
  dept.name AS dept_name, dept.x AS dept_x, dept.y AS dept_y,
  arvl.name AS arvl_name, arvl.x AS arvl_x, arvl.y AS arvl_y,
  (dept.x - arvl.x)*(dept.x - arvl.x)+(dept.y-arvl.y)*(dept.y-arvl.y) AS dist
FROM mission m
  JOIN region dept ON m.departure_id=dept.region_id
  JOIN region arvl ON m.arrival_id=arvl.region_id
WHERE m.mission_id = ?`)
const findMissions = db.prepare(`SELECT
  mission_id, reward,
  dept.name AS dept_name, dept.x AS dept_x, dept.y AS dept_y,
  arvl.name AS arvl_name, arvl.x AS arvl_x, arvl.y AS arvl_y,
  (dept.x - arvl.x)*(dept.x - arvl.x)+(dept.y-arvl.y)*(dept.y-arvl.y) AS dist
FROM mission m
  JOIN region dept ON m.departure_id=dept.region_id
  JOIN region arvl ON m.arrival_id=arvl.region_id`)
const findPort = db.prepare(`SELECT
  region_id, name, x, y
FROM region r
WHERE r.region_id = ?`)
const findPorts = db.prepare(`SELECT
  region_id, name, x, y
FROM region LIMIT 9`)
module.exports = {
  insertUser,
  insertShip,
  findUser,
  earnGold,
  findMission,
  findMissions,
  findPort,
  findPorts,
}
