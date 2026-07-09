import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Timer, AlertTriangle, CheckCircle } from 'lucide-react';

interface CountdownTimerProps {
  expiryDate: string | null;
  approvalDate: string | null;
  isActive: boolean;
  userName?: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({
  expiryDate,
  approvalDate,
  isActive,
  userName
}) => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    total: 0
  });

  const calculateTimeLeft = (): TimeLeft => {
    if (!expiryDate || !isActive) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
    }

    const now = new Date().getTime();
    const expiry = new Date(expiryDate).getTime();
    const difference = expiry - now;

    if (difference <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
    }

    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((difference % (1000 * 60)) / 1000),
      total: difference
    };
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    // Initial calculation
    setTimeLeft(calculateTimeLeft());

    return () => clearInterval(timer);
  }, [expiryDate, isActive]);

  // If user is not active/approved
  if (!isActive) {
    return (
      <Badge variant="secondary" className="text-xs">
        <Timer className="w-3 h-3 mr-1" />
        Not Active
      </Badge>
    );
  }

  // If no expiry date set
  if (!expiryDate) {
    return (
      <Badge variant="default" className="text-xs bg-green-100 text-green-800 border-green-200">
        <CheckCircle className="w-3 h-3 mr-1" />
        Permanent Access
      </Badge>
    );
  }

  // If expired
  if (timeLeft.total <= 0) {
    return (
      <Badge variant="destructive" className="text-xs animate-pulse">
        <AlertTriangle className="w-3 h-3 mr-1" />
        EXPIRED
      </Badge>
    );
  }

  // Determine urgency level
  const daysLeft = timeLeft.days;
  let variant: "default" | "secondary" | "destructive" | "outline" = "default";
  let bgColor = "bg-blue-100 text-blue-800 border-blue-200";
  
  if (daysLeft <= 7) {
    variant = "destructive";
    bgColor = "bg-red-100 text-red-800 border-red-200 animate-pulse";
  } else if (daysLeft <= 30) {
    bgColor = "bg-orange-100 text-orange-800 border-orange-200";
  } else if (daysLeft <= 90) {
    bgColor = "bg-yellow-100 text-yellow-800 border-yellow-200";
  }

  return (
    <div className="space-y-1">
      <Badge variant={variant} className={`text-xs ${bgColor}`}>
        <Timer className="w-3 h-3 mr-1" />
        {daysLeft > 0 && `${daysLeft}d `}
        {(daysLeft < 7 || timeLeft.hours > 0) && `${timeLeft.hours}h `}
        {daysLeft < 1 && `${timeLeft.minutes}m `}
        {daysLeft < 1 && timeLeft.hours < 1 && `${timeLeft.seconds}s`}
        {daysLeft > 0 && timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0 && ' left'}
      </Badge>
      
      {/* Detailed breakdown for critical cases */}
      {daysLeft <= 7 && daysLeft > 0 && (
        <div className="text-xs text-red-600 font-medium">
          Expires in {daysLeft} day{daysLeft !== 1 ? 's' : ''}
        </div>
      )}
      
      {daysLeft === 0 && (
        <div className="text-xs text-red-600 font-bold animate-pulse">
          Expires TODAY in {timeLeft.hours}h {timeLeft.minutes}m!
        </div>
      )}
    </div>
  );
};

export default CountdownTimer;
