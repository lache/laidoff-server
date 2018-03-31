const argv = require('yargs').argv
const init = require('./init')

if (argv.init) {
  init.initialize()
}

const express = require('express')
const raname = require('random-name')
const uuidv1 = require('uuid/v1')
const moment = require('moment')
const numeral = require('numeral')
const query = require('./query')
const dgram = require('dgram')
const seaUdpClient = dgram.createSocket('udp4')
const message = require('./message')

const app = express()
app.locals.moment = moment
app.locals.numeral = numeral

app.use(express.static('html'))
app.set('view engine', 'pug')

const userCache = {}

const createUser = guid => {
  const userName = `${raname.first()} ${raname.last()}`
  const shipName = `${raname.middle()} ${raname.middle()}`
  const user = query.insertUser.run(guid, userName)
  query.insertShip.run(user.lastInsertROWID, shipName)
  return user.lastInsertROWID
}
const createShip = (guid, shipName) => {
  const user = findOrCreateUser(guid)
  const ship = query.insertShip.run(user.user_id, shipName)
  return ship.lastInsertROWID
}
const findUser = guid => query.findUser.get(guid)
const earnGold = (guid, reward) => query.earnGold.run(reward, guid)
const findOrCreateUser = guid => {
  if (guid in userCache) {
    return userCache[guid]
  }
  const userInDb = findUser(guid)
  console.log(userInDb)
  if (userInDb !== undefined) {
    userCache[guid] = userInDb
    return userInDb
  }
  createUser(guid)
  return findOrCreateUser(guid)
}

const findMission = missionId => query.findMission.get(missionId)
const findMissions = () => {
  const result = query.findMissions.all()
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
}

const findPort = portId => query.findPort.get(portId)
const findPorts = () => {
  const result = query.findPorts.all()
  const rows = []
  let row = []
  let index = 0
  for (let each of result) {
    row.push(each)
    if (++index % 3 === 0) {
      rows.push(row)
      row = []
    }
  }
  if (row.length > 0) {
    rows.push(row)
  }
  return rows
}

const spawnSeaObject = (id, x, y) => {
  const buf = message.SpawnStruct.buffer()
  for (let i = 0; i < buf.length; i++) {
    buf[i] = 0
  }
  message.SpawnStruct.fields.type = 1
  message.SpawnStruct.fields.id = id
  message.SpawnStruct.fields.x = x
  message.SpawnStruct.fields.y = y
  seaUdpClient.send(Buffer.from(buf), 4000, 'localhost', err => {
    if (err) {
      console.error('sea udp client error:', err)
    }
  })
}

const travelTo = (id, x, y) => {
  const buf = message.TeleportToStruct.buffer()
  for (let i = 0; i < buf.length; i++) {
    buf[i] = 0
  }
  message.TeleportToStruct.fields.type = 2
  message.TeleportToStruct.fields.id = id
  message.TeleportToStruct.fields.x = x
  message.TeleportToStruct.fields.y = y
  seaUdpClient.send(Buffer.from(buf), 4000, 'localhost', err => {
    if (err) {
      console.error('sea udp client error:', err)
    }
  })
}

const teleportTo = (id, x, y) => {
  const buf = message.TeleportToStruct.buffer()
  for (let i = 0; i < buf.length; i++) {
    buf[i] = 0
  }
  message.TeleportToStruct.fields.type = 3
  message.TeleportToStruct.fields.id = id
  message.TeleportToStruct.fields.x = x
  message.TeleportToStruct.fields.y = y
  seaUdpClient.send(Buffer.from(buf), 4000, 'localhost', err => {
    if (err) {
      console.error('sea udp client error:', err)
    }
  })
}

app.get('/', (req, res) => {
  const u = findOrCreateUser(req.query.u || uuidv1())
  spawnSeaObject(u.guid, 0, 0)
  return res.render('intro', { user: u })
})

app.get('/idle', (req, res) => {
  const u = findOrCreateUser(req.query.u || uuidv1())
  return res.render('idle', { user: u })
})

app.get('/loan', (req, res) => {
  const u = findOrCreateUser(req.query.u || uuidv1())
  return res.render('loan', { user: u })
})

app.get('/vessel', (req, res) => {
  const u = findOrCreateUser(req.query.u || uuidv1())
  return res.render('vessel', { user: u })
})

app.get('/mission', (req, res) => {
  const u = findOrCreateUser(req.query.u || uuidv1())
  const m = findMissions()
  return res.render('mission', { user: u, rows: m })
})

app.get('/start', (req, res) => {
  const u = findOrCreateUser(req.query.u || uuidv1())
  const m = findMission(req.query.mission || 1)
  return res.render('start', { user: u, mission: m })
})

app.get('/success', (req, res) => {
  const u = findOrCreateUser(req.query.u || uuidv1())
  const m = findMission(req.query.mission || 1)
  earnGold(u.guid, m.reward)
  delete userCache[u.guid]
  return res.render('success', { user: u, mission: m })
})

app.get('/port', (req, res) => {
  const u = findOrCreateUser(req.query.u || uuidv1())
  const p = findPorts()
  return res.render('port', { user: u, rows: p })
})

app.get('/traveltoport', (req, res) => {
  const u = findOrCreateUser(req.query.u || uuidv1())
  const p = findPort(req.query.region || 1)
  console.log('travel to port', p.region_id, p.x, p.y)
  travelTo(u.guid, p.x, p.y)
  return res.render('idle', { user: u })
})

app.get('/teleporttoport', (req, res) => {
  const u = findOrCreateUser(req.query.u || uuidv1())
  const p = findPort(req.query.region || 1)
  console.log('teleport to port', p.region_id, p.x, p.y)
  teleportTo(u.guid, p.x, p.y)
  return res.render('idle', { user: u })
})

const sendSpawnShip = (id, name, x, y) => {
  const buf = message.SpawnShipStruct.buffer()
  for (let i = 0; i < buf.length; i++) {
    buf[i] = 0
  }
  message.SpawnShipStruct.fields.type = 4
  message.SpawnShipStruct.fields.id = id
  message.SpawnShipStruct.fields.name = name
  message.SpawnShipStruct.fields.x = x
  message.SpawnShipStruct.fields.y = y
  seaUdpClient.send(Buffer.from(buf), 4000, 'localhost', err => {
    if (err) {
      console.error('sea udp SpawnShipStruct client error:', err)
    }
  })
}

app.get('/purchase_new_ship', (req, res) => {
  const u = findOrCreateUser(req.query.u || uuidv1())
  const shipId = createShip(u.guid, u.user_name)
  sendSpawnShip(shipId, u.user_name, req.get('X-Lng'), req.get('X-Lat'))
  return res.render('idle', { user: u })
})

const port = argv.port || 3000
app.listen(port, () => {
  console.log(`Starting on ${port} port!`)
})
