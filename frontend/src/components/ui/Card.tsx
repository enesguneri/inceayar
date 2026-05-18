import React from 'react';

export const Card: React.FC<{ children: React.ReactNode; className?: string; glass?: boolean }> = ({ 
  children, 
  className = '', 
  glass = true 
}) => {
  return (
    <div className={`rounded-2xl overflow-hidden transition-all duration-300 ${glass ? 'glass-dark' : 'bg-dark-surface border border-dark-border'} ${className}`}>
      {children}
    </div>
  );
};

export const CardHeader: React.FC<{ title: string; description?: string; action?: React.ReactNode; className?: string }> = ({ 
  title, 
  description, 
  action,
  className = '' 
}) => (
  <div className={`p-6 border-b border-white/5 flex justify-between items-start ${className}`}>
    <div>
      <h3 className="text-xl font-semibold text-white tracking-tight">{title}</h3>
      {description && <p className="text-slate-400 text-sm mt-1">{description}</p>}
    </div>
    {action && <div>{action}</div>}
  </div>
);

export const CardBody: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`p-6 ${className}`}>
    {children}
  </div>
);
