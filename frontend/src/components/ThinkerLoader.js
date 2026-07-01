import React from 'react';

const ThinkerLoader = ({ className = 'thinker-loader' }) => {
  return (
    <svg
      className={className}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      {/* Doodle-style animated loader - a little face thinking */}
      <circle className="thinker-loader__stroke" cx="10" cy="10" r="4.75" />
      <path
        className="thinker-loader__stroke"
        d="M6.5 18.25c2.2 1.5 8.8 1.5 11 0"
        strokeLinecap="round"
      />
      <circle className="thinker-loader__dot" cx="18" cy="6" r="1.25" />
      {/* Doodle sparkle */}
      <circle className="thinker-loader__sparkle" cx="4" cy="4" r="0.8" />
      <circle className="thinker-loader__sparkle" cx="20" cy="18" r="0.6" />
    </svg>
  );
};

export default ThinkerLoader;