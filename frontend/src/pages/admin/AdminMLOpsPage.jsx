/**
 * Admin MLOps Wrapper
 * Wraps MLOps Dashboard in AdminLayout for consistent admin UI
 */

import AdminLayout from '../../components/admin/AdminLayout';
import MLOpsPage from '../mlops/MLOpsPage';

export default function AdminMLOpsPage() {
  return (
    <AdminLayout>
      <MLOpsPage />
    </AdminLayout>
  );
}
