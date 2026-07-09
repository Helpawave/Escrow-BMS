import { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

export const ScrollToTop = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    useEffect(() => {
        const toggleVisibility = () => {
            if (window.scrollY > 400) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        window.addEventListener('scroll', toggleVisibility);
        return () => window.removeEventListener('scroll', toggleVisibility);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        });
    };

    return (
        <Button
            onClick={scrollToTop}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={cn(
                "fixed bottom-20 md:bottom-6 right-6 z-50 rounded-full w-12 h-12 p-0 shadow-2xl transition-all duration-500 ease-out",
                "bg-primary/90 text-primary-foreground backdrop-blur-md border border-white/20",
                "hover:bg-primary hover:scale-110 hover:-translate-y-2",
                isVisible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-10 scale-50 pointer-events-none"
            )}
            size="icon"
            aria-label="Scroll to top"
        >
            <div className="relative w-full h-full flex items-center justify-center">
                <ArrowUp 
                    className={cn(
                        "w-6 h-6 transition-transform duration-300",
                        isHovered ? "animate-bounce" : ""
                    )} 
                />
                
                {/* Visual refinement: pulse effect on hover */}
                {isHovered && (
                    <span className="absolute inset-0 rounded-full bg-primary/20 animate-ping -z-10" />
                )}
            </div>
        </Button>
    );
};
