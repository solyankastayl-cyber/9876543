/**
 * StateNotConnected - показывается когда нет привязанных аккаунтов
 * 
 * Два режима:
 * 1. Consent не принят → показать кнопку "Connect Twitter" для перехода к consent
 * 2. Consent принят, но нет accounts → показать инструкции по добавлению через Extension
 */

import { Twitter, Chrome, LogIn, RefreshCw, ExternalLink, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function StateNotConnected({ onConnect, consentAccepted = false, onRefresh }) {
  // If consent is not accepted yet, show Connect button
  if (!consentAccepted) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
          <Twitter className="w-10 h-10 text-gray-400" />
        </div>
        
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          Connect Twitter
        </h2>
        
        <p className="text-gray-500 text-center max-w-md mb-8">
          Link your Twitter account to enable intelligent parsing and unlock
          real-time insights from your feed.
        </p>
        
        <Button 
          size="lg" 
          onClick={onConnect}
          className="gap-2"
          data-testid="connect-twitter-btn"
        >
          <Twitter className="w-5 h-5" />
          Connect Twitter
        </Button>
        
        <p className="text-xs text-gray-400 mt-4 text-center max-w-sm">
          Your data is never shared. Each account operates in isolation.
        </p>
      </div>
    );
  }
  
  // Consent accepted, show extension sync instructions
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
        <Twitter className="w-8 h-8 text-green-600" />
      </div>
      
      <h2 className="text-2xl font-semibold text-gray-900 mb-2">
        Add Your First Account
      </h2>
      
      <p className="text-gray-500 text-center max-w-md mb-8">
        Consent accepted! Now sync your Twitter session using our Chrome extension.
      </p>
      
      {/* Steps */}
      <div className="w-full max-w-lg space-y-4 mb-8">
        {/* Step 1: Download Extension */}
        <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-blue-600 font-semibold">1</span>
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-gray-900 mb-1">
              Download Chrome Extension
            </h3>
            <p className="text-sm text-gray-500 mb-2">
              Get FOMO Twitter Sync extension to securely transfer your session
            </p>
            <a 
              href="/fomo_extension_v1.3.0.zip" 
              download
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
            >
              <Download className="w-4 h-4" />
              Download Extension
            </a>
          </div>
        </div>
        
        {/* Step 2: Install */}
        <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-blue-600 font-semibold">2</span>
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-gray-900 mb-1">
              Install Extension
            </h3>
            <p className="text-sm text-gray-500">
              Unzip and load in Chrome: <code className="bg-gray-200 px-1 rounded text-xs">chrome://extensions</code> → Enable Developer Mode → Load unpacked
            </p>
          </div>
        </div>
        
        {/* Step 3: Login to Twitter */}
        <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-blue-600 font-semibold">3</span>
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
              <ExternalLink className="w-4 h-4" />
              Open Twitter
            </Button>
          </div>
        </div>
        
        {/* Step 4: Sync */}
        <div className="flex items-start gap-4 p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-green-600 font-semibold">4</span>
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-gray-900 mb-1">
              Click "Sync Cookies" in Extension
            </h3>
            <p className="text-sm text-gray-500">
              Configure your API URL and key in the extension, then click Sync. Your session will be securely transferred.
            </p>
          </div>
        </div>
      </div>
      
      {/* Refresh button */}
      {onRefresh && (
        <Button 
          variant="ghost" 
          onClick={onRefresh}
          className="gap-2"
          data-testid="refresh-status-btn"
        >
          <RefreshCw className="w-4 h-4" />
          Check Status
        </Button>
      )}
    </div>
  );
}
