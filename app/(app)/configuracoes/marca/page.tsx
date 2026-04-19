"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Palette,
  Upload,
  Save,
  Eye,
  Type,
  Paintbrush,
  Image,
  RefreshCw,
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
import { showToast } from "@/lib/utils/toast";

import apiClient from "@/lib/api/client";

interface BrandConfig {
  logoUrl?: string;
  corPrimaria: string;
  corSecundaria: string;
  corAcento: string;
  fontePersonalizada: string;
}

const defaultBrand: BrandConfig = {
  logoUrl: "",
  corPrimaria: "#2563eb",
  corSecundaria: "#64748b",
  corAcento: "#f59e0b",
  fontePersonalizada: "",
};

export default function MarcaPage() {
  const [brand, setBrand] = useState<BrandConfig>(defaultBrand);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const { data: tenantData } = useQuery({
    queryKey: ["tenant-brand"],
    queryFn: async () => {
      const response = await apiClient.get("/tenant/brand");
      return response.data as BrandConfig;
    },
  });

  useEffect(() => {
    if (tenantData) {
      setBrand({
        logoUrl: tenantData.logoUrl || "",
        corPrimaria: tenantData.corPrimaria || defaultBrand.corPrimaria,
        corSecundaria: tenantData.corSecundaria || defaultBrand.corSecundaria,
        corAcento: tenantData.corAcento || defaultBrand.corAcento,
        fontePersonalizada:
          tenantData.fontePersonalizada || defaultBrand.fontePersonalizada,
      });
      if (tenantData.logoUrl) {
        setLogoPreview(tenantData.logoUrl);
      }
    }
  }, [tenantData]);

  const saveMutation = useMutation({
    mutationFn: async (data: BrandConfig) => {
      const response = await apiClient.put("/tenant/brand", data);
      return response.data;
    },
    onSuccess: () => {
      showToast("success", { title: "Marca atualizada com sucesso!" });
    },
  });

  const uploadLogoMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("logo", file);
      const response = await apiClient.post("/tenant/logo", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data;
    },
    onSuccess: (data) => {
      showToast("success", { title: "Logo atualizada com sucesso!" });
      if (data?.logoUrl) {
        setBrand((prev) => ({ ...prev, logoUrl: data.logoUrl }));
        setLogoPreview(data.logoUrl);
      }
    },
  });

  function handleLogoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      setLogoPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    uploadLogoMutation.mutate(file);
  }

  function handleSave() {
    saveMutation.mutate(brand);
  }

  function handleReset() {
    setBrand(defaultBrand);
    setLogoPreview(null);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Marca"
        description="Personalize a identidade visual da sua empresa"
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleReset}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Restaurar Padrao
            </Button>
            <Button
              onClick={handleSave}
              disabled={saveMutation.isPending}
            >
              <Save className="mr-2 h-4 w-4" />
              {saveMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Settings */}
        <div className="space-y-6">
          {/* Logo */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Image className="h-4 w-4" />
                Logo da Empresa
              </CardTitle>
              <CardDescription>
                Faca upload da logo que sera exibida nos documentos e na
                plataforma.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <div className="h-24 w-24 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center overflow-hidden bg-muted/50">
                  {logoPreview ? (
                    <img
                      src={logoPreview}
                      alt="Logo"
                      className="h-full w-full object-contain p-2"
                    />
                  ) : (
                    <Image className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
                <div className="space-y-2">
                  <label htmlFor="logo-upload">
                    <Button variant="outline" size="sm" asChild>
                      <span className="cursor-pointer">
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Logo
                        <input
                          id="logo-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleLogoChange}
                        />
                      </span>
                    </Button>
                  </label>
                  <p className="text-xs text-muted-foreground">
                    PNG, JPG ou SVG. Recomendado: 200x200px.
                  </p>
                  {uploadLogoMutation.isPending && (
                    <p className="text-xs text-muted-foreground">
                      Enviando...
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Colors */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Paintbrush className="h-4 w-4" />
                Cores
              </CardTitle>
              <CardDescription>
                Defina as cores que representam sua marca.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="corPrimaria">Cor Primaria</Label>
                <div className="flex items-center gap-3">
                  <input
                    id="corPrimaria"
                    type="color"
                    value={brand.corPrimaria}
                    onChange={(e) =>
                      setBrand({ ...brand, corPrimaria: e.target.value })
                    }
                    className="h-10 w-14 cursor-pointer rounded border"
                  />
                  <Input
                    value={brand.corPrimaria}
                    onChange={(e) =>
                      setBrand({ ...brand, corPrimaria: e.target.value })
                    }
                    placeholder="#2563eb"
                    className="max-w-[140px] font-mono"
                  />
                  <span className="text-xs text-muted-foreground">
                    Usada em botoes, links e elementos de destaque
                  </span>
                </div>
              </div>

              <Separator />

              <div className="grid gap-2">
                <Label htmlFor="corSecundaria">Cor Secundaria</Label>
                <div className="flex items-center gap-3">
                  <input
                    id="corSecundaria"
                    type="color"
                    value={brand.corSecundaria}
                    onChange={(e) =>
                      setBrand({ ...brand, corSecundaria: e.target.value })
                    }
                    className="h-10 w-14 cursor-pointer rounded border"
                  />
                  <Input
                    value={brand.corSecundaria}
                    onChange={(e) =>
                      setBrand({ ...brand, corSecundaria: e.target.value })
                    }
                    placeholder="#64748b"
                    className="max-w-[140px] font-mono"
                  />
                  <span className="text-xs text-muted-foreground">
                    Textos secundarios e bordas
                  </span>
                </div>
              </div>

              <Separator />

              <div className="grid gap-2">
                <Label htmlFor="corAcento">Cor de Acento</Label>
                <div className="flex items-center gap-3">
                  <input
                    id="corAcento"
                    type="color"
                    value={brand.corAcento}
                    onChange={(e) =>
                      setBrand({ ...brand, corAcento: e.target.value })
                    }
                    className="h-10 w-14 cursor-pointer rounded border"
                  />
                  <Input
                    value={brand.corAcento}
                    onChange={(e) =>
                      setBrand({ ...brand, corAcento: e.target.value })
                    }
                    placeholder="#f59e0b"
                    className="max-w-[140px] font-mono"
                  />
                  <span className="text-xs text-muted-foreground">
                    Destaques e notificacoes
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Font */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Type className="h-4 w-4" />
                Tipografia
              </CardTitle>
              <CardDescription>
                Defina a fonte personalizada para documentos e propostas.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                <Label htmlFor="fonte">Fonte Personalizada</Label>
                <Input
                  id="fonte"
                  placeholder="Ex: Inter, Roboto, Open Sans..."
                  value={brand.fontePersonalizada}
                  onChange={(e) =>
                    setBrand({
                      ...brand,
                      fontePersonalizada: e.target.value,
                    })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Insira o nome de uma fonte do Google Fonts. Deixe em branco
                  para usar a fonte padrao do sistema.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preview */}
        <div className="space-y-6">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Pre-visualizacao
              </CardTitle>
              <CardDescription>
                Veja como sua marca ficara na plataforma.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Header preview */}
              <div
                className="rounded-lg p-4"
                style={{ backgroundColor: brand.corPrimaria }}
              >
                <div className="flex items-center gap-3">
                  {logoPreview ? (
                    <img
                      src={logoPreview}
                      alt="Logo Preview"
                      className="h-8 w-8 rounded object-contain bg-white p-0.5"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded bg-white/20 flex items-center justify-center">
                      <Palette className="h-4 w-4 text-white" />
                    </div>
                  )}
                  <span
                    className="text-lg font-bold text-white"
                    style={{
                      fontFamily: brand.fontePersonalizada || "inherit",
                    }}
                  >
                    Sua Empresa
                  </span>
                </div>
              </div>

              {/* Card preview */}
              <div className="rounded-lg border p-4 space-y-3">
                <h3
                  className="font-semibold"
                  style={{
                    fontFamily: brand.fontePersonalizada || "inherit",
                  }}
                >
                  Proposta Comercial #001
                </h3>
                <p
                  className="text-sm"
                  style={{ color: brand.corSecundaria }}
                >
                  Reforma residencial - Cliente Exemplo
                </p>
                <div className="flex gap-2">
                  <span
                    className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
                    style={{ backgroundColor: brand.corPrimaria }}
                  >
                    Em andamento
                  </span>
                  <span
                    className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
                    style={{ backgroundColor: brand.corAcento }}
                  >
                    Prioridade
                  </span>
                </div>
              </div>

              {/* Button preview */}
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Botoes</p>
                <div className="flex gap-2 flex-wrap">
                  <button
                    className="rounded-md px-4 py-2 text-sm font-medium text-white transition-colors"
                    style={{ backgroundColor: brand.corPrimaria }}
                  >
                    Botao Primario
                  </button>
                  <button
                    className="rounded-md px-4 py-2 text-sm font-medium border transition-colors"
                    style={{
                      borderColor: brand.corPrimaria,
                      color: brand.corPrimaria,
                    }}
                  >
                    Botao Outline
                  </button>
                  <button
                    className="rounded-md px-4 py-2 text-sm font-medium text-white transition-colors"
                    style={{ backgroundColor: brand.corAcento }}
                  >
                    Destaque
                  </button>
                </div>
              </div>

              {/* Color swatches */}
              <Separator />
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Paleta de Cores
                </p>
                <div className="flex gap-3">
                  <div className="text-center">
                    <div
                      className="h-12 w-12 rounded-lg shadow-sm border"
                      style={{ backgroundColor: brand.corPrimaria }}
                    />
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Primaria
                    </p>
                  </div>
                  <div className="text-center">
                    <div
                      className="h-12 w-12 rounded-lg shadow-sm border"
                      style={{ backgroundColor: brand.corSecundaria }}
                    />
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Secundaria
                    </p>
                  </div>
                  <div className="text-center">
                    <div
                      className="h-12 w-12 rounded-lg shadow-sm border"
                      style={{ backgroundColor: brand.corAcento }}
                    />
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Acento
                    </p>
                  </div>
                </div>
              </div>

              {saveMutation.isSuccess && (
                <p className="text-sm text-green-600 text-center">
                  Configuracoes de marca salvas com sucesso!
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
