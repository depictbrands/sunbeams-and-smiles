import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "@/hooks/use-toast";
import { Send, Plus, ArrowLeft, MessageCircle, Paperclip, X, FileIcon, Download, Link as LinkIcon } from "lucide-react";
import nildaAsset from "@/assets/subdirectora-Nilda.png.asset.json";

const URL_REGEX = /(https?:\/\/[^\s]+)/g;

const renderBodyWithLinks = (text: string, mine: boolean) => {
  const parts = text.split(URL_REGEX);
  return parts.map((part, i) => {
    if (URL_REGEX.test(part)) {
      URL_REGEX.lastIndex = 0;
      return (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className={`underline break-all ${mine ? "text-primary-foreground" : "text-primary"}`}
        >
          {part}
        </a>
      );
    }
    return <span key={i}>{part}</span>;
  });
};

const promptForLink = (): string | null => {
  const url = window.prompt("Pega el enlace (ej: Google Drive, YouTube, Vimeo):", "https://");
  if (!url) return null;
  const trimmed = url.trim();
  if (!/^https?:\/\//i.test(trimmed)) {
    toast({ title: "Enlace inválido", description: "Debe empezar con http:// o https://", variant: "destructive" });
    return null;
  }
  return trimmed;
};

type Profile = { user_id: string; display_name: string | null; email: string; avatar_url: string | null };

type Thread = {
  id: string;
  subject: string;
  parent_id: string;
  assigned_teacher_id: string | null;
  last_message_at: string;
  parent?: Profile;
  teacher?: Profile;
};

type Message = {
  id: string;
  thread_id: string;
  sender_id: string;
  body: string | null;
  created_at: string;
  attachment_path: string | null;
  attachment_name: string | null;
  attachment_type: string | null;
  attachment_size: number | null;
  sender?: Profile;
};

interface Props {
  userId: string;
  isStaff: boolean;
  onUnreadCountChange?: (count: number) => void;
}

const lastSeenKey = (userId: string) => `msg-last-seen-v1-${userId}`;
const loadLastSeen = (userId: string): Record<string, number> => {
  try {
    const raw = localStorage.getItem(lastSeenKey(userId));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};
const saveLastSeen = (userId: string, map: Record<string, number>) => {
  try {
    localStorage.setItem(lastSeenKey(userId), JSON.stringify(map));
  } catch {
    /* noop */
  }
};


const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024; // 10 MB

const initialOf = (p?: Profile | null) =>
  ((p?.display_name || p?.email || "?").trim().charAt(0) || "?").toUpperCase();

const nameOf = (p?: Profile | null) => p?.display_name || p?.email || "Usuario";

const STAFF_CONTACTS: { name: string; role: string; avatar?: string }[] = [
  { name: "Griselle", role: "Directora", avatar: "/teacher-profile-pictures/director-Griselle.png" },
  { name: "Adriana", role: "Administración", avatar: "/teacher-profile-pictures/maestra-Adriana.jpeg" },
  { name: "Nilda", role: "Subdirectora", avatar: nildaAsset.url },
  { name: "Yeidy", role: "Maestra", avatar: "/teacher-profile-pictures/maestra-Yeidy.jpg" },
  { name: "Bea", role: "Maestra", avatar: "/teacher-profile-pictures/maestra-Bea.jpeg" },
  { name: "Esmeralda", role: "Maestra", avatar: "/teacher-profile-pictures/maestra-Esmeralda.jpeg" },
  { name: "Zuania", role: "Asistente de maestra", avatar: "/teacher-profile-pictures/maestra-Zuania.jpeg" },
  { name: "Nay", role: "Asistente de maestra", avatar: "/teacher-profile-pictures/maestra-Nay.jpeg" },
  { name: "Keisy", role: "Asistente de maestra", avatar: "/teacher-profile-pictures/maestra-Keisy.jpeg" },
];

const formatBytes = (n: number | null) => {
  if (!n) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
};

const MessagesInbox = ({ userId, isStaff, onUnreadCountChange }: Props) => {
  const [lastSeen, setLastSeen] = useState<Record<string, number>>(() => loadLastSeen(userId));
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState("");
  const [newSubject, setNewSubject] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [teachers, setTeachers] = useState<Profile[]>([]);
  const [selectedContact, setSelectedContact] = useState<string>("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const newFileInputRef = useRef<HTMLInputElement>(null);

  const fetchProfiles = async (ids: string[]) => {
    if (!ids.length) return new Map<string, Profile>();
    const { data } = await supabase
      .from("profiles")
      .select("user_id, display_name, email, avatar_url")
      .in("user_id", ids);
    return new Map((data ?? []).map((p) => [p.user_id, p as Profile]));
  };

  const loadTeachers = async () => {
    const { data } = await supabase
      .from("teacher_profiles_public" as any)
      .select("user_id, display_name, avatar_url");
    setTeachers(((data ?? []) as any[]).map((p) => ({ ...p, email: "" })) as Profile[]);
  };

  // Match the picked staff name to a real teacher account so the thread stays private to her
  const resolveTeacherId = (contactName: string): string | null => {
    const aliases: Record<string, string[]> = {
      bea: ["bea", "beatriz"],
      nay: ["nay", "nayda", "delma"],
      griselle: ["griselle", "grisel"],
    };
    const key = contactName.trim().toLowerCase();
    const candidates = aliases[key] ?? [key];
    const match = teachers.find((t) => {
      const name = (t.display_name || "").toLowerCase();
      return candidates.some((c) => name.split(/\s+/).includes(c) || name.startsWith(c));
    });
    return match?.user_id ?? null;
  };


  const loadThreads = async () => {
    const { data: threadsData, error } = await supabase
      .from("message_threads")
      .select("id, subject, parent_id, assigned_teacher_id, last_message_at")
      .order("last_message_at", { ascending: false });
    if (error) return;
    const rows = (threadsData ?? []) as Thread[];
    const ids = Array.from(
      new Set(rows.flatMap((t) => [t.parent_id, t.assigned_teacher_id]).filter(Boolean) as string[]),
    );
    const map = await fetchProfiles(ids);
    setThreads(rows.map((t) => ({ ...t, parent: map.get(t.parent_id), teacher: t.assigned_teacher_id ? map.get(t.assigned_teacher_id) : undefined })));
  };

  const loadMessages = async (threadId: string) => {
    const { data } = await supabase
      .from("messages")
      .select("id, thread_id, sender_id, body, created_at, attachment_path, attachment_name, attachment_type, attachment_size")
      .eq("thread_id", threadId)
      .order("created_at", { ascending: true });
    const msgs = (data ?? []) as Message[];
    const ids = Array.from(new Set(msgs.map((m) => m.sender_id)));
    const map = await fetchProfiles(ids);
    setMessages(msgs.map((m) => ({ ...m, sender: map.get(m.sender_id) })));

    // Sign URLs for any attachments we haven't signed yet
    const toSign = msgs
      .map((m) => m.attachment_path)
      .filter((p): p is string => !!p && !signedUrls[p]);
    if (toSign.length) {
      const entries: [string, string][] = [];
      await Promise.all(
        toSign.map(async (path) => {
          const { data: signed } = await supabase.storage
            .from("message-attachments")
            .createSignedUrl(path, 3600);
          if (signed?.signedUrl) entries.push([path, signed.signedUrl]);
        }),
      );
      if (entries.length) {
        setSignedUrls((prev) => ({ ...prev, ...Object.fromEntries(entries) }));
      }
    }

    setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }), 50);
  };

  useEffect(() => {
    loadThreads();
    loadTeachers();
    const channel = supabase
      .channel("messages-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        const newMsg = payload.new as Message;
        if (activeId && newMsg.thread_id === activeId) {
          loadMessages(activeId);
          markSeen(activeId);
        } else if (newMsg.sender_id !== userId) {
          toast({ title: "Nuevo mensaje", description: "Tienes un mensaje sin leer." });
        }
        loadThreads();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "message_threads" }, () => loadThreads())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  useEffect(() => {
    if (activeId) {
      loadMessages(activeId);
      markSeen(activeId);
    }
  }, [activeId]);

  const markSeen = (threadId: string) => {
    setLastSeen((prev) => {
      const next = { ...prev, [threadId]: Date.now() };
      saveLastSeen(userId, next);
      return next;
    });
  };

  const isUnread = (t: Thread) => {
    const seen = lastSeen[t.id] ?? 0;
    return new Date(t.last_message_at).getTime() > seen;
  };

  const unreadCount = threads.filter(isUnread).length;

  useEffect(() => {
    onUnreadCountChange?.(unreadCount);
  }, [unreadCount, onUnreadCountChange]);


  const handlePickFile = (file: File | null) => {
    if (!file) {
      setPendingFile(null);
      return;
    }
    if (file.size > MAX_ATTACHMENT_BYTES) {
      toast({
        title: "Archivo demasiado grande",
        description: "El máximo permitido es 10 MB.",
        variant: "destructive",
      });
      return;
    }
    setPendingFile(file);
  };

  const uploadAttachment = async (threadId: string, file: File) => {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-120);
    const path = `${threadId}/${userId}/${Date.now()}-${safeName}`;
    const { error } = await supabase.storage
      .from("message-attachments")
      .upload(path, file, { contentType: file.type || "application/octet-stream", upsert: false });
    if (error) throw error;
    return {
      attachment_path: path,
      attachment_name: file.name,
      attachment_type: file.type || null,
      attachment_size: file.size,
    };
  };

  const notifySchool = async (params: {
    teacherName: string;
    subject: string;
    bodyText: string;
    threadId: string;
  }) => {
    try {
      const { data: prof } = await supabase
        .from("profiles")
        .select("display_name, email")
        .eq("user_id", userId)
        .maybeSingle();
      await supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "new-parent-message",
          recipientEmail: "preescolarsonsoles@gmail.com",
          idempotencyKey: `msg-${params.threadId}-${Date.now()}`,
          templateData: {
            parentName: prof?.display_name || prof?.email || "Padre",
            parentEmail: prof?.email ?? "",
            teacherName: params.teacherName,
            subject: params.subject,
            body: params.bodyText,
          },
        },
      });
    } catch (e) {
      console.warn("Email notification failed", e);
    }
  };

  const createThread = async () => {
    if (!newSubject.trim() || (!body.trim() && !pendingFile)) {
      toast({ title: "Falta información", description: "Agrega un asunto y un mensaje o adjunto.", variant: "destructive" });
      return;
    }
    if (!selectedContact) {
      toast({ title: "Elige una maestra", description: "Selecciona a quién enviarle el mensaje.", variant: "destructive" });
      return;
    }
    const teacherId = resolveTeacherId(selectedContact);
    setLoading(true);
    const subjectWithContact = `[Para: ${selectedContact}] ${newSubject.trim()}`.slice(0, 200);
    const { data: thread, error } = await supabase
      .from("message_threads")
      .insert({
        subject: subjectWithContact,
        parent_id: userId,
        assigned_teacher_id: teacherId,
      })
      .select()
      .single();
    if (error || !thread) {
      toast({ title: "Error", description: error?.message ?? "No se pudo crear", variant: "destructive" });
      setLoading(false);
      return;
    }
    const msgText = body.trim().slice(0, 5000);
    let attachmentFields: Record<string, unknown> = {};
    if (pendingFile) {
      try {
        attachmentFields = await uploadAttachment(thread.id, pendingFile);
      } catch (e: any) {
        setLoading(false);
        toast({ title: "Error al subir archivo", description: e.message ?? String(e), variant: "destructive" });
        return;
      }
    }
    const { error: msgErr } = await supabase
      .from("messages")
      .insert({
        thread_id: thread.id,
        sender_id: userId,
        body: msgText || null,
        ...attachmentFields,
      });
    setLoading(false);
    if (msgErr) {
      toast({ title: "Error", description: msgErr.message, variant: "destructive" });
      return;
    }
    notifySchool({
      teacherName: selectedContact,
      subject: newSubject.trim(),
      bodyText: msgText || (pendingFile ? `📎 ${pendingFile.name}` : ""),
      threadId: thread.id,
    });
    setNewSubject("");
    setBody("");
    setSelectedContact("");
    setPendingFile(null);
    setShowNew(false);
    setActiveId(thread.id);
    loadThreads();
  };

  const sendReply = async () => {
    if ((!body.trim() && !pendingFile) || !activeId) return;
    setLoading(true);
    const replyText = body.trim().slice(0, 5000);
    let attachmentFields: Record<string, unknown> = {};
    if (pendingFile) {
      try {
        attachmentFields = await uploadAttachment(activeId, pendingFile);
      } catch (e: any) {
        setLoading(false);
        toast({ title: "Error al subir archivo", description: e.message ?? String(e), variant: "destructive" });
        return;
      }
    }
    const { error } = await supabase
      .from("messages")
      .insert({
        thread_id: activeId,
        sender_id: userId,
        body: replyText || null,
        ...attachmentFields,
      });
    setLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    // Staff replying to an unassigned thread takes ownership so it stays private to her
    if (isStaff && activeThread && !activeThread.assigned_teacher_id && teachers.some((t) => t.user_id === userId)) {
      await supabase
        .from("message_threads")
        .update({ assigned_teacher_id: userId })
        .eq("id", activeId);
    }

    if (activeThread) {
      const teacherName = activeThread.subject.match(/^\[Para:\s*([^\]]+)\]/)?.[1]?.trim() || "Maestra";
      const cleanSubject = activeThread.subject.replace(/^\[Para:[^\]]+\]\s*/, "");
      const notifyBody = replyText || (pendingFile ? `📎 ${pendingFile.name}` : "");
      if (!isStaff) {
        notifySchool({
          teacherName,
          subject: cleanSubject,
          bodyText: notifyBody,
          threadId: activeId,
        });
      } else {
        try {
          const { data: prof } = await supabase
            .from("profiles")
            .select("display_name, email")
            .eq("user_id", userId)
            .maybeSingle();
          const { data: parentProf } = await supabase
            .from("profiles")
            .select("display_name, email")
            .eq("user_id", activeThread.parent_id)
            .maybeSingle();
          await supabase.functions.invoke("send-transactional-email", {
            body: {
              templateName: "new-parent-message",
              recipientEmail: "preescolarsonsoles@gmail.com",
              idempotencyKey: `msg-${activeId}-${Date.now()}`,
              templateData: {
                parentName: `${prof?.display_name || prof?.email || "Staff"} (respuesta)`,
                parentEmail: prof?.email ?? "",
                teacherName: `${parentProf?.display_name || parentProf?.email || "Padre"}`,
                subject: cleanSubject,
                body: notifyBody,
              },
            },
          });
        } catch (e) {
          console.warn("Email notification failed", e);
        }
      }
    }
    setBody("");
    setPendingFile(null);
    loadMessages(activeId);
  };

  const activeThread = threads.find((t) => t.id === activeId);

  const renderAttachment = (m: Message, mine: boolean) => {
    if (!m.attachment_path) return null;
    const url = signedUrls[m.attachment_path];
    const isImage = (m.attachment_type ?? "").startsWith("image/");
    if (isImage && url) {
      return (
        <a href={url} target="_blank" rel="noopener noreferrer" className="block mt-1">
          <img
            src={url}
            alt={m.attachment_name ?? "Imagen"}
            className="max-h-64 rounded-xl border border-black/10 object-cover"
          />
        </a>
      );
    }
    return (
      <a
        href={url ?? "#"}
        target="_blank"
        rel="noopener noreferrer"
        className={`mt-2 flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium ${
          mine ? "bg-primary-foreground/15 text-primary-foreground" : "bg-background text-ink border"
        }`}
      >
        <FileIcon className="h-4 w-4 flex-shrink-0" />
        <span className="truncate flex-1">{m.attachment_name ?? "Archivo"}</span>
        <span className="opacity-70">{formatBytes(m.attachment_size)}</span>
        <Download className="h-3.5 w-3.5 opacity-70" />
      </a>
    );
  };

  return (
    <Card className="rounded-3xl border-2 shadow-soft overflow-hidden">
      <div className="grid md:grid-cols-[320px_1fr] min-h-[500px]">
        {/* Sidebar */}
        <div className={`border-r bg-muted/30 ${activeId || showNew ? "hidden md:block" : ""}`}>
          <div className="p-4 border-b flex items-center justify-between">
            <h3 className="font-bold text-ink flex items-center gap-2">
              <MessageCircle className="h-4 w-4" /> {isStaff ? "Bandeja" : "Mis mensajes"}
              {unreadCount > 0 && (
                <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-destructive text-destructive-foreground text-[11px] font-bold">
                  {unreadCount}
                </span>
              )}
            </h3>
            {!isStaff && (
              <Button size="sm" variant="hero" onClick={() => { setShowNew(true); setActiveId(null); }}>
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </div>
          <div className="overflow-y-auto max-h-[450px]">
            {threads.length === 0 && (
              <p className="p-4 text-sm text-muted-foreground">
                {isStaff ? "Aún no hay conversaciones." : "No tienes mensajes. Crea uno nuevo."}
              </p>
            )}
            {threads.map((t) => {
              const other = isStaff ? t.parent : t.teacher;
              const unread = isUnread(t);
              return (
                <button
                  key={t.id}
                  onClick={() => { setActiveId(t.id); setShowNew(false); }}
                  className={`w-full text-left p-3 border-b hover:bg-accent/50 transition-colors flex gap-3 items-start ${
                    activeId === t.id ? "bg-accent" : ""
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    <Avatar className="h-10 w-10">
                      {other?.avatar_url && <AvatarImage src={other.avatar_url} alt={nameOf(other)} />}
                      <AvatarFallback className="bg-primary/15 text-primary text-sm font-bold">{initialOf(other)}</AvatarFallback>
                    </Avatar>
                    {unread && (
                      <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-destructive ring-2 ring-background" aria-label="Nuevo mensaje" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className={`text-sm text-ink truncate flex items-center gap-2 ${unread ? "font-extrabold" : "font-semibold"}`}>
                      <span className="truncate">{nameOf(other)}</span>
                      {unread && <span className="text-[10px] uppercase tracking-wide text-destructive font-bold">Nuevo</span>}
                    </div>
                    <div className={`text-xs truncate ${unread ? "text-ink font-medium" : "text-muted-foreground"}`}>{t.subject}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      {new Date(t.last_message_at).toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" })}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

        </div>

        {/* Main panel */}
        <div className="flex flex-col">
          {showNew && !isStaff ? (
            <div className="p-6 space-y-4">
              <button onClick={() => setShowNew(false)} className="md:hidden inline-flex items-center gap-1 text-sm text-muted-foreground">
                <ArrowLeft className="h-4 w-4" /> Volver
              </button>
              <h3 className="font-bold text-ink">Nuevo mensaje</h3>

              <div>
                <label className="text-sm font-semibold text-ink mb-2 block">Para</label>
                <div className="grid sm:grid-cols-2 gap-2">
                  {STAFF_CONTACTS.map((c) => {
                    const selected = selectedContact === c.name;
                    return (
                      <button
                        key={c.name}
                        type="button"
                        onClick={() => setSelectedContact(c.name)}
                        className={`w-full rounded-2xl border-2 p-3 text-left transition-colors flex items-center gap-3 ${
                          selected ? "border-primary bg-primary/10" : "border-border bg-background hover:bg-accent/50"
                        }`}
                      >
                        <Avatar className="h-11 w-11">
                          {c.avatar && <AvatarImage src={c.avatar} alt={c.name} className="object-cover" />}
                          <AvatarFallback className="bg-primary/15 text-primary text-sm font-bold">
                            {c.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-ink truncate">{c.name}</div>
                          <div className="text-xs text-muted-foreground truncate">{c.role}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-ink mb-1 block">Asunto</label>
                <Input value={newSubject} onChange={(e) => setNewSubject(e.target.value)} maxLength={200} placeholder="Ej: Pregunta sobre el horario" />
              </div>
              <div>
                <label className="text-sm font-semibold text-ink mb-1 block">Mensaje</label>
                <Textarea value={body} onChange={(e) => setBody(e.target.value)} maxLength={5000} rows={6} placeholder="Escribe tu mensaje..." />
              </div>

              <div>
                <input
                  ref={newFileInputRef}
                  type="file"
                  className="hidden"
                  accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx"
                  onChange={(e) => handlePickFile(e.target.files?.[0] ?? null)}
                />
                {pendingFile ? (
                  <div className="flex items-center gap-2 rounded-xl border bg-muted/40 p-2 text-sm">
                    <FileIcon className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="truncate flex-1">{pendingFile.name}</span>
                    <span className="text-xs text-muted-foreground">{formatBytes(pendingFile.size)}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setPendingFile(null);
                        if (newFileInputRef.current) newFileInputRef.current.value = "";
                      }}
                      className="text-muted-foreground hover:text-ink"
                      aria-label="Quitar archivo"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => newFileInputRef.current?.click()}>
                      <Paperclip className="h-4 w-4" /> Adjuntar archivo o foto
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const url = promptForLink();
                        if (url) setBody((b) => (b ? `${b}\n${url}` : url));
                      }}
                    >
                      <LinkIcon className="h-4 w-4" /> Agregar enlace (Drive, YouTube…)
                    </Button>
                  </div>
                )}
              </div>

              <Button variant="hero" onClick={createThread} disabled={loading} className="w-full">
                <Send className="h-4 w-4" /> Enviar
              </Button>
            </div>
          ) : activeThread ? (
            <>
              <div className="p-4 border-b flex items-center gap-3">
                <button onClick={() => setActiveId(null)} className="md:hidden">
                  <ArrowLeft className="h-5 w-5" />
                </button>
                {(() => {
                  const other = isStaff ? activeThread.parent : activeThread.teacher;
                  return (
                    <Avatar className="h-10 w-10">
                      {other?.avatar_url && <AvatarImage src={other.avatar_url} alt={nameOf(other)} />}
                      <AvatarFallback className="bg-primary/15 text-primary text-sm font-bold">{initialOf(other)}</AvatarFallback>
                    </Avatar>
                  );
                })()}
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-ink truncate">{nameOf(isStaff ? activeThread.parent : activeThread.teacher)}</div>
                  <div className="text-xs text-muted-foreground truncate">{activeThread.subject}</div>
                </div>
              </div>
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[400px] min-h-[300px]">
                {messages.map((m) => {
                  const mine = m.sender_id === userId;
                  return (
                    <div key={m.id} className={`flex gap-2 ${mine ? "justify-end" : "justify-start"}`}>
                      {!mine && (
                        <Avatar className="h-8 w-8 flex-shrink-0">
                          {m.sender?.avatar_url && <AvatarImage src={m.sender.avatar_url} alt={nameOf(m.sender)} />}
                          <AvatarFallback className="bg-primary/15 text-primary text-xs font-bold">{initialOf(m.sender)}</AvatarFallback>
                        </Avatar>
                      )}
                      <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${mine ? "bg-primary text-primary-foreground" : "bg-muted text-ink"}`}>
                        {!mine && <div className="text-xs font-semibold opacity-70 mb-1">{nameOf(m.sender)}</div>}
                        {m.body && <div className="text-sm whitespace-pre-wrap break-words">{renderBodyWithLinks(m.body, mine)}</div>}
                        {renderAttachment(m, mine)}
                        <div className="text-[10px] mt-1 opacity-70">
                          {new Date(m.created_at).toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {pendingFile && (
                <div className="px-3 pt-2">
                  <div className="flex items-center gap-2 rounded-xl border bg-muted/40 p-2 text-sm">
                    <FileIcon className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="truncate flex-1">{pendingFile.name}</span>
                    <span className="text-xs text-muted-foreground">{formatBytes(pendingFile.size)}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setPendingFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                      className="text-muted-foreground hover:text-ink"
                      aria-label="Quitar archivo"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
              <div className="p-3 border-t flex gap-2 items-end">
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx"
                  onChange={(e) => handlePickFile(e.target.files?.[0] ?? null)}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                  title="Adjuntar archivo o foto"
                  className="flex-shrink-0"
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    const url = promptForLink();
                    if (url) setBody((b) => (b ? `${b}\n${url}` : url));
                  }}
                  title="Agregar enlace (Google Drive, YouTube, etc.)"
                  className="flex-shrink-0"
                >
                  <LinkIcon className="h-4 w-4" />
                </Button>
                <Textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  maxLength={5000}
                  rows={2}
                  placeholder="Escribe una respuesta..."
                  className="flex-1 resize-none"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendReply();
                    }
                  }}
                />
                <Button variant="hero" onClick={sendReply} disabled={loading || (!body.trim() && !pendingFile)}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-8 text-center text-muted-foreground">
              <div>
                <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-40" />
                <p>{isStaff ? "Selecciona una conversación" : "Selecciona o crea un mensaje"}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default MessagesInbox;
