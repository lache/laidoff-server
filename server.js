const db = require('./db')
const express = require('express')
const raname = require('random-name')
const uuidv1 = require('uuid/v1')
const moment = require('moment')
const numeral = require('numeral')

// Not today.
// const Sqlite3 = require('better-sqlite3')
// const db = new Sqlite3('ttl.db')

const app = express()
app.locals.moment = moment
app.locals.numeral = numeral

app.use(express.static('html'))
app.set('view engine', 'pug')

const userCache = {}

const createUser = guid =>
  db
    .query(`INSERT INTO user (guid, name) VALUES (?, ?)`, [
      guid,
      `${raname.first()} ${raname.last()}`
    ])
    .then(_ =>
      db.query(`INSERT INTO ship (user_id, name) VALUES (?, ?)`, [
        _.insertId,
        `${raname.middle()} ${raname.middle()}`
      ])
    )

const findUser = guid =>
  db.queryOne(
    `SELECT
            u.user_id, u.guid, u.name AS user_name, u.gold,
            s.ship_id, s.name AS ship_name, s.x, s.y, s.angle, s.oil
        FROM ttl.user u
            JOIN ttl.ship s ON u.user_id = s.user_id
        WHERE u.guid = ?
        LIMIT 1`,
    [guid]
  )

const earnGold = (guid, reward) =>
  db.query(`UPDATE user SET gold = gold + ? WHERE guid = ?`, [reward, guid])

const findOrCreateUser = guid =>
  guid in userCache
    ? Promise.resolve(userCache[guid])
    : findUser(guid).then(
        u =>
          u.user_id !== undefined
            ? (userCache[guid] = u)
            : createUser(guid).then(_ => findOrCreateUser(guid))
      )

const findMission = missionId =>
  db.queryOne(
    `SELECT
            mission_id, reward,
            dept.name AS dept_name, dept.x AS dept_x, dept.y AS dept_y,
            arvl.name AS arvl_name, arvl.x AS arvl_x, arvl.y AS arvl_y
        FROM ttl.mission m
            JOIN ttl.region dept ON m.departure_id=dept.region_id
            JOIN ttl.region arvl ON m.arrival_id=arvl.region_id
        WHERE m.mission_id = ?`,
    [missionId]
  )

const findMissions = () =>
  db
    .query(
      `SELECT
            mission_id, reward,
            dept.name AS dept_name, dept.x AS dept_x, dept.y AS dept_y,
            arvl.name AS arvl_name, arvl.x AS arvl_x, arvl.y AS arvl_y
        FROM ttl.mission m
            JOIN ttl.region dept ON m.departure_id=dept.region_id
            JOIN ttl.region arvl ON m.arrival_id=arvl.region_id`
    )
    .then(result => {
      const rows = []
      let row = []
      let index = 0
      for (let each of result) {
        row.push(each)
        if (++index % 2 === 0) {
          rows.push(row)
          row = []
        }
      }
      if (row.length > 0) {
        rows.push(row)
      }
      console.log(rows)
      return rows
    })

app.get('/', (req, res) =>
  findOrCreateUser(req.query.u || uuidv1())
    .then(u => res.render('intro', { user: u }))
    .catch(console.log)
)

app.get('/idle', (req, res) =>
  findOrCreateUser(req.query.u || uuidv1())
    .then(u => res.render('idle', { user: u }))
    .catch(console.log)
)

app.get('/mission', (req, res) =>
  findOrCreateUser(req.query.u || uuidv1())
    .then(u =>
      findMissions().then(m => res.render('mission', { user: u, rows: m }))
    )
    .catch(console.log)
)

app.get('/start', (req, res) =>
  findOrCreateUser(req.query.u || uuidv1())
    .then(u =>
      findMission(req.query.mission || 1).then(m =>
        res.render('start', { user: u, mission: m })
      )
    )
    .catch(console.log)
)

app.get('/success', (req, res) =>
  findOrCreateUser(req.query.u || uuidv1())
    .then(u =>
      findMission(req.query.mission || 1).then(m =>
        earnGold(u.guid, m.reward).then(_ => {
          delete userCache[u.guid]
          return res.render('success', { user: u, mission: m })
        })
      )
    )
    .catch(console.log)
)

const port = process.argv.length === 1 ? 3000 : parseInt(process.argv[1])
app.listen(port, () => {
  console.log(`Starting on ${port} port!`)
})
