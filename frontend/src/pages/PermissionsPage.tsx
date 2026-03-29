import { useState, useEffect } from 'react';
import { permissionsApi } from '../services/api';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Plus, Trash2 } from 'lucide-react';

interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: string;
}

export default function PermissionsPage() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [newPerm, setNewPerm] = useState({ name: '', description: '', resource: '', action: 'read' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await permissionsApi.list();
      setPermissions(res.data.permissions);
    } catch (err) {
      console.error('Failed to load permissions', err);
    } finally {
      setLoading(false);
    }
  };

  const createPermission = async () => {
    if (!newPerm.name || !newPerm.resource || !newPerm.action) return;
    try {
      await permissionsApi.create(newPerm);
      setNewPerm({ name: '', description: '', resource: '', action: 'read' });
      setShowNew(false);
      loadData();
    } catch (err) {
      console.error('Failed to create permission', err);
    }
  };

  const deletePermission = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    try {
      await permissionsApi.delete(id);
      loadData();
    } catch (err) {
      console.error('Failed to delete permission', err);
    }
  };

  // Group permissions by resource
  const grouped = permissions.reduce<Record<string, Permission[]>>((acc, perm) => {
    if (!acc[perm.resource]) acc[perm.resource] = [];
    acc[perm.resource].push(perm);
    return acc;
  }, {});

  if (loading) {
    return <div className="flex items-center justify-center py-12 text-slate-500">Loading permissions...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Permission Management</h1>
          <p className="text-slate-500 mt-1">Manage resource-based permissions for RBAC</p>
        </div>
        <Button onClick={() => setShowNew(!showNew)}>
          <Plus className="h-4 w-4 mr-2" />
          New Permission
        </Button>
      </div>

      {showNew && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Create New Permission</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Permission Name</Label>
                <Input
                  value={newPerm.name}
                  onChange={(e) => setNewPerm({ ...newPerm, name: e.target.value })}
                  placeholder="e.g., reports:read"
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  value={newPerm.description}
                  onChange={(e) => setNewPerm({ ...newPerm, description: e.target.value })}
                  placeholder="Permission description"
                />
              </div>
              <div className="space-y-2">
                <Label>Resource</Label>
                <Input
                  value={newPerm.resource}
                  onChange={(e) => setNewPerm({ ...newPerm, resource: e.target.value })}
                  placeholder="e.g., reports"
                />
              </div>
              <div className="space-y-2">
                <Label>Action</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-slate-200 bg-transparent px-3 py-1 text-sm shadow-sm"
                  value={newPerm.action}
                  onChange={(e) => setNewPerm({ ...newPerm, action: e.target.value })}
                >
                  <option value="create">create</option>
                  <option value="read">read</option>
                  <option value="update">update</option>
                  <option value="delete">delete</option>
                  <option value="manage">manage</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={createPermission}>Create</Button>
              <Button variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {Object.entries(grouped).map(([resource, perms]) => (
          <Card key={resource}>
            <CardHeader>
              <CardTitle className="text-lg capitalize">{resource}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {perms.map((perm) => (
                  <div key={perm.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-xs">{perm.action}</Badge>
                      <div>
                        <p className="text-sm font-medium">{perm.name}</p>
                        <p className="text-xs text-slate-500">{perm.description}</p>
                      </div>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-red-500 hover:text-red-700"
                      onClick={() => deletePermission(perm.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
