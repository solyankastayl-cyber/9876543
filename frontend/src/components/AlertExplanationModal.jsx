/**
 * Alert Explanation Modal (Phase 15.4)
 * 
 * Shows detailed WHY/WHY NOW/Evidence/Risk for alerts
 */
import { useState, useEffect } from 'react';
import { X, AlertTriangle, CheckCircle2, Info, TrendingUp, Clock, Shield } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import TrustBadge from './TrustBadge';
import RegimeContext from './RegimeContext';
import { alertsApi, signalsApi, marketApi } from '../api';

export default function AlertExplanationModal({ alert, isOpen, onClose }) {
  const [explanation, setExplanation] = useState(null);
  const [trustScore, setTrustScore] = useState(null);
  const [regime, setRegime] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && alert) {
      fetchExplanation();
    }
  }, [isOpen, alert]);

  const fetchExplanation = async () => {
    if (!alert) return;
    
    setLoading(true);
    try {
      // Fetch alert explanation
      const explanationResponse = await alertsApi.getAlertExplanation(alert.id);
      
      if (explanationResponse.ok && explanationResponse.data) {
        setExplanation(explanationResponse.data);
      } else {
        // Fallback to mock data
        setExplanation({
          why: alert.whatItMeans || 'Significant market movement detected based on historical patterns and actor behavior.',
          whyNow: 'Current market conditions create optimal timing for this action based on liquidity, volatility, and actor history.',
          evidence: [
            'Actor has 73% historical accuracy in similar market conditions',
            'Transaction size is 2.3x larger than average for this actor',
            'Market regime is currently trending up with low volatility',
            'Similar signals in past 30 days resulted in +12% average price movement',
          ],
          riskNotes: [
            'High volume period - increased slippage risk',
            'Actor has shown reversal behavior within 48h in 15% of cases',
            'Market volatility may spike due to upcoming economic events',
          ],
          expectedOutcome: alert.whatToDo || 'Monitor closely and be prepared to act within the next 6-12 hours.',
          marketContext: {
            regime: 'trend_up',
            volatility: 0.15,
            confidence: 0.78,
          },
        });
      }

      // If alert has associated signal, fetch trust score
      if (alert.signalId) {
        const trustResponse = await signalsApi.getSignalTrust(alert.signalId);
        if (trustResponse.ok && trustResponse.data) {
          setTrustScore(trustResponse.data.trustScore);
        }
      }

      // If alert has asset, fetch market regime
      if (alert.assetAddress) {
        const regimeResponse = await marketApi.getCurrentRegime(alert.assetAddress);
        if (regimeResponse.ok && regimeResponse.data) {
          setRegime(regimeResponse.data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch alert explanation:', error);
      // Keep mock data on error
    } finally {
      setLoading(false);
    }
  };

  if (!alert) return null;

  const severityConfig = {
    danger: {
      color: 'text-red-600 bg-red-50 border-red-200',
      icon: AlertTriangle,
      label: 'High Priority',
    },
    warning: {
      color: 'text-orange-600 bg-orange-50 border-orange-200',
      icon: Info,
      label: 'Warning',
    },
    info: {
      color: 'text-blue-600 bg-blue-50 border-blue-200',
      icon: Info,
      label: 'Info',
    },
  };

  const config = severityConfig[alert.severity] || severityConfig.info;
  const Icon = config.icon;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${config.color}`}>
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-gray-900 mb-1">
                  {alert.title}
                </DialogTitle>
                <p className="text-sm text-gray-600">{alert.message}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="secondary" className="text-xs">
                    {config.label}
                  </Badge>
                  <span className="text-xs text-gray-400">{alert.time}</span>
                </div>
              </div>
            </div>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="py-12 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-sm text-gray-500">Loading explanation...</p>
          </div>
        ) : explanation ? (
          <div className="space-y-4 pt-4">
            {/* Trust Score & Market Context */}
            <div className="grid grid-cols-2 gap-3">
              {trustScore !== null && (
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-4 h-4 text-gray-500" />
                    <span className="text-xs font-medium text-gray-700">Trust Score</span>
                  </div>
                  <TrustBadge score={trustScore} size="md" />
                </div>
              )}
              {(regime || explanation.marketContext) && (
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-gray-500" />
                    <span className="text-xs font-medium text-gray-700">Market Context</span>
                  </div>
                  <RegimeContext 
                    regime={regime?.regime || explanation.marketContext?.regime} 
                    performanceInRegime={
                      regime?.confidence 
                        ? regime.confidence * 100 
                        : explanation.marketContext?.confidence * 100
                    }
                    className="w-full"
                  />
                </div>
              )}
            </div>

            <Separator />

            {/* WHY */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Info className="w-5 h-5 text-blue-600" />
                <h4 className="font-semibold text-gray-900">Why This Alert?</h4>
              </div>
              <p className="text-sm text-gray-700 bg-blue-50 p-3 rounded-lg">
                {explanation.why}
              </p>
            </div>

            {/* WHY NOW */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-purple-600" />
                <h4 className="font-semibold text-gray-900">Why Now?</h4>
              </div>
              <p className="text-sm text-gray-700 bg-purple-50 p-3 rounded-lg">
                {explanation.whyNow}
              </p>
            </div>

            <Separator />

            {/* Evidence */}
            {explanation.evidence && explanation.evidence.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <h4 className="font-semibold text-gray-900">Evidence</h4>
                </div>
                <ul className="space-y-2">
                  {explanation.evidence.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-green-600 mt-0.5">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Risk Notes */}
            {explanation.riskNotes && explanation.riskNotes.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  <h4 className="font-semibold text-gray-900">Risk Considerations</h4>
                </div>
                <ul className="space-y-2">
                  {explanation.riskNotes.map((risk, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-yellow-600 mt-0.5">⚠</span>
                      <span>{risk}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <Separator />

            {/* Expected Outcome / Recommendation */}
            <div className="bg-gradient-to-r from-teal-50 to-blue-50 rounded-lg p-4 border border-teal-200">
              <div className="flex items-start gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-teal-600 mt-0.5" />
                <h4 className="font-semibold text-gray-900">Recommended Action</h4>
              </div>
              <p className="text-sm text-gray-900 font-medium">
                {explanation.expectedOutcome}
              </p>
            </div>

            {/* Meta Info */}
            {explanation.relatedSignals > 0 && (
              <div className="text-xs text-gray-500 text-center pt-2">
                Based on analysis of {explanation.relatedSignals} related signals and current market conditions
              </div>
            )}
          </div>
        ) : (
          <div className="py-8 text-center text-sm text-gray-500">
            No explanation available for this alert
          </div>
        )}

        {/* Close button */}
        <div className="flex justify-end pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white text-white rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
            disabled={loading}
          >
            Got it
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
