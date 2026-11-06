import React from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  className?: string;
  imageClassName?: string;
  textClassName?: string;
  subtextClassName?: string;
  size?: "sm" | "md" | "lg" | "xl";
  asLink?: boolean;
  to?: string;
  onClick?: () => void;
  showText?: boolean;
  subtitle?: string;
}

const sizeMap = {
  sm: { img: "w-6 h-6", text: "text-sm sm:text-base tracking-tight" },
  md: { img: "w-7 h-7 sm:w-8 sm:h-8", text: "text-base sm:text-lg md:text-xl tracking-tight" },
  lg: { img: "w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10", text: "text-lg sm:text-xl md:text-2xl tracking-tight" },
  xl: { img: "w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12", text: "text-xl sm:text-2xl md:text-3xl tracking-tight" },
};

export const BrandLogo: React.FC<BrandLogoProps> = ({
  className,
  imageClassName,
  textClassName,
  subtextClassName,
  size = "md",
  asLink = false,
  to = "/",
  onClick,
  showText = true,
  subtitle,
}) => {
  const currentSize = sizeMap[size];

  const content = (
    <div
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 sm:gap-2.5 group select-none shrink-0",
        onClick && "cursor-pointer",
        className
      )}
    >
      <img
        src="/logo.png"
        alt="ESCROW BMS Logo"
        className={cn(
          currentSize.img,
          "object-contain transition-transform duration-300 group-hover:scale-105 shrink-0",
          imageClassName
        )}
      />
      {showText && (
        <div className="flex flex-col leading-none shrink-0">
          <span
            className={cn(
              "font-sans font-black tracking-tight text-slate-900 dark:text-white leading-none whitespace-nowrap",
              currentSize.text,
              textClassName
            )}
          >
            ESCROW<span className="text-emerald-500">BMS</span>
          </span>
          {subtitle && (
            <span
              className={cn(
                "text-[8px] sm:text-[9px] font-bold text-slate-400 dark:text-slate-400 tracking-wider uppercase mt-0.5 sm:mt-1 truncate max-w-[150px]",
                subtextClassName
              )}
            >
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (asLink) {
    return (
      <Link to={to} className="inline-flex items-center focus:outline-none shrink-0">
        {content}
      </Link>
    );
  }

  return content;
};

export default BrandLogo;
