const Sqlite3 = require('better-sqlite3')
const db = new Sqlite3('ttl.db')
const fs = require('fs')

const initialize = () => {
  const schemaSql = fs.readFileSync('./ttl.schema.sqlite3.sql', 'utf8')
  db.exec(schemaSql)

  const dataSql = fs.readFileSync('./ttl.data.sqlite3.sql', 'utf8')
  db.exec(dataSql)
}

module.exports = {
  initialize
}
