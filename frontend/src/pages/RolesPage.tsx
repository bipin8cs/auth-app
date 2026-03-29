import { useState, useEffect } from 'react';
import { rolesApi, permissionsApi } from '../services/api';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Plus, Trash2, Shield, Save } from 'lucide-react';

interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
}

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [newRole, setNewRole] = useState({ name: '', description: '' });
  const [showNew, setShowNew] = useState(false);
  const [editingPerms, setEditingPerms] = useState<string | null>(null);
  const [selectedPerms, setSelectedPerms] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [rolesRes, permsRes] = await Promise.all([rolesApi.list(), permissionsApi.list()]);
      setRoles(rolesRes.data.roles);
      setAllPermissions(permsRes.data.permissions);
    } catch (err) {
      console.error('Failed to load roles', err);
    } finally {
      setLoading(false);
    }
  };

  const createRole = async () => {
    if (!newRole.name) return;
    try {
      await rolesApi.create(newRole);
      setNewRole({ name: '', description: '' });
      setShowNew(false);
      loadData();
    } catch (err) {
      console.error('Failed to create role', err);
    }
  };

  const deleteRole = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    try {
      await rolesApi.delete(id);
      loadData();
    } catch (err) {
      console.error('Failed to delete role', err);
    }
  };

  const startEditPerms = (role: Role) => {
    setEditingPerms(role.id);
    setSelectedPerms(role.permissions.map((p) => p.id));
  };

  const savePerms = async (roleId: string) => {
    try {
      await rolesApi.assignPermissions(roleId, selectedPerms);
      setEditingPerms(null);
      loadData();
    } catch (err) {
      console.error('Failed to save permissions', err);
    }
  };

  const togglePerm = (permId: string) => {
    setSelectedPerms((prev) =>
      prev.includes(permId) ? prev.filter((id) => id !== permId) : [...prev, permId]
    );
  };

  if (loading) {
    return <div className="flex items-center justify-center py-12 text-slate-500">Loading roles...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Role Management</h1>
          <p className="text-slate-500 mt-1">Manage RBAC roles and their permissions</p>
        </div>
        <Button onClick={() => setShowNew(!showNew)}>
          <Plus className="h-4 w-4 mr-2" />
          New Role
        </Button>
      </div>

      {showNew && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Create New Role</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Role Name</Label>
                <Input
                  value={newRole.name}
                  onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                  placeholder="e.g., editor"
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  value={newRole.description}
                  onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                  placeholder="Role description"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={createRole}>Create</Button>
              <Button variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {roles.map((role) => (
          <Card key={role.id}>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5" />
                <div>
                  <CardTitle className="text-lg capitalize">{role.name}</CardTitle>
                  <p className="text-sm text-slate-500">{role.description}</p>
                </div>
              </div>
              <div className="flex gap-2">
                {editingPerms === role.id ? (
                  <>
                    <Button size="sm" onClick={() => savePerms(role.id)}>
                      <Save className="h-4 w-4 mr-1" />
                      Save
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingPerms(null)}>
                      Cancel
                    </Button>
                  </>
                ) : (
                  <>
                    <Button size="sm" variant="outline" onClick={() => startEditPerms(role)}>
                      Edit Permissions
                    </Button>
                    {!['admin', 'manager', 'user'].includes(role.name) && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-500"
                        onClick={() => deleteRole(role.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1.5">
                {editingPerms === role.id
                  ? allPermissions.map((perm) => (
                      <Badge
                        key={perm.id}
                        variant={selectedPerms.includes(perm.id) ? 'default' : 'outline'}
                        className="cursor-pointer text-xs"
                        onClick={() => togglePerm(perm.id)}
                      >
                        {perm.name}
                      </Badge>
                    ))
                  : role.permissions.map((perm) => (
                      <Badge key={perm.id} variant="secondary" className="text-xs">
                        {perm.name}
                      </Badge>
                    ))}
                {!editingPerms && role.permissions.length === 0 && (
                  <span className="text-sm text-slate-400">No permissions assigned</span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
