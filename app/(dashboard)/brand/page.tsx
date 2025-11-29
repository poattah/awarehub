"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { applyBrandToDocument, BrandKit } from "@/lib/brand";

type UploadState = {
  logo?: boolean;
  font?: boolean;
};

export default function BrandPage() {
  const [orgId, setOrgId] = useState<string | null>(null);
  const [kit, setKit] = useState<BrandKit | null>(null);
  const [name, setName] = useState("Default brand");
  const [primary, setPrimary] = useState("#3b82f6");
  const [secondary, setSecondary] = useState("#10b981");
  const [accent, setAccent] = useState("#f59e0b");
  const [background, setBackground] = useState("#ffffff");
  const [text, setText] = useState("#0f172a");
  const [headingFont, setHeadingFont] = useState("Inter");
  const [bodyFont, setBodyFont] = useState("Inter");
  const [customFontName, setCustomFontName] = useState("");
  const [customFontUrl, setCustomFontUrl] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [logoPreview, setLogoPreview] = useState("");
  const [buttonBg, setButtonBg] = useState("#3b82f6");
  const [buttonText, setButtonText] = useState("#ffffff");
  const [buttonRadius, setButtonRadius] = useState("9999px");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [successModal, setSuccessModal] = useState<{
    open: boolean;
    message: string;
  }>({ open: false, message: "" });
  const [uploading, setUploading] = useState<UploadState>({});
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputLogo = useRef<HTMLInputElement | null>(null);
  const fileInputFont = useRef<HTMLInputElement | null>(null);
  const [mounted, setMounted] = useState(false);

  const sanitizeFilename = (name: string) => {
    const parts = name.split(".");
    const ext = parts.length > 1 ? `.${parts.pop()}` : "";
    const base = parts.join(".");
    const safe =
      base
        .normalize("NFKD")
        .replace(/[^\w.-]+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-+|-+$/g, "") || "file";
    return `${safe}${ext}`;
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const loadOrgAndBrand = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", userId)
        .maybeSingle();
      if (!(profile as any)?.organization_id) return;
      setOrgId((profile as any).organization_id);
      setLoading(true);
      const resp = await fetch("/api/internal/brand-kit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organization_id: profile.organization_id }),
      });
      setLoading(false);
      if (!resp.ok) return;
      const json = await resp.json();
      const data = json.data as any;
      if (data) {
        setKit(data as BrandKit);
        setName(data.name || "Default brand");
        setPrimary(data.primary_color || "#3b82f6");
        setSecondary(data.secondary_color || "#10b981");
        setAccent(data.accent_color || "#f59e0b");
        setBackground(data.background_color || "#ffffff");
        setText(data.text_color || "#0f172a");
        setHeadingFont(data.font_family_heading || "Inter");
        setBodyFont(data.font_family_body || "Inter");
        setCustomFontName(data.font_custom_name || "");
        setCustomFontUrl(data.font_custom_url || "");
        setLogoUrl(data.logo_url || "");
        const button = (data.button_style || {}) as Record<string, any>;
        setButtonBg(button.bg || data.primary_color || "#3b82f6");
        setButtonText(button.text || "#ffffff");
        setButtonRadius(button.radius || "9999px");
        applyBrandToDocument(data as BrandKit);
      }
    };
    loadOrgAndBrand();
  }, []);

  const palettePreview = useMemo(
    () =>
      ({
        "--brand-primary": primary,
        "--brand-secondary": secondary,
        "--brand-accent": accent,
        "--brand-bg": background,
        "--brand-text": text,
        "--brand-button-bg": buttonBg,
        "--brand-button-text": buttonText,
      } as React.CSSProperties),
    [primary, secondary, accent, background, text, buttonBg, buttonText]
  );

  const handleUpload = async (file: File, type: "logo" | "font") => {
    if (!orgId) return null;
    setUploadError(null);
    // Ensure bucket exists (server-side create via service role)
    const ensureRes = await fetch("/api/internal/ensure-brand-bucket", {
      method: "POST",
    });
    if (!ensureRes.ok) {
      const msg =
        (await ensureRes.json().catch(() => null))?.error ||
        "Could not ensure bucket";
      setUploadError(msg);
      return null;
    }

    const bucket = supabase.storage.from("brand-assets");
    const safeName = sanitizeFilename(file.name);
    const path = `${orgId}/${type}-${Date.now()}-${safeName}`;
    setUploading((prev) => ({ ...prev, [type]: true }));
    const { error } = await bucket.upload(path, file, { upsert: true });
    setUploading((prev) => ({ ...prev, [type]: false }));
    if (error) {
      setUploadError(error.message || "Upload failed");
      return null;
    }
    const { data: publicUrlData } = bucket.getPublicUrl(path);
    const url = publicUrlData?.publicUrl || null;
    return url;
  };

  const saveBrand = async (opts?: { logoUrl?: string }) => {
    if (!orgId) {
      setSaveError("No organization context; please sign in again.");
      return;
    }
    setSaving(true);
    setSaveError(null);
    setSuccessModal({ open: false, message: "" });
    const button_style = {
      bg: buttonBg,
      text: buttonText,
      radius: buttonRadius,
    };
    const payload: any = {
      organization_id: orgId,
      name,
      primary_color: primary,
      secondary_color: secondary,
      accent_color: accent,
      background_color: background,
      text_color: text,
      font_family_heading: headingFont,
      font_family_body: bodyFont,
      font_custom_name: customFontName || null,
      font_custom_url: customFontUrl || null,
      logo_url: (opts?.logoUrl ?? logoUrl) || null,
      button_style,
      is_default: true,
    };
    // Save via service route to bypass RLS issues on brand_kits
    const resp = await fetch("/api/internal/save-brand", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...payload,
        brand_kit_id: kit?.id,
      }),
    });
    setSaving(false);
    if (!resp.ok) {
      const msg =
        (await resp.json().catch(() => null))?.error ||
        "Failed to save brand kit";
      setSaveError(msg);
      return;
    }
    const json = await resp.json();
    const data = json.data as BrandKit;
    if (data) {
      setKit(data);
      setLogoUrl((data as any).logo_url || logoUrl);
      applyBrandToDocument(data);
      setSuccessModal({ open: true, message: "Brand kit saved" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Brand Kit</h1>
          <p className="text-muted-foreground">
            Manage your organization's brand assets and styling
          </p>
        </div>
        <Button onClick={saveBrand} disabled={saving || loading}>
          {saving ? "Saving…" : "Save Brand"}
        </Button>
      </div>
      {saveError && <p className="text-sm text-red-600">{saveError}</p>}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Brand Colors</CardTitle>
            <CardDescription>
              Primary, secondary, accent, background, text, and button colors.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: "Primary", value: primary, setter: setPrimary },
              { label: "Secondary", value: secondary, setter: setSecondary },
              { label: "Accent", value: accent, setter: setAccent },
              { label: "Background", value: background, setter: setBackground },
              { label: "Text", value: text, setter: setText },
            ].map((item) => (
              <div className="space-y-2" key={item.label}>
                <Label>{item.label} color</Label>
                <div className="flex space-x-2">
                  <Input
                    type="color"
                    value={item.value}
                    onChange={(e) => item.setter(e.target.value)}
                    className="h-10 w-20"
                  />
                  <Input
                    type="text"
                    value={item.value}
                    onChange={(e) => item.setter(e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>
            ))}
            <div className="grid gap-3 md:grid-cols-3">
              <div>
                <Label>Button BG</Label>
                <Input
                  type="color"
                  value={buttonBg}
                  onChange={(e) => setButtonBg(e.target.value)}
                  className="h-10 w-full"
                />
              </div>
              <div>
                <Label>Button Text</Label>
                <Input
                  type="color"
                  value={buttonText}
                  onChange={(e) => setButtonText(e.target.value)}
                  className="h-10 w-full"
                />
              </div>
              <div>
                <Label>Button Radius</Label>
                <Input
                  value={buttonRadius}
                  onChange={(e) => setButtonRadius(e.target.value)}
                  placeholder="e.g., 8px or 9999px"
                />
              </div>
            </div>
            <div
              className="rounded-xl border border-border/60 bg-card/70 p-4"
              style={palettePreview as any}
            >
              <p
                className="text-sm font-semibold"
                style={{ color: "var(--brand-text)" }}
              >
                Preview
              </p>
              <div className="mt-3 flex items-center gap-3">
                <div
                  className="h-10 w-10 rounded-full"
                  style={{ background: "var(--brand-primary)" }}
                />
                <div
                  className="h-10 w-10 rounded-full"
                  style={{ background: "var(--brand-secondary)" }}
                />
                <div
                  className="h-10 w-10 rounded-full"
                  style={{ background: "var(--brand-accent)" }}
                />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  style={{
                    background: "var(--brand-button-bg)",
                    color: "var(--brand-button-text)",
                    borderRadius: buttonRadius,
                  }}
                >
                  Button
                </Button>
                <Button
                  variant="outline"
                  style={{
                    borderColor: "var(--brand-primary)",
                    color: "var(--brand-text)",
                  }}
                >
                  Outline
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Typography</CardTitle>
            <CardDescription>Choose or upload your brand fonts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Heading Font</Label>
              <select
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                value={headingFont}
                onChange={(e) => setHeadingFont(e.target.value)}
              >
                {[
                  "Inter",
                  "Roboto",
                  "Poppins",
                  "Open Sans",
                  "Manrope",
                  "Space Grotesk",
                ].map((opt) => (
                  <option key={opt}>{opt}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Body Font</Label>
              <select
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                value={bodyFont}
                onChange={(e) => setBodyFont(e.target.value)}
              >
                {[
                  "Inter",
                  "Roboto",
                  "Lato",
                  "Source Sans Pro",
                  "Manrope",
                  "Space Grotesk",
                ].map((opt) => (
                  <option key={opt}>{opt}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Upload custom font (TTF/OTF)</Label>
              <Input
                type="file"
                accept=".ttf,.otf,.woff,.woff2"
                ref={fileInputFont}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const url = await handleUpload(file, "font");
                  if (url) {
                    setCustomFontUrl(url);
                    setCustomFontName(file.name.replace(/\.[^.]+$/, ""));
                  }
                }}
              />
              {uploading.font && (
                <p className="text-xs text-muted-foreground">Uploading font…</p>
              )}
              {customFontUrl && (
                <p className="text-xs text-muted-foreground">
                  Custom font: {customFontName}
                </p>
              )}
            </div>
            <div
              className="p-4 border rounded-lg space-y-2"
              style={{ fontFamily: customFontName || headingFont }}
            >
              <p className="text-2xl font-bold">Heading Preview</p>
              <p
                className="text-base"
                style={{ fontFamily: customFontName || bodyFont }}
              >
                Body text preview in your selected font.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Logo & Assets</CardTitle>
            <CardDescription>
              Upload your organization's brand assets
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Primary Logo</Label>
                <div
                  className="relative flex aspect-square items-center justify-center rounded-lg border-2 border-dashed hover:border-primary cursor-pointer transition-colors bg-muted/30 overflow-hidden"
                  onClick={() => fileInputLogo.current?.click()}
                >
                  {logoPreview || logoUrl ? (
                    <img
                      src={logoPreview || logoUrl}
                      alt="Logo"
                      className="h-full w-full object-contain p-4"
                    />
                  ) : (
                    <div className="text-center">
                      <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                      <p className="mt-2 text-sm text-muted-foreground">
                        Upload Logo
                      </p>
                    </div>
                  )}
                  {uploading.logo && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex flex-col items-center justify-center text-white">
                      <div className="h-10 w-10 rounded-full border-4 border-white/40 border-t-white animate-spin" />
                      <p className="mt-2 text-xs font-semibold tracking-wide">
                        Uploading…
                      </p>
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputLogo}
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setLogoPreview(URL.createObjectURL(file));
                    const url = await handleUpload(file, "logo");
                    if (url) {
                      setLogoUrl(url);
                      await saveBrand({ logoUrl: url });
                    } else {
                      setSaveError("Logo upload failed; not saved.");
                    }
                  }}
                />
                {uploadError && (
                  <p className="text-xs text-red-600">{uploadError}</p>
                )}
                {!uploading.logo && logoUrl && !uploadError && (
                  <p className="text-xs text-muted-foreground">Logo updated</p>
                )}
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Current logo (saved)</Label>
                <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-muted/30 p-3 min-h-[88px]">
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt="Saved logo"
                      className="h-14 w-14 object-contain rounded-md bg-white p-2"
                    />
                  ) : (
                    <div className="h-14 w-14 rounded-md border border-dashed border-border/60 flex items-center justify-center text-xs text-muted-foreground">
                      None
                    </div>
                  )}
                  <div className="text-sm text-muted-foreground">
                    {logoUrl
                      ? "This is the currently saved logo."
                      : "No logo saved yet."}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {mounted &&
        successModal.open &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
            onClick={() => setSuccessModal({ open: false, message: "" })}
          >
            <div
              className="w-full max-w-sm rounded-2xl border border-border/70 bg-card shadow-soft-lg p-5 text-center space-y-3"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mx-auto h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <div className="h-6 w-6 rounded-full border-2 border-green-500 border-t-transparent animate-spin-slow" />
              </div>
              <h3 className="text-lg font-semibold">Success</h3>
              <p className="text-sm text-muted-foreground">
                {successModal.message}
              </p>
              <Button
                className="w-full"
                onClick={() => setSuccessModal({ open: false, message: "" })}
              >
                Close
              </Button>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
