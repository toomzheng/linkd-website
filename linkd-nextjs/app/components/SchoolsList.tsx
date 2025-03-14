import React from 'react';

const SchoolsList = () => {
  return (
    <div className="schools-list mb-[22px] text-center">
      <p>
        <a href="https://berkeley.uselinkd.com/" target="_blank" rel="noopener noreferrer" className="school-link"><b><u>berkeley</u></b></a>
        {' | '}
        <a href="https://stanford.uselinkd.com/" target="_blank" rel="noopener noreferrer" className="school-link"><b><u>stanford</u></b></a>
        {' | '}
        <a href="https://yale.uselinkd.com/" target="_blank" rel="noopener noreferrer" className="school-link"><b><u>yale</u></b></a>
        {' | '}
        <a href="https://columbia.uselinkd.com/" target="_blank" rel="noopener noreferrer" className="school-link"><b><u>columbia</u></b></a>
        {' | '}
        <a href="https://utoronto.uselinkd.com/" target="_blank" rel="noopener noreferrer" className="school-link"><b><u>utoronto</u></b></a>
        {' | '}
        <a href="https://upenn-frontend-production.up.railway.app/" target="_blank" rel="noopener noreferrer" className="school-link"><b><u>upenn</u></b></a>
        {' | '}
        <b><u>waterloo (next!)</u></b>
      </p>
    </div>
  );
};

export default SchoolsList;