import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export async function initDb() {
  await sql`
    CREATE TABLE IF NOT EXISTS guest_groups (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      invited_by VARCHAR(100),
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'guest_groups' AND column_name = 'invited_by'
      ) THEN
        ALTER TABLE guest_groups ADD COLUMN invited_by VARCHAR(100);
      END IF;
    END $$;
  `;

  await sql`
    UPDATE guest_groups SET invited_by = 'Abed' WHERE invited_by IS NULL
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS guests (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      pax INTEGER NOT NULL DEFAULT 1,
      invited_by VARCHAR(100) NOT NULL,
      group_id INTEGER REFERENCES guest_groups(id) ON DELETE SET NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'guests' AND column_name = 'group_id'
      ) THEN
        ALTER TABLE guests ADD COLUMN group_id INTEGER REFERENCES guest_groups(id) ON DELETE SET NULL;
      END IF;
    END $$;
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

export interface Group {
  id: number;
  name: string;
  invited_by: string | null;
  created_at: string;
}

export interface GroupWithMembers extends Group {
  members: Guest[];
  total_pax: number;
}

export interface Guest {
  id: number;
  name: string;
  pax: number;
  invited_by: string;
  group_id: number | null;
}

export async function getGroups(): Promise<GroupWithMembers[]> {
  const groups = await sql`SELECT * FROM guest_groups ORDER BY id`;
  const guests = await sql`SELECT * FROM guests WHERE group_id IS NOT NULL ORDER BY id`;

  return groups.map(group => {
    const members = guests.filter(g => g.group_id === group.id);
    return {
      ...group,
      members,
      total_pax: members.reduce((sum, m) => sum + m.pax, 0)
    } as GroupWithMembers;
  });
}

export async function createGroup(name: string, invitedBy: string | null, guestIds?: number[]): Promise<GroupWithMembers> {
  const rows = await sql`
    INSERT INTO guest_groups (name, invited_by)
    VALUES (${name}, ${invitedBy})
    RETURNING *
  `;
  const group = rows[0] as Group;

  if (guestIds && guestIds.length > 0) {
    await sql`UPDATE guests SET group_id = ${group.id} WHERE id = ANY(${guestIds})`;
  }

  const members = guestIds && guestIds.length > 0
    ? await sql`SELECT * FROM guests WHERE group_id = ${group.id} ORDER BY id`
    : [];

  return {
    ...group,
    members: members as Guest[],
    total_pax: members.reduce((sum, m) => sum + (m as Guest).pax, 0)
  };
}

export async function updateGroup(id: number, name: string): Promise<Group> {
  const rows = await sql`
    UPDATE guest_groups
    SET name = ${name}
    WHERE id = ${id}
    RETURNING *
  `;
  return rows[0] as Group;
}

export async function deleteGroup(id: number): Promise<void> {
  await sql`DELETE FROM guest_groups WHERE id = ${id}`;
}

export async function addGuestsToGroup(groupId: number, guestIds: number[]): Promise<Guest[]> {
  await sql`UPDATE guests SET group_id = ${groupId} WHERE id = ANY(${guestIds})`;
  const rows = await sql`SELECT * FROM guests WHERE group_id = ${groupId} ORDER BY id`;
  return rows as Guest[];
}

export async function removeGuestsFromGroup(guestIds: number[]): Promise<void> {
  await sql`UPDATE guests SET group_id = NULL WHERE id = ANY(${guestIds})`;
}
