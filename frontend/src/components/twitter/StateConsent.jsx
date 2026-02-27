/**
 * StateConsent - Policy acceptance screen with full policy modal
 * 
 * Features:
 * - Loads policy from backend (version-controlled)
 * - Shows modal with full policy text (markdown)
 * - Checkbox agreement before continue
 * - Version tracking for compliance
 */

import { useState, useEffect } from 'react';
import { Shield, CheckCircle2, ExternalLink, X, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getPolicy, acceptPolicyConsent } from '@/api/twitterIntegration.api';
import ReactMarkdown from 'react-markdown';

function PolicyModal({ policy, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div 
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-blue-600" />
            <div>
              <h2 className="font-semibold text-gray-900">{policy.title}</h2>
              <p className="text-xs text-gray-500">
                Version {policy.version} • Last updated: {new Date(policy.updatedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        
        {/* Content (scrollable) */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="prose prose-sm prose-gray max-w-none">
            <ReactMarkdown
              components={{
                h1: ({node, ...props}) => <h1 className="text-xl font-bold text-gray-900 mb-4" {...props} />,
                h2: ({node, ...props}) => <h2 className="text-lg font-semibold text-gray-800 mt-6 mb-3" {...props} />,
                h3: ({node, ...props}) => <h3 className="text-base font-medium text-gray-700 mt-4 mb-2" {...props} />,
                p: ({node, ...props}) => <p className="text-gray-600 mb-3 leading-relaxed" {...props} />,
                ul: ({node, ...props}) => <ul className="list-disc list-inside space-y-1 mb-3 text-gray-600" {...props} />,
                li: ({node, ...props}) => <li className="text-gray-600" {...props} />,
                strong: ({node, ...props}) => <strong className="font-semibold text-gray-800" {...props} />,
                hr: () => <hr className="my-4 border-gray-200" />,
                blockquote: ({node, ...props}) => (
                  <blockquote className="border-l-4 border-blue-500 pl-4 py-1 my-3 bg-blue-50 text-blue-800" {...props} />
                ),
              }}
            >
              {policy.contentMarkdown}
            </ReactMarkdown>
          </div>
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <Button variant="outline" onClick={onClose} className="w-full">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

export function StateConsent({ onAccept, loading: externalLoading }) {
  const [agreed, setAgreed] = useState(false);
  const [showPolicy, setShowPolicy] = useState(false);
  const [policy, setPolicy] = useState(null);
  const [loadingPolicy, setLoadingPolicy] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState(null);
  
  // Load policy on mount
  useEffect(() => {
    async function loadPolicy() {
      try {
        setLoadingPolicy(true);
        const data = await getPolicy();
        setPolicy(data);
      } catch (err) {
        console.error('Failed to load policy:', err);
        setError(err.message);
      } finally {
        setLoadingPolicy(false);
      }
    }
    loadPolicy();
  }, []);
  
  const handleAccept = async () => {
    if (!policy || !agreed) return;
    
    try {
      setAccepting(true);
      setError(null);
      
      // Accept with version
      await acceptPolicyConsent(policy.policy.version);
      
      // Call parent callback
      if (onAccept) {
        onAccept();
      }
    } catch (err) {
      console.error('Failed to accept policy:', err);
      setError(err.message);
    } finally {
      setAccepting(false);
    }
  };
  
  const isLoading = loadingPolicy || accepting || externalLoading;
  
  if (loadingPolicy) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" />
        <p className="text-gray-500">Loading policy...</p>
      </div>
    );
  }
  
  if (error && !policy) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4" data-testid="state-consent">
      <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-6">
        <Shield className="w-8 h-8 text-blue-500" />
      </div>
      
      <h2 className="text-2xl font-semibold text-gray-900 mb-2">
        Data Usage Consent
      </h2>
      
      <p className="text-gray-500 text-center mb-6 max-w-md">
        Before connecting Twitter, please review and accept our data usage policy.
      </p>
      
      <div className="bg-gray-50 rounded-lg p-6 max-w-lg mb-6">
        <p className="text-gray-600 text-sm leading-relaxed mb-4">
          By connecting Twitter, you allow FOMO to:
        </p>
        
        <ul className="space-y-3 text-sm">
          <li className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <span className="text-gray-700">
              Use your session cookies to parse tweets from your feed
            </span>
          </li>
          <li className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <span className="text-gray-700">
              Analyze parsed content for crypto signals and sentiment
            </span>
          </li>
          <li className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <span className="text-gray-700">
              Store encrypted session data for continuous parsing
            </span>
          </li>
        </ul>
        
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Your cookies are encrypted with AES-256-GCM and never shared.
            You can disconnect at any time.
          </p>
        </div>
      </div>
      
      {/* Policy link */}
      <button
        onClick={() => setShowPolicy(true)}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm mb-6 underline underline-offset-2"
        data-testid="view-policy-btn"
      >
        <FileText className="w-4 h-4" />
        Read full Twitter Data Usage Policy
        <ExternalLink className="w-3 h-3" />
      </button>
      
      {/* Agreement checkbox */}
      <label className="flex items-center gap-3 mb-6 cursor-pointer">
        <input 
          type="checkbox" 
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          data-testid="consent-checkbox"
        />
        <span className="text-sm text-gray-700">
          I have read and agree to the{' '}
          <button 
            onClick={() => setShowPolicy(true)}
            className="text-blue-600 hover:underline"
          >
            Twitter Data Usage Policy
          </button>
        </span>
      </label>
      
      {/* Error message */}
      {error && (
        <p className="text-red-500 text-sm mb-4">{error}</p>
      )}
      
      {/* Accept button */}
      <Button 
        size="lg"
        disabled={!agreed || isLoading}
        onClick={handleAccept}
        data-testid="accept-consent-btn"
      >
        {accepting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          'I Agree & Continue'
        )}
      </Button>
      
      {/* Policy version info */}
      {policy && (
        <p className="text-xs text-gray-400 mt-4">
          Policy version: {policy.policy.version}
        </p>
      )}
      
      {/* Policy Modal */}
      {showPolicy && policy && (
        <PolicyModal 
          policy={policy.policy} 
          onClose={() => setShowPolicy(false)} 
        />
      )}
    </div>
  );
}

export default StateConsent;
