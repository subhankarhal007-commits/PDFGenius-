import React, { useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';

export type AdsterraAdType = 
  | 'socialBar' 
  | 'banner728x90' 
  | 'banner300x250' 
  | 'banner320x50' 
  | 'nativeBanner' 
  | 'popunder';

interface AdsterraSlotProps {
  type: AdsterraAdType;
  className?: string;
}

export const AdsterraSlot: React.FC<AdsterraSlotProps> = ({ type, className = '' }) => {
  const { siteSettings } = useApp();
  const containerRef = useRef<HTMLDivElement | null>(null);

  const adConfig = siteSettings.adsterraAds?.[type];
  const isEnabled = Boolean(adConfig?.enabled && adConfig?.code?.trim());
  const adCode = adConfig?.code?.trim() || '';

  useEffect(() => {
    if (!isEnabled || !containerRef.current || !adCode) return;

    const container = containerRef.current;
    container.innerHTML = '';

    // If adCode contains script tags, execute them safely in DOM
    if (adCode.includes('<script')) {
      // Create a temporary DOM parser
      const parser = new DOMParser();
      const doc = parser.parseFromString(adCode, 'text/html');

      // 1. Append non-script nodes
      Array.from(doc.body.childNodes).forEach((node) => {
        if (node.nodeName !== 'SCRIPT') {
          container.appendChild(node.cloneNode(true));
        }
      });

      // 2. Re-create and execute script tags
      const scripts = doc.querySelectorAll('script');
      scripts.forEach((oldScript) => {
        const newScript = document.createElement('script');
        // Copy attributes
        Array.from(oldScript.attributes).forEach((attr) => {
          newScript.setAttribute(attr.name, attr.value);
        });
        // Copy inline code
        if (oldScript.innerHTML) {
          newScript.innerHTML = oldScript.innerHTML;
        }
        container.appendChild(newScript);
      });
    } else if (adCode.startsWith('http://') || adCode.startsWith('https://') || adCode.startsWith('//')) {
      // Direct Link / SmartLink format
      const isBanner = type.includes('banner');
      const sizeClasses = 
        type === 'banner728x90' ? 'w-[728px] max-w-full h-[90px]' :
        type === 'banner300x250' ? 'w-[300px] h-[250px]' :
        type === 'banner320x50' ? 'w-[320px] max-w-full h-[50px]' :
        'w-full max-w-2xl py-6';

      const a = document.createElement('a');
      a.href = adCode;
      a.target = '_blank';
      a.rel = 'noopener noreferrer nofollow';
      a.className = `flex flex-col items-center justify-center bg-gradient-to-r from-emerald-600 via-teal-600 to-purple-600 text-white rounded-xl shadow-md p-3 text-center transition-transform hover:scale-[1.01] ${sizeClasses}`;
      a.innerHTML = `
        <span class="text-[9px] font-mono tracking-wider uppercase opacity-80 mb-0.5">Sponsored Partner</span>
        <span class="text-xs sm:text-sm font-bold underline">Click here to visit our verified sponsor &rarr;</span>
      `;
      container.appendChild(a);
    } else {
      // Plain HTML or iframe code
      container.innerHTML = adCode;
    }

    return () => {
      if (container) {
        container.innerHTML = '';
      }
    };
  }, [isEnabled, adCode, type]);

  if (!isEnabled) return null;

  // Render specific layout containers based on ad type
  if (type === 'popunder') {
    return <div ref={containerRef} className="hidden" aria-hidden="true" />;
  }

  if (type === 'socialBar') {
    return (
      <div 
        ref={containerRef} 
        className="fixed bottom-4 right-4 z-50 max-w-sm pointer-events-auto shadow-2xl animate-in slide-in-from-bottom-4 duration-300"
      />
    );
  }

  // Dimension helpers for banners
  const getContainerStyles = () => {
    switch (type) {
      case 'banner728x90':
        return 'hidden md:flex min-h-[90px] w-full max-w-[728px] mx-auto justify-center items-center my-4 overflow-hidden';
      case 'banner300x250':
        return 'flex min-h-[250px] w-full max-w-[300px] mx-auto justify-center items-center my-4 overflow-hidden';
      case 'banner320x50':
        return 'flex md:hidden min-h-[50px] w-full max-w-[320px] mx-auto justify-center items-center my-2 overflow-hidden';
      case 'nativeBanner':
        return 'w-full max-w-5xl mx-auto my-6 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 shadow-xs';
      default:
        return 'my-2 mx-auto flex justify-center';
    }
  };

  return (
    <div className={`adsterra-ad-container ${getContainerStyles()} ${className}`}>
      <div className="flex flex-col items-center w-full">
        <span className="text-[9px] font-mono tracking-widest text-slate-400 uppercase mb-1">
          Advertisement
        </span>
        <div ref={containerRef} className="flex justify-center items-center overflow-hidden" />
      </div>
    </div>
  );
};
