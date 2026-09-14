import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  color?: string;
  isExpired?: boolean;
  variant?: 'solid' | 'subtle' | 'outline';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  color = '#64748B',
  isExpired = false,
  variant = 'subtle',
  className = '',
}) => {
  if (isExpired) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200 ${className}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
        {children}
      </span>
    );
  }

  return (
    <span
      style={{
        backgroundColor: `${color}1A`, // 10% opacity
        color: color,
        borderColor: `${color}40`,
      }}
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${className}`}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      {children}
    </span>
  );
};
