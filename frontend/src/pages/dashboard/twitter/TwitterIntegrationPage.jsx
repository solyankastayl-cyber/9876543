/**
 * Twitter Integration Page - FINAL UX
 * 
 * Product-first approach:
 * - Step 1: Data Usage Consent
 * - Step 2: How the Connection Works (education)
 * - Step 3: Secure Session Sync (one-time)
 * - Step 4: Connection Status
 * - FAQ + Final reassurance
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { 
  CheckCircle2, 
  Twitter,
  Download,
  RefreshCw,
  FileText,
  Shield,
  Lock,
  Eye,
  Zap,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Copy,
  Loader2,
  AlertCircle,
  Info,
  Plus,
  Trash2,
  ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { getIntegrationStatus, getPolicy, acceptConsent, addAccount, getAccounts, deleteAccount } from '../../../api/twitterIntegration.api';

export default function TwitterIntegrationPage() {
  // State
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [actionLoading, setActionLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [policy, setPolicy] = useState(null);
  const [policyModalOpen, setPolicyModalOpen] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  const [manualInstallOpen, setManualInstallOpen] = useState(false);
  
  // Twitter account state
  const [twitterUsername, setTwitterUsername] = useState('');
  const [accounts, setAccounts] = useState([]);
  const [addingAccount, setAddingAccount] = useState(false);
  const [deletingAccountId, setDeletingAccountId] = useState(null);
  
  // Current step (1-4)
  const [currentStep, setCurrentStep] = useState(1);
  
  // Determine step from status
  const determineStep = useCallback((statusData) => {
    if (!statusData) return 1;
    
    const details = statusData.details || {};
    const consentAccepted = details.consentAccepted;
    // sessions is at top level, not inside details
    const sessions = statusData.sessions || { ok: 0, stale: 0 };
    const totalSessions = (sessions.ok || 0) + (sessions.stale || 0);
    
    // Step 1: No consent
    if (!consentAccepted) return 1;
    
    // Step 4: Has sessions - show status
    if (totalSessions > 0) return 4;
    
    // Step 3: Consent given, no sessions yet
    return 3;
  }, []);
  
  // Load data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [statusData, policyData, accountsData] = await Promise.all([
        getIntegrationStatus(),
        getPolicy().catch(() => null),
        getAccounts().catch(() => ({ accounts: [] })),
      ]);
      setStatus(statusData);
      setPolicy(policyData);
      setAccounts(accountsData.accounts || []);
      setCurrentStep(determineStep(statusData));
    } catch (err) {
      console.error('Failed to load:', err);
      toast.error('Failed to load integration status');
    } finally {
      setLoading(false);
    }
  }, [determineStep]);
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  // Add Twitter account
  const handleAddAccount = async () => {
    const username = twitterUsername.trim().replace('@', '');
    if (!username) {
      toast.error('Please enter your Twitter username');
      return;
    }
    try {
      setAddingAccount(true);
      await addAccount(username);
      toast.success(`@${username} added successfully`);
      setTwitterUsername('');
      // Refresh accounts
      const accountsData = await getAccounts();
      setAccounts(accountsData.accounts || []);
    } catch (err) {
      toast.error(err.message || 'Failed to add account');
    } finally {
      setAddingAccount(false);
    }
  };
  
  // Delete Twitter account
  const handleDeleteAccount = async (accountId, username) => {
    if (!confirm(`Remove @${username}? You can add it again later.`)) {
      return;
    }
    try {
      setDeletingAccountId(accountId);
      await deleteAccount(accountId);
      toast.success(`@${username} removed`);
      // Refresh accounts and status
      const [accountsData, statusData] = await Promise.all([
        getAccounts(),
        getIntegrationStatus(),
      ]);
      setAccounts(accountsData.accounts || []);
      setStatus(statusData);
      // If no more sessions, go back to step 3
      const sessions = statusData?.sessions || { ok: 0, stale: 0 };
      const totalSessions = (sessions.ok || 0) + (sessions.stale || 0);
      if (totalSessions === 0) {
        setCurrentStep(3);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to remove account');
    } finally {
      setDeletingAccountId(null);
    }
  };
  
  // Handle consent
  const handleAcceptConsent = async () => {
    if (!consentChecked) {
      toast.error('Please agree to the policy first');
      return;
    }
    try {
      setActionLoading(true);
      await acceptConsent();
      toast.success('Consent accepted');
      setCurrentStep(2); // Go to education step
    } catch (err) {
      toast.error(err.message || 'Failed');
    } finally {
      setActionLoading(false);
    }
  };
  
  // Handle "I understand" on step 2
  const handleUnderstand = () => {
    setCurrentStep(3);
  };
  
  // Handle check status
  const handleCheckStatus = async () => {
    try {
      setActionLoading(true);
      await fetchData();
      toast.success('Status updated');
    } catch (err) {
      toast.error('Failed to check status');
    } finally {
      setActionLoading(false);
    }
  };
  
  // Copy to clipboard helper
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-12 px-4">
      <div className="max-w-2xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-2xl mb-6">
            <Twitter className="w-8 h-8 text-blue-500" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Twitter Integration
          </h1>
          <p className="text-lg text-gray-600 mb-2">
            Turn your Twitter feed into real-time crypto signals
          </p>
          <p className="text-sm text-gray-500">
            Secure. Transparent. Fully under your control.
          </p>
        </div>
        
        {/* ========== STEP 1: DATA USAGE CONSENT ========== */}
        {currentStep === 1 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-8" data-testid="step-1">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <Shield className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Step 1 — Data Usage Consent</h2>
                <p className="text-sm text-gray-500">Before we connect anything</p>
              </div>
            </div>
            
            <p className="text-gray-700 mb-6">
              To analyze signals from your Twitter feed, we need your permission.
            </p>
            
            <div className="mb-6">
              <p className="text-sm font-medium text-gray-700 mb-3">By continuing, you allow FOMO to:</p>
              <ul className="space-y-2">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-600">Read public tweets from your feed</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-600">Analyze content for crypto signals & sentiment</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-600">Store encrypted session data for continuous parsing</span>
                </li>
              </ul>
            </div>
            
            {/* Security info */}
            <div className="bg-slate-50 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <Lock className="w-5 h-5 text-slate-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-slate-700 mb-1">Your session data is:</p>
                  <ul className="text-sm text-slate-600 space-y-1">
                    <li>• encrypted with AES-256-GCM</li>
                    <li>• never shared</li>
                    <li>• revocable at any time</li>
                  </ul>
                </div>
              </div>
            </div>
            
            {/* Policy link */}
            <button
              onClick={() => setPolicyModalOpen(true)}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6 text-sm font-medium"
              data-testid="read-policy-btn"
            >
              <FileText className="w-4 h-4" />
              Read full Twitter Data Usage Policy
            </button>
            
            {/* Checkbox */}
            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200 mb-6">
              <Checkbox
                id="consent"
                checked={consentChecked}
                onCheckedChange={setConsentChecked}
                className="mt-0.5"
                data-testid="consent-checkbox"
              />
              <label htmlFor="consent" className="text-sm text-gray-700 cursor-pointer">
                I understand and agree to the Twitter Data Usage Policy
              </label>
            </div>
            
            {/* Continue button */}
            <Button
              onClick={handleAcceptConsent}
              disabled={!consentChecked || actionLoading}
              className="w-full h-12 text-base"
              data-testid="continue-btn"
            >
              {actionLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Continue
            </Button>
          </div>
        )}
        
        {/* ========== STEP 2: HOW THE CONNECTION WORKS ========== */}
        {currentStep === 2 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-8" data-testid="step-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                <Info className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Step 2 — How the Connection Works</h2>
                <p className="text-sm text-gray-500">Important — takes 10 seconds to read</p>
              </div>
            </div>
            
            <div className="mb-6">
              <h3 className="font-medium text-gray-900 mb-2">Why this is different from "Login with Twitter"</h3>
              <p className="text-gray-600 mb-4">
                Twitter does not allow websites to access session data directly.
              </p>
              <p className="text-gray-600">
                To keep your account safe, browsers isolate Twitter sessions from external websites.
                <span className="text-gray-500"> This is a security restriction, not a limitation of our platform.</span>
              </p>
            </div>
            
            {/* Our solution */}
            <div className="bg-blue-50 rounded-xl p-5 mb-6">
              <h3 className="font-medium text-blue-900 mb-3">Our solution</h3>
              <p className="text-blue-800 text-sm mb-4">
                We use a lightweight secure connector (Chrome extension) that:
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-3 text-sm text-blue-800">
                  <Lock className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  Does NOT read passwords
                </li>
                <li className="flex items-center gap-3 text-sm text-blue-800">
                  <Lock className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  Does NOT modify your account
                </li>
                <li className="flex items-center gap-3 text-sm text-blue-800">
                  <Lock className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  Only transfers session cookies once
                </li>
                <li className="flex items-center gap-3 text-sm text-blue-800">
                  <Lock className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  Works only after you are logged into Twitter
                </li>
              </ul>
              <p className="text-xs text-blue-600 mt-4">
                This is the same technical approach used by analytics, monitoring and compliance tools.
              </p>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
              <Eye className="w-4 h-4" />
              <span className="font-medium">You stay in full control.</span>
            </div>
            
            <Button
              onClick={handleUnderstand}
              className="w-full h-12 text-base"
              data-testid="understand-btn"
            >
              I understand how this works
            </Button>
          </div>
        )}
        
        {/* ========== STEP 3: SECURE SESSION SYNC ========== */}
        {currentStep === 3 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-8" data-testid="step-3">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <Zap className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Step 3 — Secure Session Sync</h2>
                <p className="text-sm text-gray-500">One-time setup • Under 1 minute</p>
              </div>
            </div>
            
            {/* Step 3.1: Add Twitter Account */}
            <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-blue-900">Your Twitter accounts</h3>
                <span className="text-xs text-blue-600">{accounts.length}/3 accounts</span>
              </div>
              
              {/* List of accounts */}
              {accounts.length > 0 && (
                <div className="space-y-2 mb-3">
                  {accounts.map(acc => (
                    <div key={acc.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-blue-100">
                      <div className="flex items-center gap-2">
                        <Twitter className="w-4 h-4 text-blue-500" />
                        <span className="font-medium text-gray-900">@{acc.username}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          acc.sessionStatus === 'OK' ? 'bg-green-100 text-green-700' :
                          acc.sessionStatus === 'STALE' ? 'bg-amber-100 text-amber-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {acc.sessionStatus === 'OK' ? 'Connected' : 
                           acc.sessionStatus === 'STALE' ? 'Needs refresh' : 'Waiting for sync'}
                        </span>
                        {/* Refresh hint for STALE sessions */}
                        {acc.sessionStatus === 'STALE' && (
                          <button
                            onClick={() => {
                              setManualInstallOpen(true);
                              toast.info('Re-sync your session using the extension');
                            }}
                            className="p-1.5 text-amber-600 hover:bg-amber-50 rounded transition-colors"
                            title="Refresh session"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                        )}
                        {/* Delete button */}
                        <button
                          onClick={() => handleDeleteAccount(acc.id, acc.username)}
                          disabled={deletingAccountId === acc.id}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                          title="Remove account"
                        >
                          {deletingAccountId === acc.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Add account form - always show if under limit */}
              {accounts.length < 3 && (
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder={accounts.length === 0 ? "@your_twitter_username" : "@add_another_account"}
                    value={twitterUsername}
                    onChange={(e) => setTwitterUsername(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddAccount()}
                    className="flex-1 bg-white"
                    data-testid="twitter-username-input"
                  />
                  <Button 
                    onClick={handleAddAccount}
                    disabled={addingAccount || !twitterUsername.trim()}
                    data-testid="add-account-btn"
                    size="icon"
                    className="px-3"
                  >
                    {addingAccount ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  </Button>
                </div>
              )}
              
              {accounts.length === 3 && (
                <p className="text-xs text-blue-600">Maximum 3 accounts reached</p>
              )}
            </div>
            
            {/* Option A: Chrome Web Store (Coming Soon) */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-medium text-gray-900">Option A — One-Click Install</span>
                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Coming Soon</span>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <Button disabled className="w-full h-11 mb-3 opacity-60">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Enable Secure Twitter Connector
                </Button>
                <ul className="text-xs text-gray-500 space-y-1">
                  <li>• Installs from Chrome Web Store</li>
                  <li>• No manual setup</li>
                  <li>• Auto-configured</li>
                  <li>• One click → done</li>
                </ul>
                <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  This option will be available once published to Chrome Web Store
                </p>
              </div>
            </div>
            
            {/* Option B: Manual Install */}
            <Collapsible open={manualInstallOpen} onOpenChange={setManualInstallOpen}>
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">Option B — Manual Install</span>
                    <span className="text-xs text-gray-500">(advanced users)</span>
                  </div>
                  {manualInstallOpen ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </CollapsibleTrigger>
              
              <CollapsibleContent>
                <div className="mt-4 space-y-4">
                  {/* Step 1: Download */}
                  <div className="flex gap-4">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-semibold text-blue-600">1</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 mb-2">Install the secure connector</h4>
                      <a
                        href="/fomo_extension_v1.3.0.zip"
                        download
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
                        data-testid="download-btn"
                      >
                        <Download className="w-4 h-4" />
                        Download Secure Connector
                      </a>
                    </div>
                  </div>
                  
                  {/* Step 2: Enable in Chrome */}
                  <div className="flex gap-4">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-semibold text-blue-600">2</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 mb-2">Enable it in Chrome</h4>
                      <ul className="text-sm text-gray-600 space-y-2">
                        <li className="flex items-center gap-2">
                          <span>•</span>
                          <span>Open</span>
                          <a 
                            href="chrome://extensions" 
                            onClick={(e) => {
                              e.preventDefault();
                              window.open('chrome://extensions', '_blank');
                              copyToClipboard('chrome://extensions');
                              toast.info('URL copied! Paste in address bar if tab didn\'t open');
                            }}
                            className="font-mono bg-gray-100 px-2 py-1 rounded text-sm text-blue-600 hover:bg-blue-100 hover:text-blue-700 cursor-pointer underline decoration-blue-300"
                          >
                            chrome://extensions
                          </a>
                        </li>
                        <li className="flex items-center gap-2">
                          <span>•</span>
                          <span>Enable</span>
                          <span className="font-semibold">Developer Mode</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <span>•</span>
                          <span>Click</span>
                          <span className="font-semibold">Load unpacked</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <span>•</span>
                          <span>Select the extracted folder</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                  
                  {/* Step 3: Sync */}
                  <div className="flex gap-4">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-semibold text-blue-600">3</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 mb-2">Sync your session</h4>
                      <ul className="text-sm text-gray-600 space-y-2">
                        <li className="flex items-center gap-2">
                          <span>•</span>
                          <span>Make sure you're logged into Twitter</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <span>•</span>
                          <span>Open the extension</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <span>•</span>
                          <span>Click</span>
                          <span className="font-semibold">Sync Session</span>
                        </li>
                      </ul>
                      <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                        <p className="text-sm text-gray-600 mb-3">Configure extension with:</p>
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Platform URL:</span>
                            <code className="bg-white px-3 py-1.5 rounded border border-gray-200 text-sm text-blue-600 font-mono truncate max-w-[280px]" title={window.location.origin}>{window.location.origin}</code>
                            <button
                              onClick={() => copyToClipboard(window.location.origin)}
                              className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors flex-shrink-0"
                              title="Copy URL"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Your API Keys:</span>
                            <a href="/settings/api-keys" className="text-sm text-blue-600 hover:underline font-medium">Manage in Settings → API Keys</a>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
            
            {/* What happens during sync */}
            <div className="mt-6 p-4 bg-gray-50 rounded-xl">
              <h4 className="text-sm font-medium text-gray-700 mb-2">What happens during sync?</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Your current Twitter session cookies are securely transferred</li>
                <li>• Cookies are encrypted</li>
                <li>• No passwords are accessed</li>
                <li>• This is a one-time action</li>
              </ul>
            </div>
            
            {/* Check status button */}
            <div className="mt-6 space-y-3">
              <Button
                onClick={handleCheckStatus}
                variant="outline"
                className="w-full h-11"
                disabled={actionLoading}
                data-testid="check-status-btn"
              >
                {actionLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                I've synced — Check Status
              </Button>
              
              {/* Show "Continue to Status" button if user already has connected sessions */}
              {(() => {
                const sessions = status?.sessions || { ok: 0, stale: 0 };
                const totalSessions = (sessions.ok || 0) + (sessions.stale || 0);
                return totalSessions > 0;
              })() && (
                <Button
                  onClick={() => setCurrentStep(4)}
                  className="w-full h-11"
                  data-testid="continue-to-status-btn"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Continue to Connection Status
                </Button>
              )}
            </div>
          </div>
        )}
        
        {/* ========== STEP 4: CONNECTION STATUS ========== */}
        {currentStep === 4 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-8" data-testid="step-4">
            {/* Back button at top */}
            <button
              onClick={() => setCurrentStep(3)}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4 -mt-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to setup
            </button>
            
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Step 4 — Connection Status</h2>
                <p className="text-sm text-gray-500">You're all set!</p>
              </div>
            </div>
            
            {/* Status card */}
            <div className="bg-green-50 rounded-xl p-6 mb-6 border border-green-200">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
                <div>
                  <h3 className="text-lg font-semibold text-green-800">Twitter Connected</h3>
                  <p className="text-sm text-green-600">Session active and parsing</p>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div className="bg-white/60 rounded-lg p-3 text-center">
                  <p className="text-gray-500 text-xs mb-1">Accounts</p>
                  <p className="font-semibold text-gray-900">{status?.accounts || 0}</p>
                </div>
                <div className="bg-white/60 rounded-lg p-3 text-center">
                  <p className="text-gray-500 text-xs mb-1">Sessions</p>
                  <p className="font-semibold text-gray-900">{status?.sessions?.ok || 0} active</p>
                </div>
                <div className="bg-white/60 rounded-lg p-3 text-center">
                  <p className="text-gray-500 text-xs mb-1">Status</p>
                  <p className="font-semibold text-green-600">Healthy</p>
                </div>
              </div>
            </div>
            
            {/* What's next */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-2">From this point on:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Parsing runs automatically
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  No extension interaction required
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  You can disconnect anytime
                </li>
              </ul>
            </div>
            
            <div className="flex gap-3">
              <Button
                onClick={handleCheckStatus}
                variant="outline"
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Refresh
              </Button>
              <Button
                onClick={() => setCurrentStep(3)}
                variant="outline"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Account
              </Button>
              <Button
                onClick={() => navigate('/dashboard/twitter/targets')}
                className="flex-1"
              >
                Go to Targets
              </Button>
            </div>
          </div>
        )}
        
        {/* ========== FAQ ========== */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Frequently Asked Questions</h3>
          
          <div className="space-y-5">
            <div>
              <h4 className="font-medium text-gray-800 mb-1">Do you see my Twitter password?</h4>
              <p className="text-sm text-gray-600">No. Never. We physically cannot.</p>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-800 mb-1">Why not OAuth / Login with Twitter?</h4>
              <p className="text-sm text-gray-600">OAuth does not allow feed-level parsing or session-based analysis.</p>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-800 mb-1">Is this safe?</h4>
              <p className="text-sm text-gray-600">Yes. This follows browser security rules instead of bypassing them.</p>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-800 mb-1">Can I revoke access?</h4>
              <p className="text-sm text-gray-600">Anytime. One click. Instantly stops parsing.</p>
            </div>
          </div>
        </div>
        
        {/* ========== FINAL REASSURANCE ========== */}
        <div className="text-center text-sm text-gray-500 space-y-1 mb-8">
          <p>We do not "log into" your Twitter.</p>
          <p>We do not automate actions.</p>
          <p>We do not bypass security.</p>
          <p className="font-medium text-gray-700 pt-2">You explicitly approve every step.</p>
        </div>
        
      </div>
      
      {/* ========== POLICY MODAL ========== */}
      <Dialog open={policyModalOpen} onOpenChange={setPolicyModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Twitter Data Usage Policy
            </DialogTitle>
          </DialogHeader>
          
          <div className="prose prose-sm max-w-none text-gray-600">
            {policy?.policy?.contentMarkdown ? (
              <div dangerouslySetInnerHTML={{ __html: policy.policy.contentMarkdown.replace(/\n/g, '<br/>') }} />
            ) : (
              <>
                <h3>Data We Collect</h3>
                <p>When you connect your Twitter account, we collect:</p>
                <ul>
                  <li>Session cookies (for authentication)</li>
                  <li>Public tweets from your feed</li>
                  <li>Activity metadata (timestamps, engagement metrics)</li>
                </ul>
                
                <h3>How We Use Your Data</h3>
                <ul>
                  <li>To parse your Twitter feed for relevant content</li>
                  <li>To generate trading signals based on social sentiment</li>
                  <li>To provide real-time alerts via Telegram</li>
                </ul>
                
                <h3>Data Security</h3>
                <ul>
                  <li>All session data is encrypted with AES-256-GCM</li>
                  <li>We never store your Twitter password</li>
                  <li>Data is stored on encrypted volumes</li>
                  <li>You can revoke access at any time</li>
                </ul>
                
                <h3>Your Rights</h3>
                <ul>
                  <li>Request deletion of all your data</li>
                  <li>Export your data</li>
                  <li>Revoke access and disconnect instantly</li>
                </ul>
              </>
            )}
          </div>
          
          <div className="mt-4 pt-4 border-t">
            <Button onClick={() => setPolicyModalOpen(false)} className="w-full">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
