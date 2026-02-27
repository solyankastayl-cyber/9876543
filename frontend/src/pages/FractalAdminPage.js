/**
 * BLOCK 50 — Fractal Admin Page
 * Institutional control panel route
 * 
 * Wrapped in AdminLayout for consistent navigation.
 */

import React from 'react';
import { AdminLayout } from '../components/admin/AdminLayout';
import { AdminDashboard } from '../components/fractal/admin';

export function FractalAdminPage() {
  return (
    <AdminLayout>
      <AdminDashboard />
    </AdminLayout>
  );
}

export default FractalAdminPage;
