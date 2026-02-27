/**
 * P2.A — Confidence Dashboard Page
 * 
 * Admin metrics page for confidence quality monitoring.
 */

import React from 'react';
import AdminLayout from '../../../components/admin/AdminLayout';
import { ConfidenceDashboard } from '../../../components/admin/metrics/ConfidenceDashboard';

export function ConfidenceDashboardPage() {
  return (
    <AdminLayout>
      <div className="p-6">
        <ConfidenceDashboard />
      </div>
    </AdminLayout>
  );
}

export default ConfidenceDashboardPage;
