import { db } from '../../config/database'

export async function findAccessibleByUser(userId: string, page: number, limit: number) {
  const offset = (page - 1) * limit
  const { rows } = await db.query(
    `SELECT DISTINCT d.id, d.title, d.owner_id, d.created_at, d.updated_at,
            CASE WHEN d.owner_id = $1 THEN 'owner' ELSE 'editor' END AS role
     FROM documents d
     LEFT JOIN document_collaborators dc ON dc.document_id = d.id
     WHERE d.owner_id = $1 OR dc.user_id = $1
     ORDER BY updated_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset],
  )

  const { rows: countRows } = await db.query(
    `SELECT COUNT(DISTINCT d.id)
     FROM documents d
     LEFT JOIN document_collaborators dc ON dc.document_id = d.id
     WHERE d.owner_id = $1 OR dc.user_id = $1`,
    [userId],
  )

  return { rows, total: parseInt(countRows[0].count, 10) }
}

export async function findById(id: string) {
  const { rows } = await db.query(
    'SELECT id, title, owner_id, ydoc_state, created_at, updated_at FROM documents WHERE id = $1',
    [id],
  )
  return rows[0] || null
}

export async function findAccessibleById(id: string, userId: string) {
  const { rows } = await db.query(
    `SELECT DISTINCT d.id, d.title, d.owner_id, d.ydoc_state, d.created_at, d.updated_at,
            CASE WHEN d.owner_id = $2 THEN 'owner' ELSE 'editor' END AS role
     FROM documents d
     LEFT JOIN document_collaborators dc ON dc.document_id = d.id
     WHERE d.id = $1
       AND (d.owner_id = $2 OR dc.user_id = $2)`,
    [id, userId],
  )

  return rows[0] || null
}

export async function create(ownerId: string, title = 'Sem título') {
  const { rows } = await db.query(
    `INSERT INTO documents (owner_id, title)
     VALUES ($1, $2)
     RETURNING id, title, owner_id, created_at, updated_at, 'owner' AS role`,
    [ownerId, title],
  )
  return rows[0]
}

export async function updateTitle(id: string, title: string) {
  const { rows } = await db.query(
    'UPDATE documents SET title = $1, updated_at = NOW() WHERE id = $2 RETURNING id, title, updated_at',
    [title, id],
  )
  return rows[0] || null
}

export async function updateYdocState(id: string, state: Uint8Array) {
  await db.query(
    'UPDATE documents SET ydoc_state = $1, updated_at = NOW() WHERE id = $2',
    [Buffer.from(state), id],
  )
}

export async function remove(id: string) {
  await db.query('DELETE FROM documents WHERE id = $1', [id])
}

export async function findUserByEmail(email: string) {
  const { rows } = await db.query(
    'SELECT id, name, email FROM users WHERE LOWER(email) = LOWER($1)',
    [email],
  )

  return rows[0] || null
}

export async function listCollaborators(documentId: string) {
  const { rows } = await db.query(
    `SELECT u.id, u.name, u.email, 'owner' AS role
     FROM documents d
     JOIN users u ON u.id = d.owner_id
     WHERE d.id = $1

     UNION ALL

     SELECT u.id, u.name, u.email, 'editor' AS role
     FROM document_collaborators dc
     JOIN users u ON u.id = dc.user_id
     WHERE dc.document_id = $1
     ORDER BY role DESC, name ASC`,
    [documentId],
  )

  return rows
}

export async function addCollaborator(documentId: string, userId: string, createdBy: string) {
  await db.query(
    `INSERT INTO document_collaborators (document_id, user_id, created_by)
     VALUES ($1, $2, $3)
     ON CONFLICT (document_id, user_id) DO NOTHING`,
    [documentId, userId, createdBy],
  )
}

export async function removeCollaborator(documentId: string, userId: string) {
  const { rowCount } = await db.query(
    'DELETE FROM document_collaborators WHERE document_id = $1 AND user_id = $2',
    [documentId, userId],
  )

  return (rowCount ?? 0) > 0
}
