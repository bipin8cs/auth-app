import { useState, useEffect } from 'react';
import { policiesApi } from '../services/api';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Plus, Trash2, Edit, Save, X } from 'lucide-react';

interface Policy {
  id: string;
  name: string;
  description: string;
  effect: 'allow' | 'deny';
  resource: string;
  action: string;
  conditions: Record<string, unknown>;
  isActive: boolean;
}

export default function PoliciesPage() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newPolicy, setNewPolicy] = useState({
    name: '',
    description: '',
    effect: 'allow',
    resource: '',
    action: '',
    conditions: '{}',
    isActive: true,
  });
  const [editPolicy, setEditPolicy] = useState({
    name: '',
    description: '',
    effect: 'allow',
    resource: '',
    action: '',
    conditions: '{}',
    isActive: true,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await policiesApi.list();
      setPolicies(res.data.policies);
    } catch (err) {
      console.error('Failed to load policies', err);
    } finally {
      setLoading(false);
    }
  };

  const createPolicy = async () => {
    if (!newPolicy.name || !newPolicy.resource || !newPolicy.action) return;
    try {
      const data = {
        ...newPolicy,
        conditions: JSON.parse(newPolicy.conditions),
      };
      await policiesApi.create(data);
      setNewPolicy({ name: '', description: '', effect: 'allow', resource: '', action: '', conditions: '{}', isActive: true });
      setShowNew(false);
      loadData();
    } catch (err) {
      console.error('Failed to create policy', err);
    }
  };

  const startEdit = (policy: Policy) => {
    setEditingId(policy.id);
    setEditPolicy({
      name: policy.name,
      description: policy.description || '',
      effect: policy.effect,
      resource: policy.resource,
      action: policy.action,
      conditions: JSON.stringify(policy.conditions, null, 2),
      isActive: policy.isActive,
    });
  };

  const saveEdit = async (id: string) => {
    try {
      const data = {
        ...editPolicy,
        conditions: JSON.parse(editPolicy.conditions),
      };
      await policiesApi.update(id, data);
      setEditingId(null);
      loadData();
    } catch (err) {
      console.error('Failed to update policy', err);
    }
  };

  const deletePolicy = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    try {
      await policiesApi.delete(id);
      loadData();
    } catch (err) {
      console.error('Failed to delete policy', err);
    }
  };

  const toggleActive = async (policy: Policy) => {
    try {
      await policiesApi.update(policy.id, { isActive: !policy.isActive });
      loadData();
    } catch (err) {
      console.error('Failed to toggle policy', err);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-12 text-slate-500">Loading policies...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">ABAC Policy Management</h1>
          <p className="text-slate-500 mt-1">
            Manage attribute-based access control policies with conditions
          </p>
        </div>
        <Button onClick={() => setShowNew(!showNew)}>
          <Plus className="h-4 w-4 mr-2" />
          New Policy
        </Button>
      </div>

      {showNew && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Create New ABAC Policy</CardTitle>
            <CardDescription>
              Define conditions based on user attributes, resource attributes, and environment
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Policy Name</Label>
                <Input
                  value={newPolicy.name}
                  onChange={(e) => setNewPolicy({ ...newPolicy, name: e.target.value })}
                  placeholder="e.g., Weekend access restriction"
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  value={newPolicy.description}
                  onChange={(e) => setNewPolicy({ ...newPolicy, description: e.target.value })}
                  placeholder="Policy description"
                />
              </div>
              <div className="space-y-2">
                <Label>Effect</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-slate-200 bg-transparent px-3 py-1 text-sm shadow-sm"
                  value={newPolicy.effect}
                  onChange={(e) => setNewPolicy({ ...newPolicy, effect: e.target.value })}
                >
                  <option value="allow">Allow</option>
                  <option value="deny">Deny</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Resource</Label>
                <Input
                  value={newPolicy.resource}
                  onChange={(e) => setNewPolicy({ ...newPolicy, resource: e.target.value })}
                  placeholder="e.g., users, reports, *"
                />
              </div>
              <div className="space-y-2">
                <Label>Action</Label>
                <Input
                  value={newPolicy.action}
                  onChange={(e) => setNewPolicy({ ...newPolicy, action: e.target.value })}
                  placeholder="e.g., read, update, manage, *"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Conditions (JSON)</Label>
              <textarea
                className="flex w-full rounded-md border border-slate-200 bg-transparent px-3 py-2 text-sm shadow-sm font-mono min-h-24"
                value={newPolicy.conditions}
                onChange={(e) => setNewPolicy({ ...newPolicy, conditions: e.target.value })}
                placeholder='{"user.department": "Engineering", "environment.hour": {"$gte": 9}}'
              />
              <p className="text-xs text-slate-500">
                Supported operators: $eq, $ne, $gt, $gte, $lt, $lte, $in, $nin, $exists, $regex.
                Context paths: user.*, resource.*, environment.*
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={createPolicy}>Create Policy</Button>
              <Button variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {policies.map((policy) => (
          <Card key={policy.id} className={!policy.isActive ? 'opacity-60' : ''}>
            {editingId === policy.id ? (
              <>
                <CardHeader>
                  <CardTitle className="text-lg">Edit Policy</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input
                        value={editPolicy.name}
                        onChange={(e) => setEditPolicy({ ...editPolicy, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Input
                        value={editPolicy.description}
                        onChange={(e) => setEditPolicy({ ...editPolicy, description: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Effect</Label>
                      <select
                        className="flex h-9 w-full rounded-md border border-slate-200 bg-transparent px-3 py-1 text-sm shadow-sm"
                        value={editPolicy.effect}
                        onChange={(e) => setEditPolicy({ ...editPolicy, effect: e.target.value })}
                      >
                        <option value="allow">Allow</option>
                        <option value="deny">Deny</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Resource</Label>
                      <Input
                        value={editPolicy.resource}
                        onChange={(e) => setEditPolicy({ ...editPolicy, resource: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Action</Label>
                      <Input
                        value={editPolicy.action}
                        onChange={(e) => setEditPolicy({ ...editPolicy, action: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Conditions (JSON)</Label>
                    <textarea
                      className="flex w-full rounded-md border border-slate-200 bg-transparent px-3 py-2 text-sm shadow-sm font-mono min-h-24"
                      value={editPolicy.conditions}
                      onChange={(e) => setEditPolicy({ ...editPolicy, conditions: e.target.value })}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => saveEdit(policy.id)}>
                      <Save className="h-4 w-4 mr-1" /> Save
                    </Button>
                    <Button variant="outline" onClick={() => setEditingId(null)}>
                      <X className="h-4 w-4 mr-1" /> Cancel
                    </Button>
                  </div>
                </CardContent>
              </>
            ) : (
              <>
                <CardHeader className="flex flex-row items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{policy.name}</CardTitle>
                      <Badge variant={policy.effect === 'allow' ? 'success' : 'destructive'} className="text-xs">
                        {policy.effect.toUpperCase()}
                      </Badge>
                      <Badge variant={policy.isActive ? 'secondary' : 'outline'} className="text-xs">
                        {policy.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <CardDescription className="mt-1">{policy.description}</CardDescription>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => toggleActive(policy)}>
                      {policy.isActive ? 'Disable' : 'Enable'}
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => startEdit(policy)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-red-500"
                      onClick={() => deletePolicy(policy.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-slate-500">Resource:</span>{' '}
                      <span className="font-medium">{policy.resource}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Action:</span>{' '}
                      <span className="font-medium">{policy.action}</span>
                    </div>
                  </div>
                  <div className="mt-3">
                    <span className="text-sm text-slate-500">Conditions:</span>
                    <pre className="mt-1 rounded-md bg-slate-50 p-3 text-xs font-mono overflow-x-auto border">
                      {JSON.stringify(policy.conditions, null, 2)}
                    </pre>
                  </div>
                </CardContent>
              </>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
