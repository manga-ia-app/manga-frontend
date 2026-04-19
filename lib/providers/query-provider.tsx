"use client";

import { QueryClient, QueryClientProvider, MutationCache } from "@tanstack/react-query";
import { ReactNode, useState } from "react";
import { showToast, getApiErrorMessage } from "@/lib/utils/toast";

interface QueryProviderProps {
  children: ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        mutationCache: new MutationCache({
          onError: (error, _variables, _context, mutation) => {
            // Se a mutation tem onError proprio, nao exibe toast global
            if (mutation.options.onError) return;

            const message = getApiErrorMessage(error);
            showToast("error", {
              title: "Erro na operacao",
              description: message,
            });
          },
        }),
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
