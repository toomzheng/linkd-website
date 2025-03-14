import React from 'react';

const InvestorLink = () => {
  return (
    <div className="investor-link-container mt-[0.2rem] mb-[0.5rem]">
      <p className="font-medium">
        for interested investors: <a href="https://forms.gle/GqVntDRGpTAGo4XN9" className="investor-link inline-flex items-center gap-[5px] no-underline transition-opacity hover:opacity-70" target="_blank" rel="noopener noreferrer">
          <b>intro us here</b>
          <svg className="share-icon w-[14px] h-[14px] opacity-60 transition-all" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="18" cy="5" r="3"></circle>
            <circle cx="6" cy="12" r="3"></circle>
            <circle cx="18" cy="19" r="3"></circle>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
          </svg>
        </a>
      </p>
    </div>
  );
};

export default InvestorLink; 