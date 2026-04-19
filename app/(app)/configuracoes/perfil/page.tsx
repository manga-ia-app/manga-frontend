"use client";

import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  User,
  Mail,
  Phone,
  Camera,
  Lock,
  Save,
  Eye,
  EyeOff,
  Shield,
} from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";
import { maskPhone, unmask } from "@/lib/utils/masks";
import { showToast } from "@/lib/utils/toast";

import apiClient from "@/lib/api/client";
import { useAuth } from "@/lib/hooks/use-auth";

export default function PerfilPage() {
  const { user } = useAuth();

  const [profileForm, setProfileForm] = useState({
    nome: "",
    email: "",
    telefone: "",
  });

  const [passwordForm, setPasswordForm] = useState({
    senhaAtual: "",
    novaSenha: "",
    confirmarSenha: "",
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Load user data
  useEffect(() => {
    if (user) {
      setProfileForm({
        nome: user.nome || "",
        email: user.email || "",
        telefone: "",
      });
      if (user.avatarUrl) {
        setAvatarPreview(user.avatarUrl);
      }
    }
  }, [user]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: { nome: string; telefone?: string }) => {
      const response = await apiClient.put("/auth/profile", data);
      return response.data;
    },
    onSuccess: () => {
      showToast("success", { title: "Perfil atualizado com sucesso!" });
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: {
      senhaAtual: string;
      novaSenha: string;
    }) => {
      const response = await apiClient.put("/auth/change-password", data);
      return response.data;
    },
    onSuccess: () => {
      showToast("success", { title: "Senha alterada com sucesso!" });
      setPasswordForm({
        senhaAtual: "",
        novaSenha: "",
        confirmarSenha: "",
      });
      setPasswordError("");
    },
  });

  const uploadAvatarMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("avatar", file);
      const response = await apiClient.post("/auth/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data;
    },
    onSuccess: (data) => {
      showToast("success", { title: "Foto de perfil atualizada com sucesso!" });
      if (data?.avatarUrl) {
        setAvatarPreview(data.avatarUrl);
      }
    },
  });

  function handleSaveProfile() {
    updateProfileMutation.mutate({
      nome: profileForm.nome,
      telefone: profileForm.telefone ? unmask(profileForm.telefone) : undefined,
    });
  }

  function handleChangePassword() {
    setPasswordError("");

    if (!passwordForm.senhaAtual || !passwordForm.novaSenha) {
      setPasswordError("Preencha todos os campos de senha.");
      return;
    }

    if (passwordForm.novaSenha.length < 8) {
      setPasswordError("A nova senha deve ter pelo menos 8 caracteres.");
      return;
    }

    if (passwordForm.novaSenha !== passwordForm.confirmarSenha) {
      setPasswordError("As senhas nao coincidem.");
      return;
    }

    changePasswordMutation.mutate({
      senhaAtual: passwordForm.senhaAtual,
      novaSenha: passwordForm.novaSenha,
    });
  }

  function handleAvatarChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    // Preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setAvatarPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload
    uploadAvatarMutation.mutate(file);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Perfil"
        description="Gerencie suas informacoes pessoais e senha"
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile info */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4" />
                Informacoes Pessoais
              </CardTitle>
              <CardDescription>
                Atualize seus dados pessoais. O email nao pode ser alterado.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="nome">Nome Completo</Label>
                <Input
                  id="nome"
                  placeholder="Seu nome completo"
                  value={profileForm.nome}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, nome: e.target.value })
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email">E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    className="pl-10 bg-muted/50"
                    value={profileForm.email}
                    disabled
                    readOnly
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  O email nao pode ser alterado. Entre em contato com o suporte
                  se necessario.
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="telefone">Telefone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="telefone"
                    className="pl-10"
                    placeholder="(00) 00000-0000"
                    value={profileForm.telefone}
                    onChange={(e) =>
                      setProfileForm({
                        ...profileForm,
                        telefone: maskPhone(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button
                onClick={handleSaveProfile}
                disabled={updateProfileMutation.isPending}
              >
                <Save className="mr-2 h-4 w-4" />
                {updateProfileMutation.isPending
                  ? "Salvando..."
                  : "Salvar Alteracoes"}
              </Button>
            </CardFooter>
          </Card>

          {/* Password change */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Alterar Senha
              </CardTitle>
              <CardDescription>
                Para alterar sua senha, informe a senha atual e a nova senha.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="senhaAtual">Senha Atual</Label>
                <div className="relative">
                  <Input
                    id="senhaAtual"
                    type={showCurrentPassword ? "text" : "password"}
                    placeholder="Sua senha atual"
                    value={passwordForm.senhaAtual}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        senhaAtual: e.target.value,
                      })
                    }
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="novaSenha">Nova Senha</Label>
                  <div className="relative">
                    <Input
                      id="novaSenha"
                      type={showNewPassword ? "text" : "password"}
                      placeholder="Minimo 8 caracteres"
                      value={passwordForm.novaSenha}
                      onChange={(e) =>
                        setPasswordForm({
                          ...passwordForm,
                          novaSenha: e.target.value,
                        })
                      }
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="confirmarSenha">Confirmar Nova Senha</Label>
                  <Input
                    id="confirmarSenha"
                    type="password"
                    placeholder="Repita a nova senha"
                    value={passwordForm.confirmarSenha}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        confirmarSenha: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              {passwordError && (
                <p className="text-sm text-destructive">{passwordError}</p>
              )}

              {changePasswordMutation.isSuccess && (
                <p className="text-sm text-green-600">
                  Senha alterada com sucesso!
                </p>
              )}

              {changePasswordMutation.isError && (
                <p className="text-sm text-destructive">
                  Erro ao alterar a senha. Verifique a senha atual e tente novamente.
                </p>
              )}
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button
                variant="outline"
                onClick={handleChangePassword}
                disabled={changePasswordMutation.isPending}
              >
                <Lock className="mr-2 h-4 w-4" />
                {changePasswordMutation.isPending
                  ? "Alterando..."
                  : "Alterar Senha"}
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Sidebar - Avatar and account info */}
        <div className="space-y-6">
          {/* Avatar */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Foto do Perfil</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <div className="relative group">
                <div className="h-32 w-32 rounded-full bg-muted flex items-center justify-center overflow-hidden border-4 border-background shadow-lg">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Avatar"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User className="h-16 w-16 text-muted-foreground" />
                  )}
                </div>
                <label
                  htmlFor="avatar-upload"
                  className="absolute bottom-0 right-0 h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center cursor-pointer shadow-md hover:bg-primary/90 transition-colors"
                >
                  <Camera className="h-4 w-4" />
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                </label>
              </div>
              <p className="text-xs text-muted-foreground mt-3 text-center">
                Clique no icone da camera para alterar sua foto. Formatos: JPG,
                PNG. Tamanho maximo: 2MB.
              </p>
              {uploadAvatarMutation.isPending && (
                <p className="text-xs text-muted-foreground mt-2">
                  Enviando foto...
                </p>
              )}
            </CardContent>
          </Card>

          {/* Account info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Informacoes da Conta
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Funcao</p>
                <Badge variant="secondary" className="mt-1">
                  {user?.role || "Colaborador"}
                </Badge>
              </div>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge variant="default" className="mt-1">
                  Ativo
                </Badge>
              </div>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground">Membro desde</p>
                <p className="text-sm font-medium mt-1">
                  {user?.criadoEm
                    ? new Date(user.criadoEm).toLocaleDateString("pt-BR")
                    : "-"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
