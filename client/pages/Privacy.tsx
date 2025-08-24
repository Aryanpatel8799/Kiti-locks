import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Link } from "react-router-dom";
import { Shield, Eye, Lock, Database, AlertCircle, Cookie } from "lucide-react";

export default function Privacy() {
  const sections = [
    {
      title: "Information We Collect",
      icon: Database,
      content: `We collect information you provide directly to us, such as when you create an account, make a purchase, or contact us. This includes your name, email address, shipping address, phone number, and payment information. We also automatically collect certain information about your device when you use our services, including your IP address, browser type, and usage patterns.`,
    },
    {
      title: "How We Use Your Information",
      icon: Eye,
      content: `We use the information we collect to provide, maintain, and improve our services; process transactions; send you technical notices and support messages; respond to your comments and questions; and communicate with you about products, services, offers, and events. We may also use your information for security purposes and to detect and prevent fraud.`,
    },
    {
      title: "Information Sharing",
      icon: Shield,
      content: `We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this policy. We may share your information with service providers who assist us in operating our website and conducting our business, provided they agree to keep your information confidential. We may also disclose your information when required by law or to protect our rights.`,
    },
    {
      title: "Data Security",
      icon: Lock,
      content: `We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. This includes encryption of sensitive data, secure socket layer (SSL) technology for data transmission, and regular security assessments. However, no method of transmission over the internet is 100% secure.`,
    },
    {
      title: "Cookies and Tracking",
      icon: Cookie,
      content: `We use cookies and similar tracking technologies to enhance your browsing experience, analyze site traffic, and personalize content. Cookies are small files that are stored on your device. You can control cookie settings through your browser, but disabling cookies may affect the functionality of our website.`,
    },
    {
      title: "Third-Party Services",
      icon: Shield,
      content: `Our website may contain links to third-party websites and services. We are not responsible for the privacy practices or content of these third-party sites. We encourage you to read the privacy policies of any third-party sites you visit. We may also use third-party analytics services to help us understand how our website is used.`,
    },
    {
      title: "Your Rights and Choices",
      icon: Shield,
      content: `You have the right to access, update, or delete your personal information. You can manage your account settings, opt out of marketing communications, and control your privacy preferences through your account dashboard. If you have any questions about your rights or wish to exercise them, please contact us.`,
    },
    {
      title: "Data Retention",
      icon: Database,
      content: `We retain your personal information for as long as necessary to provide our services, comply with legal obligations, resolve disputes, and enforce our agreements. When we no longer need your information, we will securely delete or anonymize it in accordance with our data retention policies.`,
    },
    {
      title: "International Data Transfers",
      icon: Shield,
      content: `Your information may be transferred to and processed in countries other than your country of residence. These countries may have different data protection laws. When we transfer your information internationally, we implement appropriate safeguards to protect your data.`,
    },
    {
      title: "Children's Privacy",
      icon: Shield,
      content: `Our services are not directed to children under 13 years of age. We do not knowingly collect personal information from children under 13. If we learn that we have collected personal information from a child under 13, we will delete that information as quickly as possible.`,
    },
    {
      title: "Changes to This Policy",
      icon: AlertCircle,
      content: `We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date. We encourage you to review this Privacy Policy periodically for any changes.`,
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-100 py-24">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            <Badge
              variant="secondary"
              className="mb-6 px-4 py-2 text-sm font-medium bg-white/80 backdrop-blur-sm"
            >
              <Shield className="w-4 h-4 mr-2 text-blue-600" />
              Your Privacy Matters
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold text-slate-900 mb-6">
              Privacy
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                Policy
              </span>
            </h1>
            <p className="text-lg md:text-xl text-slate-600 mb-8 leading-relaxed">
              We are committed to protecting your privacy and ensuring the
              security of your personal information. This policy explains how we
              collect, use, and protect your data.
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-slate-600">
              <AlertCircle className="w-4 h-4" />
              <span>Last updated: January 1, 2024</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Privacy Content */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Introduction */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <Card className="border-l-4 border-l-blue-600">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Lock className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900 mb-2">
                      Our Commitment to Privacy
                    </h2>
                    <p className="text-slate-600 leading-relaxed mb-4">
                      At Kiti Store, we understand that your privacy is
                      important. This Privacy Policy describes how we collect,
                      use, and protect your personal information when you visit
                      our website or use our services.
                    </p>
                    <p className="text-slate-600 leading-relaxed">
                      By using our website, you consent to the practices
                      described in this Privacy Policy. If you do not agree with
                      this policy, please do not use our services.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Privacy Sections */}
          <div className="space-y-8">
            {sections.map((section, index) => (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.05 }}
                viewport={{ once: true }}
              >
                <Card className="hover:shadow-lg transition-shadow duration-300">
                  <CardHeader>
                    <CardTitle className="text-xl text-slate-900 flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
                        <section.icon className="w-5 h-5 text-blue-600" />
                      </div>
                      {section.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-600 leading-relaxed">
                      {section.content}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* GDPR Rights Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="mt-16"
          >
            <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-xl text-slate-900 flex items-center gap-3">
                  <Shield className="w-6 h-6 text-blue-600" />
                  Your Data Protection Rights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-slate-600 leading-relaxed">
                  Under data protection laws, you have the following rights
                  regarding your personal information:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    "Right to access your data",
                    "Right to correct inaccurate data",
                    "Right to delete your data",
                    "Right to restrict processing",
                    "Right to data portability",
                    "Right to object to processing",
                  ].map((right, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      <span className="text-slate-700 text-sm">{right}</span>
                    </div>
                  ))}
                </div>
                <p className="text-slate-600 text-sm">
                  To exercise any of these rights, please contact us at{" "}
                  <a
                    href="mailto:privacy@Kiti Store.com"
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    privacy@Kiti Store.com
                  </a>
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="mt-16"
          >
            <Separator className="mb-8" />
            <Card className="bg-slate-50 border-0">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <AlertCircle className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">
                      Questions About This Privacy Policy?
                    </h3>
                    <p className="text-slate-600 mb-4">
                      If you have any questions about this Privacy Policy or our
                      privacy practices, please contact us. We're committed to
                      addressing your concerns and protecting your privacy.
                    </p>
                    <div className="flex flex-wrap gap-4 text-sm">
                      <Link
                        to="/contact"
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Contact Us
                      </Link>
                      <Link
                        to="/terms"
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Terms of Service
                      </Link>
                      <a
                        href="mailto:privacy@Kiti Store.com"
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        privacy@Kiti Store.com
                      </a>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
