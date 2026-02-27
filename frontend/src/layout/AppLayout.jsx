import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import TopBar from './TopBar';

export default function AppLayout({ globalState }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar globalState={globalState} />

      <div className="flex-1 flex flex-col">
        <TopBar />
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
