/**
 * ClusterReviewModal (B3)
 * 
 * Modal for reviewing cluster evidence and confirming/rejecting
 * 
 * CRITICAL UI RULES:
 * - Show all evidence transparently
 * - Never auto-confirm
 * - Clear confirm/reject actions
 */
import React, { useState, useEffect } from 'react';
import { 
  X, Check, AlertCircle, Coins, Clock, Activity, 
  ArrowRight, ExternalLink, Loader2 
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
} from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { getClusterReview, confirmCluster, rejectCluster } from '../api/clusters.api';

/**
 * Format wallet address
 */
const formatAddress = (address) => {
  if (!address) return '';
  return `${address.slice(0, 8)}...${address.slice(-6)}`;
};

/**
 * Get evidence icon
 */
const getEvidenceIcon = (type) => {
  switch (type) {
    case 'token_overlap': return Coins;
    case 'timing': return Clock;
    case 'role_pattern': return Activity;
    default: return AlertCircle;
  }
};

/**
 * Evidence Card
 */
const EvidenceCard = ({ evidence }) => {
  const Icon = getEvidenceIcon(evidence.type);
  
  return (
    <div className="p-4 border border-slate-200 dark:border-gray-200 rounded-lg">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
          <Icon className="w-4 h-4 text-slate-600 dark:text-slate-400" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-medium text-sm">{evidence.title}</h4>
            <Badge 
              variant="outline" 
              className={`text-xs ${
                evidence.score >= 0.7 
                  ? 'bg-green-100 text-green-700' 
                  : evidence.score >= 0.5
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              {Math.round(evidence.score * 100)}% score
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {evidence.description}
          </p>
          {evidence.supporting?.length > 0 && (
            <ul className="mt-2 space-y-1">
              {evidence.supporting.map((fact, i) => (
                <li key={i} className="text-xs text-slate-500 flex items-center gap-1">
                  <span className="w-1 h-1 bg-slate-400 rounded-full" />
                  {fact}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Main ClusterReviewModal
 */
export function ClusterReviewModal({ 
  clusterId,
  isOpen,
  onClose,
  onConfirm,
  onReject,
  onWalletClick,
}) {
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    if (!isOpen || !clusterId) {
      setReview(null);
      setLoading(true);
      setNotes('');
      return;
    }
    
    const fetchReview = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await getClusterReview(clusterId);
        if (response.ok) {
          setReview(response.data);
        } else {
          setError(response.error || 'Failed to load cluster');
        }
      } catch (err) {
        console.error('Error fetching cluster review:', err);
        setError('Unable to load cluster details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchReview();
  }, [clusterId, isOpen]);
  
  const handleConfirm = async () => {
    setProcessing(true);
    try {
      const response = await confirmCluster(clusterId, notes);
      if (response.ok) {
        onConfirm?.(response.data);
        onClose();
      } else {
        setError(response.error);
      }
    } catch (err) {
      setError('Failed to confirm cluster');
    } finally {
      setProcessing(false);
    }
  };
  
  const handleReject = async () => {
    setProcessing(true);
    try {
      const response = await rejectCluster(clusterId, notes);
      if (response.ok) {
        onReject?.(response.data);
        onClose();
      } else {
        setError(response.error);
      }
    } catch (err) {
      setError('Failed to reject cluster');
    } finally {
      setProcessing(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-500" />
            Review Related Addresses
          </DialogTitle>
        </DialogHeader>
        
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-600">
            <AlertCircle className="w-8 h-8 mx-auto mb-2" />
            <p>{error}</p>
          </div>
        ) : review ? (
          <div className="space-y-6">
            {/* Addresses in cluster */}
            <div>
              <h3 className="text-sm font-medium mb-3">Addresses in this cluster</h3>
              <div className="flex flex-wrap gap-2">
                {review.cluster.addresses.map((addr, i) => (
                  <button
                    key={addr}
                    onClick={() => onWalletClick?.(addr)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm font-mono hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    {formatAddress(addr)}
                    {i === 0 && (
                      <Badge variant="secondary" className="ml-1 text-xs">Primary</Badge>
                    )}
                    <ExternalLink className="w-3 h-3 text-muted-foreground" />
                  </button>
                ))}
              </div>
            </div>
            
            {/* Confidence */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Confidence Level</span>
                <Badge 
                  className={`${
                    review.cluster.confidence >= 0.7 
                      ? 'bg-green-100 text-green-700' 
                      : review.cluster.confidence >= 0.5
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {Math.round(review.cluster.confidence * 100)}%
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {review.confidenceExplanation}
              </p>
            </div>
            
            {/* Evidence */}
            <div>
              <h3 className="text-sm font-medium mb-3">Evidence</h3>
              <div className="space-y-3">
                {review.evidenceDetails.map((evidence, i) => (
                  <EvidenceCard key={i} evidence={evidence} />
                ))}
              </div>
            </div>
            
            {/* Notes */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Notes (optional)
              </label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about this relationship..."
                rows={2}
              />
            </div>
            
            {/* Warning */}
            <div className="p-3 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg text-sm text-yellow-700 dark:text-yellow-300">
              <strong>Note:</strong> This is a system suggestion based on behavioral analysis. 
              Please review the evidence carefully before confirming or rejecting.
            </div>
          </div>
        ) : null}
        
        <DialogFooter className="gap-2 sm:gap-0">
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={processing}
          >
            Cancel
          </Button>
          <Button 
            variant="destructive"
            onClick={handleReject}
            disabled={processing || loading}
          >
            {processing ? (
              <Loader2 className="w-4 h-4 animate-spin mr-1" />
            ) : (
              <X className="w-4 h-4 mr-1" />
            )}
            Reject
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={processing || loading}
            className="bg-green-600 hover:bg-green-700"
          >
            {processing ? (
              <Loader2 className="w-4 h-4 animate-spin mr-1" />
            ) : (
              <Check className="w-4 h-4 mr-1" />
            )}
            Confirm Relationship
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ClusterReviewModal;
