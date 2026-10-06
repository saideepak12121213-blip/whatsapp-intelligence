import React, { useState } from 'react';
import { Tag, Plus, Edit2, Trash2, Check, X, ShieldAlert, Sparkles, FolderPlus } from 'lucide-react';

export default function AdminCategoriesView({ categories, onAddCategory, onUpdateCategory, onDeleteCategory }) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [addForm, setAddForm] = useState({
    name: '',
    slug: '',
    description: '',
    color: '#6366f1',
    display_order: 1,
    icon: 'Tag'
  });

  const [editForm, setEditForm] = useState({
    name: '',
    slug: '',
    description: '',
    color: '#6366f1',
    display_order: 1
  });

  const handleStartAdd = () => {
    setAddForm({
      name: '',
      slug: '',
      description: '',
      color: '#ec4899',
      display_order: (categories?.length || 0) + 1,
      icon: 'Tag'
    });
    setIsAdding(true);
  };

  const handleSaveAdd = async (e) => {
    e.preventDefault();
    if (!addForm.name || !addForm.slug) return;
    await onAddCategory({
      ...addForm,
      slug: addForm.slug.toUpperCase()
    });
    setIsAdding(false);
  };

  const handleStartEdit = (cat) => {
    setEditingId(cat.id);
    setEditForm({
      name: cat.name,
      slug: cat.slug,
      description: cat.description || '',
      color: cat.color || '#6366f1',
      display_order: cat.display_order || 1
    });
  };

  const handleSaveEdit = async (catId) => {
    await onUpdateCategory(catId, {
      ...editForm,
      slug: editForm.slug.toUpperCase()
    });
    setEditingId(null);
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em' }}>
            Centralized Academic Categories
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Section 13: Centralized category registry. Add, rename, reorder, or update categories across all posts.
          </p>
        </div>

        <button onClick={handleStartAdd} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Plus size={16} /> Add Category
        </button>
      </div>

      {/* Add Category Drawer */}
      {isAdding && (
        <form onSubmit={handleSaveAdd} className="glass-panel" style={{
          padding: '20px',
          background: 'rgba(30, 41, 59, 0.9)',
          border: '1px solid rgba(99, 102, 241, 0.4)',
          borderRadius: '14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc' }}>Add New Academic Category</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Category Name</label>
              <input
                type="text"
                placeholder="e.g. Internships"
                value={addForm.name}
                onChange={(e) => {
                  const val = e.target.value;
                  setAddForm({
                    ...addForm,
                    name: val,
                    slug: val.toUpperCase().replace(/\s+/g, '_')
                  });
                }}
                required
                style={{ width: '100%', padding: '8px 12px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: '#fff' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Slug Code</label>
              <input
                type="text"
                placeholder="e.g. INTERNSHIP"
                value={addForm.slug}
                onChange={(e) => setAddForm({ ...addForm, slug: e.target.value.toUpperCase() })}
                required
                style={{ width: '100%', padding: '8px 12px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: '#fff' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Color</label>
              <input
                type="color"
                value={addForm.color}
                onChange={(e) => setAddForm({ ...addForm, color: e.target.value })}
                style={{ width: '100%', height: '38px', padding: '2px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-subtle)', borderRadius: '8px', cursor: 'pointer' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Display Order</label>
              <input
                type="number"
                value={addForm.display_order}
                onChange={(e) => setAddForm({ ...addForm, display_order: parseInt(e.target.value) || 1 })}
                style={{ width: '100%', padding: '8px 12px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: '#fff' }}
              />
            </div>
          </div>
          <div>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Description</label>
            <input
              type="text"
              placeholder="Short description of this academic category..."
              value={addForm.description}
              onChange={(e) => setAddForm({ ...addForm, description: e.target.value })}
              style={{ width: '100%', padding: '8px 12px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: '#fff' }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
            <button type="button" onClick={() => setIsAdding(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <Check size={14} /> Create Category
            </button>
          </div>
        </form>
      )}

      {/* Category List Table */}
      <div className="glass-panel" style={{ padding: '20px', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
              <th style={{ padding: '12px 14px' }}>Order</th>
              <th style={{ padding: '12px 14px' }}>Category Name</th>
              <th style={{ padding: '12px 14px' }}>Slug Code</th>
              <th style={{ padding: '12px 14px' }}>Badge Color</th>
              <th style={{ padding: '12px 14px' }}>Description</th>
              <th style={{ padding: '12px 14px' }}>Type</th>
              <th style={{ padding: '12px 14px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {(categories || []).map(cat => {
              const isEditing = editingId === cat.id;
              return (
                <tr key={cat.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '12px 14px', color: 'var(--text-muted)' }}>
                    {isEditing ? (
                      <input
                        type="number"
                        value={editForm.display_order}
                        onChange={(e) => setEditForm({ ...editForm, display_order: parseInt(e.target.value) || 1 })}
                        style={{ width: '60px', padding: '4px', background: '#0f172a', border: '1px solid #334155', color: '#fff', borderRadius: '4px' }}
                      />
                    ) : (
                      `#${cat.display_order || 0}`
                    )}
                  </td>
                  <td style={{ padding: '12px 14px', fontWeight: 700, color: '#f8fafc' }}>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        style={{ padding: '4px 8px', background: '#0f172a', border: '1px solid #334155', color: '#fff', borderRadius: '4px' }}
                      />
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: cat.color || '#6366f1' }} />
                        {cat.name}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.slug}
                        onChange={(e) => setEditForm({ ...editForm, slug: e.target.value.toUpperCase() })}
                        style={{ padding: '4px 8px', background: '#0f172a', border: '1px solid #334155', color: '#fff', borderRadius: '4px' }}
                      />
                    ) : (
                      <span className="badge badge-medium" style={{ fontSize: '0.74rem' }}>
                        {cat.slug}
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    {isEditing ? (
                      <input
                        type="color"
                        value={editForm.color}
                        onChange={(e) => setEditForm({ ...editForm, color: e.target.value })}
                        style={{ width: '40px', height: '28px', cursor: 'pointer' }}
                      />
                    ) : (
                      <span style={{ color: cat.color, fontWeight: 600 }}>{cat.color}</span>
                    )}
                  </td>
                  <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.description}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        style={{ width: '100%', padding: '4px 8px', background: '#0f172a', border: '1px solid #334155', color: '#fff', borderRadius: '4px' }}
                      />
                    ) : (
                      cat.description || '—'
                    )}
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ fontSize: '0.72rem', color: cat.is_system ? '#38bdf8' : '#a855f7' }}>
                      {cat.is_system ? 'System Default' : 'Custom Category'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                    {isEditing ? (
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        <button onClick={() => handleSaveEdit(cat.id)} className="btn btn-primary" style={{ padding: '4px 8px', fontSize: '0.75rem' }}>
                          <Check size={13} /> Save
                        </button>
                        <button onClick={() => setEditingId(null)} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem' }}>
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        <button onClick={() => handleStartEdit(cat)} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem' }}>
                          <Edit2 size={13} />
                        </button>
                        {!cat.is_system && (
                          <button onClick={() => onDeleteCategory(cat.id)} className="btn btn-danger" style={{ padding: '4px 8px', fontSize: '0.75rem' }}>
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
