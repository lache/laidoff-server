
const db = require('./db')
const express = require('express')
const raname = require('random-name')
const uuidv1 = require('uuid/v1')
const moment = require('moment')

const app = express()
app.use(express.static('html'))
app.set('view engine', 'pug')
app.locals.moment = moment

const userCache = {}

const createUser = guid => 
    db.query(`INSERT INTO user (guid, name) VALUES (?, ?)`, [guid, `${raname.first()} ${raname.last()}`])
        .then(_ => db.query(`INSERT INTO ship (user_id, name) VALUES (?, ?)`, [_.insertId, `${raname.middle()} ${raname.middle()}`]))

const findUser = guid =>
    db.queryOne(`SELECT
            u.user_id, u.guid, u.name AS user_name, u.gold,
            s.ship_id, s.name AS ship_name, s.x, s.y, s.angle, s.oil
        FROM ttl.user u
            JOIN ttl.ship s ON u.user_id = s.user_id
        WHERE u.guid = ?
        LIMIT 1`, [guid])

const findOrCreateUser = guid => guid in userCache
    ? Promise.resolve(userCache[guid])
    : findUser(guid).then(u => u.user_id !== undefined
        ? (userCache[guid] = u)
        : createUser(guid).then(_ => findOrCreateUser(guid)))

const findMission = () => 
    db.query(`SELECT
            mission_id, reward,
            dept.name AS dept_name, dept.x AS dept_x, dept.y AS dept_y,
            arvl.name AS arvl_name, arvl.x AS arvl_x, arvl.y AS arvl_y
        FROM ttl.mission m
            JOIN ttl.region dept ON m.departure_id=dept.region_id
            JOIN ttl.region arvl ON m.arrival_id=arvl.region_id`)
        .then(result => {
            console.log(result)
        })

app.get('/', (req, res) => 
    findOrCreateUser(req.query.u || uuidv1())
        .then(u => res.render('intro', {guid: u.guid}))
        .catch(console.log))

app.get('/idle', (req, res) => 
    findOrCreateUser(req.query.u || uuidv1())
        .then(u => res.render('idle', {user: u}))
        .catch(console.log))

app.listen(3001, function(){
    console.log('Conneted 3001 port!')
})
