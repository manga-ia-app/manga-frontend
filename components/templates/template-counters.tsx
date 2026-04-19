"use client";

import { Badge } from "@/components/ui/badge";
import type { TemplatePhase } from "@/lib/types/templates";

interface TemplateCountersProps {
  phases: TemplatePhase[];
}

export function TemplateCounters({ phases }: TemplateCountersProps) {
  const phaseCount = phases.length;
  let subPhaseCount = 0;
  let activityCount = 0;
  let checklistCount = 0;

  phases.forEach((p) => {
    subPhaseCount += p.subPhases.length;
    activityCount += p.activities.length;
    p.activities.forEach((a) => {
      checklistCount += a.checklistItems.length;
    });
    p.subPhases.forEach((s) => {
      activityCount += s.activities.length;
      s.activities.forEach((a) => {
        checklistCount += a.checklistItems.length;
      });
    });
  });

  return (
    <div className="flex flex-wrap gap-2">
      <Badge variant="outline">{phaseCount} etapas</Badge>
      <Badge variant="outline">{subPhaseCount} subetapas</Badge>
      <Badge variant="outline">{activityCount} atividades</Badge>
      <Badge variant="outline">{checklistCount} checklists</Badge>
    </div>
  );
}
