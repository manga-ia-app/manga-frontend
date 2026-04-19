"use client";

import { useState } from "react";
import { HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export interface HelpSection {
  heading?: string;
  content: string;
}

export interface HelpContent {
  title: string;
  sections: HelpSection[];
}

interface HelpButtonProps {
  help: HelpContent;
  iconSize?: number;
}

export function HelpButton({ help, iconSize = 18 }: HelpButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:text-foreground"
        onClick={() => setOpen(true)}
        aria-label="Ajuda"
      >
        <HelpCircle size={iconSize} />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{help.title}</DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto space-y-4 text-sm">
            {help.sections.map((section, i) => (
              <div key={i}>
                {section.heading && (
                  <p className="font-semibold mb-1">{section.heading}</p>
                )}
                <p className="text-muted-foreground leading-relaxed">
                  {section.content}
                </p>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
