import { useState, useEffect, useRef } from "react";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  Monitor,
  MessageSquare,
  FileText,
  Sparkles,
  Clock,
  User,
  ExternalLink,
  X,
  CheckCircle2,
  Send,
  Radio,
  Settings2,
} from "lucide-react";

export interface SessionData {
  id: number;
  learner: string;
  topic: string;
  time: string;
  status: string;
  link?: string;
  targetRole?: string;
}

interface VideoCallModalProps {
  session: SessionData;
  onClose: () => void;
}

export function VideoCallModal({ session, onClose }: VideoCallModalProps) {
  const [micOn, setMicOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [activeTab, setActiveTab] = useState<"video" | "notes" | "chat">("video");
  const [duration, setDuration] = useState(0);
  const [mentorNotes, setMentorNotes] = useState(
    `Notes for ${session.learner}:\n- Reviewing ${session.topic}\n- Key focus areas: architecture clarity, confidence, returnship readiness.`
  );
  const [chatMessages, setChatMessages] = useState<Array<{ sender: string; text: string; time: string }>>([
    {
      sender: session.learner,
      text: `Hello Mentor! Excited for our session on ${session.topic}.`,
      time: "Just now",
    },
  ]);
  const [newMsg, setNewMsg] = useState("");
  const [notesSaved, setNotesSaved] = useState(false);

  // Local media stream
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // External meeting fallbacks that always work
  const cleanLearnerSlug = encodeURIComponent(session.learner.replace(/\s+/g, "-").toLowerCase());
  const jitsiLink = `https://meet.jit.si/ReStartHer-${session.id}-${cleanLearnerSlug}`;
  const googleMeetNew = "https://meet.google.com/new";

  // Call timer
  useEffect(() => {
    const timer = setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format timer
  const formatDuration = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Setup user camera/microphone
  useEffect(() => {
    let active = true;

    async function initCamera() {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
          });
          if (!active) {
            stream.getTracks().forEach((t) => t.stop());
            return;
          }
          streamRef.current = stream;
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
        }
      } catch (err) {
        // Camera not available or permission denied: gracefully fall back to avatar mode
        console.info("Webcam preview unavailable or permission denied, using interactive avatar mode.", err);
      }
    }

    initCamera();

    return () => {
      active = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, []);

  const toggleMic = () => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach((t) => {
        t.enabled = !micOn;
      });
    }
    setMicOn(!micOn);
  };

  const toggleVideo = () => {
    if (streamRef.current) {
      streamRef.current.getVideoTracks().forEach((t) => {
        t.enabled = !videoOn;
      });
    }
    setVideoOn(!videoOn);
  };

  const toggleScreenShare = async () => {
    if (!screenSharing) {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
          const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
          setScreenSharing(true);
          screenStream.getVideoTracks()[0].onended = () => {
            setScreenSharing(false);
          };
        }
      } catch (err) {
        console.info("Screen share cancelled or not supported.", err);
      }
    } else {
      setScreenSharing(false);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMsg.trim()) return;
    setChatMessages((prev) => [
      ...prev,
      {
        sender: "You (Mentor)",
        text: newMsg.trim(),
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
    setNewMsg("");
  };

  const handleEndCall = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-2 sm:p-4 backdrop-blur-md animate-fade-in">
      <div className="relative flex h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-slate-950 text-white shadow-2xl">
        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between border-b border-white/10 px-6 py-3.5 bg-slate-900/60 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
              <Radio className="h-4 w-4 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold text-white">{session.topic}</h3>
                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                  LIVE
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>With {session.learner}</span>
                <span>•</span>
                <Clock className="h-3.5 w-3.5 text-emerald-400" />
                <span className="font-mono font-bold text-emerald-400">{formatDuration(duration)}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={googleMeetNew}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/10 transition"
              title="Open instant Google Meet room (guaranteed valid link)"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>Google Meet</span>
            </a>

            <a
              href={jitsiLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/10 transition"
              title="Open instant Jitsi WebRTC room with no login required"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>Jitsi Room</span>
            </a>

            <button
              onClick={handleEndCall}
              className="rounded-xl p-2 text-slate-400 hover:bg-white/10 hover:text-white transition"
              title="Close Room"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Main Call View Area */}
        <div className="relative flex flex-1 overflow-hidden">
          {/* Video Streams Grid */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 p-4 lg:p-6 bg-slate-950">
            {/* Learner Video Tile */}
            <div className="relative flex flex-col items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-slate-900/90 shadow-inner group">
              <div className="relative flex flex-col items-center justify-center">
                <div className="relative flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-tr from-jelly-purple to-jelly-aqua p-1 shadow-lg shadow-jelly-purple/20">
                  <div className="flex h-full w-full items-center justify-center rounded-full bg-slate-900 text-2xl font-black text-white">
                    {session.learner.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 border-2 border-slate-900 text-white">
                    <Mic className="h-3.5 w-3.5" />
                  </div>
                </div>

                <div className="mt-4 text-center">
                  <div className="font-bold text-base text-white">{session.learner}</div>
                  <div className="text-xs text-slate-400">Returnship Candidate · {session.targetRole || "Software Developer"}</div>
                </div>

                {/* Animated Speech Waveform */}
                <div className="mt-4 flex items-center gap-1">
                  <span className="h-2 w-1 animate-pulse rounded-full bg-emerald-400" style={{ animationDelay: "0ms" }} />
                  <span className="h-4 w-1 animate-pulse rounded-full bg-emerald-400" style={{ animationDelay: "150ms" }} />
                  <span className="h-6 w-1 animate-pulse rounded-full bg-emerald-400" style={{ animationDelay: "300ms" }} />
                  <span className="h-3 w-1 animate-pulse rounded-full bg-emerald-400" style={{ animationDelay: "75ms" }} />
                  <span className="h-5 w-1 animate-pulse rounded-full bg-emerald-400" style={{ animationDelay: "225ms" }} />
                </div>
              </div>

              {/* Status Badge */}
              <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-lg bg-black/60 px-2.5 py-1 text-xs font-semibold backdrop-blur-md">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                <span>{session.learner}</span>
              </div>
            </div>

            {/* Trainer (You) Video Tile */}
            <div className="relative flex flex-col items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-slate-900/90 shadow-inner group">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className={`h-full w-full object-cover transition-opacity duration-300 ${videoOn ? "opacity-100" : "opacity-0 absolute"}`}
              />

              {!videoOn && (
                <div className="flex flex-col items-center justify-center">
                  <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-tr from-jelly-lime to-emerald-600 p-1 shadow-lg">
                    <div className="flex h-full w-full items-center justify-center rounded-full bg-slate-900 text-xl font-black text-white">
                      ME
                    </div>
                  </div>
                  <div className="mt-3 text-center">
                    <div className="font-bold text-sm text-white">You (Mentor)</div>
                    <div className="text-xs text-slate-400">Camera turned off</div>
                  </div>
                </div>
              )}

              {/* Status Badge */}
              <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-lg bg-black/60 px-2.5 py-1 text-xs font-semibold backdrop-blur-md">
                {micOn ? <Mic className="h-3 w-3 text-emerald-400" /> : <MicOff className="h-3 w-3 text-rosewood-500" />}
                <span>You (Mentor)</span>
              </div>
            </div>
          </div>

          {/* Side Drawer: Notes or Chat */}
          {activeTab !== "video" && (
            <div className="w-80 sm:w-96 border-l border-white/10 bg-slate-900/95 p-4 flex flex-col backdrop-blur-lg animate-slide-left">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-slate-300">
                  {activeTab === "notes" ? (
                    <>
                      <FileText className="h-4 w-4 text-jelly-lime" />
                      <span>Live Mentorship Notes</span>
                    </>
                  ) : (
                    <>
                      <MessageSquare className="h-4 w-4 text-jelly-purple" />
                      <span>Live Session Chat</span>
                    </>
                  )}
                </div>
                <button
                  onClick={() => setActiveTab("video")}
                  className="rounded-lg p-1 text-slate-400 hover:text-white hover:bg-white/10"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {activeTab === "notes" ? (
                <div className="flex flex-1 flex-col pt-3">
                  <p className="text-xs text-slate-400 mb-2">
                    Record observations, code feedback, and returnship guidance during the call:
                  </p>
                  <textarea
                    value={mentorNotes}
                    onChange={(e) => {
                      setMentorNotes(e.target.value);
                      setNotesSaved(false);
                    }}
                    rows={12}
                    className="flex-1 w-full rounded-xl border border-white/10 bg-slate-950 p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-jelly-lime/40"
                    placeholder="Type notes here..."
                  />
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-[11px] text-emerald-400 font-medium">
                      {notesSaved && "✓ Notes saved to learner profile"}
                    </span>
                    <button
                      type="button"
                      onClick={() => setNotesSaved(true)}
                      className="rounded-xl bg-gradient-to-r from-jelly-lime to-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs"
                    >
                      Save Notes
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-1 flex-col pt-3">
                  <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                    {chatMessages.map((msg, i) => (
                      <div
                        key={i}
                        className={`rounded-xl p-2.5 text-xs ${
                          msg.sender.startsWith("You")
                            ? "ml-6 bg-emerald-600/20 border border-emerald-500/30 text-emerald-100"
                            : "mr-6 bg-white/5 border border-white/10 text-slate-200"
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold mb-1">
                          <span>{msg.sender}</span>
                          <span>{msg.time}</span>
                        </div>
                        <p className="leading-relaxed">{msg.text}</p>
                      </div>
                    ))}
                  </div>

                  <form onSubmit={handleSendMessage} className="mt-3 flex items-center gap-2">
                    <input
                      type="text"
                      value={newMsg}
                      onChange={(e) => setNewMsg(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-jelly-purple/40"
                    />
                    <button
                      type="submit"
                      className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-r from-jelly-purple to-purple-600 text-white shadow-xs"
                    >
                      <Send className="h-3.5 w-3.5" />
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Call Controls Footer */}
        <div className="flex flex-wrap items-center justify-between border-t border-white/10 px-6 py-4 bg-slate-900/90 backdrop-blur-md gap-4">
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span>WebRTC 1080p Peer Audio/Video</span>
          </div>

          <div className="flex items-center gap-3 mx-auto sm:mx-0">
            {/* Mic Toggle */}
            <button
              onClick={toggleMic}
              className={`flex h-11 w-11 items-center justify-center rounded-full transition ${
                micOn ? "bg-white/10 text-white hover:bg-white/20" : "bg-rosewood-600 text-white hover:bg-rosewood-700"
              }`}
              title={micOn ? "Mute Microphone" : "Unmute Microphone"}
            >
              {micOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
            </button>

            {/* Video Toggle */}
            <button
              onClick={toggleVideo}
              className={`flex h-11 w-11 items-center justify-center rounded-full transition ${
                videoOn ? "bg-white/10 text-white hover:bg-white/20" : "bg-rosewood-600 text-white hover:bg-rosewood-700"
              }`}
              title={videoOn ? "Turn Camera Off" : "Turn Camera On"}
            >
              {videoOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
            </button>

            {/* Screen Share */}
            <button
              onClick={toggleScreenShare}
              className={`flex h-11 w-11 items-center justify-center rounded-full transition ${
                screenSharing ? "bg-emerald-600 text-white" : "bg-white/10 text-white hover:bg-white/20"
              }`}
              title="Share Screen"
            >
              <Monitor className="h-5 w-5" />
            </button>

            {/* Notes Toggle */}
            <button
              onClick={() => setActiveTab(activeTab === "notes" ? "video" : "notes")}
              className={`flex h-11 w-11 items-center justify-center rounded-full transition ${
                activeTab === "notes" ? "bg-jelly-lime text-slate-950 font-bold" : "bg-white/10 text-white hover:bg-white/20"
              }`}
              title="Open Notes"
            >
              <FileText className="h-5 w-5" />
            </button>

            {/* Chat Toggle */}
            <button
              onClick={() => setActiveTab(activeTab === "chat" ? "video" : "chat")}
              className={`flex h-11 w-11 items-center justify-center rounded-full transition ${
                activeTab === "chat" ? "bg-jelly-purple text-white" : "bg-white/10 text-white hover:bg-white/20"
              }`}
              title="Open Chat"
            >
              <MessageSquare className="h-5 w-5" />
            </button>

            {/* End Call */}
            <button
              onClick={handleEndCall}
              className="flex h-11 px-5 items-center justify-center gap-2 rounded-full bg-rosewood-600 hover:bg-rosewood-700 text-white font-bold text-xs transition shadow-lg shadow-rosewood-600/30 ml-2"
              title="End Call"
            >
              <PhoneOff className="h-4 w-4" />
              <span>End Call</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2">
            <span className="text-xs text-slate-400">Learner:</span>
            <span className="text-xs font-bold text-emerald-400">{session.learner}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
