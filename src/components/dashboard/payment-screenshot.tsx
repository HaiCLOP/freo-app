"use client";

import React, { useState } from "react";

export function PaymentScreenshot({ src }: { src: string }) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors">
        <svg className="w-6 h-6 mb-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
        </svg>
        <span className="text-[10px] font-bold text-center uppercase tracking-wider">Open<br/>Link</span>
      </div>
    );
  }

  return (
    <img 
      src={src}
      alt="Payment Screenshot"
      className="object-cover w-full h-full hover:opacity-80 transition-opacity"
      onError={() => setHasError(true)}
    />
  );
}
