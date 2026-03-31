"use client";

import Link from "next/link";
import { MapPin, ExternalLink, Lock, Users, BarChart3, Vote, FileText } from "lucide-react";

export default function RoutesPage() {
  const routes = [
    {
      path: "/",
      name: "Home / Landing Page",
      icon: Vote,
      description: "Beautiful landing page showcasing ROFV system",
      features: [
        "Project overview",
        "Portal access links",
        "How voting works section",
        "Key features grid",
        "Call-to-action buttons",
      ],
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
    },
    {
      path: "/register",
      name: "Voter Registration",
      icon: FileText,
      description: "Create new voter account with Aadhaar verification",
      features: [
        "Personal information form",
        "Aadhaar number validation",
        "Address & constituency selection",
        "Process flow visualization",
        "Pending approval system",
      ],
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
    },
    {
      path: "/admin",
      name: "Admin Portal",
      icon: Users,
      description: "Electoral officer management panel",
      features: [
        "Review voter registration requests",
        "Approve/reject voter applications",
        "Manual whitelist management",
        "Merkle root generation",
        "Election locking",
      ],
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
    },
    {
      path: "/booth/verify",
      name: "Identity Verification",
      icon: Lock,
      description: "Voter identity verification against whitelist",
      features: [
        "Aadhaar-based identity check",
        "Zero-knowledge proof simulation",
        "Nullifier generation",
        "Process flow display",
        "Auto-redirect to voting",
      ],
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
    },
    {
      path: "/booth/vote",
      name: "Vote Casting",
      icon: Vote,
      description: "Cast vote securely with offline capability",
      features: [
        "3 candidate buttons (A, B, C)",
        "Network status detection",
        "Offline mode simulation",
        "Vote signing process",
        "Receipt generation",
        "DTN queue management",
      ],
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
    },
    {
      path: "/analytics",
      name: "Results Dashboard",
      icon: BarChart3,
      description: "Real-time vote tally and DTN sync status",
      features: [
        "DTN sync status overview",
        "Manual sync trigger",
        "Live vote counting",
        "Vote distribution charts",
        "Transaction queue details",
        "Blockchain confirmation status",
      ],
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
    },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center gap-3">
            <MapPin className="w-8 h-8 text-orange-600" />
            <h1 className="text-3xl font-bold text-gray-900">Routes Map</h1>
          </div>
          <p className="text-gray-600 mt-2">Complete routes documentation for ROFV System</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Summary */}
        <div className="bg-gradient-to-r from-orange-600 to-green-600 rounded-2xl p-8 mb-12 text-white shadow-lg">
          <h2 className="text-2xl font-bold mb-4">📍 System Routes Overview</h2>
          <p className="mb-4 text-orange-50">
            ROFV system has 6 main routes covering the complete voting workflow from registration to results.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-orange-100 text-sm mb-1">Total Routes</p>
              <p className="text-4xl font-bold">6</p>
            </div>
            <div>
              <p className="text-orange-100 text-sm mb-1">Primary Flows</p>
              <p className="text-4xl font-bold">4</p>
            </div>
            <div>
              <p className="text-orange-100 text-sm mb-1">Admin Functions</p>
              <p className="text-4xl font-bold">2</p>
            </div>
          </div>
        </div>

        {/* Routes Grid */}
        <div className="space-y-6">
          {routes.map((route, idx) => {
            const IconComponent = route.icon;
            return (
              <div
                key={idx}
                className={`rounded-xl border-2 ${route.borderColor} ${route.bgColor} overflow-hidden shadow-md hover:shadow-lg transition-shadow`}
              >
                <div className="p-8">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 bg-white rounded-lg ${route.color}`}>
                        <IconComponent className="w-8 h-8" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-1">
                          {route.name}
                        </h3>
                        <code className="text-sm font-mono font-semibold text-gray-700 bg-white px-3 py-1 rounded">
                          {route.path}
                        </code>
                      </div>
                    </div>
                    <Link
                      href={route.path}
                      className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-100 rounded-lg font-semibold text-gray-900 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Open
                    </Link>
                  </div>

                  <p className="text-gray-700 mb-6">
                    {route.description}
                  </p>

                  <div>
                    <p className="text-sm font-bold text-gray-700 mb-3 uppercase">
                      Features & Functions:
                    </p>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {route.features.map((feature, i) => (
                        <li key={i} className="flex items-center gap-2 text-gray-700">
                          <span className={`w-2 h-2 rounded-full ${route.color}`}></span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Workflow Section */}
        <div className="mt-16 bg-white rounded-xl shadow-lg border-2 border-gray-200 p-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">🔄 User Workflows</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* New Voter Flow */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-green-600 mb-6">
                👤 New Voter Flow
              </h3>
              <div className="space-y-3">
                {[
                  { step: "1", title: "Register", route: "/register" },
                  { step: "2", title: "Admin Approval", route: "/admin" },
                  { step: "3", title: "Verify Identity", route: "/booth/verify" },
                  { step: "4", title: "Cast Vote", route: "/booth/vote" },
                  { step: "5", title: "View Results", route: "/analytics" },
                ].map((item) => (
                  <Link
                    key={item.step}
                    href={item.route}
                    className="p-4 bg-green-50 border-2 border-green-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="bg-green-600 text-white font-bold w-10 h-10 rounded-full flex items-center justify-center group-hover:bg-green-700">
                        {item.step}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{item.title}</p>
                        <p className="text-sm text-gray-600">{item.route}</p>
                      </div>
                      <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Existing Voter Flow */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-blue-600 mb-6">
                🗳️ Existing Voter Flow
              </h3>
              <div className="space-y-3">
                {[
                  { step: "1", title: "Verify Identity", route: "/booth/verify" },
                  { step: "2", title: "Cast Vote", route: "/booth/vote" },
                  { step: "3", title: "View Results", route: "/analytics" },
                ].map((item) => (
                  <Link
                    key={item.step}
                    href={item.route}
                    className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="bg-blue-600 text-white font-bold w-10 h-10 rounded-full flex items-center justify-center group-hover:bg-blue-700">
                        {item.step}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{item.title}</p>
                        <p className="text-sm text-gray-600">{item.route}</p>
                      </div>
                      <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Admin Flow */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-orange-600 mb-6">
                👨‍⚖️ Admin Flow
              </h3>
              <div className="space-y-3">
                {[
                  { step: "1", title: "Review Applications", route: "/admin" },
                  { step: "2", title: "Approve Voters", route: "/admin" },
                  { step: "3", title: "Manage Whitelist", route: "/admin" },
                  { step: "4", title: "Generate Merkle Root", route: "/admin" },
                  { step: "5", title: "Monitor Results", route: "/analytics" },
                ].map((item) => (
                  <Link
                    key={item.step}
                    href={item.route}
                    className="p-4 bg-orange-50 border-2 border-orange-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="bg-orange-600 text-white font-bold w-10 h-10 rounded-full flex items-center justify-center group-hover:bg-orange-700">
                        {item.step}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{item.title}</p>
                        <p className="text-sm text-gray-600">{item.route}</p>
                      </div>
                      <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* View Only */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-purple-600 mb-6">
                👀 View Only
              </h3>
              <div className="space-y-3">
                {[
                  { step: "1", title: "Home / Landing", route: "/" },
                  { step: "2", title: "View Results", route: "/analytics" },
                ].map((item) => (
                  <Link
                    key={item.step}
                    href={item.route}
                    className="p-4 bg-purple-50 border-2 border-purple-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="bg-purple-600 text-white font-bold w-10 h-10 rounded-full flex items-center justify-center group-hover:bg-purple-700">
                        {item.step}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{item.title}</p>
                        <p className="text-sm text-gray-600">{item.route}</p>
                      </div>
                      <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Mocked Features Section */}
        <div className="mt-16 bg-blue-50 rounded-xl border-2 border-blue-200 p-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">⚙️ Mocked Operations (MVP)</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: "Voter Registration",
                items: [
                  "✓ Form validation",
                  "✓ localStorage storage",
                  "✓ Request tracking",
                ],
              },
              {
                title: "Admin Approval",
                items: [
                  "✓ Registration review",
                  "✓ Whitelist updates",
                  "✓ Auto-approval",
                ],
              },
              {
                title: "Identity Verification",
                items: [
                  "✓ Whitelist checking",
                  "✓ ZK proof simulation",
                  "✓ Nullifier generation",
                ],
              },
              {
                title: "Vote Signing",
                items: [
                  "✓ 2s delay simulation",
                  "✓ Random receipt ID",
                  "✓ Signature mock",
                ],
              },
              {
                title: "DTN Queue",
                items: [
                  "✓ localStorage queue",
                  "✓ Status tracking",
                  "✓ Manual sync",
                ],
              },
              {
                title: "Blockchain Sync",
                items: [
                  "✓ Mock transaction hashes",
                  "✓ Status states",
                  "✓ Auto-confirmation",
                ],
              },
              {
                title: "Merkle Root",
                items: [
                  "✓ Random hash generation",
                  "✓ Election locking",
                  "✓ Root storage",
                ],
              },
              {
                title: "Vote Tally",
                items: [
                  "✓ Vote counting",
                  "✓ Real-time updates",
                  "✓ Distribution calc",
                ],
              },
              {
                title: "Network Status",
                items: [
                  "✓ Online/offline detection",
                  "✓ Offline simulation",
                  "✓ Auto-sync on connect",
                ],
              },
            ].map((feature, i) => (
              <div key={i} className="bg-white rounded-lg p-6 border-l-4 border-blue-600">
                <h3 className="font-bold text-gray-900 mb-3">{feature.title}</h3>
                <ul className="space-y-2">
                  {feature.items.map((item, j) => (
                    <li key={j} className="text-sm text-gray-700">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-16 p-8 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border-2 border-green-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">🚀 Quick Access</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/"
              className="p-4 bg-white rounded-lg border-2 border-gray-200 hover:border-orange-600 hover:shadow-lg transition-all text-center font-semibold"
            >
              🏠 Home
            </Link>
            <Link
              href="/register"
              className="p-4 bg-white rounded-lg border-2 border-gray-200 hover:border-green-600 hover:shadow-lg transition-all text-center font-semibold"
            >
              📝 Register
            </Link>
            <Link
              href="/admin"
              className="p-4 bg-white rounded-lg border-2 border-gray-200 hover:border-orange-600 hover:shadow-lg transition-all text-center font-semibold"
            >
              👨‍⚖️ Admin
            </Link>
            <Link
              href="/booth/verify"
              className="p-4 bg-white rounded-lg border-2 border-gray-200 hover:border-green-600 hover:shadow-lg transition-all text-center font-semibold"
            >
              🔐 Verify
            </Link>
            <Link
              href="/booth/vote"
              className="p-4 bg-white rounded-lg border-2 border-gray-200 hover:border-purple-600 hover:shadow-lg transition-all text-center font-semibold"
            >
              🗳️ Vote
            </Link>
            <Link
              href="/analytics"
              className="p-4 bg-white rounded-lg border-2 border-gray-200 hover:border-blue-600 hover:shadow-lg transition-all text-center font-semibold"
            >
              📊 Results
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
