'use client';

import { useState, useEffect } from 'react';

interface Guest {
  id: number;
  name: string;
  pax: number;
  invited_by: string;
}

const INVITED_BY_OPTIONS = ['Abed', 'Fanny', 'Papa', 'Mama', 'Mama Fanny'];

export default function Home() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [name, setName] = useState('');
  const [pax, setPax] = useState(1);
  const [invitedBy, setInvitedBy] = useState(INVITED_BY_OPTIONS[0]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editPax, setEditPax] = useState(1);
  const [editInvitedBy, setEditInvitedBy] = useState('');

  useEffect(() => {
    fetch('/api/guests')
      .then(res => res.json())
      .then(setGuests)
      .catch(console.error);
  }, []);

  const addGuest = async () => {
    if (!name.trim()) return;
    const res = await fetch('/api/guests', {
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
    setEditInvitedBy(guest.invited_by);
  };

  const saveEdit = async () => {
    if (!editingId || !editName.trim()) return;
    await fetch(`/api/guests/${editingId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editName.trim(), pax: editPax, invitedBy: editInvitedBy })
    });
    setGuests(guests.map(g =>
      g.id === editingId ? { ...g, name: editName.trim(), pax: editPax, invited_by: editInvitedBy } : g
    ));
    setEditingId(null);
  };

  const deleteGuest = async (id: number) => {
    await fetch(`/api/guests/${id}`, { method: 'DELETE' });
    setGuests(guests.filter(g => g.id !== id));
  };

  const totalPax = guests.reduce((sum, g) => sum + g.pax, 0);

  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-2xl font-bold text-center text-white mb-6">Daftar Undangan</h1>

      <div className="flex flex-wrap gap-2 mb-4">
        <input
          type="text"
          placeholder="Nama"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addGuest()}
          className="flex-1 min-w-[120px] px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <input
          type="number"
          min="1"
          value={pax}
          onChange={e => setPax(Number(e.target.value) || 1)}
          onKeyDown={e => e.key === 'Enter' && addGuest()}
          className="w-20 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <select
          value={invitedBy}
          onChange={e => setInvitedBy(e.target.value)}
          className="px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          {INVITED_BY_OPTIONS.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
        <button
          onClick={addGuest}
          className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors"
        >
          Tambah
        </button>
      </div>

      {guests.length > 0 && (
        <div className="flex justify-between items-center p-4 bg-gray-800 rounded-xl mb-4">
          <span className="text-gray-300">Total Tamu</span>
          <span className="text-3xl font-bold text-emerald-400">{totalPax}</span>
        </div>
      )}

      <div className="bg-gray-800 rounded-xl overflow-hidden">
        {guests.length === 0 ? (
          <div className="text-center py-10 text-gray-500">Belum ada tamu</div>
        ) : (
          guests.map(guest => (
            <div
              key={guest.id}
              className={`flex flex-wrap items-center gap-3 p-4 border-b border-gray-700 last:border-b-0 ${editingId === guest.id ? 'bg-gray-750' : ''}`}
            >
              {editingId === guest.id ? (
                <>
                  <input
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    className="flex-1 min-w-[100px] px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <input
                    type="number"
                    min="1"
                    value={editPax}
                    onChange={e => setEditPax(Number(e.target.value) || 1)}
                    className="w-16 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <select
                    value={editInvitedBy}
                    onChange={e => setEditInvitedBy(e.target.value)}
                    className="px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {INVITED_BY_OPTIONS.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <button
                      onClick={saveEdit}
                      className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded transition-colors"
                    >
                      OK
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-3 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded transition-colors"
                    >
                      X
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <span className="flex-1 text-white">{guest.name}</span>
                  <span className="px-3 py-1 bg-blue-900/50 text-blue-300 rounded-full text-sm">
                    {guest.pax} pax
                  </span>
                  <span className="px-3 py-1 bg-orange-900/50 text-orange-300 rounded-full text-sm">
                    {guest.invited_by}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => startEdit(guest)}
                      className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteGuest(guest.id)}
                      className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                    >
                      Hapus
                    </button>
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
