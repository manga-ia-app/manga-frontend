"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { confirmEmail } from "@/lib/api/auth";

type ConfirmationStatus = "loading" | "success" | "error";

function ConfirmEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<ConfirmationStatus>("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    async function confirm() {
      if (!token) {
        setStatus("error");
        setErrorMessage("Token de confirmação não encontrado na URL.");
        return;
      }

      try {
        await confirmEmail(token);
        setStatus("success");
      } catch (err: unknown) {
        setStatus("error");
        if (err instanceof Error) {
          setErrorMessage(err.message);
        } else {
          setErrorMessage(
            "Ocorreu um erro ao confirmar seu e-mail. O link pode ter expirado."
          );
        }
      }
    }

    confirm();
  }, [token]);

  return (
    <Card>
      <CardHeader className="space-y-1 text-center">
        <div className="flex justify-center mb-2">
          <span className="text-2xl font-bold tracking-tight text-primary">
            Manga
          </span>
        </div>
        <CardTitle className="text-2xl">Confirmação de E-mail</CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col items-center space-y-4">
        {status === "loading" && (
          <>
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <CardDescription className="text-center">
              Confirmando seu e-mail, aguarde...
            </CardDescription>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle className="h-12 w-12 text-green-500" />
            <CardDescription className="text-center text-base">
              Seu e-mail foi confirmado com sucesso! Agora você pode acessar
              sua conta.
            </CardDescription>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle className="h-12 w-12 text-destructive" />
            <CardDescription className="text-center text-base text-destructive">
              {errorMessage}
            </CardDescription>
          </>
        )}
      </CardContent>

      <CardFooter className="flex justify-center">
        {status !== "loading" && (
          <Link href="/login">
            <Button>Ir para login</Button>
          </Link>
        )}
      </CardFooter>
    </Card>
  );
}

export default function ConfirmEmailPage() {
  return (
    <Suspense
      fallback={
        <Card>
          <CardContent className="flex flex-col items-center space-y-4 py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground">Carregando...</p>
          </CardContent>
        </Card>
      }
    >
      <ConfirmEmailContent />
    </Suspense>
  );
}
