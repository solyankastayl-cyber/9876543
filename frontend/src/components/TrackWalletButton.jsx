/**
 * TrackWalletButton (P0)
 * 
 * Button to add wallet to watchlist
 * COPIED FROM TrackTokenButton - same logic, type='wallet'
 */
import React, { useState, useEffect } from 'react';
import { Star, Check, Loader2, Bell } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { addToWatchlist, getWatchlist } from '../api/watchlist.api';

export function TrackWalletButton({ 
  walletAddress,
  walletLabel,
  chain = 'Ethereum',
  onCreateAlert,
  className = '',
}) {
  const [isTracked, setIsTracked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  
  // Check if already tracked
  useEffect(() => {
    if (!walletAddress) {
      setChecking(false);
      return;
    }
    
    const checkTracked = async () => {
      try {
        const response = await getWatchlist('wallet');
        if (response?.ok && response.data) {
          const isInWatchlist = response.data.some(
            item => item.target?.address?.toLowerCase() === walletAddress.toLowerCase()
          );
          setIsTracked(isInWatchlist);
        }
      } catch (err) {
        console.error('Error checking watchlist:', err);
      } finally {
        setChecking(false);
      }
    };
    
    checkTracked();
  }, [walletAddress]);
  
  const handleTrack = async () => {
    if (!walletAddress || loading || isTracked) return;
    
    setLoading(true);
    try {
      const response = await addToWatchlist({
        type: 'wallet',
        target: {
          address: walletAddress,
          chain,
          label: walletLabel,
        },
      });
      
      if (response?.ok) {
        setIsTracked(true);
      }
    } catch (err) {
      console.error('Error adding to watchlist:', err);
    } finally {
      setLoading(false);
    }
  };
  
  if (checking) {
    return (
      <div className={`flex gap-2 ${className}`}>
        <Button variant="outline" size="sm" disabled>
          <Loader2 className="w-4 h-4 animate-spin" />
        </Button>
      </div>
    );
  }
  
  return (
    <div className={`flex gap-2 ${className}`}>
      {isTracked ? (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge className="bg-green-100 text-green-700 border-green-200 cursor-default">
                <Check className="w-3 h-3 mr-1" />
                Tracked
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">This wallet is in your watchlist</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleTrack}
          disabled={loading}
          data-testid="track-wallet-button"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin mr-1" />
          ) : (
            <Star className="w-4 h-4 mr-1" />
          )}
          Track
        </Button>
      )}
      
      {/* Create Alert Button - always available */}
      {onCreateAlert && (
        <Button 
          variant="default" 
          size="sm" 
          onClick={onCreateAlert}
          className="bg-purple-600 hover:bg-purple-700"
          data-testid="create-wallet-alert-button"
        >
          <Bell className="w-4 h-4 mr-1" />
          Set Alert
        </Button>
      )}
    </div>
  );
}

export default TrackWalletButton;
