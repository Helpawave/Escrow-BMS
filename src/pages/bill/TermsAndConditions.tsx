import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { FileText, UserCheck, Shield, Book, Scale, AlertCircle, ArrowLeft, Mail, Gavel } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const TermsAndConditions = () => {
    const fadeIn = {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.6 }
    };

    const sections = [
        {
            icon: UserCheck,
            title: "1. Legal Agreement",
            content: "These Terms of Service constitute a legally binding agreement between you and Escrow Bill (a product of ASH-TECH SOLUTIONS). By accessing our domain and dashboard, you acknowledge that you have read, understood, and agreed to be bound by these provisions."
        },
        {
            icon: Book,
            title: "2. The 'As-Is' Provision",
            content: "Escrow Bill provides software for financial record-keeping and invoice generation. While we strive for 100% accuracy in GST calculations and report generation, the Service is provided 'as is'. Users are advised to verify critical financial documents with their tax consultants."
        },
        {
            icon: Shield,
            title: "3. User Conduct & Integrity",
            content: "You agree not to use the Service for any unlawful purposes, including but not limited to generating fraudulent invoices or money laundering tracking. ASH-TECH SOLUTIONS reserves the right to terminate or block accounts immediately (see Section 6) if suspicious activity is detected."
        },
        {
            icon: PenalTool, // Fallback if PenTool is used
            title: "4. Intellectual Property Rights",
            content: "All source code, UI designs, and functionality within Escrow Bill are the intellectual property of ASH-TECH SOLUTIONS. No part of this platform may be copied, reproduced, or reverse-engineered for commercial use without express written permission."
        },
        {
            icon: FileText,
            title: "5. Subscription & Billing",
            content: "Subscriptions are billed in advance on a recurring basis. Failure to renew within the grace period will result in restricted account access. All fees are non-refundable except as specified in our Refund Policy."
        },
        {
            icon: AlertCircle,
            title: "6. Right to Block/Terminate",
            content: "Administrators of Escrow Bill reserve the unilateral right to block user access to the dashboard for violation of these terms, non-payment, or upon request by law enforcement. Blocked users will lose all access to their cloud-stored data until specifically reinstated."
        },
        {
            icon: Scale,
            title: "7. Jurisdiction",
            content: "Any disputes arising from the use of this service shall be exclusively governed by the laws of India, under the jurisdiction of the courts in New Delhi, where ASH-TECH SOLUTIONS is headquartered."
        }
    ];

    return (
        <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900">
            <SEO
                title="Terms & Conditions"
                description="Professional terms of service governing the use of Escrow Bill. Review your rights and responsibilities as a business on our platform."
            />

            <main className="flex-1 py-8 px-4 md:py-12">
                <div className="container mx-auto xl:max-w-5xl max-w-4xl">
                    <motion.div initial="initial" animate="animate" variants={fadeIn}>
                        <Button variant="ghost" asChild className="mb-8 hover:bg-white dark:hover:bg-slate-800 rounded-full">
                            <Link to="/">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Platform
                            </Link>
                        </Button>

                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-16">
                            <div className="flex items-center gap-5">
                                <div className="w-16 h-16 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 shadow-inner">
                                    <Gavel className="h-8 w-8" />
                                </div>
                                <div>
                                    <h1 className="text-4xl md:text-5xl font-bold text-foreground">
                                        Terms of Service
                                    </h1>
                                    <p className="text-slate-500 dark:text-slate-400 font-bold tracking-widest text-xs mt-1 uppercase">
                                        Service Agreement Rev. 2024.B
                                    </p>
                                </div>
                            </div>
                            <div className="bg-white dark:bg-slate-800 px-6 py-3 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 text-right">
                                <p className="text-slate-400 text-sm font-medium">Version Release</p>
                                <p className="text-slate-900 dark:text-white font-bold">{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                            </div>
                        </div>
                    </motion.div>

                    <div className="grid gap-6">
                        {sections.map((section, index) => (
                            <motion.section
                                key={index}
                                initial={{ opacity: 0, scale: 0.98 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.05 }}
                                className="bg-white dark:bg-slate-800/40 p-4 md:p-8 md:p-10 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 hover:border-indigo-200 transition-all duration-300"
                            >
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600">
                                        {/* Fallback for the icon */}
                                        {section.icon ? <section.icon className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                                    </div>
                                    <h2 className="text-2xl font-bold text-foreground">{section.title}</h2>
                                </div>
                                <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed font-medium pl-14">
                                    {section.content}
                                </p>
                            </motion.section>
                        ))}

                        <motion.section
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="bg-primary text-primary-foreground p-6 md:p-12 rounded-xl shadow-sm mt-12 text-center"
                        >
                            <h2 className="text-3xl font-bold mb-6">Legal Clarifications?</h2>
                            <p className="text-xl text-indigo-100 leading-relaxed mb-10 max-w-2xl mx-auto font-medium">
                                If you require further clarification on our legal framework or wish to discuss custom enterprise agreements, reach out to us.
                            </p>

                            <div className="inline-flex items-center gap-4 bg-primary text-primary-foreground px-8 py-4 rounded-xl font-bold shadow-sm">
                                <Mail className="h-6 w-6" />
                                legal@escrowbill.in
                            </div>
                        </motion.section>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

// Simple Fallback Icon
const PenalTool = ({ className }: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m12 19 7-7 3 3-7 7-3-3Z" /><path d="m18 13-1.5-7.5L2 2l3.5 14.5L13 18l5-5Z" /><path d="m2 2 5 2.5" /><path d="m6.4 19.2 1.4-1.4" /><path d="m14.5 13.5 1-1" /><path d="m15.7 14.9 1-1" /></svg>
);

export default TermsAndConditions;
