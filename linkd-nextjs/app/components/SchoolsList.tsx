import React from 'react';

const SchoolsList = () => {
  return (
    <div className="schools-list mb-[22px] text-center">
      <p>
        <a href="https://berkeley.uselinkd.com/" target="_blank" rel="noopener noreferrer" className="school-link"><u>berkeley</u></a>
        {' | '}
        <a href="https://stanford.uselinkd.com/" target="_blank" rel="noopener noreferrer" className="school-link"><u>stanford</u></a>
        {' | '}
        <a href="https://yale.uselinkd.com/" target="_blank" rel="noopener noreferrer" className="school-link"><u>yale</u></a>
        {' | '}
        <a href="https://columbia.uselinkd.com/" target="_blank" rel="noopener noreferrer" className="school-link"><u>columbia</u></a>
        {' | '}
        <a href="https://utoronto.uselinkd.com/" target="_blank" rel="noopener noreferrer" className="school-link"><u>utoronto</u></a>
        {' | '}
        <a href="https://upenn-frontend-production.up.railway.app/" target="_blank" rel="noopener noreferrer" className="school-link"><u>upenn</u></a>
        {' | '}
        <u>waterloo (next!)</u>
      </p>
    </div>
  );
};

export default SchoolsList;