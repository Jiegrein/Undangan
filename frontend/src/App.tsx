import { useState, useEffect } from 'react';

interface Guest {
  id: string;
  name: string;
  pax: number;
  invitedBy: string;
}

const INVITED_BY_OPTIONS = ['Abed', 'Fanny', 'Papa', 'Mama', 'Mama Fanny'];

const API_URL = '/api/guests';

export default function App() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [name, setName] = useState('');
  const [pax, setPax] = useState(1);
  const [invitedBy, setInvitedBy] = useState(INVITED_BY_OPTIONS[0]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPax, setEditPax] = useState(1);
  const [editInvitedBy, setEditInvitedBy] = useState('');

  useEffect(() => {
    fetch(API_URL)
      .then(res => res.json())
      .then(setGuests)
      .catch(console.error);
  }, []);

  const addGuest = async () => {
    if (!name.trim()) return;
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), pax, invitedBy })
    });
    const newGuest = await res.json();
    setGuests([...guests, newGuest]);
    setName('');
    setPax(1);
  };

  const startEdit = (guest: Guest) => {
    setEditingId(guest.id);
    setEditName(guest.name);
    setEditPax(guest.pax);
    setEditInvitedBy(guest.invitedBy);
  };

  const saveEdit = async () => {
    if (!editingId || !editName.trim()) return;
    await fetch(`${API_URL}/${editingId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editName.trim(), pax: editPax, invitedBy: editInvitedBy })
    });
    setGuests(guests.map(g =>
      g.id === editingId ? { ...g, name: editName.trim(), pax: editPax, invitedBy: editInvitedBy } : g
    ));
    setEditingId(null);
  };

  const deleteGuest = async (id: string) => {
    await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
    setGuests(guests.filter(g => g.id !== id));
  };

  const totalPax = guests.reduce((sum, g) => sum + g.pax, 0);

  return (
    <div className="container">
      <h1>Daftar Undangan</h1>

      <div className="add-form">
        <input
          type="text"
          placeholder="Nama"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addGuest()}
        />
        <input
          type="number"
          min="1"
          value={pax}
          onChange={e => setPax(Number(e.target.value) || 1)}
          onKeyDown={e => e.key === 'Enter' && addGuest()}
        />
        <select value={invitedBy} onChange={e => setInvitedBy(e.target.value)}>
          {INVITED_BY_OPTIONS.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
        <button onClick={addGuest}>Tambah</button>
      </div>

      {guests.length > 0 && (
        <div className="total">
          <span>Total Tamu</span>
          <span className="total-number">{totalPax}</span>
        </div>
      )}

      <div className="guest-list">
        {guests.length === 0 ? (
          <div className="empty">Belum ada tamu</div>
        ) : (
          guests.map(guest => (
            <div key={guest.id} className={`guest-item ${editingId === guest.id ? 'editing' : ''}`}>
              {editingId === guest.id ? (
                <>
                  <input
                    className="name-input"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                  />
                  <input
                    className="pax-input"
                    type="number"
                    min="1"
                    value={editPax}
                    onChange={e => setEditPax(Number(e.target.value) || 1)}
                  />
                  <select
                    className="invitedby-select"
                    value={editInvitedBy}
                    onChange={e => setEditInvitedBy(e.target.value)}
                  >
                    {INVITED_BY_OPTIONS.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                  <div className="actions">
                    <button className="btn btn-save" onClick={saveEdit}>OK</button>
                    <button className="btn btn-cancel" onClick={() => setEditingId(null)}>X</button>
                  </div>
                </>
              ) : (
                <>
                  <span className="guest-name">{guest.name}</span>
                  <span className="guest-pax">{guest.pax} pax</span>
                  <span className="guest-invitedby">{guest.invitedBy}</span>
                  <div className="actions">
                    <button className="btn btn-edit" onClick={() => startEdit(guest)}>Edit</button>
                    <button className="btn btn-delete" onClick={() => deleteGuest(guest.id)}>Hapus</button>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>

    </div>
  );
}
