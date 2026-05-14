import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "@/hooks/use-toast";
import { Send, Plus, ArrowLeft, MessageCircle } from "lucide-react";

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
  body: string;
  created_at: string;
  sender?: Profile;
};

interface Props {
  userId: string;
  isStaff: boolean;
}

const initialOf = (p?: Profile | null) =>
  ((p?.display_name || p?.email || "?").trim().charAt(0) || "?").toUpperCase();

const nameOf = (p?: Profile | null) => p?.display_name || p?.email || "Usuario";

const STAFF_CONTACTS: { name: string; role: string; avatar?: string }[] = [
  { name: "Griselle", role: "Directora", avatar: "/teacher-profile-pictures/director-Griselle.png" },
  { name: "Nilda", role: "Subdirectora" },
  { name: "Yeidy", role: "Maestra", avatar: "/teacher-profile-pictures/maestra-Yeidy.jpg" },
  { name: "Zuania", role: "Maestra", avatar: "/teacher-profile-pictures/maestra-Zuania.jpeg" },
  { name: "Bea", role: "Maestra", avatar: "/teacher-profile-pictures/maestra-Bea.jpeg" },
  { name: "Nay", role: "Maestra", avatar: "/teacher-profile-pictures/maestra-Nay.jpeg" },
  { name: "Keisy", role: "Maestra", avatar: "/teacher-profile-pictures/maestra-Keisy.jpeg" },
  { name: "Adriana", role: "Maestra", avatar: "/teacher-profile-pictures/maestra-Adriana.jpeg" },
  { name: "Esmeralda", role: "Maestra", avatar: "/teacher-profile-pictures/maestra-Esmeralda.jpeg" },
];

const MessagesInbox = ({ userId, isStaff }: Props) => {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState("");
  const [newSubject, setNewSubject] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [teachers, setTeachers] = useState<Profile[]>([]);
  const [selectedContact, setSelectedContact] = useState<string>("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchProfiles = async (ids: string[]) => {
    if (!ids.length) return new Map<string, Profile>();
    const { data } = await supabase
      .from("profiles")
      .select("user_id, display_name, email, avatar_url")
      .in("user_id", ids);
    return new Map((data ?? []).map((p) => [p.user_id, p as Profile]));
  };

  const loadTeachers = async () => {
    const { data: roles } = await supabase.from("user_roles").select("user_id").eq("role", "teacher");
    const ids = (roles ?? []).map((r) => r.user_id);
    if (!ids.length) {
      setTeachers([]);
      return;
    }
    const map = await fetchProfiles(ids);
    setTeachers(Array.from(map.values()));
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
      .select("id, thread_id, sender_id, body, created_at")
      .eq("thread_id", threadId)
      .order("created_at", { ascending: true });
    const msgs = (data ?? []) as Message[];
    const ids = Array.from(new Set(msgs.map((m) => m.sender_id)));
    const map = await fetchProfiles(ids);
    setMessages(msgs.map((m) => ({ ...m, sender: map.get(m.sender_id) })));
    setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }), 50);
  };

  useEffect(() => {
    loadThreads();
    loadTeachers();
    const channel = supabase
      .channel("messages-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        const newMsg = payload.new as Message;
        if (activeId && newMsg.thread_id === activeId) loadMessages(activeId);
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
    if (activeId) loadMessages(activeId);
  }, [activeId]);

  const createThread = async () => {
    if (!newSubject.trim() || !body.trim()) {
      toast({ title: "Falta información", description: "Agrega un asunto y un mensaje.", variant: "destructive" });
      return;
    }
    if (!selectedContact) {
      toast({ title: "Elige una maestra", description: "Selecciona a quién enviarle el mensaje.", variant: "destructive" });
      return;
    }
    const teacherId = teachers[0]?.user_id ?? null;
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
    const { error: msgErr } = await supabase
      .from("messages")
      .insert({ thread_id: thread.id, sender_id: userId, body: body.trim().slice(0, 5000) });
    setLoading(false);
    if (msgErr) {
      toast({ title: "Error", description: msgErr.message, variant: "destructive" });
      return;
    }
    setNewSubject("");
    setBody("");
    setSelectedContact("");
    setShowNew(false);
    setActiveId(thread.id);
    loadThreads();
  };

  const sendReply = async () => {
    if (!body.trim() || !activeId) return;
    setLoading(true);
    const { error } = await supabase
      .from("messages")
      .insert({ thread_id: activeId, sender_id: userId, body: body.trim().slice(0, 5000) });
    setLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    setBody("");
    loadMessages(activeId);
  };

  const activeThread = threads.find((t) => t.id === activeId);

  return (
    <Card className="rounded-3xl border-2 shadow-soft overflow-hidden">
      <div className="grid md:grid-cols-[320px_1fr] min-h-[500px]">
        {/* Sidebar */}
        <div className={`border-r bg-muted/30 ${activeId || showNew ? "hidden md:block" : ""}`}>
          <div className="p-4 border-b flex items-center justify-between">
            <h3 className="font-bold text-ink flex items-center gap-2">
              <MessageCircle className="h-4 w-4" /> {isStaff ? "Bandeja" : "Mis mensajes"}
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
              return (
                <button
                  key={t.id}
                  onClick={() => { setActiveId(t.id); setShowNew(false); }}
                  className={`w-full text-left p-3 border-b hover:bg-accent/50 transition-colors flex gap-3 items-start ${
                    activeId === t.id ? "bg-accent" : ""
                  }`}
                >
                  <Avatar className="h-10 w-10 flex-shrink-0">
                    {other?.avatar_url && <AvatarImage src={other.avatar_url} alt={nameOf(other)} />}
                    <AvatarFallback className="bg-primary/15 text-primary text-sm font-bold">{initialOf(other)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-sm text-ink truncate">{nameOf(other)}</div>
                    <div className="text-xs text-muted-foreground truncate">{t.subject}</div>
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
                        <div className="text-sm whitespace-pre-wrap break-words">{m.body}</div>
                        <div className="text-[10px] mt-1 opacity-70">
                          {new Date(m.created_at).toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="p-3 border-t flex gap-2">
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
                <Button variant="hero" onClick={sendReply} disabled={loading || !body.trim()}>
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
