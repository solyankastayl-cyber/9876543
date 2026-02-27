/**
 * StateNeedCookies - показывается когда нужно синхронизировать cookies через extension
 */

import { Download, Chrome, LogIn, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

const EXTENSION_URL = 'https://chrome.google.com/webstore/detail/fomo-twitter-sync/placeholder';

export function StateNeedCookies({ onRefresh }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <h2 className="text-2xl font-semibold text-gray-900 mb-2">
        Sync Your Twitter Session
      </h2>
      
      <p className="text-gray-500 text-center max-w-md mb-8">
        Follow these steps to connect your Twitter account securely.
      </p>
      
      {/* Steps */}
      <div className="w-full max-w-lg space-y-4 mb-8">
        {/* Step 1 */}
        <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-blue-600 font-semibold">1</span>
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-gray-900 mb-1">
              Install Chrome Extension
            </h3>
            <p className="text-sm text-gray-500 mb-2">
              Download FOMO Twitter Sync from Chrome Web Store
            </p>
            <Button 
              variant="outline" 
              size="sm"
              className="gap-2"
              onClick={() => window.open(EXTENSION_URL, '_blank')}
              data-testid="install-extension-btn"
            >
              <Chrome className="w-4 h-4" />
              Install Extension
            </Button>
          </div>
        </div>
        
        {/* Step 2 */}
        <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-blue-600 font-semibold">2</span>
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-gray-900 mb-1">
              Login to Twitter
            </h3>
            <p className="text-sm text-gray-500 mb-2">
              Open Twitter and make sure you're logged in
            </p>
            <Button 
              variant="outline" 
              size="sm"
              className="gap-2"
              onClick={() => window.open('https://twitter.com', '_blank')}
            >
              <LogIn className="w-4 h-4" />
              Open Twitter
            </Button>
          </div>
        </div>
        
        {/* Step 3 */}
        <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-green-600 font-semibold">3</span>
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-gray-900 mb-1">
              Click "Sync Cookies"
            </h3>
            <p className="text-sm text-gray-500">
              In the extension popup, click the sync button. Your session will be 
              securely transferred.
            </p>
          </div>
        </div>
      </div>
      
      {/* Refresh button */}
      <Button 
        variant="ghost" 
        onClick={onRefresh}
        className="gap-2"
        data-testid="refresh-status-btn"
      >
        <RefreshCw className="w-4 h-4" />
        Check Status
      </Button>
      
      <p className="text-xs text-gray-400 mt-6 text-center max-w-sm">
        Having trouble? Make sure you're logged into Twitter before syncing.
      </p>
    </div>
  );
}
