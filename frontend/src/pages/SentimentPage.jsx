/**
 * Sentiment Analyzer Page (S3.7)
 * URL-first Universal Sentiment Analyzer
 * 
 * Philosophy: User analyzes SOURCE, not abstract text
 * - URL to article/post/thread
 * - Backend extracts and analyzes
 * - UI shows result with explanation
 */
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../components/ui/tooltip';
import { 
  AlertCircle, 
  CheckCircle, 
  Loader2, 
  Link2, 
  Globe, 
  FileText,
  Info,
  ExternalLink,
  RotateCcw,
  Sparkles
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

// ============================================
// Components
// ============================================

// Health/Status Badge
const StatusBadge = ({ status, mock }) => {
  if (mock) {
    return (
      <Badge className="bg-amber-100 text-amber-700 border-amber-200">
        <AlertCircle className="w-3 h-3 mr-1" />
        Dev Mode (Mock)
      </Badge>
    );
  }
  if (status === 'READY') {
    return (
      <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
        <CheckCircle className="w-3 h-3 mr-1" />
        Model Ready
      </Badge>
    );
  }
  return (
    <Badge className="bg-gray-100 text-gray-600 border-gray-200">
      {status || 'Unknown'}
    </Badge>
  );
};

// Sentiment Bar with gradient
const SentimentBar = ({ score, confidence }) => {
  const percentage = Math.round(score * 100);
  const confidencePct = Math.round(confidence * 100);
  
  const getLabel = (score) => {
    if (score >= 0.6) return 'Positive';
    if (score <= 0.4) return 'Negative';
    return 'Neutral';
  };
  
  const getLabelColor = (score) => {
    if (score >= 0.6) return 'text-emerald-600';
    if (score <= 0.4) return 'text-red-600';
    return 'text-amber-600';
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500">Confidence: {confidencePct}%</span>
        <span className={`font-medium ${getLabelColor(score)}`}>{getLabel(score)}</span>
      </div>
      <div className="w-full h-3 rounded-full overflow-hidden relative"
        style={{ background: 'linear-gradient(to right, #ef4444, #f59e0b, #22c55e)' }}>
        <div 
          className="absolute top-0 h-full w-1.5 bg-white shadow-lg rounded"
          style={{ left: `calc(${percentage}% - 3px)` }}
        />
      </div>
    </div>
  );
};

// Explanation Tooltip Content
const ExplanationTooltip = ({ meta }) => {
  if (!meta) return null;
  
  const modelPct = Math.round((meta.modelScore || 0) * 100);
  const boostPct = Math.round((meta.rulesBoost || 0) * 100);
  const boostSign = boostPct >= 0 ? '+' : '';
  
  return (
    <div className="space-y-3 p-1 max-w-xs">
      <div className="font-medium text-sm border-b pb-2">Why this result?</div>
      
      <div className="space-y-1.5">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Model score:</span>
          <span className="font-mono">{modelPct}%</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Rules boost:</span>
          <span className={`font-mono ${boostPct > 0 ? 'text-emerald-400' : boostPct < 0 ? 'text-red-400' : 'text-gray-400'}`}>
            {boostSign}{boostPct}%
          </span>
        </div>
      </div>
      
      {meta.reasons && meta.reasons.length > 0 && (
        <div className="space-y-1">
          <div className="text-xs text-gray-500 uppercase tracking-wide">Signals</div>
          <ul className="text-sm space-y-0.5">
            {meta.reasons.slice(0, 3).map((reason, i) => (
              <li key={i} className="text-gray-700 flex items-start gap-1.5">
                <span className="text-emerald-400 mt-0.5">•</span>
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {meta.rulesApplied && meta.rulesApplied.length > 0 && (
        <div className="space-y-1">
          <div className="text-xs text-gray-500 uppercase tracking-wide">Rules applied</div>
          <div className="flex flex-wrap gap-1">
            {meta.rulesApplied.map((rule, i) => (
              <span key={i} className="px-1.5 py-0.5 bg-gray-700 rounded text-xs text-gray-700">
                {rule}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Result Card
const ResultCard = ({ result, loading }) => {
  if (loading) {
    return (
      <Card className="border-gray-200">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (!result) return null;
  
  const { label, score, confidence, meta } = result;
  const isAdjusted = meta?.rulesBoost !== 0 || (meta?.rulesApplied && meta.rulesApplied.length > 0);
  
  const getLabelBadge = (label) => {
    const colors = {
      POSITIVE: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      NEUTRAL: 'bg-amber-100 text-amber-700 border-amber-200',
      NEGATIVE: 'bg-red-100 text-red-700 border-red-200',
    };
    return colors[label] || colors.NEUTRAL;
  };

  return (
    <Card className="border-gray-200">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-teal-500" />
            Sentiment Analysis
          </CardTitle>
          <div className="flex items-center gap-2">
            {isAdjusted && (
              <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">
                Adjusted
              </Badge>
            )}
            <Badge className={getLabelBadge(label)}>
              {label}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {meta?.mock && (
          <div className="mb-4 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Mock response — sentiment runtime is offline (dev mode)
          </div>
        )}
        
        <SentimentBar score={score} confidence={confidence || meta?.confidenceScore || 0.5} />
        
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-gray-500">
              <span>Model: {meta?.modelVersion || 'unknown'}</span>
              <span>·</span>
              <span>Latency: {meta?.latencyMs || 0}ms</span>
            </div>
            <TooltipProvider delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="text-gray-400 hover:text-gray-600 flex items-center gap-1">
                    <Info className="w-4 h-4" />
                    <span className="text-xs">Details</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="left" className="bg-gray-800 border-gray-200 text-white">
                  <ExplanationTooltip meta={meta} />
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// URL Extraction Preview Card
const ExtractionCard = ({ extraction }) => {
  if (!extraction) return null;
  
  return (
    <Card className="border-gray-200 bg-gray-50">
      <CardContent className="pt-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
            <Globe className="w-5 h-5 text-gray-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded">
                {extraction.domain}
              </span>
              <span className="text-xs text-gray-400">
                {extraction.textLen.toLocaleString()} chars
              </span>
            </div>
            {extraction.title && (
              <h4 className="font-medium text-gray-900 mt-1 truncate">
                {extraction.title}
              </h4>
            )}
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
              {extraction.preview}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Error Card
const ErrorCard = ({ error, onRetry }) => (
  <Card className="border-red-200 bg-red-50">
    <CardContent className="pt-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
          <AlertCircle className="w-5 h-5 text-red-500" />
        </div>
        <div className="flex-1">
          <h4 className="font-medium text-red-700">Analysis Failed</h4>
          <p className="text-sm text-red-600 mt-0.5">{error}</p>
        </div>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry} className="border-red-200 text-red-600 hover:bg-red-100">
            <RotateCcw className="w-4 h-4 mr-1" />
            Retry
          </Button>
        )}
      </div>
    </CardContent>
  </Card>
);

// ============================================
// Main Component
// ============================================

export default function SentimentPage() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [extraction, setExtraction] = useState(null);
  const [result, setResult] = useState(null);
  const [capabilities, setCapabilities] = useState(null);
  
  // Fetch capabilities on mount
  useEffect(() => {
    fetchCapabilities();
  }, []);
  
  const fetchCapabilities = async () => {
    try {
      const res = await fetch(`${API_URL}/api/v4/sentiment/capabilities`);
      const data = await res.json();
      if (data.ok) {
        setCapabilities(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch capabilities:', err);
    }
  };
  
  const analyzeUrl = async () => {
    if (!url.trim()) return;
    
    // Validate URL
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        setError('Invalid URL. Must start with http:// or https://');
        return;
      }
    } catch {
      setError('Invalid URL format');
      return;
    }
    
    setLoading(true);
    setError(null);
    setExtraction(null);
    setResult(null);
    
    try {
      const res = await fetch(`${API_URL}/api/v4/sentiment/analyze-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      
      const data = await res.json();
      
      if (!data.ok) {
        setError(data.message || data.error || 'Analysis failed');
        return;
      }
      
      setExtraction(data.data.extracted);
      setResult(data.data.result);
      
    } catch (err) {
      setError(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !loading) {
      analyzeUrl();
    }
  };
  
  const clearResults = () => {
    setUrl('');
    setError(null);
    setExtraction(null);
    setResult(null);
  };
  
  const isMock = capabilities?.features?.mock;

  return (
    <div className="min-h-screen bg-gray-50" data-testid="sentiment-analyzer-page">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FileText className="w-6 h-6 text-teal-500" />
              Sentiment Analyzer
            </h1>
            <StatusBadge status={capabilities?.modelVersion ? 'READY' : 'UNKNOWN'} mock={isMock} />
          </div>
          <p className="text-gray-500">
            Analyze sentiment from any article, post, or thread. Paste a URL to get started.
          </p>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* URL Input */}
        <Card className="border-gray-200 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="url"
                  placeholder="https://coindesk.com/article/..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="pl-10 h-12 text-base"
                  data-testid="url-input"
                />
              </div>
              <Button 
                onClick={analyzeUrl}
                disabled={loading || !url.trim()}
                className="h-12 px-6 bg-teal-500 hover:bg-teal-600"
                data-testid="analyze-button"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Analyze
                  </>
                )}
              </Button>
            </div>
            
            {/* Quick examples */}
            <div className="mt-4 flex items-center gap-2 text-sm">
              <span className="text-gray-400">Try:</span>
              <button 
                onClick={() => setUrl('https://coindesk.com/markets/bitcoin-price')}
                className="text-teal-600 hover:text-teal-700 hover:underline"
              >
                CoinDesk
              </button>
              <span className="text-gray-700">·</span>
              <button 
                onClick={() => setUrl('https://cointelegraph.com/news')}
                className="text-teal-600 hover:text-teal-700 hover:underline"
              >
                CoinTelegraph
              </button>
              <span className="text-gray-700">·</span>
              <button 
                onClick={() => setUrl('https://decrypt.co/news')}
                className="text-teal-600 hover:text-teal-700 hover:underline"
              >
                Decrypt
              </button>
            </div>
          </CardContent>
        </Card>
        
        {/* Results */}
        <div className="mt-6 space-y-4">
          {error && (
            <ErrorCard error={error} onRetry={analyzeUrl} />
          )}
          
          {extraction && (
            <ExtractionCard extraction={extraction} />
          )}
          
          <ResultCard result={result} loading={loading} />
          
          {(extraction || result) && !loading && (
            <div className="text-center">
              <Button variant="ghost" onClick={clearResults} className="text-gray-500">
                Clear & Analyze Another
              </Button>
            </div>
          )}
        </div>
        
        {/* Empty state */}
        {!loading && !result && !error && (
          <div className="mt-12 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Link2 className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-gray-700 font-medium mb-1">Paste a URL to analyze</h3>
            <p className="text-gray-500 text-sm max-w-md mx-auto">
              Enter a link to any news article, blog post, or social media thread. 
              We'll extract the content and analyze its sentiment.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
