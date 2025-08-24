import { ReactNode } from "react";

export const Card = ({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) => {
  return (
    <div className={`rounded-xl border border-gray-700 bg-gray-900 text-white shadow-md ${className}`}>
      {children}
    </div>
  );
};

export const CardContent = ({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) => {
  return <div className={`p-4 ${className}`}>{children}</div>;
};
