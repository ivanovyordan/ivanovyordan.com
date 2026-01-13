import React from 'react';

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const Container: React.FC<ContainerProps> = ({ children, className = '', size = 'md' }) => {
  const maxWidths = {
    sm: 'max-w-3xl',
    md: 'max-w-4xl',
    lg: 'max-w-6xl'
  };

  return (
    <div className={`${maxWidths[size]} mx-auto px-6 ${className}`}>
      {children}
    </div>
  );
};

export default Container;
