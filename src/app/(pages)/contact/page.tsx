"use client";
import { Mail, Phone, MapPin } from "lucide-react";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gray-100">
      <main className="container mx-auto px-4 py-12">
        <section className="bg-white rounded-lg shadow-lg p-8 max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-blue-600 mb-6 text-center">
            Contact Us
          </h1>

          <div className="text-center space-y-6 text-gray-700">
            {/* Address */}
            <p className="flex items-center justify-center">
              <MapPin className="h-5 w-5 mr-2 text-blue-600" />
              747, Janpath, Rani Sati Nagar, Nirman Nagar, Jaipur - 302019
            </p>

            {/* Email */}
            <p className="flex items-center justify-center">
              <Mail className="h-5 w-5 mr-2 text-blue-600" />
              <a
                href="mailto:hr@netparam.in"
                className="text-blue-600 hover:underline"
              >
                hr@netparam.in
              </a>
            </p>

            {/* Phone Numbers */}
            <div className="flex flex-col items-center space-y-2">
              <p className="flex items-center">
                <Phone className="h-5 w-5 mr-2 text-blue-600" />
                <a
                  href="tel:+917665010205"
                  className="text-blue-600 hover:underline"
                >
                  7665010205
                </a>
              </p>
              <p className="flex items-center">
                <Phone className="h-5 w-5 mr-2 text-blue-600" />
                <a
                  href="tel:+919119360547"
                  className="text-blue-600 hover:underline"
                >
                  9119360547
                </a>
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
