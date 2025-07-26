import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Link } from "react-router-dom";
import { FileText, Shield, Scale, AlertCircle } from "lucide-react";

export default function Terms() {
  const sections = [
    {
      title: "Acceptance of Terms",
      content: `By accessing and using Kiti Locks's website and services, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.`,
    },
    {
      title: "Products and Services",
      content: `Kiti Locks provides an online marketplace for bathroom hardware, fixtures, and accessories. We strive to provide accurate product descriptions, pricing, and availability information, but we do not warrant that product descriptions or other content is accurate, complete, reliable, current, or error-free.`,
    },
    {
      title: "Account Registration",
      content: `To purchase products, you may be required to create an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account.`,
    },
    {
      title: "Ordering and Payment",
      content: `All orders are subject to acceptance by Kiti Locks. We reserve the right to refuse or cancel any order for any reason. Payment must be received before products are shipped. We accept major credit cards and other payment methods as indicated on our website.`,
    },
    {
      title: "Shipping and Delivery",
      content: `Shipping times are estimates and not guaranteed. Risk of loss and title for products purchased from Kiti Locks pass to you upon delivery to the carrier. We are not responsible for any delays caused by shipping carriers or other circumstances beyond our control.`,
    },
    {
      title: "Returns and Refunds",
      content: `We accept returns of unused products in original packaging within 30 days of purchase. Return shipping costs are the responsibility of the customer unless the return is due to our error. Refunds will be processed within 5-10 business days of receiving the returned item.`,
    },
    {
      title: "Product Warranties",
      content: `Products sold by Kiti Locks may include manufacturer warranties. We do not provide additional warranties beyond those offered by manufacturers. Any warranty claims should be directed to the manufacturer according to their warranty terms.`,
    },
    {
      title: "Limitation of Liability",
      content: `Kiti Locks shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, use, goodwill, or other intangible losses, resulting from your use of our services.`,
    },
    {
      title: "Privacy Policy",
      content: `Your privacy is important to us. Please review our Privacy Policy, which also governs your use of our services, to understand our practices regarding the collection, use, and disclosure of your personal information.`,
    },
    {
      title: "Intellectual Property",
      content: `All content on this website, including text, graphics, logos, images, and software, is the property of Kiti Locks or its content suppliers and is protected by copyright and other intellectual property laws.`,
    },
    {
      title: "Prohibited Uses",
      content: `You may not use our services for any unlawful purpose or to solicit others to perform unlawful acts, to violate any international, federal, provincial, or state regulations, rules, laws, or local ordinances, or to infringe upon or violate our intellectual property rights or the intellectual property rights of others.`,
    },
    {
      title: "Termination",
      content: `We may terminate or suspend your account and bar access to the service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever, including without limitation if you breach the Terms.`,
    },
    {
      title: "Changes to Terms",
      content: `We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days notice prior to any new terms taking effect.`,
    },
    {
      title: "Contact Information",
      content: `If you have any questions about these Terms of Service, please contact us at legal@Kiti Locks.com or by mail at: Kiti Locks Legal Department, 123 Hardware St, Design City, DC 12345.`,
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
              <FileText className="w-4 h-4 mr-2 text-blue-600" />
              Legal Information
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold text-slate-900 mb-6">
              Terms of
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                Service
              </span>
            </h1>
            <p className="text-lg md:text-xl text-slate-600 mb-8 leading-relaxed">
              These terms and conditions outline the rules and regulations for
              the use of Kiti Locks's website and services.
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-slate-600">
              <AlertCircle className="w-4 h-4" />
              <span>Last updated: January 1, 2024</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Terms Content */}
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
                  <Scale className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900 mb-2">
                      Agreement Overview
                    </h2>
                    <p className="text-slate-600 leading-relaxed">
                      By using our website at Kiti Locks.com (the "Service")
                      operated by Kiti Locks ("us", "we", or "our"), you are
                      agreeing to be bound by the following terms and conditions
                      ("Terms of Service", "Terms"). These Terms apply to all
                      visitors, users, and others who access or use the Service.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Terms Sections */}
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
                      <span className="w-8 h-8 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center text-blue-600 font-bold text-sm">
                        {index + 1}
                      </span>
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
                  <Shield className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">
                      Questions About These Terms?
                    </h3>
                    <p className="text-slate-600 mb-4">
                      If you have any questions about these Terms of Service,
                      please don't hesitate to contact us. We're here to help
                      clarify any concerns you may have.
                    </p>
                    <div className="flex flex-wrap gap-4 text-sm">
                      <Link
                        to="/contact"
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Contact Us
                      </Link>
                      <Link
                        to="/privacy"
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Privacy Policy
                      </Link>
                      <a
                        href="mailto:legal@Kiti Locks.com"
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        legal@Kiti Locks.com
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
