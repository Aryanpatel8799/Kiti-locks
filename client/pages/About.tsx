import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import SEO from "@/components/SEO";
import {
  Users,
  Heart,
  Award,
  Globe,
  Shield,
  Truck,
  Star,
  Quote,
  ArrowRight,
  CheckCircle,
} from "lucide-react";

export default function About() {
  const stats = [
    { label: "Happy Customers", value: "5,000+", icon: Users },
    { label: "Products Sold", value: "25,000+", icon: Award },
    { label: "Cities Served", value: "50+", icon: Globe },
    { label: "Years Innovation", value: "2+", icon: Star },
  ];

  const values = [
    {
      icon: Heart,
      title: "Customer First",
      description:
        "Every decision we make is with our customers in mind. Your satisfaction is our top priority.",
    },
    {
      icon: Award,
      title: "Quality Excellence",
      description:
        "We source only the finest materials and work with trusted manufacturers to ensure lasting quality.",
    },
    {
      icon: Shield,
      title: "Trust & Security",
      description:
        "Your personal information and payment details are protected with industry-leading security.",
    },
    {
      icon: Truck,
      title: "Reliable Service",
      description:
        "Fast shipping, easy returns, and responsive customer support whenever you need us.",
    },
  ];

  const team = [
    {
      name: "Pradeep Kumar Khuntia",
      role: "Founder & Director",
      image: "/placeholder.svg",
      bio: "Visionary founder of Kiti Locks and Director of Khuntia Enterprises Pvt. Ltd. Leading the transformation of modular kitchen hardware for modern Indian homes.",
    },
    {
      name: "Rajesh Kumar",
      role: "Head of Engineering",
      image: "/placeholder.svg",
      bio: "Expert in precision-engineered kitchen hardware with deep expertise in hydraulic systems and soft-close mechanisms.",
    },
    {
      name: "Priya Sharma",
      role: "Customer Experience",
      image: "/placeholder.svg",
      bio: "Dedicated to ensuring every customer receives exceptional service and finds the perfect kitchen hardware solutions.",
    },
  ];

  return (
    <>
      <SEO 
        title="About Kiti Store - Premium Bathroom Hardware & Kitchen Accessories Store"
        description="Learn about Kiti Store, India's leading provider of premium bathroom hardware, kitchen accessories, door locks, and home improvement products. Discover our story, mission, and commitment to quality."
        keywords="about kiti store, bathroom hardware company, kitchen accessories brand, premium hardware manufacturer, home improvement products india, bathroom fittings company, cabinet hardware supplier"
        url="https://www.kitistore.com/about"
        type="website"
      />
      <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-100 py-24">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
          <motion.div
            className="absolute top-10 left-10 w-72 h-72 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"
            animate={{
              x: [0, 100, 0],
              y: [0, -50, 0],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear",
            }}
          />
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
              <Heart className="w-4 h-4 mr-2 text-blue-600" />
              Since 2022
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold text-slate-900 mb-6">
              Redefining Kitchen Hardware,
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                For Modern Indian Homes
              </span>
            </h1>
            <p className="text-lg md:text-xl text-slate-600 mb-8 leading-relaxed">
              To deliver world-class kitchen hardware that blends innovation,
              luxury, and practicality—crafted for Indian homes with global
              standards. We bring precision-engineered hydraulic hinges,
              soft-close channels, and lift-up systems to transform modern
              Indian kitchens.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center"
                >
                  <stat.icon className="w-8 h-8 text-blue-600" />
                </motion.div>
                <div className="text-3xl font-bold text-slate-900 mb-2">
                  {stat.value}
                </div>
                <div className="text-slate-600">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
                Our Story
              </h2>
              <div className="space-y-4 text-lg text-slate-600 leading-relaxed">
                <p>
                  Kiti Locks was founded in 2022 by Pradeep Kumar Khuntia, a
                  visionary leader who recognized the gap in premium kitchen
                  hardware for modern Indian homes. Frustrated by the lack of
                  quality, globally-inspired hardware that could meet Indian
                  kitchen needs, he established Kiti Locks through Khuntia
                  Enterprises Pvt. Ltd.
                </p>
                <p>
                  Under Mr. Khuntia's leadership, Kiti Locks has become
                  synonymous with precision engineering, aesthetic design, and
                  functional excellence. The brand specializes in bringing
                  world-class kitchen hardware like hydraulic hinges, soft-close
                  channels, and lift-up systems to Indian kitchens.
                </p>
                <p>
                  Today, we're proud to serve customers across India with our
                  space-optimized hardware engineered specifically for compact
                  Indian kitchens. Every product reflects our founder's mission:
                  to make Kiti Locks the go-to name for luxurious, durable, and
                  space-efficient kitchen solutions across India.
                </p>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="aspect-square bg-gradient-to-br from-blue-100 to-purple-100 rounded-3xl p-8 flex items-center justify-center">
                <div className="text-center">
                  <Quote className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                  <blockquote className="text-xl font-medium text-slate-900 mb-4">
                    "Every kitchen deserves hardware that combines global design
                    standards with Indian functionality. That's the Kiti Locks
                    promise."
                  </blockquote>
                  <cite className="text-slate-600">
                    - Pradeep Kumar Khuntia, Founder & Director
                  </cite>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Our Values
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              These principles guide everything we do, from product selection to
              customer service
            </p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -5 }}
              >
                <Card className="h-full text-center group hover:shadow-xl transition-all duration-300">
                  <CardContent className="p-6">
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center group-hover:shadow-lg transition-shadow"
                    >
                      <value.icon className="w-8 h-8 text-blue-600" />
                    </motion.div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-3">
                      {value.title}
                    </h3>
                    <p className="text-slate-600 leading-relaxed">
                      {value.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Meet Our Team
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              The passionate people behind Kiti Locks, dedicated to delivering
              world-class kitchen hardware for modern Indian homes
            </p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {team.map((member, index) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -5 }}
              >
                <Card className="text-center group hover:shadow-xl transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                      <Users className="w-12 h-12 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-1">
                      {member.name}
                    </h3>
                    <p className="text-blue-600 font-medium mb-3">
                      {member.role}
                    </p>
                    <p className="text-slate-600 text-sm leading-relaxed">
                      {member.bio}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
        <motion.div
          className="absolute top-0 left-0 w-full h-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2 }}
        >
          <div className="absolute top-10 left-10 w-32 h-32 bg-blue-400/10 rounded-full blur-xl" />
          <div className="absolute bottom-10 right-10 w-40 h-40 bg-purple-400/10 rounded-full blur-xl" />
        </motion.div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Transform Your Kitchen?
            </h2>
            <p className="text-lg text-slate-300 mb-8">
              Browse our collection of premium kitchen hardware and start your
              modular kitchen renovation today
            </p>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                asChild
                size="lg"
                className="px-8 py-3 text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Link to="/products">
                  Shop Now
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>
      </div>
    </>
  );
}
