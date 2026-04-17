'use client';
import { useState } from 'react';
import { useApp } from '@/lib/store';
import type { User, Permission, UserRole } from '@/types';

const ALL_PERMISSIONS: { key: Permission; label: string; section: string }[] = [
  { key: 'view_piscinas', label: 'Ver Piscinas', section: 'Piscinas' },
  { key: 'edit_piscinas', label: 'Editar Piscinas', section: 'Piscinas' },
  { key: 'view_contadores', label: 'Ver Contadores', section: 'Contadores' },
  { key: 'edit_contadores', label: 'Editar Contadores', section: 'Contadores' },
  { key: 'view_legionella', label: 'Ver Legionella', section: 'Legionella' },
  { key: 'edit_legionella', label: 'Editar Legionella', section: 'Legionella' },
  { key: 'view_incendios', label: 'Ver Incendios', section: 'Incendios' },
  { key: 'edit_incendios', label: 'Editar Incendios', section: 'Incendios' },
  { key: 'view_alerts', label: 'Ver Alertas', section: 'Sistema' },
  { key: 'manage_users', label: 'Gestionar Usuarios', section: 'Sistema' },
  { key: 'export_data', label: 'Exportar Datos', section: 'Sistema' },
];

const ROLE_DEFAULTS: Record<UserRole, Permission[]> = {
  admin: ALL_PERMISSIONS.map(p => p.key),
  supervisor: ['view_piscinas','view_contadores','view_legionella','view_incendios','edit_piscinas','edit_contadores','edit_legionella','edit_incendios','view_alerts','export_data'],
  operario: ['view_piscinas','view_contadores','view_legionella','view_incendios','edit_piscinas','edit_contadores','edit_legionella','edit_incendios'],
  readonly: ['view_piscinas','view_contadores','view_legionella','view_incendios'],
};

const ROLE_COLORS: Record<UserRole, string> = {
  admin: 'badge-danger', supervisor: 'badge-warning', operario: 'badge-info', readonly: 'badge-gray',
};

export default function UsuariosPage() {
  const { hasPermission, users, currentUser, updateUser, addUser, deleteUser } = useApp();
  const [editUser, setEditUser] = useState<User | null>(null);
  const [newUserOpen, setNewUserOpen] = useState(false);
  const [newForm, setNewForm] = useState({ name: '', email: '', password: '', role: 'operario' as UserRole, active: true, permissions: ROLE_DEFAULTS.operario });
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  if (!hasPermission('manage_users')) {
    return (
      <div style={{ maxWidth: '500px' }}>
        <div className="alert-banner alert-danger"><span>⛔</span> Solo los administradores pueden gestionar usuarios.</div>
      </div>
    );
  }

  const handleRoleChange = (role: UserRole) => {
    setNewForm(p => ({ ...p, role, permissions: [...ROLE_DEFAULTS[role]] }));
  };

  const handleEditRoleChange = (role: UserRole) => {
    setEditUser(p => p ? { ...p, role, permissions: [...ROLE_DEFAULTS[role]] } : null);
  };

  const togglePerm = (perm: Permission, target: 'new' | 'edit') => {
    if (target === 'new') {
      setNewForm(p => ({
        ...p,
        permissions: p.permissions.includes(perm) ? p.permissions.filter(x => x !== perm) : [...p.permissions, perm],
      }));
    } else {
      setEditUser(p => p ? {
        ...p,
        permissions: p.permissions.includes(perm) ? p.permissions.filter(x => x !== perm) : [...p.permissions, perm],
      } : null);
    }
  };

  const sections = [...new Set(ALL_PERMISSIONS.map(p => p.section))];

  const PermissionsEditor = ({ perms, onToggle }: { perms: Permission[]; onToggle: (p: Permission) => void }) => (
    <div>
      {sections.map(sec => (
        <div key={sec} style={{ marginBottom: '12px' }}>
          <p style={{ margin: '0 0 6px', fontSize: '11px', fontWeight: '700', letterSpacing: '0.05em', textTransform: 'uppercase', color: '#94a3b8' }}>{sec}</p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {ALL_PERMISSIONS.filter(p => p.section === sec).map(p => (
              <label key={p.key} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', padding: '5px 10px', borderRadius: '20px', background: perms.includes(p.key) ? '#dbeafe' : '#f1f5f9', border: `1px solid ${perms.includes(p.key) ? '#93c5fd' : '#e2eaf4'}`, fontSize: '12px', fontWeight: '500', color: perms.includes(p.key) ? '#1e40af' : '#64748b', transition: 'all 0.15s' }}>
                <input type="checkbox" checked={perms.includes(p.key)} onChange={() => onToggle(p.key)} style={{ display: 'none' }} />
                {perms.includes(p.key) ? '✓' : '○'} {p.label}
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#0f1f3d', margin: '0 0 4px' }}>👥 Gestión de Usuarios</h1>
          <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>Administra accesos y permisos del equipo</p>
        </div>
        <button className="btn btn-primary" onClick={() => setNewUserOpen(true)}>+ Nuevo usuario</button>
      </div>

      {/* Roles legend */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '20px' }}>
        <p style={{ margin: '0 0 10px', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Roles disponibles</p>
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          {(Object.keys(ROLE_DEFAULTS) as UserRole[]).map(role => (
            <div key={role} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className={`badge ${ROLE_COLORS[role]}`} style={{ textTransform: 'capitalize' }}>{role}</span>
              <span style={{ fontSize: '12px', color: '#64748b' }}>— {ROLE_DEFAULTS[role].length} permisos</span>
            </div>
          ))}
        </div>
      </div>

      {/* User cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '14px' }}>
        {users.map(user => (
          <div key={user.id} className="card" style={{ padding: '20px', opacity: user.active ? 1 : 0.6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: user.id === currentUser?.id ? '#0057a8' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: '700', color: user.id === currentUser?.id ? '#fff' : '#334155', flex: 'none' }}>
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#0f1f3d', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.name}
                  {user.id === currentUser?.id && <span style={{ marginLeft: '6px', fontSize: '10px', color: '#0057a8', fontWeight: '600' }}>(tú)</span>}
                </p>
                <p style={{ margin: 0, fontSize: '12px', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</p>
              </div>
              <span className={`badge ${ROLE_COLORS[user.role]}`} style={{ textTransform: 'capitalize', flex: 'none' }}>{user.role}</span>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <p style={{ margin: '0 0 6px', fontSize: '11px', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Permisos ({user.permissions.length})</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {user.permissions.slice(0, 6).map(p => (
                  <span key={p} style={{ fontSize: '10px', padding: '2px 6px', background: '#f1f5f9', color: '#334155', borderRadius: '4px' }}>{p.replace('_', ' ')}</span>
                ))}
                {user.permissions.length > 6 && (
                  <span style={{ fontSize: '10px', padding: '2px 6px', background: '#f1f5f9', color: '#94a3b8', borderRadius: '4px' }}>+{user.permissions.length - 6} más</span>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => updateUser({ ...user, active: !user.active })}
              >
                {user.active ? 'Desactivar' : 'Activar'}
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => setEditUser(user)}>Editar</button>
              {user.id !== currentUser?.id && (
                <button className="btn btn-danger btn-sm" onClick={() => setConfirmDelete(user.id)}>Eliminar</button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Confirm delete */}
      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="card" style={{ padding: '28px', width: '100%', maxWidth: '360px', textAlign: 'center' }}>
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>🗑</div>
            <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#0f1f3d', marginBottom: '8px' }}>¿Eliminar usuario?</h2>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px' }}>Esta acción no se puede deshacer.</p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button className="btn btn-secondary" onClick={() => setConfirmDelete(null)}>Cancelar</button>
              <button className="btn btn-danger" onClick={() => { deleteUser(confirmDelete!); setConfirmDelete(null); }}>Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="card" style={{ padding: '28px', width: '100%', maxWidth: '580px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '17px', fontWeight: '700', color: '#0f1f3d', margin: 0 }}>Editar usuario: {editUser.name}</h2>
              <button onClick={() => setEditUser(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#94a3b8' }}>×</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '5px' }}>Nombre</label>
                <input className="input-field" value={editUser.name} onChange={e => setEditUser(p => p ? { ...p, name: e.target.value } : null)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '5px' }}>Email</label>
                <input className="input-field" type="email" value={editUser.email} onChange={e => setEditUser(p => p ? { ...p, email: e.target.value } : null)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '5px' }}>Rol (aplica permisos predefinidos)</label>
                <select className="input-field" value={editUser.role} onChange={e => handleEditRoleChange(e.target.value as UserRole)}>
                  <option value="admin">Admin</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="operario">Operario</option>
                  <option value="readonly">Solo lectura</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '5px' }}>Nueva contraseña (dejar vacío para no cambiar)</label>
                <input className="input-field" type="password" placeholder="••••••••" />
              </div>
            </div>
            <div style={{ marginBottom: '20px' }}>
              <p style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: '600', color: '#0f1f3d' }}>Permisos personalizados</p>
              <PermissionsEditor perms={editUser.permissions} onToggle={p => togglePerm(p, 'edit')} />
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setEditUser(null)}>Cancelar</button>
              <button className="btn btn-primary" onClick={() => { updateUser(editUser); setEditUser(null); }}>Guardar cambios</button>
            </div>
          </div>
        </div>
      )}

      {/* New user modal */}
      {newUserOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="card" style={{ padding: '28px', width: '100%', maxWidth: '580px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '17px', fontWeight: '700', color: '#0f1f3d', margin: 0 }}>Nuevo usuario</h2>
              <button onClick={() => setNewUserOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#94a3b8' }}>×</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
              {[
                { key: 'name', label: 'Nombre completo', type: 'text' },
                { key: 'email', label: 'Email', type: 'email' },
                { key: 'password', label: 'Contraseña', type: 'password' },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '5px' }}>{f.label}</label>
                  <input className="input-field" type={f.type} value={(newForm as any)[f.key]} onChange={e => setNewForm(p => ({ ...p, [f.key]: e.target.value }))} />
                </div>
              ))}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#334155', marginBottom: '5px' }}>Rol</label>
                <select className="input-field" value={newForm.role} onChange={e => handleRoleChange(e.target.value as UserRole)}>
                  <option value="admin">Admin</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="operario">Operario</option>
                  <option value="readonly">Solo lectura</option>
                </select>
              </div>
            </div>
            <div style={{ marginBottom: '20px' }}>
              <p style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: '600', color: '#0f1f3d' }}>Permisos</p>
              <PermissionsEditor perms={newForm.permissions} onToggle={p => togglePerm(p, 'new')} />
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setNewUserOpen(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={() => {
                if (!newForm.name || !newForm.email || !newForm.password) { alert('Rellena todos los campos'); return; }
                addUser({ ...newForm, active: true });
                setNewUserOpen(false);
                setNewForm({ name: '', email: '', password: '', role: 'operario', active: true, permissions: ROLE_DEFAULTS.operario });
              }}>Crear usuario</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
