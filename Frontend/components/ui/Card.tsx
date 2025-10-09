import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  gradient?: boolean;
  padding?: "sm" | "md" | "lg";
  onClick?: () => void;
}

export default function Card({ 
  children, 
  className = "", 
  hover = false, 
  gradient = false,
  padding = "md",
  onClick 
}: CardProps) {
  const paddingClasses = {
    sm: "p-3 sm:p-4",
    md: "p-4 sm:p-6", 
    lg: "p-6 sm:p-8"
  };

  const baseClasses = `
    bg-white dark:bg-slate-800 
    rounded-2xl 
    border border-slate-200 dark:border-slate-700 
    shadow-sm
    transition-all duration-200 ease-out
    ${paddingClasses[padding]}
    ${hover ? "hover:shadow-md hover:scale-[1.02] hover:border-slate-300 dark:hover:border-slate-600" : ""}
    ${gradient ? "bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900" : ""}
    ${onClick ? "cursor-pointer" : ""}
    ${className}
  `;

  return (
    <div className={baseClasses} onClick={onClick}>
      {children}
    </div>
  );
}