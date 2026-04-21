"use client";

import { Suspense, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Check, Loader2, ShieldCheck, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { checkPasswordPwned, resetPassword } from "@/lib/api/auth";
import { extractApiError } from "@/lib/api/error";
import { AUTH_GENERIC_ERRORS } from "@/lib/constants/auth-messages";
import {
  PASSWORD_MIN_LENGTH,
  passwordSchema,
} from "@/lib/validators/password";

const schema = z
  .object({
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, "Confirmação de senha é obrigatória"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

type FormData = z.infer<typeof schema>;
type PwnedStatus = "idle" | "checking" | "pwned" | "ok";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetSkeleton />}>
      <ResetForm />
    </Suspense>
  );
}

function ResetSkeleton() {
  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Redefinir senha</CardTitle>
      </CardHeader>
      <CardContent className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </CardContent>
    </Card>
  );
}

function ResetForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  const newPassword = watch("newPassword");
  const [pwnedStatus, setPwnedStatus] = useState<PwnedStatus>("idle");

  useEffect(() => {
    if (newPassword.length < PASSWORD_MIN_LENGTH) {
      setPwnedStatus("idle");
      return;
    }
    setPwnedStatus("checking");
    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      try {
        const result = await checkPasswordPwned(newPassword);
        if (!controller.signal.aborted) {
          setPwnedStatus(result.pwned ? "pwned" : "ok");
        }
      } catch {
        if (!controller.signal.aborted) setPwnedStatus("idle");
      }
    }, 500);
    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [newPassword]);

  async function onSubmit(data: FormData) {
    if (!token) {
      setError("Link inválido. Solicite um novo.");
      return;
    }
    if (pwnedStatus === "pwned") {
      setError(
        "Esta senha apareceu em um vazamento público de dados. Escolha uma senha diferente."
      );
      return;
    }

    try {
      setError(null);
      await resetPassword(token, data.newPassword);
      router.replace("/login?reason=password_reset");
    } catch (err: unknown) {
      setError(extractApiError(err, AUTH_GENERIC_ERRORS.resetPassword));
    }
  }

  if (!token) {
    return (
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Link inválido</CardTitle>
          <CardDescription>
            Não encontramos um token nesta URL. Solicite um novo link de
            redefinição.
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex justify-center">
          <Link href="/forgot-password">
            <Button variant="outline">Solicitar novo link</Button>
          </Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="space-y-1 text-center">
        <div className="flex justify-center mb-2">
          <span className="text-2xl font-bold tracking-tight text-primary">
            Manga
          </span>
        </div>
        <CardTitle className="text-2xl">Redefinir senha</CardTitle>
        <CardDescription>
          Escolha uma nova senha para sua conta. Todas as sessões existentes
          serão encerradas.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="newPassword">Nova senha</Label>
            <Input
              id="newPassword"
              type="password"
              placeholder={`Mínimo ${PASSWORD_MIN_LENGTH} caracteres`}
              autoComplete="new-password"
              {...register("newPassword")}
            />
            {errors.newPassword && (
              <p className="text-sm text-destructive">
                {errors.newPassword.message}
              </p>
            )}
            {newPassword.length > 0 && (
              <ul className="space-y-1 mt-2">
                <li
                  className={`flex items-center gap-1.5 text-xs ${
                    newPassword.length >= PASSWORD_MIN_LENGTH
                      ? "text-green-600"
                      : "text-muted-foreground"
                  }`}
                >
                  {newPassword.length >= PASSWORD_MIN_LENGTH ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <X className="h-3 w-3" />
                  )}
                  {`Mínimo ${PASSWORD_MIN_LENGTH} caracteres`}
                </li>
                {newPassword.length >= PASSWORD_MIN_LENGTH && (
                  <li
                    className={`flex items-center gap-1.5 text-xs ${
                      pwnedStatus === "ok"
                        ? "text-green-600"
                        : pwnedStatus === "pwned"
                        ? "text-destructive"
                        : "text-muted-foreground"
                    }`}
                  >
                    {pwnedStatus === "checking" ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : pwnedStatus === "ok" ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <X className="h-3 w-3" />
                    )}
                    {pwnedStatus === "checking"
                      ? "Verificando se a senha apareceu em vazamentos..."
                      : pwnedStatus === "pwned"
                      ? "Senha encontrada em vazamentos — escolha outra"
                      : pwnedStatus === "ok"
                      ? "Senha não encontrada em vazamentos públicos"
                      : "Verificação de vazamentos indisponível"}
                  </li>
                )}
              </ul>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Repita a senha"
              autoComplete="new-password"
              {...register("confirmPassword")}
            />
            {errors.confirmPassword && (
              <p className="text-sm text-destructive">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Redefinindo...
              </>
            ) : (
              <>
                <ShieldCheck className="mr-2 h-4 w-4" />
                Redefinir senha
              </>
            )}
          </Button>

          <Link
            href="/login"
            className="text-center text-sm text-muted-foreground hover:underline"
          >
            <ArrowLeft className="inline-block mr-1 h-3 w-3" />
            Voltar ao login
          </Link>
        </CardFooter>
      </form>
    </Card>
  );
}
