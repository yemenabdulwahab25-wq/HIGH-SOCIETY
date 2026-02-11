import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  fullWidth = false,
  className = '', 
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-950 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-cannabis-600 hover:bg-cannabis-500 text-white focus:ring-cannabis-500",
    secondary: "bg-dark-800 hover:bg-dark-700 text-white border border-gray-700 focus:ring-gray-500",
    danger: "bg-red-600 hover:bg-red-500 text-white focus:ring-red-500",
    ghost: "bg-transparent hover:bg-white/10 text-gray-300 hover:text-white"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};