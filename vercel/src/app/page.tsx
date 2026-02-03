'use client';

import { useState, useEffect } from 'react';

interface Guest {
  id: number;
  name: string;
  pax: number;
  invited_by: string;
  group_id: number | null;
}

interface Group {
  id: number;
  name: string;
  invited_by: string | null;
  members: Guest[];
  total_pax: number;
}

const INVITED_BY_OPTIONS = ['Papa', 'Mama', 'Fanny', 'Abed', 'Mama Fanny'];

export default function Home() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [name, setName] = useState('');
  const [pax, setPax] = useState<number | ''>('');
  const [invitedBy, setInvitedBy] = useState(INVITED_BY_OPTIONS[0]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editPax, setEditPax] = useState<number | ''>('');
  const [editInvitedBy, setEditInvitedBy] = useState('');

  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedGuestIds, setSelectedGuestIds] = useState<Set<number>>(new Set());
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [editingGroupId, setEditingGroupId] = useState<number | null>(null);
  const [editGroupName, setEditGroupName] = useState('');
  const [collapsedGroups, setCollapsedGroups] = useState<Set<number>>(new Set());
  const [collapsedInvitedBy, setCollapsedInvitedBy] = useState<Set<string>>(new Set());
  const [showAddToGroupModal, setShowAddToGroupModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [guestsRes, groupsRes] = await Promise.all([
      fetch('/api/guests'),
      fetch('/api/groups')
    ]);
    const [guestsData, groupsData] = await Promise.all([
      guestsRes.json(),
      groupsRes.json()
    ]);
    setGuests(guestsData);
    setGroups(groupsData);
    setCollapsedGroups(new Set(groupsData.map((g: Group) => g.id)));
  };

  const addGuest = async () => {
    if (!name.trim()) return;
    const finalPax = pax === '' || pax < 1 ? 1 : pax;
    const res = await fetch('/api/guests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), pax: finalPax, invitedBy })
    });
    const newGuest = await res.json();
    setGuests([...guests, newGuest]);
    setName('');
    setPax('');
  };

  const startEdit = (guest: Guest) => {
    setEditingId(guest.id);
    setEditName(guest.name);
    setEditPax(guest.pax);
    setEditInvitedBy(guest.invited_by);
  };

  const handlePaxChange = (value: string, setter: (val: number | '') => void) => {
    if (value === '') {
      setter('');
    } else {
      const num = parseInt(value, 10);
      setter(isNaN(num) ? '' : num);
    }
  };

  const saveEdit = async () => {
    if (!editingId || !editName.trim()) return;
    const finalPax = editPax === '' || editPax < 1 ? 1 : editPax;
    await fetch(`/api/guests/${editingId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editName.trim(), pax: finalPax, invitedBy: editInvitedBy })
    });
    setGuests(guests.map(g =>
      g.id === editingId ? { ...g, name: editName.trim(), pax: finalPax, invited_by: editInvitedBy } : g
    ));
    setGroups(groups.map(group => ({
      ...group,
      members: group.members.map(m =>
        m.id === editingId ? { ...m, name: editName.trim(), pax: finalPax, invited_by: editInvitedBy } : m
      ),
      total_pax: group.members.reduce((sum, m) =>
        sum + (m.id === editingId ? finalPax : m.pax), 0
      )
    })));
    setEditingId(null);
  };

  const handleDeleteGuest = async (id: number) => {
    await fetch(`/api/guests/${id}`, { method: 'DELETE' });
    setGuests(guests.filter(g => g.id !== id));
    setGroups(groups.map(group => {
      const newMembers = group.members.filter(m => m.id !== id);
      return {
        ...group,
        members: newMembers,
        total_pax: newMembers.reduce((sum, m) => sum + m.pax, 0)
      };
    }).filter(g => g.members.length > 0));
  };

  const toggleSelection = (id: number) => {
    const newSelected = new Set(selectedGuestIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedGuestIds(newSelected);
  };

  const cancelSelection = () => {
    setIsSelectionMode(false);
    setSelectedGuestIds(new Set());
  };

  const createGroup = async () => {
    if (!newGroupName.trim() || selectedGuestIds.size === 0) return;

    const selectedGuests = guests.filter(g => selectedGuestIds.has(g.id));
    const inviters = [...new Set(selectedGuests.map(g => g.invited_by))];

    if (inviters.length > 1) {
      alert('Semua tamu dalam satu grup harus dari pengundang yang sama!');
      return;
    }

    const groupInvitedBy = inviters[0];

    const res = await fetch('/api/groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newGroupName.trim(), invitedBy: groupInvitedBy, guestIds: Array.from(selectedGuestIds) })
    });
    const newGroup = await res.json();
    setGroups([...groups, newGroup]);
    setCollapsedGroups(new Set([...Array.from(collapsedGroups), newGroup.id]));
    setGuests(guests.map(g =>
      selectedGuestIds.has(g.id) ? { ...g, group_id: newGroup.id } : g
    ));
    setShowGroupModal(false);
    setNewGroupName('');
    cancelSelection();
  };

  const addToExistingGroup = async (groupId: number) => {
    if (selectedGuestIds.size === 0) return;

    const targetGroup = groups.find(g => g.id === groupId);
    const selectedGuests = guests.filter(g => selectedGuestIds.has(g.id));
    const selectedInviters = [...new Set(selectedGuests.map(g => g.invited_by))];

    if (targetGroup?.invited_by && selectedInviters.some(inv => inv !== targetGroup.invited_by)) {
      alert('Tamu harus dari pengundang yang sama dengan grup!');
      return;
    }

    const res = await fetch(`/api/groups/${groupId}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guestIds: Array.from(selectedGuestIds) })
    });
    const updatedMembers = await res.json();

    setGroups(groups.map(g => {
      if (g.id === groupId) {
        return {
          ...g,
          members: updatedMembers,
          total_pax: updatedMembers.reduce((sum: number, m: Guest) => sum + m.pax, 0)
        };
      }
      return g;
    }));
    setGuests(guests.map(g =>
      selectedGuestIds.has(g.id) ? { ...g, group_id: groupId } : g
    ));
    setShowAddToGroupModal(false);
    cancelSelection();
  };

  const startEditGroup = (group: Group) => {
    setEditingGroupId(group.id);
    setEditGroupName(group.name);
  };

  const saveGroupEdit = async () => {
    if (!editingGroupId || !editGroupName.trim()) return;
    await fetch(`/api/groups/${editingGroupId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editGroupName.trim() })
    });
    setGroups(groups.map(g =>
      g.id === editingGroupId ? { ...g, name: editGroupName.trim() } : g
    ));
    setEditingGroupId(null);
  };

  const deleteGroup = async (id: number) => {
    const group = groups.find(g => g.id === id);
    await fetch(`/api/groups/${id}`, { method: 'DELETE' });
    setGroups(groups.filter(g => g.id !== id));
    if (group) {
      setGuests(guests.map(g =>
        group.members.some(m => m.id === g.id) ? { ...g, group_id: null } : g
      ));
    }
  };

  const toggleGroupCollapse = (groupId: number) => {
    const newCollapsed = new Set(collapsedGroups);
    if (newCollapsed.has(groupId)) {
      newCollapsed.delete(groupId);
    } else {
      newCollapsed.add(groupId);
    }
    setCollapsedGroups(newCollapsed);
  };

  const toggleInvitedByCollapse = (invitedBy: string) => {
    const newCollapsed = new Set(collapsedInvitedBy);
    if (newCollapsed.has(invitedBy)) {
      newCollapsed.delete(invitedBy);
    } else {
      newCollapsed.add(invitedBy);
    }
    setCollapsedInvitedBy(newCollapsed);
  };

  const removeFromGroup = async (guestId: number) => {
    await fetch(`/api/groups/0/members`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guestIds: [guestId] })
    });
    setGuests(guests.map(g => g.id === guestId ? { ...g, group_id: null } : g));
    setGroups(groups.map(group => {
      const newMembers = group.members.filter(m => m.id !== guestId);
      return {
        ...group,
        members: newMembers,
        total_pax: newMembers.reduce((sum, m) => sum + m.pax, 0)
      };
    }).filter(g => g.members.length > 0));
  };

  const ungroupedGuests = guests.filter(g => g.group_id === null);
  const totalPax = guests.reduce((sum, g) => sum + g.pax, 0);

  const renderGuestRow = (guest: Guest, inGroup = false) => (
    <div
      key={guest.id}
      className={`flex flex-wrap items-center gap-2 p-3 border-b border-gray-700 last:border-b-0 ${editingId === guest.id ? 'bg-gray-750' : ''}`}
    >
      {isSelectionMode && !inGroup && (
        <input
          type="checkbox"
          checked={selectedGuestIds.has(guest.id)}
          onChange={() => toggleSelection(guest.id)}
          className="w-5 h-5 accent-emerald-500 flex-shrink-0"
        />
      )}
      {editingId === guest.id ? (
        <div className="flex flex-wrap items-center gap-2 w-full">
          <input
            value={editName}
            onChange={e => setEditName(e.target.value)}
            className="flex-1 min-w-[80px] px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <input
            type="number"
            value={editPax}
            onChange={e => handlePaxChange(e.target.value, setEditPax)}
            placeholder="1"
            className="w-14 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <select
            value={editInvitedBy}
            onChange={e => setEditInvitedBy(e.target.value)}
            className="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {INVITED_BY_OPTIONS.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          <div className="flex gap-1">
            <button
              onClick={saveEdit}
              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded transition-colors text-sm"
            >
              OK
            </button>
            <button
              onClick={() => setEditingId(null)}
              className="px-2 py-1 bg-gray-600 hover:bg-gray-500 text-white rounded transition-colors text-sm"
            >
              X
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2 w-full">
          <span className="text-white min-w-0 flex-1 truncate">{guest.name}</span>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="px-2 py-1 bg-blue-900/50 text-blue-300 rounded-full text-xs">
              {guest.pax} pax
            </span>
            <span className="px-2 py-1 bg-orange-900/50 text-orange-300 rounded-full text-xs">
              {guest.invited_by}
            </span>
          </div>
          <div className="flex gap-1 flex-shrink-0">
            {inGroup && (
              <button
                onClick={() => removeFromGroup(guest.id)}
                className="px-2 py-1 bg-yellow-600 hover:bg-yellow-700 text-white rounded transition-colors text-sm"
                title="Keluarkan dari grup"
              >
                X
              </button>
            )}
            <button
              onClick={() => startEdit(guest)}
              className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors text-sm"
            >
              Edit
            </button>
            <button
              onClick={() => handleDeleteGuest(guest.id)}
              className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded transition-colors text-sm"
            >
              Hapus
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const renderGroupTree = (group: Group, nested = false) => {
    const members = group.members;
    const isCollapsed = searchQuery.trim() ? false : collapsedGroups.has(group.id);

    return (
      <div key={group.id} className={`bg-gray-800 rounded-xl overflow-hidden ${nested ? 'mb-2' : 'mb-4'}`}>
        <div
          className={`flex items-center justify-between p-3 border-b border-gray-700 ${nested ? 'bg-gray-700' : 'bg-gray-750'} cursor-pointer`}
          onClick={() => editingGroupId !== group.id && toggleGroupCollapse(group.id)}
        >
          {editingGroupId === group.id ? (
            <div className="flex items-center gap-2 flex-1" onClick={e => e.stopPropagation()}>
              <input
                value={editGroupName}
                onChange={e => setEditGroupName(e.target.value)}
                className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                onClick={saveGroupEdit}
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded transition-colors"
              >
                OK
              </button>
              <button
                onClick={() => setEditingGroupId(null)}
                className="px-3 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded transition-colors"
              >
                X
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2 w-full">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className={`text-gray-400 transition-transform flex-shrink-0 ${isCollapsed ? '' : 'rotate-90'}`}>
                  ▶
                </span>
                <span className="font-semibold text-white truncate">{group.name}</span>
                <span className="text-gray-400 text-sm flex-shrink-0">({members.length})</span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0" onClick={e => e.stopPropagation()}>
                <span className="px-2 py-1 bg-emerald-900/50 text-emerald-300 rounded-full text-xs">
                  {group.total_pax} pax
                </span>
                <button
                  onClick={() => startEditGroup(group)}
                  className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors text-sm"
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteGroup(group.id)}
                  className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded transition-colors text-sm"
                >
                  Hapus
                </button>
              </div>
            </div>
          )}
        </div>
        {!isCollapsed && (
          <div>
            {members.map(member => renderGuestRow(member, true))}
          </div>
        )}
      </div>
    );
  };

  const renderInvitedBySection = (inviter: string) => {
    const query = searchQuery.toLowerCase().trim();

    const inviterGroups = groups
      .filter(g => g.invited_by === inviter)
      .map(g => ({
        ...g,
        members: query
          ? g.members.filter(m => m.name.toLowerCase().includes(query))
          : g.members
      }))
      .filter(g => !query || g.members.length > 0 || g.name.toLowerCase().includes(query));

    const inviterUngroupedGuests = ungroupedGuests.filter(
      g => g.invited_by === inviter && (!query || g.name.toLowerCase().includes(query))
    );

    const totalInviterPax =
      inviterGroups.reduce((sum, g) => sum + g.members.reduce((s, m) => s + m.pax, 0), 0) +
      inviterUngroupedGuests.reduce((sum, g) => sum + g.pax, 0);

    if (inviterGroups.length === 0 && inviterUngroupedGuests.length === 0) {
      return null;
    }

    const isCollapsed = query ? false : collapsedInvitedBy.has(inviter);

    return (
      <div key={inviter} className="mb-4">
        <div
          className="flex items-center justify-between p-4 bg-gray-800 rounded-xl cursor-pointer"
          onClick={() => toggleInvitedByCollapse(inviter)}
        >
          <div className="flex items-center gap-2">
            <span className={`text-gray-400 transition-transform ${isCollapsed ? '' : 'rotate-90'}`}>
              ▶
            </span>
            <span className="text-lg font-semibold text-white">{inviter}</span>
          </div>
          <span className="px-3 py-1 bg-emerald-900/50 text-emerald-300 rounded-full text-sm font-medium">
            {totalInviterPax} pax
          </span>
        </div>

        {!isCollapsed && (
          <div className="mt-2 ml-4 space-y-2">
            {inviterGroups.map(group => renderGroupTree(group, true))}

            {inviterUngroupedGuests.length > 0 && (
              <div className="bg-gray-800 rounded-xl overflow-hidden">
                <div className="px-4 py-2 bg-gray-750 border-b border-gray-700">
                  <span className="text-sm text-gray-400">Tamu Lainnya</span>
                </div>
                {inviterUngroupedGuests.map(guest => renderGuestRow(guest))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

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
          value={pax}
          onChange={e => handlePaxChange(e.target.value, setPax)}
          onKeyDown={e => e.key === 'Enter' && addGuest()}
          placeholder="1"
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

      {guests.length > 0 && (
        <input
          type="text"
          placeholder="Cari nama..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 mb-4"
        />
      )}

      {guests.length > 0 && (
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-300">Daftar Tamu</h2>
          {ungroupedGuests.length > 0 && (
            <button
              onClick={() => isSelectionMode ? cancelSelection() : setIsSelectionMode(true)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                isSelectionMode
                  ? 'bg-gray-600 hover:bg-gray-500 text-white'
                  : 'bg-purple-600 hover:bg-purple-700 text-white'
              }`}
            >
              {isSelectionMode ? 'Batal' : 'Pilih'}
            </button>
          )}
        </div>
      )}

      {guests.length === 0 ? (
        <div className="bg-gray-800 rounded-xl overflow-hidden">
          <div className="text-center py-10 text-gray-500">
            Belum ada tamu
          </div>
        </div>
      ) : (
        INVITED_BY_OPTIONS.map(inviter => renderInvitedBySection(inviter))
      )}

      {isSelectionMode && selectedGuestIds.size > 0 && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-900 border border-gray-700 rounded-xl p-4 shadow-xl flex items-center gap-4">
          <span className="text-white">{selectedGuestIds.size} dipilih</span>
          <button
            onClick={() => setShowGroupModal(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
          >
            Buat Grup
          </button>
          {groups.length > 0 && (
            <button
              onClick={() => setShowAddToGroupModal(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Tambah ke Grup
            </button>
          )}
          <button
            onClick={cancelSelection}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
          >
            Batal
          </button>
        </div>
      )}

      {showGroupModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-sm">
            <h3 className="text-xl font-semibold text-white mb-4">Buat Grup Baru</h3>
            <input
              type="text"
              placeholder="Nama grup"
              value={newGroupName}
              onChange={e => setNewGroupName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && createGroup()}
              autoFocus
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={createGroup}
                disabled={!newGroupName.trim()}
                className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
              >
                Buat
              </button>
              <button
                onClick={() => {
                  setShowGroupModal(false);
                  setNewGroupName('');
                }}
                className="flex-1 px-4 py-3 bg-gray-600 hover:bg-gray-500 text-white font-medium rounded-lg transition-colors"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddToGroupModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-sm">
            <h3 className="text-xl font-semibold text-white mb-4">Pilih Grup</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {groups.map(group => (
                <button
                  key={group.id}
                  onClick={() => addToExistingGroup(group.id)}
                  className="w-full px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-left flex justify-between items-center"
                >
                  <span>{group.name}</span>
                  <span className="text-gray-400 text-sm">{group.members.length} anggota</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowAddToGroupModal(false)}
              className="w-full mt-4 px-4 py-3 bg-gray-600 hover:bg-gray-500 text-white font-medium rounded-lg transition-colors"
            >
              Batal
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
