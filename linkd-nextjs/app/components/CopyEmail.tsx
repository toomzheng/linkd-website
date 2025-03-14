'use client';

import React, { useState } from 'react';

interface CopyEmailProps {
  email: string;
  children: React.ReactNode;
}

const CopyEmail = ({ email, children }: CopyEmailProps) => {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      
      // Reset after 666ms
      setTimeout(() => {
        setCopied(false);
      }, 666);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };
  
  return (
    <a 
      href="#" 
      onClick={handleCopy}
      className="copy-email cursor-pointer text-inherit no-underline transition-opacity hover:opacity-70 hover:no-underline inline-flex items-center gap-[5px]"
    >
      {copied ? 'copied!' : (
        <>
          {children}
          <svg 
            className="copy-icon w-[14px] h-[14px] opacity-60 transition-opacity" 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
        </>
      )}
    </a>
  );
};

export default CopyEmail; 