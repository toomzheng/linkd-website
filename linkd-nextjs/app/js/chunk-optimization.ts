import React from 'react';

// Preconnect to required origins
export const preconnectOrigins = () => {
  const origins = ['https://www.googletagmanager.com'];
  
  origins.forEach(origin => {
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = origin;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  });
};

// Dynamic import for components that might not be needed immediately
export const lazyLoadComponent = (componentImport) => {
  return React.lazy(() => {
    // Add a small delay for non-critical components
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(componentImport());
      }, 100);
    });
  });
};

// This function will be called on client side only
export const optimizePageLoad = () => {
  // Don't run during SSR
  if (typeof window === 'undefined') return;
  
  // Use requestIdleCallback to defer non-critical operations
  if (window.requestIdleCallback) {
    window.requestIdleCallback(() => {
      preconnectOrigins();
    });
  } else {
    setTimeout(preconnectOrigins, 1000);
  }
  
  // Remove unused event listeners when components unmount
  return () => {
    // Cleanup code here
  };
}; 