import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";

interface ButtonProps {
  children: ReactNode;
  variant?: "primary" | "secondary" | "success" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  icon?: LucideIcon;
  iconPosition?: "left" | "right";
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  className?: string;
}

export default function Button({
  children,
  variant = "primary",
  size = "md",
  icon: Icon,
  iconPosition = "left",
  disabled = false,
  loading = false,
  onClick,
  className = ""
}: ButtonProps) {
  const variants = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white border-blue-600 hover:border-blue-700 shadow-sm hover:shadow-md",
    secondary: "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200 hover:border-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-200 dark:border-slate-600",
    success: "bg-green-600 hover:bg-green-700 text-white border-green-600 hover:border-green-700 shadow-sm hover:shadow-md",
    danger: "bg-red-600 hover:bg-red-700 text-white border-red-600 hover:border-red-700 shadow-sm hover:shadow-md",
    ghost: "bg-transparent hover:bg-slate-100 text-slate-600 border-transparent hover:border-slate-200 dark:hover:bg-slate-800 dark:text-slate-400 dark:hover:border-slate-700"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base"
  };

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-4 h-4", 
    lg: "w-5 h-5"
  };

  const baseClasses = `
    inline-flex items-center justify-center gap-2
    font-medium rounded-lg border
    transition-all duration-200 ease-out
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
    transform hover:scale-105 active:scale-95
    ${variants[variant]}
    ${sizes[size]}
    ${disabled || loading ? "opacity-50 cursor-not-allowed hover:scale-100" : ""}
    ${className}
  `;

  return (
    <button
      className={baseClasses}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading ? (
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
      ) : (
        <>
          {Icon && iconPosition === "left" && <Icon className={iconSizes[size]} />}
          {children}
          {Icon && iconPosition === "right" && <Icon className={iconSizes[size]} />}
        </>
      )}
    </button>
  );
}