"use client";

import { CheckCircle, Clock, AlertCircle, Loader } from "lucide-react";

export interface ProcessStep {
  name: string;
  description: string;
  status: "pending" | "processing" | "completed" | "failed";
}

interface ProcessFlowProps {
  title: string;
  description?: string;
  steps: ProcessStep[];
  isVisible: boolean;
}

export default function ProcessFlow({
  title,
  description,
  steps,
  isVisible,
}: ProcessFlowProps) {
  if (!isVisible) return null;

  const completedSteps = steps.filter((s) => s.status === "completed").length;
  const processingStep = steps.find((s) => s.status === "processing");
  const progress = (completedSteps / steps.length) * 100;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">{title}</h2>
          {description && (
            <p className="text-gray-600">{description}</p>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold text-gray-700">Progress</span>
            <span className="text-sm font-bold text-blue-600">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-orange-600 to-green-600 h-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-4 mb-8">
          {steps.map((step, index) => (
            <div key={index} className="flex items-start gap-4">
              <div className="flex-shrink-0 mt-1">
                {step.status === "completed" && (
                  <div className="flex items-center justify-center h-6 w-6 rounded-full bg-green-600">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                )}
                {step.status === "processing" && (
                  <div className="flex items-center justify-center h-6 w-6 rounded-full bg-blue-600 animate-pulse">
                    <Loader className="w-4 h-4 text-white animate-spin" />
                  </div>
                )}
                {step.status === "pending" && (
                  <div className="flex items-center justify-center h-6 w-6 rounded-full border-2 border-gray-300">
                    <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                  </div>
                )}
                {step.status === "failed" && (
                  <div className="flex items-center justify-center h-6 w-6 rounded-full bg-red-600">
                    <AlertCircle className="w-5 h-5 text-white" />
                  </div>
                )}
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-gray-900">{step.name}</h3>
                  {step.status === "processing" && (
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                      Processing...
                    </span>
                  )}
                  {step.status === "completed" && (
                    <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded">
                      Done
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600">{step.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Status Message */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
          <p className="text-sm text-blue-900 font-medium">
            {processingStep
              ? `Processing: ${processingStep.name}...`
              : completedSteps === steps.length
              ? "✅ All steps completed successfully!"
              : "⏳ Initializing..."}
          </p>
        </div>
      </div>
    </div>
  );
}
