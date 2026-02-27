import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatAddress(address, chars = 6) {
  if (!address) return '';
  return `${address.slice(0, chars)}...${address.slice(-4)}`;
}

export function formatUSD(value) {
  if (value === null || value === undefined) return '$0.00';
  
  if (value >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(2)}B`;
  }
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(2)}M`;
  }
  if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(2)}K`;
  }
  return `$${value.toFixed(2)}`;
}

export function formatNumber(value) {
  if (value === null || value === undefined) return '0';
  
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(2)}B`;
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(2)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(2)}K`;
  }
  return value.toFixed(2);
}

export function formatPercentage(value) {
  if (value === null || value === undefined) return '0%';
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

export function formatTimeAgo(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);
  
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  
  return date.toLocaleDateString();
}

export function getNetworkColor(network) {
  const colors = {
    ethereum: '#627EEA',
    bsc: '#F3BA2F',
    polygon: '#8247E5',
    arbitrum: '#2D374B',
  };
  return colors[network] || '#64748b';
}

export function getNetworkName(network) {
  const names = {
    ethereum: 'Ethereum',
    bsc: 'BNB Chain',
    polygon: 'Polygon',
    arbitrum: 'Arbitrum',
  };
  return names[network] || network;
}

export function getEntityTypeColor(type) {
  const colors = {
    exchange: '#627EEA',
    wallet: '#64748b',
    contract: '#10b981',
    pool: '#8b5cf6',
    protocol: '#f59e0b',
  };
  return colors[type] || '#64748b';
}

export function getSeverityClass(severity) {
  const classes = {
    normal: 'severity-normal',
    important: 'severity-important',
    critical: 'severity-critical',
  };
  return classes[severity] || 'severity-normal';
}

export function getChainBadgeClass(network) {
  const classes = {
    ethereum: 'chain-badge-ethereum',
    bsc: 'chain-badge-bsc',
    polygon: 'chain-badge-polygon',
    arbitrum: 'chain-badge-arbitrum',
  };
  return classes[network] || 'chain-badge-ethereum';
}

export function copyToClipboard(text) {
  navigator.clipboard.writeText(text);
}

export function getTxTypeLabel(type) {
  const labels = {
    transfer: 'Transfer',
    swap: 'Swap',
    mint: 'Mint',
    burn: 'Burn',
    contract_interaction: 'Contract',
  };
  return labels[type] || type;
}

export function getAlertTypeLabel(type) {
  const labels = {
    whale_movement: 'Whale Movement',
    liquidity_risk: 'Liquidity Risk',
    exchange_inflow: 'Exchange Inflow',
    suspicious_activity: 'Suspicious Activity',
  };
  return labels[type] || type;
}
