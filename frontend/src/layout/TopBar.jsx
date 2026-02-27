import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { Eye, Wallet, Search } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../components/ui/tooltip";
import UniversalSearch from '../components/UniversalSearch';
import GlobalIndexingStatus from '../components/GlobalIndexingStatus';
import NotificationBell from '../components/NotificationBell';

export default function TopBar() {
  const location = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);
  
  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <TooltipProvider>
      <div className="bg-white border-b px-6 py-3 flex items-center justify-between">
        {/* Universal Search */}
        <div className="flex-1 max-w-2xl">
          {searchOpen ? (
            <UniversalSearch 
              onClose={() => setSearchOpen(false)}
              autoFocus={true}
            />
          ) : (
            <div className="relative">
              <input
                type="text"
                placeholder="Search tokens, wallets, entities..."
                onClick={() => setSearchOpen(true)}
                readOnly
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
              />
            </div>
          )}
        </div>

        {/* Right Section - Icons + Connect */}
        <div className="flex items-center gap-3 ml-6">
          {/* Global Indexing Status */}
          <GlobalIndexingStatus />

          {/* Watchlist Icon */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Link 
                to="/watchlist"
                className={`p-2.5 rounded-full transition-colors ${
                  isActive('/watchlist') 
                    ? 'text-gray-900 bg-gray-100' 
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Eye className="w-5 h-5" />
              </Link>
            </TooltipTrigger>
            <TooltipContent className="bg-gray-900 text-white">
              <p className="text-xs">Watchlist</p>
            </TooltipContent>
          </Tooltip>

          {/* Alerts - NotificationBell with dropdown */}
          <NotificationBell />

          {/* Connect Wallet Button - BLACK (original) */}
          <button className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-full text-sm font-bold transition-all shadow-lg shadow-gray-900/20 hover:shadow-xl hover:shadow-gray-900/30 hover:scale-105 active:scale-95">
            <Wallet className="w-4 h-4" />
            <span className="hidden sm:inline">Connect</span>
          </button>
        </div>
      </div>
    </TooltipProvider>
  );
}
