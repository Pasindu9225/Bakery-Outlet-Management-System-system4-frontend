import React from 'react';

const Skeleton = ({ className, variant = 'text', width, height }) => {
  const baseClass = "bg-line animate-pulse rounded";
  
  const variants = {
    text: "h-4 w-full mb-2",
    title: "h-6 w-3/4 mb-4",
    circle: "rounded-full",
    rect: "w-full h-full",
  };

  const style = {
    width: width,
    height: height,
  };

  return (
    <div 
      className={`${baseClass} ${variants[variant] || ''} ${className || ''}`}
      style={style}
    />
  );
};

export const DashboardSkeleton = () => (
  <div className="space-y-4 p-4">
    <Skeleton variant="title" width="40%" />
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Skeleton height="100px" />
      <Skeleton height="100px" />
      <Skeleton height="100px" />
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Skeleton variant="title" width="30%" />
        <Skeleton height="200px" />
      </div>
      <div className="space-y-2">
        <Skeleton variant="title" width="30%" />
        <Skeleton height="200px" />
      </div>
    </div>
  </div>
);

export default Skeleton;
