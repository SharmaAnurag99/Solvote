"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Mail, Phone, MapPin, User, FileText, Check, AlertCircle, ArrowLeft, Lock } from "lucide-react";
import ProcessFlow, { ProcessStep } from "@/components/ProcessFlow";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    aadhaar: "",
    address: "",
    constituency: "",
    motherName: "",
  });

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [processSteps, setProcessSteps] = useState<ProcessStep[]>([
    {
      name: "Validating Form",
      description: "Checking all required fields and format validation",
      status: "pending",
    },
    {
      name: "Encrypting Data",
      description: "End-to-end encryption of personal information",
      status: "pending",
    },
    {
      name: "Generating Confirmation Token",
      description: "Creating unique registration ID",
      status: "pending",
    },
    {
      name: "Storing in Database",
      description: "Saving registration request securely",
      status: "pending",
    },
    {
      name: "Submitting to Admin",
      description: "Sending request to election administrator",
      status: "pending",
    },
  ]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) newErrors.fullName = "Full name is required";
    if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) newErrors.email = "Valid email required";
    if (!formData.phone.match(/^\d{10}$/)) newErrors.phone = "10-digit phone number required";
    if (!formData.aadhaar.match(/^\d{12}$/)) newErrors.aadhaar = "12-digit Aadhaar number required";
    if (!formData.address.trim()) newErrors.address = "Address is required";
    if (!formData.constituency) newErrors.constituency = "Please select a constituency";
    if (!formData.motherName.trim()) newErrors.motherName = "Mother's name is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    // MOCK: Simulate registration process with step updates
    const steps = [...processSteps];
    
    // Step 1: Validate Form
    steps[0].status = "processing";
    setProcessSteps([...steps]);
    await new Promise((resolve) => setTimeout(resolve, 800));
    steps[0].status = "completed";
    
    // Step 2: Encrypt Data
    steps[1].status = "processing";
    setProcessSteps([...steps]);
    await new Promise((resolve) => setTimeout(resolve, 800));
    steps[1].status = "completed";
    
    // Step 3: Generate Token
    steps[2].status = "processing";
    setProcessSteps([...steps]);
    await new Promise((resolve) => setTimeout(resolve, 600));
    steps[2].status = "completed";
    
    // Step 4: Store in DB
    steps[3].status = "processing";
    setProcessSteps([...steps]);
    await new Promise((resolve) => setTimeout(resolve, 800));
    
    // Store registration request in localStorage
    const pendingRequests = JSON.parse(localStorage.getItem("voter_registrations") || "[]");
    pendingRequests.push({
      id: `REG-${Date.now()}`,
      ...formData,
      status: "pending",
      appliedAt: new Date().toISOString(),
    });
    localStorage.setItem("voter_registrations", JSON.stringify(pendingRequests));
    steps[3].status = "completed";
    
    // Step 5: Submit to Admin
    steps[4].status = "processing";
    setProcessSteps([...steps]);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    steps[4].status = "completed";
    
    setProcessSteps([...steps]);
    setLoading(false);
    setSubmitted(true);

    // Reset form
    setFormData({
      fullName: "",
      email: "",
      phone: "",
      aadhaar: "",
      address: "",
      constituency: "",
      motherName: "",
    });

    // Auto-redirect after 3 seconds
    setTimeout(() => {
      window.location.href = "/";
    }, 3000);
  };

  if (submitted) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-2xl p-12 max-w-md w-full text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-green-100 rounded-full p-4">
              <Check className="w-12 h-12 text-green-600" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Registration Submitted!</h2>
          <p className="text-gray-600 mb-6">
            Your voter registration request has been submitted successfully. The election administrator will review your application and notify you once approved.
          </p>
          <div className="bg-green-50 border-l-4 border-green-600 p-4 mb-8 text-left">
            <p className="text-sm text-green-800">
              <strong>What happens next?</strong><br />
              Your registration is now pending admin approval. You'll receive an email at <span className="font-semibold">{formData.email}</span> once your application is reviewed.
            </p>
          </div>
          <Link
            href="/"
            className="inline-block px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-bold"
          >
            Back to Home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
            <h1 className="text-xl font-bold text-gray-900">Back</h1>
          </Link>
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-orange-600" />
            <p className="text-sm text-gray-600">Secure Registration</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* Title Section */}
        <div className="text-center mb-12">
          <h2 className="text-5xl font-bold text-gray-900 mb-4">
            Register to Vote
          </h2>
          <p className="text-xl text-gray-600 mb-2">
            Become part of the democratic process
          </p>
          <p className="text-gray-500">
            Your registration will be reviewed by the election administrator and you'll receive email confirmation
          </p>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          {/* Section 1: Personal Information */}
          <div className="mb-12">
            <h3 className="text-2xl font-bold text-gray-900 mb-8 flex items-center gap-3">
              <span className="bg-orange-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                1
              </span>
              Personal Information
            </h3>

            <div className="space-y-6">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <User className="w-4 h-4 text-orange-600" />
                  Full Name *
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  className="input-field"
                />
                {errors.fullName && (
                  <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" /> {errors.fullName}
                  </p>
                )}
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-orange-600" />
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="your@email.com"
                    className="input-field"
                  />
                  {errors.email && (
                    <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" /> {errors.email}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-orange-600" />
                    Phone Number *
                  </label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="10-digit number"
                    maxLength="10"
                    className="input-field"
                  />
                  {errors.phone && (
                    <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" /> {errors.phone}
                    </p>
                  )}
                </div>
              </div>

              {/* Mother's Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Mother's Name *
                </label>
                <input
                  type="text"
                  name="motherName"
                  value={formData.motherName}
                  onChange={handleChange}
                  placeholder="Enter your mother's name"
                  className="input-field"
                />
                {errors.motherName && (
                  <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" /> {errors.motherName}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Identification & Address */}
          <div className="mb-12 pb-12 border-b border-gray-200">
            <h3 className="text-2xl font-bold text-gray-900 mb-8 flex items-center gap-3">
              <span className="bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                2
              </span>
              Identification & Address
            </h3>

            <div className="space-y-6">
              {/* Aadhaar Number */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-green-600" />
                  Aadhaar Number *
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  12-digit unique identification number. Will be verified by the administrator.
                </p>
                <input
                  type="text"
                  name="aadhaar"
                  value={formData.aadhaar}
                  onChange={handleChange}
                  placeholder="xxxx xxxx xxxx"
                  maxLength="12"
                  className="input-field font-mono tracking-widest"
                />
                {errors.aadhaar && (
                  <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" /> {errors.aadhaar}
                  </p>
                )}
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-green-600" />
                  Address *
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Enter your residential address"
                  className="input-field"
                />
                {errors.address && (
                  <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" /> {errors.address}
                  </p>
                )}
              </div>

              {/* Constituency */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Constituency *
                </label>
                <select
                  name="constituency"
                  value={formData.constituency}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="">Select your constituency</option>
                  <option value="north">North (Delhi North)</option>
                  <option value="south">South (Delhi South)</option>
                  <option value="east">East (Delhi East)</option>
                  <option value="west">West (Delhi West)</option>
                  <option value="central">Central (Delhi Central)</option>
                </select>
                {errors.constituency && (
                  <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" /> {errors.constituency}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Privacy Notice */}
          <div className="bg-blue-50 border-l-4 border-blue-600 p-6 mb-8 rounded">
            <p className="text-sm text-blue-900">
              <strong>🔒 Privacy Notice:</strong> Your information is encrypted and will only be used for voter verification. The election administrator will verify your details against official records.
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-orange-600 to-green-600 text-white rounded-lg hover:shadow-lg transition-all font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                Processing Registration...
              </>
            ) : (
              "Submit Registration Request"
            )}
          </button>

          {/* Process Flow*/}
          <ProcessFlow
            title="Voter Registration Process"
            description="Your registration is being processed through our secure system..."
            steps={processSteps}
            isVisible={loading}
          />

          {/* Disclaimer */}
          <p className="text-center text-sm text-gray-500 mt-6">
            By registering, you confirm that all information provided is accurate and truthful.
          </p>
        </form>

        {/* Info Box */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-md border-t-4 border-orange-600">
            <h4 className="font-bold text-gray-900 mb-2">Already Registered?</h4>
            <p className="text-sm text-gray-600 mb-4">
              Check the status of your application
            </p>
            <button className="text-orange-600 font-semibold hover:text-orange-700 text-sm">
              Check Status →
            </button>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md border-t-4 border-green-600">
            <h4 className="font-bold text-gray-900 mb-2">Questions?</h4>
            <p className="text-sm text-gray-600 mb-4">
              Contact the election office
            </p>
            <a href="tel:+911234567890" className="text-green-600 font-semibold hover:text-green-700 text-sm">
              Call Support →
            </a>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md border-t-4 border-blue-600">
            <h4 className="font-bold text-gray-900 mb-2">Information</h4>
            <p className="text-sm text-gray-600 mb-4">
              Learn more about the voting process
            </p>
            <a href="#" className="text-blue-600 font-semibold hover:text-blue-700 text-sm">
              Learn More →
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
