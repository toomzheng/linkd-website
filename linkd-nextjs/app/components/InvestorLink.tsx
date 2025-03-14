import React from 'react';

const InvestorLink = () => {
  return (
    <div className="investor-link-container mt-[0.2rem] mb-[0.5rem] flex items-center flex-wrap gap-[0px]">
      <span>for interested investors:</span>
      <a href="https://forms.gle/GqVntDRGpTAGo4XN9" className="investor-link inline-flex items-center p-[4px_10px] rounded-[12px] font-[var(--font-family)] text-[0.95rem] no-underline transition-opacity hover:opacity-70 gap-[8px]" target="_blank" rel="noopener noreferrer">
        <span><b>intro us here</b></span>
        <svg className="share-icon w-[16px] h-[16px] opacity-50 transition-all" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="18" cy="5" r="3"></circle>
          <circle cx="6" cy="12" r="3"></circle>
          <circle cx="18" cy="19" r="3"></circle>
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
        </svg>
      </a>
    </div>
  );
};

export default InvestorLink; 