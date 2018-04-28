const argv = require('yargs').argv
const init = require('./init')

if (argv.init) {
  init.initialize()
  console.log(`Initialized.`)
  process.exit(0)
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
const url = require('url')
const app = express()
app.locals.moment = moment
app.locals.numeral = numeral

app.use(express.static('html'))
app.set('view engine', 'pug')

const userCache = {}

const createUser = guid => {
  const userName = `${raname.first()} ${raname.last()}`
  const user = query.insertUser.run(guid, userName)
  // no initial ship
  // const shipName = `${raname.middle()} ${raname.middle()}`
  // query.insertShip.run(user.lastInsertROWID, shipName)
  return user.lastInsertROWID
}
const createPort = (guid, portName, x, y) => {
  const user = findOrCreateUser(guid)
  const port = query.insertPort.run(portName, x, y)
  return port.lastInsertROWID
}
const createShip = (guid, shipName) => {
  const user = findOrCreateUser(guid)
  const ship = query.insertShip.run(user.user_id, shipName)
  return ship.lastInsertROWID
}
const deleteShip = shipId => {
  query.deleteShip.run(shipId)
}
const createShiproute = (port1Id, port2Id) => {
  const shiproute = query.insertShiproute.run(port1Id, port2Id)
  return shiproute.lastInsertROWID
}
const setShipShiproute = (shipId, shiprouteId) => {
  query.setShipShiproute.run(shiprouteId, shipId)
}
const listShipShiproute = onRow => {
  for (const row of query.listShipShiproute.iterate()) {
    onRow(row)
  }
}
const findShip = shipId => query.findShip.get(shipId)
const findUser = guid => query.findUser.get(guid)
const findUserGuid = userId => query.findUserGuid.get(userId)
const earnGold = (guid, reward) => query.earnGold.run(reward, guid)
const earnGoldUser = (userId, reward) => query.earnGoldUser.run(reward, userId)
const spendGold = (guid, cost) => query.spendGold.run(cost, guid)
const findOrCreateUser = guid => {
  if (guid in userCache) {
    return userCache[guid]
  }
  const userInDb = findUser(guid)
  // console.log(userInDb)
  if (userInDb !== undefined) {
    userCache[guid] = userInDb
    return userInDb
  }
  createUser(guid)
  return findOrCreateUser(guid)
}
const findUserShipsScrollDown = (userId, lastUserId, count) => {
  return query.findUserShipsScrollDown.all(userId, lastUserId, count)
}
const findUserShipsScrollUp = (userId, firstUserId, count) => {
  return query.findUserShipsScrollUp.all(userId, firstUserId, count)
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
const findPortsScrollDown = (userId, lastRegionId, count) => {
  return query.findPortsScrollDown.all(lastRegionId, count)
}
const findPortsScrollUp = (userId, lastRegionId, count) => {
  return query.findPortsScrollUp.all(lastRegionId, count)
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

app.get('/sell_vessel', (req, res) => {
  const u = findOrCreateUser(req.query.u || uuidv1())
  if (req.query.s) {
    deleteShip(req.query.s)
    const buf = message.DeleteShipStruct.buffer()
    for (let i = 0; i < buf.length; i++) {
      buf[i] = 0
    }
    message.DeleteShipStruct.fields.type = 5 // Delete Ship
    message.DeleteShipStruct.fields.shipId = req.query.s
    seaUdpClient.send(Buffer.from(buf), 4000, 'localhost', err => {
      if (err) {
        console.error('sea udp client error:', err)
      }
    })
  }
  res.redirect(
    url.format({
      pathname: '/vessel',
      query: {
        u: u.guid,
        currentFirstKey: req.query.currentFirstKey
      }
    })
  )
})

app.get('/vessel', (req, res) => {
  const u = findOrCreateUser(req.query.u || uuidv1())
  const limit = 5
  let s
  if (req.query.firstKey) {
    // user pressed 'next' page button
    s = findUserShipsScrollDown(u.user_id, req.query.firstKey, limit)
    if (s.length === 0) {
      // no next elements available. stay on the current page
      s = findUserShipsScrollDown(
        u.user_id,
        req.query.currentFirstKey - 1,
        limit
      )
    }
  } else if (req.query.lastKey) {
    // user pressed 'prev' page button
    s = findUserShipsScrollUp(u.user_id, req.query.lastKey, limit)
    s.reverse()
    if (s.length === 0) {
      // no prev elements available. stay on the current page
      s = findUserShipsScrollDown(
        u.user_id,
        req.query.currentFirstKey - 1,
        limit
      )
    }
  } else if (
    req.query.currentFirstKey &&
    req.query.currentFirstKey !== 'undefined'
  ) {
    // refresh current page
    s = findUserShipsScrollDown(u.user_id, req.query.currentFirstKey - 1, limit)
    if (s.length === 0) {
      // the only element in this page is removed
      // go to previous page
      s = findUserShipsScrollUp(u.user_id, req.query.currentFirstKey, limit)
      s.reverse()
    }
  } else {
    // default: fetch first page
    s = findUserShipsScrollDown(u.user_id, 0, limit)
  }
  const firstKey = s.length > 0 ? s[0].ship_id : undefined
  const lastKey = s.length > 0 ? s[s.length - 1].ship_id : undefined
  return res.render('vessel', {
    user: u,
    rows: s,
    firstKey: firstKey,
    lastKey: lastKey
  })
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
  const limit = 6
  let p
  if (req.query.firstKey) {
    // user pressed 'next' page button
    p = findPortsScrollDown(u.user_id, req.query.firstKey, limit)
    if (p.length === 0) {
      // no next elements available. stay on the current page
      p = findPortsScrollDown(u.user_id, req.query.currentFirstKey - 1, limit)
    }
  } else if (req.query.lastKey) {
    // user pressed 'prev' page button
    p = findPortsScrollUp(u.user_id, req.query.lastKey, limit)
    p.reverse()
    if (p.length === 0) {
      // no prev elements available. stay on the current page
      p = findPortsScrollDown(u.user_id, req.query.currentFirstKey - 1, limit)
    }
  } else if (
    req.query.currentFirstKey &&
    req.query.currentFirstKey !== 'undefined'
  ) {
    // refresh current page
    p = findPortsScrollDown(u.user_id, req.query.currentFirstKey - 1, limit)
    if (p.length === 0) {
      // the only element in this page is removed
      // go to previous page
      p = findPortsScrollUp(u.user_id, req.query.currentFirstKey, limit)
      p.reverse()
    }
  } else {
    // default: fetch first page
    p = findPortsScrollDown(u.user_id, 0, limit)
  }
  const firstKey = p.length > 0 ? p[0].region_id : undefined
  const lastKey = p.length > 0 ? p[p.length - 1].region_id : undefined

  return res.render('port', {
    user: u,
    rows: p,
    firstKey: firstKey,
    lastKey: lastKey
  })
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

const sendSpawnShip = (id, name, x, y, port1Id = -1, port2Id = -1) => {
  const buf = message.SpawnShipStruct.buffer()
  for (let i = 0; i < buf.length; i++) {
    buf[i] = 0
  }
  message.SpawnShipStruct.fields.type = 4
  message.SpawnShipStruct.fields.id = id
  message.SpawnShipStruct.fields.name = name
  message.SpawnShipStruct.fields.x = x
  message.SpawnShipStruct.fields.y = y
  message.SpawnShipStruct.fields.port1Id = port1Id
  message.SpawnShipStruct.fields.port2Id = port2Id
  seaUdpClient.send(Buffer.from(buf), 4000, 'localhost', err => {
    if (err) {
      console.error('sea udp SpawnShipStruct client error:', err)
    }
  })
}

const sendSpawnPort = (id, name, x, y) => {
  const buf = message.SpawnPortStruct.buffer()
  for (let i = 0; i < buf.length; i++) {
    buf[i] = 0
  }
  message.SpawnPortStruct.fields.type = 6
  message.SpawnPortStruct.fields.id = id
  message.SpawnPortStruct.fields.name = name
  message.SpawnPortStruct.fields.x = x
  message.SpawnPortStruct.fields.y = y
  seaUdpClient.send(Buffer.from(buf), 4000, 'localhost', err => {
    if (err) {
      console.error('sea udp SpawnShipStruct client error:', err)
    }
  })
}

app.get('/purchase_new_ship', (req, res) => {
  const u = findOrCreateUser(req.query.u || uuidv1())
  const shipName = `${raname.middle()} ${raname.middle()}`
  const shipId = createShip(u.guid, shipName)
  sendSpawnShip(shipId, u.user_name, req.get('X-Lng'), req.get('X-Lat'))
  spendGold(u.guid, 1000)
  delete userCache[u.guid]
  const uAfter = findOrCreateUser(req.query.u || uuidv1())
  res.redirect(
    url.format({
      pathname: '/vessel',
      query: {
        u: uAfter.guid,
        currentFirstKey: req.query.currentFirstKey
      }
    })
  )
})

app.get('/purchase_new_port', (req, res) => {
  const u = findOrCreateUser(req.query.u || uuidv1())
  const portName = `Port ${raname.first()}`
  const regionId = createPort(
    u.guid,
    portName,
    req.get('X-Lng'),
    req.get('X-Lat')
  )
  sendSpawnPort(regionId, portName, req.get('X-Lng'), req.get('X-Lat'))
  spendGold(u.guid, 10000)
  delete userCache[u.guid]
  const uAfter = findOrCreateUser(req.query.u || uuidv1())
  res.redirect(
    url.format({
      pathname: '/port',
      query: {
        u: uAfter.guid,
        currentFirstKey: req.query.currentFirstKey
      }
    })
  )
})

app.get('/newPortRegistered', (req, res) => {
  const u = findOrCreateUser(req.query.u || uuidv1())
  const seaports = [
    {
      name: '부산항',
      img: 'remtex/seaport-busan.png'
    },
    {
      name: '울산항',
      img: 'remtex/seaport-ulsan.png'
    },
    {
      name: '싱가포르항',
      img: 'remtex/seaport-singapore.png'
    }
  ]
  const seaport = seaports[Math.floor(Math.random() * seaports.length)]
  return res.render('testNewPort', { user: u, seaport: seaport })
})

app.get('/test*', (req, res) => {
  const u = findOrCreateUser(req.query.u || uuidv1())
  return res.render(req.url.substring(1, req.url.length), { user: u })
})

seaUdpClient.on('message', function(buf, remote) {
  if (buf[0] === 1) {
    // SpawnShipReply
    console.log(
      `SpawnShipReply from ${remote.address}:${remote.port} (len=${buf.length})`
    )
    message.SpawnShipReplyStruct._setBuff(buf)
    console.log('UDP type: ' + message.SpawnShipReplyStruct.fields.type)
    console.log('UDP ship_id: ' + message.SpawnShipReplyStruct.fields.shipId)
    console.log('UDP port1_id: ' + message.SpawnShipReplyStruct.fields.port1Id)
    console.log('UDP port2_id: ' + message.SpawnShipReplyStruct.fields.port2Id)
    const shiprouteId = createShiproute(
      message.SpawnShipReplyStruct.fields.port1Id,
      message.SpawnShipReplyStruct.fields.port2Id
    )
    setShipShiproute(message.SpawnShipReplyStruct.fields.shipId, shiprouteId)
  } else if (buf[0] === 2) {
    // RecoverAllShips
    console.log(
      `RecoverAllShips from ${remote.address}:${remote.port} (len=${
        buf.length
      })`
    )
    console.log('A new sea-server instance requested recovering.')
    console.log('Recovering in progress...')
    let count = 0
    listShipShiproute(row => {
      // console.log(row)
      sendSpawnShip(row.ship_id, '', 0, 0, row.port1_id, row.port2_id)
      count++
    })
    console.log(`Recovering Done. ${count} ship(s) recovered.`)
  } else if (buf[0] === 3) {
    // Arrival
    message.ArrivalStruct._setBuff(buf)
    // console.log(
    //   `Arrival ship id ${message.ArrivalStruct.fields.shipId} from ${
    //     remote.address
    //   }:${remote.port} (len=${buf.length})`
    // )
    const ship = findShip(message.ArrivalStruct.fields.shipId)
    if (ship) {
      earnGoldUser(ship.user_id, 1)
      const guid = findUserGuid(ship.user_id).guid
      delete userCache[guid]
    } else {
      console.error(
        `Could not find ship with id ${message.ArrivalStruct.fields.shipId}!`
      )
    }
  }
})

seaUdpClient.on('listening', () => {
  const address = seaUdpClient.address()
  console.log(`UDP server listening ${address.address}:${address.port}!`)
})

const udpPort = argv.udpport || 3003
seaUdpClient.bind(udpPort)

const port = argv.port || 3000
app.listen(port, () => {
  console.log(`TCP server listening on ${port} port!`)
})
