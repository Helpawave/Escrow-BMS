import Footer from '@/components/Footer';
import SEO from "@/components/SEO";
import { RefreshCcw, ShieldCheck, Clock, CreditCard, HelpCircle, ArrowLeft, Mail, AlertCircle, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const RefundPolicy = () => {
    const fadeIn = {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.6 }
    };

    const sections = [
        {
            icon: ShieldCheck,
            title: "1. Cancellation Rights",
            content: "You have the full right to cancel your Escrow Bill subscription at any time. When you cancel, your premium features will remain enabled until the end of your prepaid billing period. We do not offer prorated refunds for mid-month cancellations, but you will not be billed further."
        },
        {
            icon: Clock,
            title: "2. The 7-Day Guarantee",
            content: "We stand by our product. For first-time subscribers, we offer a strict 7-day money-back guarantee. If Escrow Bill doesn't meet your business needs within the first week of purchase, you are eligible for a 100% refund, no questions asked."
        },
        {
            icon: CreditCard,
            title: "3. Refund Scope",
            content: "Refunds apply only to the current subscription cycle fee. Fees for additional services, custom integrations, or physical hardware (if any) are governed by separate agreements and may not be refundable. Renewals are automatically processed and are not eligible for the 7-day guarantee."
        },
        {
            icon: RefreshCcw,
            title: "4. Processing Timeline",
            content: "Once a refund request is validated by our accounts team at ASH-TECH SOLUTIONS, it will be initiated immediately. However, it may take 5 to 7 business days for the funds to reflect in your original payment method (Bank/UPI/Card), depending on your financial institution."
        },
        {
            icon: AlertCircle,
            title: "5. Exceptional Cases",
            content: "Refunds may be denied if we detect fraudulent use of the service, generation of suspicious invoices, or violation of our Terms of Service. In cases of duplicate payments due to gateway failures, extra amounts are automatically refunded within 48 hours."
        }
    ];

    return (
        <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900">
            <SEO
                title="Cancellation & Refund Policy"
                description="Transparent refund and cancellation terms. Learn about our 7-day money-back guarantee and how we handle your subscription payments."
            />

            <main className="flex-1 py-8 px-4 md:py-12 text-center">
                <div className="container mx-auto xl:max-w-5xl max-w-4xl">
                    <motion.div initial="initial" animate="animate" variants={fadeIn}>
                        <Button variant="ghost" asChild className="mb-8 hover:bg-white dark:hover:bg-slate-800 rounded-full">
                            <Link to="/">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Platform
                            </Link>
                        </Button>

                        <div className="max-w-2xl mx-auto mb-16">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 font-bold text-sm mb-6 border border-green-100 dark:border-green-800">
                                <CheckCircle2 className="h-4 w-4" />
                                7-Day Money Back Guarantee
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-orange-600 to-rose-600 dark:from-white dark:to-slate-400 mb-6 mt-4">
                                Cancellation & Refund Policy
                            </h1>
                            <p className="text-xl text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                                Transparent billing is at the heart of Escrow Bill. <br className="hidden md:block" /> No hidden fees, no complicated exits.
                            </p>
                        </div>
                    </motion.div>

                    <div className="grid md:grid-cols-2 gap-6 text-left">
                        {sections.map((section, index) => (
                            <motion.section
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                className={`p-4 md:p-8 md:p-10 rounded-[2.5rem] bg-white dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow ${index === 0 ? 'md:col-span-2 bg-gradient-to-br from-white to-orange-50/30' : ''}`}
                            >
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-12 h-12 rounded-2xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600">
                                        <section.icon className="h-6 w-6" />
                                    </div>
                                    <h2 className="text-2xl font-black text-slate-900 dark:text-white">{section.title}</h2>
                                </div>
                                <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                                    {section.content}
                                </p>
                            </motion.section>
                        ))}

                        <motion.section
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            className="md:col-span-2 bg-slate-900 p-6 md:p-12 rounded-[3.5rem] mt-12 overflow-hidden relative"
                        >
                            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-orange-600/10 to-transparent"></div>
                            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
                                <div className="text-left max-w-xl">
                                    <h2 className="text-3xl font-black text-white mb-4">Questions about a transaction?</h2>
                                    <p className="text-slate-400 text-lg font-medium">
                                        Our billing team at ASH-TECH SOLUTIONS monitors all transactions 24/7. If you see an error, we'll fix it faster than you can say "GST".
                                    </p>
                                </div>
                                <div className="shrink-0 bg-white dark:bg-slate-800/20 border border-white/10 p-4 md:p-8 rounded-[2rem] text-center backdrop-blur-sm shadow-xl">
                                    <p className="text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-widest mb-4">Billing Support</p>
                                    <p className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                                        <Mail className="h-6 w-6 text-orange-500" />
                                        billing@escrowbill.in
                                    </p>
                                </div>
                            </div>
                        </motion.section>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default RefundPolicy;
