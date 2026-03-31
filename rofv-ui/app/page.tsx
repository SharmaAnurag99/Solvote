"use client";

import Link from "next/link";
import { Lock, Users, BarChart3, Vote, ArrowRight, CheckCircle, Shield, Zap } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      {/* Navigation - Inspired by Modern Political Websites */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Vote className="w-8 h-8 text-orange-600" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-green-600 bg-clip-text text-transparent">
              ROFV
            </h1>
          </div>
          <div className="flex gap-4">
            <Link href="/register" className="px-6 py-2 border-2 border-orange-600 text-orange-600 rounded-lg hover:bg-orange-50 transition-colors font-semibold">
              Register to Vote
            </Link>
            <Link href="/booth/verify" className="px-6 py-2 bg-gradient-to-r from-orange-600 to-green-600 text-white rounded-lg hover:shadow-lg transition-all font-semibold">
              Vote Now
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section - Patriotic Design */}
      <section className="relative bg-gradient-to-b from-orange-50 via-white to-green-50 py-20">
        <div className="absolute top-0 left-0 w-full h-1" style={{ background: "linear-gradient(to right, #ff9933, #ffffff, #138808)" }}></div>
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
                <span className="text-orange-600">Your Voice.</span>
                <br />
                <span className="text-green-600">Your Choice.</span>
                <br />
                <span className="text-blue-600">Your Right.</span>
              </h2>
              <p className="text-xl text-gray-700 mb-8 leading-relaxed">
                Secure, transparent, and accessible voting for everyone. Cast your vote with confidence, anytime, anywhere.
              </p>
              <div className="flex gap-4">
                <Link href="/register" className="px-8 py-3 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-lg hover:shadow-lg transition-all font-bold text-lg flex items-center gap-2">
                  Register Now <ArrowRight className="w-5 h-5" />
                </Link>
                <Link href="/booth/verify" className="px-8 py-3 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 transition-all font-bold text-lg">
                  Vote Now
                </Link>
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-100 to-blue-50 rounded-2xl p-12 shadow-xl">
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <CheckCircle className="w-8 h-8 text-green-600 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-bold text-gray-900 text-lg">Easy Registration</h4>
                    <p className="text-gray-600">Simple process to register as a voter</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Shield className="w-8 h-8 text-orange-600 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-bold text-gray-900 text-lg">Completely Secure</h4>
                    <p className="text-gray-600">End-to-end encryption for your vote</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Zap className="w-8 h-8 text-blue-600 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-bold text-gray-900 text-lg">Works Offline</h4>
                    <p className="text-gray-600">Vote anytime, syncs when online</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Info Cards Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <h3 className="text-4xl font-bold text-center mb-12 text-gray-900">
            Access Portals
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Admin Portal */}
            <Link
              href="/admin"
              className="card hover:shadow-2xl transition-all duration-300 cursor-pointer group border-l-4 border-orange-600"
            >
              <div className="flex items-start justify-between mb-4">
                <Users className="w-12 h-12 text-orange-600 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold uppercase text-orange-600 bg-orange-50 px-3 py-1 rounded-full">Admin</span>
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900 group-hover:text-orange-600 transition-colors">
                Admin Portal
              </h3>
              <p className="text-gray-600 mb-4">
                Manage voter registrations, approve applicants, and oversee the election process
              </p>
              <div className="flex items-center text-orange-600 font-semibold group-hover:translate-x-2 transition-transform">
                Access Portal <ArrowRight className="w-4 h-4 ml-2" />
              </div>
            </Link>

            {/* Voter Portal */}
            <Link
              href="/booth/verify"
              className="card hover:shadow-2xl transition-all duration-300 cursor-pointer group border-l-4 border-green-600"
            >
              <div className="flex items-start justify-between mb-4">
                <Lock className="w-12 h-12 text-green-600 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold uppercase text-green-600 bg-green-50 px-3 py-1 rounded-full">Vote</span>
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900 group-hover:text-green-600 transition-colors">
                Cast Your Vote
              </h3>
              <p className="text-gray-600 mb-4">
                Verify your identity and cast your vote securely with end-to-end encryption
              </p>
              <div className="flex items-center text-green-600 font-semibold group-hover:translate-x-2 transition-transform">
                Vote Now <ArrowRight className="w-4 h-4 ml-2" />
              </div>
            </Link>

            {/* Analytics */}
            <Link
              href="/analytics"
              className="card hover:shadow-2xl transition-all duration-300 cursor-pointer group border-l-4 border-blue-600"
            >
              <div className="flex items-start justify-between mb-4">
                <BarChart3 className="w-12 h-12 text-blue-600 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold uppercase text-blue-600 bg-blue-50 px-3 py-1 rounded-full">Results</span>
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900 group-hover:text-blue-600 transition-colors">
                View Results
              </h3>
              <p className="text-gray-600 mb-4">
                Monitor real-time vote counts and check the election results with blockchain verification
              </p>
              <div className="flex items-center text-blue-600 font-semibold group-hover:translate-x-2 transition-transform">
                View Results <ArrowRight className="w-4 h-4 ml-2" />
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <h3 className="text-4xl font-bold mb-16 text-center text-gray-900">
            How Voting Works
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { step: "1", title: "Register", desc: "Sign up as a voter online or admin approves your application" },
              { step: "2", title: "Verify", desc: "Verify your identity at the polling booth or online" },
              { step: "3", title: "Vote", desc: "Securely cast your vote offline - no harassment possible" },
              { step: "4", title: "Results", desc: "Votes synced through DTN, recorded on blockchain permanently" }
            ].map((item, i) => (
              <div key={i} className="relative">
                <div className="flex flex-col items-center">
                  <div className="bg-gradient-to-br from-orange-600 to-green-600 rounded-full w-20 h-20 flex items-center justify-center mb-6 text-white text-3xl font-bold shadow-lg">
                    {item.step}
                  </div>
                  <h4 className="font-bold text-gray-900 mb-2 text-lg text-center">{item.title}</h4>
                  <p className="text-gray-600 text-center text-sm">{item.desc}</p>
                </div>
                {i < 3 && (
                  <div className="hidden md:flex absolute top-10 -right-4 text-gray-300">
                    <ArrowRight className="w-6 h-6" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid - Modern Design */}
      <section className="py-20 bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-7xl mx-auto px-6">
          <h3 className="text-4xl font-bold mb-16 text-center text-gray-900">
            Why Choose ROFV?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: Shield, title: "Military-Grade Security", desc: "Zero-knowledge proofs ensure vote privacy" },
              { icon: Zap, title: "Offline Capability", desc: "Vote without internet, syncs automatically" },
              { icon: CheckCircle, title: "Blockchain Verified", desc: "Every vote recorded permanently on chain" },
              { icon: Users, title: "Accessible Design", desc: "Intuitive interface for all demographics" },
              { icon: Lock, title: "Voter Privacy", desc: "Your identity stays private, vote is verified" },
              { icon: BarChart3, title: "Transparent Results", desc: "Real-time counting available to all" }
            ].map((item, i) => {
              const IconComponent = item.icon;
              return (
                <div key={i} className="bg-white rounded-xl p-8 shadow-md hover:shadow-xl transition-shadow border-t-4 border-orange-600">
                  <IconComponent className="w-10 h-10 text-orange-600 mb-4" />
                  <h4 className="font-bold text-gray-900 mb-3 text-lg">{item.title}</h4>
                  <p className="text-gray-600">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-orange-600 to-green-600">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-5xl font-bold text-white mb-6">
            Ready to Vote?
          </h2>
          <p className="text-xl text-orange-50 mb-10">
            Join thousands of voters exercising their right to vote securely and transparently
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/register" className="px-10 py-4 bg-white text-orange-600 rounded-lg hover:shadow-xl transition-all font-bold text-lg">
              Register as Voter
            </Link>
            <Link href="/booth/verify" className="px-10 py-4 bg-orange-700 text-white rounded-lg hover:bg-orange-800 transition-colors font-bold text-lg border-2 border-white">
              Vote Now
            </Link>
          </div>
        </div>
      </section>

      {/* Footer - Indian Flag Colors */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Vote className="w-8 h-8 text-orange-400" />
                <h5 className="font-bold text-lg">ROFV</h5>
              </div>
              <p className="text-gray-400 text-sm">
                Resilient Offline-First Voting System bringing democracy into the digital age
              </p>
            </div>
            <div>
              <h5 className="font-bold mb-4 text-white">Quick Links</h5>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/register" className="hover:text-white transition-colors">Register to Vote</Link></li>
                <li><Link href="/booth/verify" className="hover:text-white transition-colors">Cast Vote</Link></li>
                <li><Link href="/analytics" className="hover:text-white transition-colors">View Results</Link></li>
              </ul>
            </div>
            <div>
              <h5 className="font-bold mb-4 text-white">Security</h5>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security Standards</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
            <div>
              <h5 className="font-bold mb-4 text-white">Contact</h5>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>Email: support@rofv.io</li>
                <li>Phone: +91 (555) 123-4567</li>
                <li>Address: India</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 pt-8">
            <div className="flex justify-center mb-6">
              <div className="h-2 flex gap-0 w-40">
                <div className="flex-1 bg-orange-500"></div>
                <div className="flex-1 bg-white"></div>
                <div className="flex-1 bg-green-600"></div>
              </div>
            </div>
            <p className="text-center text-gray-400">&copy; 2024 ROFV - Resilient Offline-First Voting. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
