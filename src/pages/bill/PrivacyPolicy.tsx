import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { Shield, Eye, Lock, FileText, ArrowLeft, Users, Globe, Mail, CheckCircle, Scale } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const PrivacyPolicy = () => {
    const fadeIn = {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.6 }
    };

    const sections = [
        {
            icon: Shield,
            title: "1. Transparency & Commitment",
            content: "At Escrow Bill (a product of ASH-TECH SOLUTIONS), we believe in radical transparency. This policy outlines our commitment to protecting your business and personal data using industry-leading protocols. By using our platform, you agree to the collection and use of information in accordance with this policy."
        },
        {
            icon: Eye,
            title: "2. Data We Aggregate",
            content: "We collect information required to facilitate seamless invoicing, including your Business Identity (Entity Name, GSTIN), Contact Information (Email, Phone), and Financial Metadata (Invoice amounts, client lists). We do not store sensitive bank credentials or primary payment data; these are handled by our secure payment partners (Razorpay)."
        },
        {
            icon: Lock,
            title: "3. Enterprise-Grade Security",
            content: "Security is built into our DNA. We use AES-256 encryption at rest and TLS encryption in transit. Our database is partitioned to ensure your financial records are isolated and protected against unauthorized access. Regular security audits are performed to maintain these standards."
        },
        {
            icon: Users,
            title: "4. Internal Data Handling",
            content: "Access to user data within ASH-TECH SOLUTIONS is strictly restricted to senior engineering staff on a 'need-to-know' basis for support and maintenance purposes. We do not sell, rent, or trade your data with marketing agencies or third-party brokers."
        },
        {
            icon: Scale,
            title: "5. Compliance & Legal",
            content: "We comply with Indian data protection regulations and are preparing for global standards like GDPR. We may disclose information if required to do so by law or in response to valid requests by public authorities (e.g., a court or a government agency)."
        },
        {
            icon: CheckCircle,
            title: "6. Data Portability & Deletion",
            content: "You own your data. At any time, you can export your records or request a complete account deletion. Upon deletion request, all your records will be purged from our active systems within 30 days, except where retention is legally mandated for tax purposes."
        }
    ];

    return (
        <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900">
            <SEO
                title="Privacy Policy"
                description="Our commitment to your business data security. Review Escrow Bill's professional privacy standards and data handling policies."
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
                                <div className="w-16 h-16 rounded-[1.5rem] bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                                    <Shield className="h-8 w-8" />
                                </div>
                                <div>
                                    <h1 className="text-4xl md:text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">
                                        Privacy Policy
                                    </h1>
                                    <p className="text-slate-500 dark:text-slate-400 font-bold tracking-widest text-xs mt-1 uppercase">
                                        Data Protection Standards 2024.1
                                    </p>
                                </div>
                            </div>
                            <div className="bg-white dark:bg-slate-800 px-6 py-3 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                                <p className="text-slate-400 text-sm font-medium">Last updated</p>
                                <p className="text-slate-900 dark:text-white font-bold">{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                            </div>
                        </div>
                    </motion.div>

                    <div className="grid gap-8 md:gap-12">
                        {sections.map((section, index) => (
                            <motion.section
                                key={index}
                                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.05 }}
                                className="group"
                            >
                                <div className="flex gap-6 items-start">
                                    <div className="hidden md:flex w-12 h-12 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 items-center justify-center text-primary shadow-sm group-hover:bg-primary group-hover:text-white transition-all duration-300 shrink-0">
                                        <section.icon className="h-6 w-6" />
                                    </div>
                                    <div className="bg-white dark:bg-slate-800/40 p-4 md:p-8 md:p-10 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 group-hover:border-primary/20 transition-all duration-300">
                                        <div className="flex items-center gap-3 mb-6 md:hidden">
                                            <section.icon className="h-6 w-6 text-primary" />
                                            <h2 className="text-2xl font-bold">{section.title}</h2>
                                        </div>
                                        <h2 className="hidden md:block text-2xl font-black text-slate-900 dark:text-slate-100 mb-6">{section.title}</h2>
                                        <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                                            {section.content}
                                        </p>
                                    </div>
                                </div>
                            </motion.section>
                        ))}

                        <motion.section
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="bg-slate-900 text-white p-6 md:p-12 rounded-[3rem] shadow-2xl relative overflow-hidden group"
                        >
                            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />

                            <h2 className="text-3xl font-black mb-8 relative z-10">Data Protection Officer</h2>
                            <p className="text-xl text-slate-400 leading-relaxed mb-10 relative z-10 font-medium">
                                Our dedicated legal and privacy team is available to assist you with any concerns regarding your digital footprint.
                            </p>

                            <div className="flex flex-col md:flex-row gap-8 relative z-10">
                                <div className="flex items-center gap-4 bg-white dark:bg-slate-800/5 p-4 md:p-6 rounded-2xl border border-white/10 flex-1">
                                    <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                                        <Mail className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Email Support</p>
                                        <p className="text-xl font-bold">privacy@escrowbill.in</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 bg-white dark:bg-slate-800/5 p-4 md:p-6 rounded-2xl border border-white/10 flex-1">
                                    <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400">
                                        <Globe className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Parent Organization</p>
                                        <p className="text-xl font-bold">ASH-TECH SOLUTIONS</p>
                                    </div>
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

export default PrivacyPolicy;
