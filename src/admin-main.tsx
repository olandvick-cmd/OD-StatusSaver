import { createRoot } from 'react-dom/client';
import { AdminAuthProvider } from './context/AdminAuthContext';
import { WebAdminDashboard } from './components/admin/WebAdminDashboard';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <AdminAuthProvider>
    <main className="min-h-screen bg-slate-950 text-slate-100 font-sans px-4 py-6 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <WebAdminDashboard />
      </div>
    </main>
  </AdminAuthProvider>
);
