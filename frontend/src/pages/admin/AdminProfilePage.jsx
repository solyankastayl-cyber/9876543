/**
 * Admin Profile Page
 * 
 * Profile settings: change password, security options.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { api } from '../../api/client';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { InfoTooltip } from '../../components/admin/InfoTooltip';
import {
  User,
  Shield,
  Key,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Lock,
  Mail,
  Calendar,
} from 'lucide-react';

export default function AdminProfilePage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading } = useAdminAuth();
  
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validation
    if (passwordForm.newPassword.length < 8) {
      setError('New password must be at least 8 characters');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('admin_token');
      const res = await api.post('/api/admin/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.ok) {
        setSuccess('Password changed successfully');
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        setError(res.data.message || 'Failed to change password');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  if (!isAuthenticated) {
    navigate('/admin/login', { replace: true });
    return null;
  }

  return (
    <AdminLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <User className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Profile & Security</h1>
            <p className="text-sm text-slate-500">Manage your admin account</p>
          </div>
        </div>

        {/* Profile Info */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            Account Information
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-slate-500" />
                <div>
                  <p className="text-sm text-slate-500">Username</p>
                  <p className="font-medium text-slate-900">{user?.username || 'admin'}</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-slate-500" />
                <div>
                  <p className="text-sm text-slate-500">Role</p>
                  <Badge className="bg-blue-100 text-blue-700 border-blue-300">
                    {user?.role || 'ADMIN'}
                  </Badge>
                </div>
              </div>
            </div>
            
            {user?.createdAt && (
              <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-slate-500" />
                  <div>
                    <p className="text-sm text-slate-500">Created</p>
                    <p className="font-medium text-slate-900">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Change Password */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Key className="w-5 h-5 text-amber-600" />
            Change Password
            <InfoTooltip text="Change your admin password. Use a strong password with at least 8 characters." />
          </h3>

          {/* Messages */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
              <AlertTriangle className="w-5 h-5" />
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
              <CheckCircle className="w-5 h-5" />
              {success}
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <Label htmlFor="currentPassword" className="text-slate-700">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                className="mt-1"
                placeholder="Enter current password"
                required
              />
            </div>

            <div>
              <Label htmlFor="newPassword" className="text-slate-700">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                className="mt-1"
                placeholder="Enter new password (min 8 chars)"
                required
                minLength={8}
              />
            </div>

            <div>
              <Label htmlFor="confirmPassword" className="text-slate-700">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                className="mt-1"
                placeholder="Confirm new password"
                required
              />
            </div>

            <Button 
              type="submit" 
              disabled={saving}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Changing...
                </>
              ) : (
                <>
                  <Key className="w-4 h-4 mr-2" />
                  Change Password
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Security Tips */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <h4 className="font-medium text-amber-800 mb-2 flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Security Tips
          </h4>
          <ul className="text-sm text-amber-700 space-y-1 list-disc list-inside">
            <li>Use a unique password not used on other sites</li>
            <li>Include numbers, symbols, and mixed case letters</li>
            <li>Change your password regularly</li>
            <li>Never share your admin credentials</li>
          </ul>
        </div>
      </div>
    </AdminLayout>
  );
}
