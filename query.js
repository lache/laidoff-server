const Sqlite3 = require('better-sqlite3')
const db = new Sqlite3('ttl.db')

const insertUser = db.prepare(`INSERT INTO user (guid, name) VALUES (?, ?)`)
const insertShip = db.prepare(`INSERT INTO ship (user_id, name) VALUES (?, ?)`)
const deleteShip = db.prepare(`DELETE FROM ship WHERE ship_id = ?`)
const insertShiproute = db.prepare(
  `INSERT INTO shiproute (port1_id, port2_id) VALUES (?, ?)`
)
const setShipShiproute = db.prepare(
  `UPDATE ship SET shiproute_id = ? WHERE ship_id = ?`
)
const listShipShiproute = db.prepare(
  `SELECT ship_id, port1_id, port2_id FROM ship s JOIN shiproute sr ON s.shiproute_id=sr.shiproute_id`
)
const findUserGuid = db.prepare(`SELECT guid FROM user WHERE user_id = ?`)
const findUser = db.prepare(`SELECT
  u.user_id, u.guid, u.name AS user_name, u.gold,
  s.ship_id, s.name AS ship_name, s.x, s.y, s.angle, s.oil
FROM user u
  JOIN ship s ON u.user_id = s.user_id
WHERE u.guid = ?
LIMIT 1`)
const findShip = db.prepare(`SELECT * from ship WHERE ship_id = ?`)
const findUserShipsScrollDown = db.prepare(
  `SELECT * from ship WHERE user_id = ? AND ship_id > ? ORDER BY ship_id LIMIT ?`
)
const findUserShipsScrollUp = db.prepare(
  `SELECT * from ship WHERE user_id = ? AND ship_id < ? ORDER BY ship_id DESC LIMIT ?`
)
const earnGold = db.prepare(`UPDATE user SET gold = gold + ? WHERE guid = ?`)
const earnGoldUser = db.prepare(
  `UPDATE user SET gold = gold + ? WHERE user_id = ?`
)
const spendGold = db.prepare(`UPDATE user SET gold = gold - ? WHERE guid = ?`)
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
  earnGoldUser,
  spendGold,
  findMission,
  findMissions,
  findPort,
  findPorts,
  insertShiproute,
  setShipShiproute,
  listShipShiproute,
  findShip,
  findUserGuid,
  findUserShipsScrollDown,
  findUserShipsScrollUp,
  deleteShip
}
