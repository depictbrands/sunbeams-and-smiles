import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Camera, Save } from "lucide-react";

interface Props {
  userId: string;
  onSaved?: () => void;
}

const ProfileEditor = ({ userId, onSaved }: Props) => {
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase
      .from("profiles")
      .select("display_name, avatar_url")
      .eq("user_id", userId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setDisplayName(data.display_name ?? "");
          setAvatarUrl(data.avatar_url);
        }
      });
  }, [userId]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Imagen muy grande", description: "Máximo 5MB.", variant: "destructive" });
      return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${userId}/avatar-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (upErr) {
      setUploading(false);
      toast({ title: "Error", description: upErr.message, variant: "destructive" });
      return;
    }
    const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
    const url = pub.publicUrl;
    const { error: updErr } = await supabase.from("profiles").update({ avatar_url: url }).eq("user_id", userId);
    setUploading(false);
    if (updErr) {
      toast({ title: "Error", description: updErr.message, variant: "destructive" });
      return;
    }
    setAvatarUrl(url);
    toast({ title: "Foto actualizada" });
    onSaved?.();
  };

  const saveName = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: displayName.trim().slice(0, 100) })
      .eq("user_id", userId);
    setSaving(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Nombre guardado" });
    onSaved?.();
  };

  const initial = (displayName || "?").trim().charAt(0).toUpperCase();

  return (
    <Card className="p-6 rounded-3xl border-2 shadow-soft">
      <div className="flex items-center gap-5">
        <div className="relative">
          <Avatar className="h-20 w-20 border-2 border-primary/20">
            {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} />}
            <AvatarFallback className="text-xl bg-primary/15 text-primary font-bold">{initial}</AvatarFallback>
          </Avatar>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground rounded-full p-2 shadow-md hover:bg-primary/90 disabled:opacity-50"
            aria-label="Cambiar foto"
          >
            <Camera className="h-3.5 w-3.5" />
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
        </div>
        <div className="flex-1 space-y-2">
          <label className="block text-sm font-semibold text-ink">Nombre que verán los padres</label>
          <div className="flex gap-2">
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={100}
              placeholder="Ej: Maestra Ana"
            />
            <Button variant="hero" onClick={saveName} disabled={saving}>
              <Save className="h-4 w-4" /> Guardar
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ProfileEditor;
