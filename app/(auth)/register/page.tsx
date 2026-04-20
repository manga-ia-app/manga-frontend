"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { Loader2, UserPlus, CheckCircle, Check, X } from "lucide-react";

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
import { checkPasswordPwned, registerUser } from "@/lib/api/auth";
import { extractApiError, parseApiError } from "@/lib/api/error";
import {
  PASSWORD_MIN_LENGTH,
  passwordSchema,
} from "@/lib/validators/password";

const registerSchema = z
  .object({
    firstName: z
      .string()
      .min(1, "Nome é obrigatório")
      .min(2, "Nome deve ter pelo menos 2 caracteres"),
    lastName: z
      .string()
      .min(1, "Sobrenome é obrigatório")
      .min(2, "Sobrenome deve ter pelo menos 2 caracteres"),
    email: z
      .string()
      .min(1, "E-mail é obrigatório")
      .email("E-mail inválido"),
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Confirmação de senha é obrigatória"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

type PwnedStatus = "idle" | "checking" | "pwned" | "ok";

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    setError: setFieldError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const password = watch("password");
  const [pwnedStatus, setPwnedStatus] = useState<PwnedStatus>("idle");

  // Debounced HIBP check: 500ms after last keystroke, ask the server whether
  // this password has appeared in known breaches.
  useEffect(() => {
    if (password.length < PASSWORD_MIN_LENGTH) {
      setPwnedStatus("idle");
      return;
    }

    setPwnedStatus("checking");
    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      try {
        const result = await checkPasswordPwned(password);
        if (!controller.signal.aborted) {
          setPwnedStatus(result.pwned ? "pwned" : "ok");
        }
      } catch {
        // Network failure mirrors backend fail-open behavior; don't block user.
        if (!controller.signal.aborted) {
          setPwnedStatus("idle");
        }
      }
    }, 500);

    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [password]);

  async function onSubmit(data: RegisterFormData) {
    if (pwnedStatus === "pwned") {
      setError(
        "Esta senha apareceu em um vazamento público de dados. Escolha uma senha diferente."
      );
      return;
    }

    try {
      setError(null);
      await registerUser({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
      });
      setSuccess(true);
    } catch (err: unknown) {
      const apiError = parseApiError(err);
      if (apiError?.type === "validation" && apiError.errors) {
        const formFields = new Set([
          "firstName",
          "lastName",
          "email",
          "password",
          "confirmPassword",
        ]);
        let mappedAny = false;
        for (const [field, messages] of Object.entries(apiError.errors)) {
          if (formFields.has(field) && messages.length > 0) {
            setFieldError(field as keyof RegisterFormData, {
              type: "server",
              message: messages[0],
            });
            mappedAny = true;
          }
        }
        if (!mappedAny) {
          setError(Object.values(apiError.errors).flat().join(" "));
        }
        return;
      }
      setError(extractApiError(err, "Ocorreu um erro ao criar a conta. Tente novamente."));
    }
  }

  if (success) {
    return (
      <Card>
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-12 w-12 text-green-500" />
          </div>
          <CardTitle className="text-2xl">Conta criada com sucesso!</CardTitle>
          <CardDescription>
            Sua conta está pronta. Faça login para começar a usar o sistema.
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex justify-center">
          <Link href="/login">
            <Button variant="outline">Ir para login</Button>
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
        <CardTitle className="text-2xl">Criar conta</CardTitle>
        <CardDescription>
          Preencha os dados abaixo para criar sua conta no Manga
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Nome</Label>
              <Input
                id="firstName"
                placeholder="João"
                autoComplete="given-name"
                {...register("firstName")}
              />
              {errors.firstName && (
                <p className="text-sm text-destructive">
                  {errors.firstName.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Sobrenome</Label>
              <Input
                id="lastName"
                placeholder="Silva"
                autoComplete="family-name"
                {...register("lastName")}
              />
              {errors.lastName && (
                <p className="text-sm text-destructive">
                  {errors.lastName.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              autoComplete="email"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              placeholder={`Mínimo ${PASSWORD_MIN_LENGTH} caracteres`}
              autoComplete="new-password"
              {...register("password")}
            />
            {errors.password && (
              <p className="text-sm text-destructive">
                {errors.password.message}
              </p>
            )}
            {password.length > 0 && (
              <ul className="space-y-1 mt-2">
                <li
                  className={`flex items-center gap-1.5 text-xs ${
                    password.length >= PASSWORD_MIN_LENGTH
                      ? "text-green-600"
                      : "text-muted-foreground"
                  }`}
                >
                  {password.length >= PASSWORD_MIN_LENGTH ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <X className="h-3 w-3" />
                  )}
                  {`Mínimo ${PASSWORD_MIN_LENGTH} caracteres`}
                </li>
                {password.length >= PASSWORD_MIN_LENGTH && (
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
                    ) : pwnedStatus === "pwned" ? (
                      <X className="h-3 w-3" />
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
            <Label htmlFor="confirmPassword">Confirmar senha</Label>
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
                Criando conta...
              </>
            ) : (
              <>
                <UserPlus className="mr-2 h-4 w-4" />
                Criar conta
              </>
            )}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Já tem uma conta?{" "}
            <Link
              href="/login"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Fazer login
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
