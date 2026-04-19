"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const numStr = (v: number) => (v ? String(v) : "");

export interface HealthBandLocal {
  lowerBound: number;
  upperBound: number;
  label: string;
  color: string;
  displayOrder: number;
}

const colorOptions = [
  { value: "green", label: "Verde" },
  { value: "blue", label: "Azul" },
  { value: "yellow", label: "Amarelo" },
  { value: "red", label: "Vermelho" },
];

interface Props {
  bands: HealthBandLocal[];
  onChange: (bands: HealthBandLocal[]) => void;
}

export function HealthBandConfig({ bands, onChange }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  const handleBandChange = (index: number, field: keyof HealthBandLocal, value: unknown) => {
    const updated = [...bands];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  return (
    <Card>
      <div className="px-4 py-3">
        <button
          type="button"
          className="flex items-center gap-2 text-left w-full"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
        >
          {isOpen ? (
            <ChevronDown className="h-4 w-4 shrink-0" />
          ) : (
            <ChevronRight className="h-4 w-4 shrink-0" />
          )}
          <span className="font-semibold text-sm">Indicador de Saúde</span>
        </button>
      </div>

      {isOpen && (
        <CardContent className="pt-0">
          <p className="text-xs text-muted-foreground mb-3">
            Configure as faixas de saúde do overhead do escritório.
          </p>
          <div className="space-y-3">
            {bands.map((band, i) => {
              const isLast = i === bands.length - 1;
              const lowerId = `band-lower-${i}`;
              const upperId = `band-upper-${i}`;
              const labelId = `band-label-${i}`;
              const colorId = `band-color-${i}`;

              return (
                <div
                  key={i}
                  className="grid grid-cols-[80px_80px_1fr_100px] gap-2 items-end"
                >
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">De (%)</span>
                    {i === 0 ? (
                      <span className="flex h-8 items-center text-sm text-muted-foreground">0%</span>
                    ) : (
                      <Input
                        id={lowerId}
                        type="number"
                        min={0}
                        value={numStr(band.lowerBound)}
                        onChange={(e) =>
                          handleBandChange(i, "lowerBound", parseFloat(e.target.value) || 0)
                        }
                        className="h-8 text-sm"
                      />
                    )}
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">Até (%)</span>
                    {isLast ? (
                      <span className="flex h-8 items-center text-sm text-muted-foreground">∞</span>
                    ) : (
                      <Input
                        id={upperId}
                        type="number"
                        min={0}
                        value={numStr(band.upperBound)}
                        onChange={(e) =>
                          handleBandChange(i, "upperBound", parseFloat(e.target.value) || 0)
                        }
                        className="h-8 text-sm"
                      />
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={labelId} className="text-xs">Rótulo</Label>
                    <Input
                      id={labelId}
                      value={band.label}
                      onChange={(e) => handleBandChange(i, "label", e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={colorId} className="text-xs">Cor</Label>
                    <Select value={band.color || undefined} onValueChange={(val) => handleBandChange(i, "color", val)}>
                      <SelectTrigger id={colorId} className="h-8 w-full text-sm">
                        <SelectValue placeholder="Cor..." />
                      </SelectTrigger>
                      <SelectContent>
                        {colorOptions.map((c) => (
                          <SelectItem key={c.value} value={c.value}>
                            {c.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
