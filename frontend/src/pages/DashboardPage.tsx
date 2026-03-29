import { useAuth } from '../contexts/AuthContext';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Shield, User, Key, FileCheck } from 'lucide-react';

export default function DashboardPage() {
  const { user, isAdmin, isManager } = useAuth();

  if (!user) return null;

  const allPermissions: string[] = [];
  user.roles?.forEach((role) => {
    role.permissions?.forEach((perm) => {
      if (!allPermissions.includes(perm.name)) {
        allPermissions.push(perm.name);
      }
    });
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-slate-500 mt-1">Welcome back, {user.firstName || user.email}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Auth Provider</CardTitle>
            <Key className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{user.provider}</div>
            <p className="text-xs text-slate-500">
              {user.provider === 'google' ? 'OAuth 2.0 / OpenID Connect' : 'JWT / Local'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Roles</CardTitle>
            <Shield className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user.roles?.length || 0}</div>
            <div className="flex gap-1 mt-1 flex-wrap">
              {user.roles?.map((role) => (
                <Badge key={role.id} variant={role.name === 'admin' ? 'default' : 'secondary'} className="text-xs">
                  {role.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Permissions</CardTitle>
            <FileCheck className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allPermissions.length}</div>
            <p className="text-xs text-slate-500">Across all roles</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Access Level</CardTitle>
            <User className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isAdmin ? 'Admin' : isManager ? 'Manager' : 'User'}
            </div>
            <p className="text-xs text-slate-500">
              {isAdmin ? 'Full system access' : isManager ? 'Team management' : 'Standard access'}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>Your account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between py-2 border-b">
              <span className="text-sm text-slate-500">Email</span>
              <span className="text-sm font-medium">{user.email}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-sm text-slate-500">Name</span>
              <span className="text-sm font-medium">
                {user.firstName} {user.lastName}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-sm text-slate-500">Department</span>
              <span className="text-sm font-medium">{user.department || '—'}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-sm text-slate-500">Location</span>
              <span className="text-sm font-medium">{user.location || '—'}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-sm text-slate-500">Status</span>
              <Badge variant={user.isActive ? 'success' : 'destructive'}>
                {user.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-sm text-slate-500">Member Since</span>
              <span className="text-sm font-medium">
                {new Date(user.createdAt).toLocaleDateString()}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Authorization Details</CardTitle>
            <CardDescription>Your RBAC roles and permissions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {user.roles?.map((role) => (
              <div key={role.id} className="space-y-2">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  <span className="font-medium capitalize">{role.name}</span>
                  <span className="text-xs text-slate-500">— {role.description}</span>
                </div>
                <div className="flex flex-wrap gap-1 pl-6">
                  {role.permissions?.map((perm) => (
                    <Badge key={perm.id} variant="outline" className="text-xs">
                      {perm.name}
                    </Badge>
                  ))}
                  {(!role.permissions || role.permissions.length === 0) && (
                    <span className="text-xs text-slate-400">No permissions</span>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
