import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export async function initDb() {
  await sql`
    CREATE TABLE IF NOT EXISTS guests (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      pax INTEGER NOT NULL DEFAULT 1,
      invited_by VARCHAR(100) NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;
}

export async function getGuests() {
  const rows = await sql`SELECT * FROM guests ORDER BY id`;
  return rows;
}

export async function addGuest(name: string, pax: number, invitedBy: string) {
  const rows = await sql`
    INSERT INTO guests (name, pax, invited_by)
    VALUES (${name}, ${pax}, ${invitedBy})
    RETURNING *
  `;
  return rows[0];
}

export async function updateGuest(id: number, name: string, pax: number, invitedBy: string) {
  const rows = await sql`
    UPDATE guests
    SET name = ${name}, pax = ${pax}, invited_by = ${invitedBy}
    WHERE id = ${id}
    RETURNING *
  `;
  return rows[0];
}

export async function deleteGuest(id: number) {
  await sql`DELETE FROM guests WHERE id = ${id}`;
}
