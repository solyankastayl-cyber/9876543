/**
 * Exchange Micro-Animations
 * 
 * Extended animation library for FomoAI design system
 * Includes: fadeIn, slideUp, pulse, shimmer, bounce, scale, glow effects
 */

// Inject global animations once
export function injectExchangeAnimations() {
  if (typeof document === 'undefined') return;
  if (document.getElementById('exchange-micro-animations')) return;
  
  const style = document.createElement('style');
  style.id = 'exchange-micro-animations';
  style.textContent = `
    /* ═══════════════════════════════════════════════════════════════
       BASE ANIMATIONS
    ═══════════════════════════════════════════════════════════════ */
    
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    @keyframes fadeInScale {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }
    
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(12px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    @keyframes slideDown {
      from { opacity: 0; transform: translateY(-12px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    @keyframes slideInLeft {
      from { opacity: 0; transform: translateX(-20px); }
      to { opacity: 1; transform: translateX(0); }
    }
    
    @keyframes slideInRight {
      from { opacity: 0; transform: translateX(20px); }
      to { opacity: 1; transform: translateX(0); }
    }
    
    /* ═══════════════════════════════════════════════════════════════
       PULSE & GLOW EFFECTS
    ═══════════════════════════════════════════════════════════════ */
    
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    
    @keyframes pulseSoft {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.8; transform: scale(0.98); }
    }
    
    @keyframes pulseGlow {
      0%, 100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4); }
      50% { box-shadow: 0 0 0 8px rgba(59, 130, 246, 0); }
    }
    
    @keyframes pulseGlowGreen {
      0%, 100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4); }
      50% { box-shadow: 0 0 0 8px rgba(34, 197, 94, 0); }
    }
    
    @keyframes pulseGlowRed {
      0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
      50% { box-shadow: 0 0 0 8px rgba(239, 68, 68, 0); }
    }
    
    @keyframes pulseGlowOrange {
      0%, 100% { box-shadow: 0 0 0 0 rgba(249, 115, 22, 0.4); }
      50% { box-shadow: 0 0 0 8px rgba(249, 115, 22, 0); }
    }
    
    /* ═══════════════════════════════════════════════════════════════
       SHIMMER & LOADING EFFECTS
    ═══════════════════════════════════════════════════════════════ */
    
    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
    
    @keyframes shimmerSoft {
      0% { opacity: 0.5; }
      50% { opacity: 1; }
      100% { opacity: 0.5; }
    }
    
    @keyframes gradientShift {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
    
    /* ═══════════════════════════════════════════════════════════════
       BOUNCE & SPRING EFFECTS
    ═══════════════════════════════════════════════════════════════ */
    
    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-4px); }
    }
    
    @keyframes bounceSoft {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-2px); }
    }
    
    @keyframes wiggle {
      0%, 100% { transform: rotate(0deg); }
      25% { transform: rotate(-3deg); }
      75% { transform: rotate(3deg); }
    }
    
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-2px); }
      75% { transform: translateX(2px); }
    }
    
    /* ═══════════════════════════════════════════════════════════════
       SCALE EFFECTS
    ═══════════════════════════════════════════════════════════════ */
    
    @keyframes scaleIn {
      from { opacity: 0; transform: scale(0.9); }
      to { opacity: 1; transform: scale(1); }
    }
    
    @keyframes pop {
      0% { transform: scale(1); }
      50% { transform: scale(1.05); }
      100% { transform: scale(1); }
    }
    
    /* ═══════════════════════════════════════════════════════════════
       SPINNER EFFECTS
    ═══════════════════════════════════════════════════════════════ */
    
    @keyframes spinSlow {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    
    @keyframes spinReverse {
      from { transform: rotate(360deg); }
      to { transform: rotate(0deg); }
    }
    
    /* ═══════════════════════════════════════════════════════════════
       NUMBER COUNT EFFECT
    ═══════════════════════════════════════════════════════════════ */
    
    @keyframes countUp {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    /* ═══════════════════════════════════════════════════════════════
       UTILITY CLASSES
    ═══════════════════════════════════════════════════════════════ */
    
    /* Card Hover Effects */
    .card-hover {
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .card-hover:hover {
      transform: translateY(-3px);
      box-shadow: 0 12px 28px -8px rgba(0, 0, 0, 0.12);
    }
    
    /* Button Hover Effects */
    .btn-hover {
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .btn-hover:hover {
      transform: translateY(-1px) scale(1.02);
    }
    .btn-hover:active {
      transform: translateY(0) scale(0.98);
    }
    
    /* Icon Hover Effects */
    .icon-hover {
      transition: all 0.2s ease;
    }
    .icon-hover:hover {
      transform: scale(1.15);
    }
    
    /* Badge Pulse */
    .badge-pulse {
      animation: pulseSoft 2s ease-in-out infinite;
    }
    
    /* Live Indicator */
    .live-indicator {
      animation: pulse 1.5s ease-in-out infinite;
    }
    
    /* Glow Effects */
    .glow-blue {
      animation: pulseGlow 2s ease-in-out infinite;
    }
    .glow-green {
      animation: pulseGlowGreen 2s ease-in-out infinite;
    }
    .glow-red {
      animation: pulseGlowRed 2s ease-in-out infinite;
    }
    .glow-orange {
      animation: pulseGlowOrange 2s ease-in-out infinite;
    }
    
    /* Shimmer Loading */
    .shimmer {
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s ease-in-out infinite;
    }
    
    /* Gradient Animation */
    .gradient-animate {
      background-size: 200% 200%;
      animation: gradientShift 3s ease infinite;
    }
    
    /* Bounce on Hover */
    .bounce-hover:hover {
      animation: bounceSoft 0.3s ease;
    }
    
    /* Wiggle on Hover */
    .wiggle-hover:hover {
      animation: wiggle 0.3s ease;
    }
    
    /* Pop on Click */
    .pop-click:active {
      animation: pop 0.15s ease;
    }
    
    /* Stagger Animation Delays */
    .stagger-1 { animation-delay: 50ms; }
    .stagger-2 { animation-delay: 100ms; }
    .stagger-3 { animation-delay: 150ms; }
    .stagger-4 { animation-delay: 200ms; }
    .stagger-5 { animation-delay: 250ms; }
    .stagger-6 { animation-delay: 300ms; }
    .stagger-7 { animation-delay: 350ms; }
    .stagger-8 { animation-delay: 400ms; }
    
    /* Number Animation */
    .number-animate {
      animation: countUp 0.4s ease-out forwards;
    }
    
    /* Fade Animations */
    .animate-fadeIn { animation: fadeIn 0.4s ease-out forwards; }
    .animate-fadeInScale { animation: fadeInScale 0.3s ease-out forwards; }
    .animate-slideUp { animation: slideUp 0.5s ease-out forwards; }
    .animate-slideDown { animation: slideDown 0.5s ease-out forwards; }
    .animate-slideInLeft { animation: slideInLeft 0.4s ease-out forwards; }
    .animate-slideInRight { animation: slideInRight 0.4s ease-out forwards; }
    .animate-scaleIn { animation: scaleIn 0.3s ease-out forwards; }
    
    /* Progress Bar Animation */
    .progress-animate {
      transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    /* Table Row Hover */
    .row-hover {
      transition: all 0.15s ease;
    }
    .row-hover:hover {
      background-color: rgba(59, 130, 246, 0.04);
      transform: scale(1.002);
    }
    
    /* Interactive Elements */
    .interactive {
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      cursor: pointer;
    }
    .interactive:hover {
      transform: translateY(-1px);
      filter: brightness(1.05);
    }
    .interactive:active {
      transform: translateY(0);
      filter: brightness(0.95);
    }
    
    /* Tooltip Animation */
    .tooltip-animate {
      animation: fadeInScale 0.15s ease-out;
    }
    
    /* Status Dot */
    .status-dot {
      position: relative;
    }
    .status-dot::after {
      content: '';
      position: absolute;
      inset: -2px;
      border-radius: 50%;
      animation: pulseGlow 2s ease-in-out infinite;
    }
    .status-dot.green::after {
      animation: pulseGlowGreen 2s ease-in-out infinite;
    }
    .status-dot.red::after {
      animation: pulseGlowRed 2s ease-in-out infinite;
    }
  `;
  document.head.appendChild(style);
}

// Animation style objects
export const animations = {
  fadeIn: { animation: 'fadeIn 0.4s ease-out forwards' },
  fadeInScale: { animation: 'fadeInScale 0.3s ease-out forwards' },
  slideUp: { animation: 'slideUp 0.5s ease-out forwards' },
  slideDown: { animation: 'slideDown 0.5s ease-out forwards' },
  slideInLeft: { animation: 'slideInLeft 0.4s ease-out forwards' },
  slideInRight: { animation: 'slideInRight 0.4s ease-out forwards' },
  scaleIn: { animation: 'scaleIn 0.3s ease-out forwards' },
};

// Staggered animation helper
export function getStaggerDelay(index, baseDelay = 50) {
  return { animationDelay: `${index * baseDelay}ms` };
}

// Combined style helper
export function withAnimation(animationType, delay = 0) {
  return {
    ...animations[animationType],
    animationDelay: `${delay}ms`,
  };
}

export default injectExchangeAnimations;
