import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Facebook,
  Twitter,
  Instagram,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-white">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-3 xs:px-4 sm:px-6 lg:px-8 py-8 xs:py-10 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-6 xs:gap-8">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center space-x-2 mb-3 xs:mb-4">
              <div className="w-6 h-6 xs:w-7 xs:h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xs xs:text-sm">K</span>
              </div>
              <span className="text-lg xs:text-xl font-bold">Kiti Locks</span>
            </Link>
            <p className="text-slate-400 mb-4 xs:mb-6 max-w-md text-sm xs:text-base">
              Your trusted partner for premium kitchen hardware.
              Precision-engineered solutions for modern Indian kitchens with
              global standards.
            </p>
            <div className="flex space-x-2 xs:space-x-3 sm:space-x-4">
              <Button
                variant="ghost"
                size="sm"
                className="w-7 h-7 xs:w-8 xs:h-8 sm:w-9 sm:h-9 p-0 text-slate-400 hover:text-white"
              >
                <Facebook className="w-3 h-3 xs:w-4 xs:h-4 sm:w-5 sm:h-5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-7 h-7 xs:w-8 xs:h-8 sm:w-9 sm:h-9 p-0 text-slate-400 hover:text-white"
              >
                <Twitter className="w-3 h-3 xs:w-4 xs:h-4 sm:w-5 sm:h-5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-7 h-7 xs:w-8 xs:h-8 sm:w-9 sm:h-9 p-0 text-slate-400 hover:text-white"
              >
                <Instagram className="w-3 h-3 xs:w-4 xs:h-4 sm:w-5 sm:h-5" />
              </Button>
            </div>
          </div>

          {/* Contact Info */}
          <div className="lg:col-span-2 flex flex-col justify-center sm:justify-start lg:justify-center">
            <div className="space-y-3 xs:space-y-4">
              <div className="flex items-start xs:items-center space-x-3">
                <Mail className="w-4 h-4 xs:w-5 xs:h-5 text-slate-400 mt-1 xs:mt-0 flex-shrink-0" />
                <span className="text-slate-400 text-sm xs:text-base break-all">
                  customercare@kitilocks.com
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="w-4 h-4 xs:w-5 xs:h-5 text-slate-400 flex-shrink-0" />
                <span className="text-slate-400 text-sm xs:text-base">+91 9990125444</span>
              </div>
              <div className="flex items-start space-x-3">
                <MapPin className="w-4 h-4 xs:w-5 xs:h-5 text-slate-400 mt-1 flex-shrink-0" />
                <span className="text-slate-400 text-sm xs:text-base leading-relaxed">
                  Khuntia Enterprises Pvt. Ltd. F-43B First Floor, Khanpur Extn.
                  New Delhi DL, India-110062
                </span>
              </div>
            </div>
          </div>

          {/* You can add more columns here for links, info, etc. */}
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-3 xs:px-4 sm:px-6 lg:px-8 py-4 xs:py-5 sm:py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center text-center sm:text-left">
            <p className="text-slate-400 text-xs xs:text-sm">
              © 2021 Khuntia Enterprises Pvt. Ltd. All Rights Reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
