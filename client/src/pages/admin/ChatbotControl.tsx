import React, { useState, useMemo } from 'react';
import {
  MessageCircle, Plus, Trash2, Save, Edit2, X, Check,
  ToggleLeft, ToggleRight, Search, Tag
} from 'lucide-react';
import { useMaintenanceStore } from '../../stores/maintenanceStore';
import type { ChatbotKnowledgeEntry } from '../../types/admin';

export function ChatbotControl() {
  const knowledge = useMaintenanceStore((s) => s.chatbotKnowledge);
  const addEntry = useMaintenanceStore((s) => s.addKnowledgeEntry);
  const updateEntry = useMaintenanceStore((s) => s.updateKnowledgeEntry);
  const removeEntry = useMaintenanceStore((s) => s.removeKnowledgeEntry);

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ category: '', keywords: '', response: '' });
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ category: '', keywords: '', response: '' });

  const categories = useMemo(() => {
    const cats = new Set(knowledge.map((k) => k.category));
    return ['all', ...Array.from(cats).sort()];
  }, [knowledge]);

  const filtered = useMemo(() => {
    let result = knowledge;
    if (categoryFilter !== 'all') result = result.filter((k) => k.category === categoryFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (k) =>
          k.category.toLowerCase().includes(q) ||
          k.keywords.some((kw) => kw.toLowerCase().includes(q)) ||
          k.response.toLowerCase().includes(q)
      );
    }
    return result;
  }, [knowledge, categoryFilter, search]);

  const stats = useMemo(() => ({
    total: knowledge.length,
    active: knowledge.filter((k) => k.active).length,
    inactive: knowledge.filter((k) => !k.active).length,
    categories: new Set(knowledge.map((k) => k.category)).size,
  }), [knowledge]);

  const startEdit = (entry: ChatbotKnowledgeEntry) => {
    setEditingId(entry.id);
    setEditForm({
      category: entry.category,
      keywords: entry.keywords.join(', '),
      response: entry.response,
    });
  };

  const saveEdit = () => {
    if (!editingId) return;
    updateEntry(editingId, {
      category: editForm.category.trim(),
      keywords: editForm.keywords.split(',').map((k) => k.trim()).filter(Boolean),
      response: editForm.response.trim(),
    });
    setEditingId(null);
  };

  const handleAdd = () => {
    if (!addForm.category.trim() || !addForm.response.trim()) return;
    addEntry({
      category: addForm.category.trim(),
      keywords: addForm.keywords.split(',').map((k) => k.trim()).filter(Boolean),
      response: addForm.response.trim(),
      active: true,
    });
    setAddForm({ category: '', keywords: '', response: '' });
    setShowAdd(false);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <MessageCircle size={28} className="text-blue-400" />
            <h2 className="text-4xl font-bold uppercase tracking-tight text-white">
              Chatbot Control
            </h2>
          </div>
          <p className="text-sm font-semibold text-gray-400">
            KNOWLEDGE BASE • {stats.total} ENTRIES ACROSS {stats.categories} CATEGORIES
          </p>
        </div>
        <button
          onClick={() => setShowAdd((prev) => !prev)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase transition-colors"
        >
          <Plus size={16} />
          Add Entry
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Entries', value: stats.total, color: 'text-white' },
          { label: 'Active', value: stats.active, color: 'text-green-400' },
          { label: 'Inactive', value: stats.inactive, color: 'text-gray-400' },
          { label: 'Categories', value: stats.categories, color: 'text-blue-400' },
        ].map((s) => (
          <div key={s.label} className="bg-gray-800 border border-gray-700 rounded-xl p-4 text-center">
            <p className="text-xs font-bold uppercase text-gray-400 mb-1">{s.label}</p>
            <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Add Form */}
      {showAdd && (
        <div className="bg-gray-800 border border-blue-400/30 rounded-xl p-6 space-y-4">
          <h3 className="text-sm font-bold uppercase text-blue-400">New Knowledge Entry</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Category</label>
              <input
                value={addForm.category}
                onChange={(e) => setAddForm((f) => ({ ...f, category: e.target.value }))}
                placeholder="e.g. Safety Tips"
                className="w-full bg-gray-900 border border-gray-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-blue-400"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Keywords (comma-separated)</label>
              <input
                value={addForm.keywords}
                onChange={(e) => setAddForm((f) => ({ ...f, keywords: e.target.value }))}
                placeholder="e.g. safe, help, guide"
                className="w-full bg-gray-900 border border-gray-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-blue-400"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Response</label>
            <textarea
              value={addForm.response}
              onChange={(e) => setAddForm((f) => ({ ...f, response: e.target.value }))}
              rows={3}
              placeholder="The response the chatbot will give when keywords match..."
              className="w-full bg-gray-900 border border-gray-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-blue-400 resize-y"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleAdd}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase transition-colors"
            >
              <Check size={14} /> Save Entry
            </button>
            <button
              onClick={() => { setShowAdd(false); setAddForm({ category: '', keywords: '', response: '' }); }}
              className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-gray-300 px-4 py-2 rounded-lg text-xs font-bold uppercase transition-colors"
            >
              <X size={14} /> Cancel
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by category, keyword, or response text..."
            className="w-full bg-gray-800 border border-gray-700 text-white pl-10 pr-4 py-3 rounded-lg text-sm focus:outline-none focus:border-blue-400"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategoryFilter(c)}
              className={`px-3 py-2 text-xs font-bold uppercase rounded-lg transition-colors ${
                categoryFilter === c ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Knowledge Entries */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-500 text-sm font-semibold uppercase">
            No knowledge entries match the current filters
          </div>
        )}
        {filtered.map((entry) => {
          const isEditing = editingId === entry.id;
          return (
            <div
              key={entry.id}
              className={`bg-gray-800 border rounded-xl overflow-hidden transition-colors ${
                entry.active ? 'border-gray-700' : 'border-gray-700/50 opacity-60'
              }`}
            >
              {isEditing ? (
                /* Edit mode */
                <div className="p-4 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Category</label>
                      <input
                        value={editForm.category}
                        onChange={(e) => setEditForm((f) => ({ ...f, category: e.target.value }))}
                        className="w-full bg-gray-900 border border-gray-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-blue-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Keywords</label>
                      <input
                        value={editForm.keywords}
                        onChange={(e) => setEditForm((f) => ({ ...f, keywords: e.target.value }))}
                        className="w-full bg-gray-900 border border-gray-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-blue-400"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Response</label>
                    <textarea
                      value={editForm.response}
                      onChange={(e) => setEditForm((f) => ({ ...f, response: e.target.value }))}
                      rows={3}
                      className="w-full bg-gray-900 border border-gray-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-blue-400 resize-y"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={saveEdit} className="flex items-center gap-1 bg-green-600 hover:bg-green-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-colors">
                      <Save size={12} /> Save
                    </button>
                    <button onClick={() => setEditingId(null)} className="flex items-center gap-1 bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-colors">
                      <X size={12} /> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                /* View mode */
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold uppercase text-blue-400 bg-blue-600/20 px-2 py-0.5 rounded">
                          {entry.category}
                        </span>
                        <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${
                          entry.active ? 'bg-green-600/20 text-green-400' : 'bg-gray-700 text-gray-500'
                        }`}>
                          {entry.active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 mt-2 flex-wrap">
                        <Tag size={12} className="text-gray-500" />
                        {entry.keywords.map((kw) => (
                          <span key={kw} className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded">
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-4">
                      <button
                        onClick={() => updateEntry(entry.id, { active: !entry.active })}
                        className="text-gray-400 hover:text-white transition-colors"
                        title={entry.active ? 'Deactivate' : 'Activate'}
                      >
                        {entry.active ? <ToggleRight size={20} className="text-green-400" /> : <ToggleLeft size={20} />}
                      </button>
                      <button onClick={() => startEdit(entry)} className="text-gray-400 hover:text-blue-400 transition-colors" title="Edit">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => removeEntry(entry.id)} className="text-gray-400 hover:text-red-400 transition-colors" title="Remove">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-300 leading-relaxed">{entry.response}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
