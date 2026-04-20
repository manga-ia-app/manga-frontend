"use client";

import { memo, type ComponentPropsWithoutRef } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { ChatMessage } from "@/lib/types/chat";
import { NavigationChips } from "./navigation-chips";
import { ChatToolIndicator } from "./chat-tool-indicator";

type MdProps<T extends keyof React.JSX.IntrinsicElements> = ComponentPropsWithoutRef<T>;

const markdownComponents = {
  p: (props: MdProps<"p">) => <p className="mb-1.5 last:mb-0 leading-relaxed">{props.children}</p>,
  ul: (props: MdProps<"ul">) => <ul className="list-disc pl-4 mb-1.5 space-y-0.5">{props.children}</ul>,
  ol: (props: MdProps<"ol">) => <ol className="list-decimal pl-4 mb-1.5 space-y-0.5">{props.children}</ol>,
  li: (props: MdProps<"li">) => <li className="leading-snug">{props.children}</li>,
  strong: (props: MdProps<"strong">) => <strong className="font-semibold">{props.children}</strong>,
  code: (props: MdProps<"code">) => (
    <code className="bg-background/50 px-1 py-0.5 rounded text-xs font-mono">{props.children}</code>
  ),
  h3: (props: MdProps<"h3">) => <h3 className="font-semibold text-sm mt-3 mb-1">{props.children}</h3>,
  h4: (props: MdProps<"h4">) => <h4 className="font-medium text-sm mt-2 mb-0.5">{props.children}</h4>,
  hr: () => <hr className="my-2 border-border/50" />,
};

interface ChatMessageBubbleProps {
  message: ChatMessage;
}

export const ChatMessageBubble = memo(function ChatMessageBubble({ message }: ChatMessageBubbleProps) {
  const router = useRouter();
  const isUser = message.role === "user";
  const isError = message.status === "error";
  const isStreaming = message.status === "streaming";

  const containerClass = isUser
    ? "flex flex-col items-end"
    : "flex flex-col items-start";

  const bubbleClass = [
    "max-w-[85%] px-3 py-2 text-sm",
    isUser && "bg-primary text-primary-foreground rounded-2xl rounded-br-sm",
    !isUser &&
      !isError &&
      "bg-muted text-foreground rounded-2xl rounded-bl-sm",
    isError &&
      "bg-destructive/10 text-destructive border border-destructive/20 rounded-2xl rounded-bl-sm",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={containerClass}>
      <div className={bubbleClass}>
        <div className={isUser ? "whitespace-pre-wrap select-text" : "select-text"}>
          {isUser ? (
            message.content
          ) : (
            <ReactMarkdown components={markdownComponents}>
              {message.content}
            </ReactMarkdown>
          )}
          {isStreaming && (
            <span className="inline-flex gap-0.5 ml-1">
              <span
                className="animate-bounce w-1 h-1 bg-current rounded-full"
                style={{ animationDelay: "0ms" }}
              />
              <span
                className="animate-bounce w-1 h-1 bg-current rounded-full"
                style={{ animationDelay: "150ms" }}
              />
              <span
                className="animate-bounce w-1 h-1 bg-current rounded-full"
                style={{ animationDelay: "300ms" }}
              />
            </span>
          )}
        </div>
        {message.navigationOptions && message.navigationOptions.length > 0 && (
          <NavigationChips
            options={message.navigationOptions}
            onNavigate={(route) => router.push(route)}
          />
        )}
        {message.toolActions && message.toolActions.length > 0 && (
          <ChatToolIndicator actions={message.toolActions} />
        )}
      </div>
      <span className="text-[10px] text-muted-foreground mt-1 px-1">
        {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      </span>
    </div>
  );
}, (prev, next) => {
  // Skip re-render if content and status haven't changed
  return prev.message.content === next.message.content
    && prev.message.status === next.message.status
    && prev.message.toolActions === next.message.toolActions
    && prev.message.navigationOptions === next.message.navigationOptions;
});
