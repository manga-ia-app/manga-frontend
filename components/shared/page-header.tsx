import { ReactNode } from "react";
import { HelpButton, type HelpContent } from "./help-button";

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
  help?: HelpContent;
}

export function PageHeader({ title, description, action, help }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      <div className="flex items-center gap-2">
        {help && <HelpButton help={help} />}
        {action && <div>{action}</div>}
      </div>
    </div>
  );
}
