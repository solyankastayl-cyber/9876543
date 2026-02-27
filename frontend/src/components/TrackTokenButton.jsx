/**
 * TrackTokenButton (P0)
 * 
 * Button to add token to watchlist
 * Shows "Tracked" badge after adding
 */
import React, { useState, useEffect } from 'react';
import { Star, Check, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { addToWatchlist, getWatchlist } from '../api/watchlist.api';

export function TrackTokenButton({ 
  tokenAddress,
  tokenSymbol,
  tokenName,
  chain = 'Ethereum',
  className = '',
}) {
  const [isTracked, setIsTracked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  
  // Check if already tracked
  useEffect(() => {
    if (!tokenAddress) {
      setChecking(false);
      return;
    }
    
    const checkTracked = async () => {
      try {
        const response = await getWatchlist('token');
        if (response?.ok && response.data) {
          const isInWatchlist = response.data.some(
            item => item.target?.address?.toLowerCase() === tokenAddress.toLowerCase()
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
  }, [tokenAddress]);
  
  const handleTrack = async () => {
    if (!tokenAddress || loading || isTracked) return;
    
    setLoading(true);
    try {
      const response = await addToWatchlist({
        type: 'token',
        target: {
          address: tokenAddress,
          chain,
          symbol: tokenSymbol,
          name: tokenName,
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
      <Button variant="outline" size="sm" disabled className={className}>
        <Loader2 className="w-4 h-4 animate-spin" />
      </Button>
    );
  }
  
  if (isTracked) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge className="bg-green-100 text-green-700 border-green-200 cursor-default">
              <Check className="w-3 h-3 mr-1" />
              Tracked
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">This token is in your watchlist</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={handleTrack}
      disabled={loading}
      className={className}
      data-testid="track-token-button"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin mr-1" />
      ) : (
        <Star className="w-4 h-4 mr-1" />
      )}
      Track Token
    </Button>
  );
}

export default TrackTokenButton;
