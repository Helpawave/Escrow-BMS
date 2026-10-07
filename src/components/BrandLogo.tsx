import React from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  className?: string;
  imageClassName?: string;
  textClassName?: string;
  size?: "sm" | "md" | "lg" | "xl";
  asLink?: boolean;
  to?: string;
  onClick?: () => void;
  showText?: boolean;
}

const sizeMap = {
  sm: { img: "w-6 h-6", text: "text-base tracking-tight" },
  md: { img: "w-7 h-7 md:w-8 md:h-8", text: "text-lg md:text-xl tracking-tight" },
  lg: { img: "w-9 h-9 md:w-10 md:h-10", text: "text-xl md:text-2xl tracking-tight" },
  xl: { img: "w-12 h-12", text: "text-2xl md:text-3xl tracking-tight" },
};

export const BrandLogo: React.FC<BrandLogoProps> = ({
  className,
  imageClassName,
  textClassName,
  size = "md",
  asLink = false,
  to = "/",
  onClick,
  showText = true,
}) => {
  const currentSize = sizeMap[size];

  const content = (
    <div
      onClick={onClick}
      className={cn("inline-flex items-center gap-2 group select-none", onClick && "cursor-pointer", className)}
    >
      <img
        src="/assets/images/e9085822-5bea-4642-b19e-dcfcde6248f7.png"
        alt="ESCROWBILL"
        className={cn(
          currentSize.img,
          "object-contain transition-transform duration-300 group-hover:scale-105",
          imageClassName
        )}
      />
      {showText && (
        <span
          className={cn(
            "font-black text-slate-900 dark:text-white leading-none",
            currentSize.text,
            textClassName
          )}
        >
          ESCROW<span className="text-emerald-600 dark:text-emerald-400">BILL</span>
        </span>
      )}
    </div>
  );

  if (asLink) {
    return (
      <Link to={to} className="inline-flex items-center focus:outline-none">
        {content}
      </Link>
    );
  }

  return content;
};

export default BrandLogo;
