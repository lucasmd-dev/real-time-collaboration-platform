import fs from 'fs'
import path from 'path'
import { db } from '../config/database'
import { logger } from '../shared/logger'

async function migrate() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      run_at TIMESTAMPTZ DEFAULT NOW()
    )
  `)

  const migrationsDir = path.join(__dirname, 'migrations')
  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort()

  const { rows: ran } = await db.query('SELECT name FROM migrations')
  const ranSet = new Set(ran.map((r: { name: string }) => r.name))

  for (const file of files) {
    if (ranSet.has(file)) continue

    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8')
    await db.query('BEGIN')
    try {
      await db.query(sql)
      await db.query('INSERT INTO migrations (name) VALUES ($1)', [file])
      await db.query('COMMIT')
      logger.info(`Migration applied: ${file}`)
    } catch (err) {
      await db.query('ROLLBACK')
      throw err
    }
  }

  logger.info('All migrations up to date')
  await db.end()
}

migrate().catch((err) => {
  logger.error({ err }, 'Migration failed')
  process.exit(1)
})
