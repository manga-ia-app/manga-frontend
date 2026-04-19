"use client";

import { cn } from "@/lib/utils/cn";
import { FileText, Layers, CheckCircle } from "lucide-react";

interface ProposalStepperProps {
  currentStep: number;
  onStepChange: (step: number) => void;
}

const steps = [
  { label: "Dados Gerais", icon: FileText },
  { label: "Montagem de Preço", icon: Layers },
  { label: "Revisão", icon: CheckCircle },
];

export function ProposalStepper({ currentStep, onStepChange }: ProposalStepperProps) {
  return (
    <div className="flex flex-col gap-1">
      {steps.map((step, index) => {
        const StepIcon = step.icon;
        const isActive = currentStep === index;
        const isCompleted = currentStep > index;

        return (
          <button
            key={index}
            type="button"
            onClick={() => onStepChange(index)}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors",
              isActive && "bg-primary text-primary-foreground",
              !isActive && isCompleted && "text-muted-foreground hover:bg-muted",
              !isActive && !isCompleted && "text-muted-foreground hover:bg-muted"
            )}
          >
            <div
              className={cn(
                "flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium",
                isActive && "bg-primary-foreground text-primary",
                isCompleted && !isActive && "bg-primary/20 text-primary",
                !isActive && !isCompleted && "bg-muted text-muted-foreground"
              )}
            >
              {isCompleted && !isActive ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <StepIcon className="w-4 h-4" />
              )}
            </div>
            <span className="text-sm font-medium">{step.label}</span>
          </button>
        );
      })}
    </div>
  );
}
