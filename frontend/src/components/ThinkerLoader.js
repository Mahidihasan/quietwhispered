import React from 'react';

const ThinkerLoader = ({ className = 'thinker-loader' }) => {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      <circle className="thinker-loader__stroke" cx="10" cy="10" r="4.75" />
      <path
        className="thinker-loader__stroke"
        d="M6.5 18.25c2.2 1.5 8.8 1.5 11 0"
        strokeLinecap="round"
      />
      <circle className="thinker-loader__dot" cx="18" cy="6" r="1.25" />
    </svg>
  );
};

export default ThinkerLoader;
