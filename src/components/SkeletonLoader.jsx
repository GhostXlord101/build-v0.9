import React from 'react';

export const TableSkeleton = ({ rows = 5, columns = 6 }) => (
  <div className="animate-pulse">
    <div className="bg-brand-surface rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-brand-violetDark p-4">
        <div className="grid grid-cols-6 gap-4">
          {Array.from({ length: columns }).map((_, i) => (
            <div key={i} className="h-4 bg-brand-violet/30 rounded"></div>
          ))}
        </div>
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="border-t border-brand-violetDark p-4">
          <div className="grid grid-cols-6 gap-4">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <div key={colIndex} className="h-4 bg-brand-violetDark/30 rounded"></div>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const CardSkeleton = ({ count = 3 }) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="bg-brand-surface rounded-lg p-6 border border-brand-violetDark">
        <div className="h-6 bg-brand-violetDark/30 rounded mb-4"></div>
        <div className="h-12 bg-brand-violetDark/30 rounded"></div>
      </div>
    ))}
  </div>
);

export const ListSkeleton = ({ items = 5 }) => (
  <div className="space-y-4 animate-pulse">
    {Array.from({ length: items }).map((_, i) => (
      <div key={i} className="bg-brand-surface rounded-lg p-4 border border-brand-violetDark">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-brand-violetDark/30 rounded-full"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-brand-violetDark/30 rounded w-3/4"></div>
            <div className="h-3 bg-brand-violetDark/30 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    ))}
  </div>
);