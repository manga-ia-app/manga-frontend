export interface ToolAction {
  label: string;
  type: "read" | "write" | "navigate";
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  status: "sending" | "streaming" | "complete" | "error";
  navigationOptions?: NavigationOption[];
  toolActions?: ToolAction[];
}

export interface NavigationOption {
  label: string;
  route: string;
  icon?: string;
}

export interface ChatSession {
  messages: ChatMessage[];
  isOpen: boolean;
  isStreaming: boolean;
  isConnected: boolean;
  isAiAvailable: boolean;
  currentContext: ChatContext;
  suggestions: ContextSuggestion[];
}

export interface ChatContext {
  route: string;
  contextName: string;
  entityId?: string;
}

export interface ContextSuggestion {
  label: string;
  prompt: string;
  icon?: string;
}

export interface ContextRouteMapping {
  contextName: string;
  supportsCreation: boolean;
  entityId?: string;
}

export interface NavigationMapEntry {
  keywords: string[];
  route: string;
  label: string;
  icon?: string;
}

export interface NavigationSuggestion {
  label: string;
  route: string;
}

export interface ConfirmationPreview {
  toolName: string;
  previewData: {
    requestId?: string;
    message: string;
    before?: Record<string, unknown> | null;
    after?: Record<string, unknown> | null;
    impact?: Record<string, unknown> | null;
    warnings?: string[];
    blocked?: boolean;
  };
}
