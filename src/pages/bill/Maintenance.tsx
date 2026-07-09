import { motion } from 'framer-motion';
import { Hammer, HardHat, Settings, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const Maintenance = () => {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-start md:justify-center p-4 md:p-6 pt-32 md:pt-48 relative overflow-y-auto overflow-x-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-5%] w-64 h-64 bg-primary/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-5%] w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] animate-pulse delay-700" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 max-w-2xl w-full text-center space-y-4 md:space-y-8 pb-20 md:pb-0"
      >
        {/* Animated Icon Container */}
        <div className="relative flex justify-center mb-8 md:mb-12">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 flex items-center justify-center opacity-10"
          >
            <Settings className="w-64 h-64 text-white" />
          </motion.div>
          
          <div className="relative">
            <div className="w-24 h-24 rounded-3xl bg-primary/20 flex items-center justify-center border border-primary/30 backdrop-blur-xl shadow-2xl">
              <HardHat className="w-12 h-12 text-primary" strokeWidth={1.5} />
            </div>
            <motion.div
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute -top-3 -right-3 w-10 h-10 rounded-2xl bg-amber-500/20 flex items-center justify-center border border-amber-500/30 backdrop-blur-xl"
            >
              <Hammer className="w-5 h-5 text-amber-500" />
            </motion.div>
          </div>
        </div>

        <div className="space-y-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-black uppercase tracking-widest mb-4"
          >
            <AlertTriangle className="w-3 h-3" />
            Temporary Downtime
          </motion.div>
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter leading-tight uppercase">
            WEBSITE UNDER <br />
            <span className="text-primary italic">MAINTENANCE.</span>
          </h1>
          <p className="text-slate-400 text-base md:text-lg font-medium max-w-md mx-auto">
            We are performing some essential updates to provide you with a better experience. We'll be back online very soon.
          </p>
        </div>

        <div className="flex flex-col items-center justify-center gap-6 pt-8">
          <Button 
            className="h-14 px-10 rounded-2xl bg-primary hover:bg-primary/90 text-slate-950 font-black text-lg shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-3 group"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
            Reload Website
          </Button>

          <div className="flex items-center gap-3 text-slate-500">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm font-bold uppercase tracking-widest">Live Updates in progress</span>
          </div>
        </div>

        <div className="pt-8 md:pt-16 grid grid-cols-2 md:grid-cols-3 gap-8 opacity-50">
          <div className="space-y-1">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Platform</p>
            <p className="text-white font-bold text-xs uppercase">Escrow Bill BMS</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</p>
            <p className="text-primary font-bold text-xs uppercase">Optimizing</p>
          </div>
          <div className="space-y-1 hidden md:block">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Expected</p>
            <p className="text-white font-bold text-xs uppercase">Few Minutes</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Maintenance;
