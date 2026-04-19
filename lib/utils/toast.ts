import { toast } from "sonner";

export type ToastVariant = "success" | "error" | "warning" | "info";

interface ShowToastOptions {
  title: string;
  description?: string;
  duration?: number;
}

export function showToast(variant: ToastVariant, options: ShowToastOptions) {
  const { title, description, duration } = options;

  switch (variant) {
    case "success":
      toast.success(title, { description, duration: duration ?? 5000 });
      break;
    case "error":
      toast.error(title, { description, duration: duration ?? 8000 });
      break;
    case "warning":
      toast.warning(title, { description, duration: duration ?? 5000 });
      break;
    case "info":
      toast.info(title, { description, duration: duration ?? 5000 });
      break;
  }
}

export function getApiErrorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null) {
    const axiosError = error as {
      response?: { data?: { message?: string; errors?: string[] } };
    };
    const data = axiosError.response?.data;
    if (data?.message) return data.message;
    if (data?.errors?.length) return data.errors.join(", ");
  }
  return "Ocorreu um erro inesperado. Tente novamente.";
}
