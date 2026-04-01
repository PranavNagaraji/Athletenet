import { useEffect, useState, useRef } from "react";
import { Users, UserPlus, Loader2, Trophy, MessageSquare, Send, Paperclip, FileText, Image as ImageIcon, MapPin, Crosshair, ChevronLeft } from "lucide-react";
import { io } from "socket.io-client";
import { useAuth } from "../../context/AuthContext";
import { VALIDATION_LIMITS, validateFile } from "../../utils/formValidation";
import FormationsBoard from "../../components/FormationsBoard";
import FormationChatCard from "../../components/FormationChatCard";
import "../club/ClubLayout.css";

const API = import.meta.env.VITE_BACKEND_URL;

const SPORT_BG_MINI = {
  football: "linear-gradient(135deg, #166534, #15803d)",
  basketball: "linear-gradient(135deg, #7c2d12, #9a3412)",
  cricket: "linear-gradient(135deg, #1e3a5f, #1e40af)",
};
const SPORT_ACCENT = { football: "#22c55e", basketball: "#f97316", cricket: "#38bdf8" };



const getInitials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "AN";

const renderAvatar = (name, url, size = 44, type = "athlete") => {
  if (url) {
    return (
      <img
        src={`${API}${url}`}
        alt={name}
        style={{
          width: size,
          height: size,
          borderRadius: size > 40 ? "16px" : "14px",
          objectFit: "cover",
          display: "block",
          flexShrink: 0,
          border: "1px solid var(--theme-border)",
          boxShadow: "0 10px 24px rgba(15, 23, 42, 0.14)",
        }}
      />
    );
  }

  const gradient =
    type === "team"
      ? "linear-gradient(135deg, #2563eb, #1d4ed8)"
      : type === "coach"
        ? "linear-gradient(135deg, #f97316, #ea580c)"
        : "linear-gradient(135deg, #10b981, #059669)";

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size > 40 ? "16px" : "14px",
        background: gradient,
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 800,
        fontSize: size * 0.38,
        letterSpacing: "0.04em",
        flexShrink: 0,
        border: "1px solid rgba(255,255,255,0.18)",
        boxShadow: "0 12px 28px rgba(15, 23, 42, 0.18)",
      }}
    >
      {getInitials(name)}
    </div>
  );
};

const sectionTitleStyle = {
  padding: "0 1.2rem",
  margin: "0 0 0.8rem 0",
  fontSize: "0.8rem",
  color: "var(--theme-muted)",
  textTransform: "uppercase",
  letterSpacing: "0.14em",
  fontWeight: 800,
};

const panelCardStyle = {
  background: "var(--theme-surface)",
  border: "1px solid var(--theme-border)",
  boxShadow: "0 20px 40px rgba(15, 23, 42, 0.08)",
};

export default function CoachTeams() {
  const { user } = useAuth();
  const [clubs, setClubs] = useState([]);
  const [teams, setTeams] = useState([]);
  const [athletes, setAthletes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [socket, setSocket] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showTeamMemberList, setShowTeamMemberList] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [coachUserId, setCoachUserId] = useState(null);
  const [showTacticsBoard, setShowTacticsBoard] = useState(false);

  const scrollRef = useRef();
  const fileInputRef = useRef();

  useEffect(() => {
    fetch(`${API}/api/coach/me`, { credentials: "include" })
      .then((r) => r.json())
      .then(async (d) => {
        const myUserId = d.user?._id || d.user;
        setCoachUserId(myUserId);
        const joinedClubs = d.clubs || [];
        setClubs(joinedClubs);

        let allTeams = [];
        const allAthletesMap = new Map();

        await Promise.all(
          joinedClubs.map(async (club) => {
            const adminId = club.admin?._id || club.admin;
            if (!adminId) return;

            const teamRes = await fetch(`${API}/api/team/club/${adminId}`);
            if (!teamRes.ok) return;

            const clubTeams = await teamRes.json();
            allTeams = [...allTeams, ...clubTeams];

            clubTeams.forEach((team) => {
              if (!team.athletes) return;
              team.athletes.forEach((ath) => {
                if (ath.user && !allAthletesMap.has(ath.user._id)) {
                  allAthletesMap.set(ath.user._id, ath.user);
                } else if (ath.name && !allAthletesMap.has(ath._id)) {
                  allAthletesMap.set(ath._id, ath);
                }
              });
            });
          })
        );

        setTeams(allTeams);
        setAthletes(Array.from(allAthletesMap.values()));
        setLoading(false);
      })
      .catch(() => setLoading(false));

    const newSocket = io(API);
    setSocket(newSocket);
    return () => newSocket.disconnect();
  }, []);

  useEffect(() => {
    if (!socket || !activeView || activeView.type === "join") return;

    const roomName =
      activeView.type === "team_chat"
        ? `team_${activeView.id}`
        : `dm_${[user._id, activeView.id].sort().join("_")}`;

    socket.emit("join_room", roomName);

    const historyUrl =
      activeView.type === "team_chat"
        ? `${API}/api/chat/team/${activeView.id}`
        : `${API}/api/chat/direct/${activeView.id}`;

    fetch(historyUrl, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => setMessages(Array.isArray(data) ? data : []));

    const handleReceive = (msg) => {
      setMessages((prev) => [...prev, msg]);
    };

    socket.on("receive_message", handleReceive);
    return () => socket.off("receive_message", handleReceive);
  }, [activeView, socket, user?._id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (activeView?.type !== "team_chat") {
      setShowTeamMemberList(false);
    }
  }, [activeView]);

  const handleSend = (e) => {
    if (e) e.preventDefault();
    if (!text.trim() || !socket || !activeView || activeView.type === "join") return;
    if (text.trim().length > VALIDATION_LIMITS.messageMax) return;

    const roomName =
      activeView.type === "team_chat"
        ? `team_${activeView.id}`
        : `dm_${[user._id, activeView.id].sort().join("_")}`;

    socket.emit("send_message", {
      room: roomName,
      sender: user._id,
      text: text.trim(),
      teamGroup: activeView.type === "team_chat" ? activeView.id : null,
      receiver: activeView.type === "dm" ? activeView.id : null,
    });

    setText("");
    setShowAttachMenu(false);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !socket || !activeView || activeView.type === "join") return;
    const fileError = validateFile(file, { maxBytes: VALIDATION_LIMITS.attachmentMaxBytes, allowNonImages: true });
    if (fileError) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await fetch(`${API}/api/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (data.url) {
        const roomName =
          activeView.type === "team_chat"
            ? `team_${activeView.id}`
            : `dm_${[user._id, activeView.id].sort().join("_")}`;

        socket.emit("send_message", {
          room: roomName,
          sender: user._id,
          text: "",
          teamGroup: activeView.type === "team_chat" ? activeView.id : null,
          receiver: activeView.type === "dm" ? activeView.id : null,
          fileUrl: data.url,
          fileType: file.type.startsWith("image/") ? "image" : "document",
        });
      }
    } catch (err) {
      console.error("Upload error", err);
    } finally {
      setUploading(false);
      setShowAttachMenu(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleAttachLocation = () => {
    if (!navigator.geolocation) return alert("Geolocation not supported by your browser");
    if (!socket || !activeView || activeView.type === "join") return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const roomName =
          activeView.type === "team_chat"
            ? `team_${activeView.id}`
            : `dm_${[user._id, activeView.id].sort().join("_")}`;

        socket.emit("send_message", {
          room: roomName,
          sender: user._id,
          text: "Shared Location",
          teamGroup: activeView.type === "team_chat" ? activeView.id : null,
          receiver: activeView.type === "dm" ? activeView.id : null,
          fileUrl: `https://www.google.com/maps?q=${lat},${lng}`,
          fileType: "location",
        });
      },
      () => alert("Unable to fetch location. Please check your browser permissions.")
    );

    setShowAttachMenu(false);
  };

  const handleJoinTeam = async (teamId) => {
    try {
      const res = await fetch(`${API}/api/team/join/coach`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId }),
      });
      if (res.ok) {
        window.location.reload();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="loading-state">
        <Loader2 size={24} className="spinner-icon" /> Loading ...
      </div>
    );
  }

  const joinedTeams = teams.filter((t) => t.coaches?.some((c) => c._id === coachUserId || c === coachUserId));
  const availableTeams = teams.filter((t) => !t.coaches?.some((c) => c._id === coachUserId || c === coachUserId));

  return (
    <>
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.92)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(8px)" }}
        >
          <button
            onClick={() => setLightboxImage(null)}
            style={{ position: "absolute", top: "1.5rem", right: "1.5rem", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", width: 44, height: 44, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: "1.2rem", backdropFilter: "blur(4px)" }}
          >
            x
          </button>
          <div onClick={(e) => e.stopPropagation()} style={{ maxWidth: "90vw", maxHeight: "90vh", borderRadius: 16, overflow: "hidden", boxShadow: "0 30px 80px rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <img src={lightboxImage} alt="Preview" style={{ maxWidth: "90vw", maxHeight: "90vh", objectFit: "contain", display: "block" }} />
          </div>
        </div>
      )}

      <div style={{ height: "calc(100vh - 40px)", display: "flex", flexDirection: "column" }}>
        <div className="page-header" style={{ paddingBottom: "1rem" }}>
          <div className="page-header-left">
            <h1>My Coaching Hub</h1>
            <p>Manage your teams, mentor athletes, and share resources</p>
          </div>
        </div>

        <div style={{ flex: 1, display: "flex", gap: "1rem", overflow: "hidden", paddingBottom: "1rem" }}>
          {sidebarOpen && (
            <div className="card" style={{ width: 320, display: "flex", flexDirection: "column", padding: "1rem 0", overflowY: "auto", ...panelCardStyle }}>
              <h3 style={sectionTitleStyle}>My Instructed Teams</h3>
              {joinedTeams.length === 0 ? (
                <div style={{ padding: "0 1.2rem", fontSize: "0.9rem", color: "var(--theme-muted)", marginBottom: "1rem" }}>No instructed teams.</div>
              ) : (
                joinedTeams.map((team) => (
                  <div
                    key={team._id}
                    onClick={() => setActiveView({ type: "team_chat", id: team._id, name: team.name, avatar: team.profilePic, description: `${team.athletes?.length || 0} Athletes` })}
                    style={{ padding: "0.9rem 1.2rem", display: "flex", alignItems: "center", gap: "0.9rem", cursor: "pointer", background: activeView?.id === team._id ? "color-mix(in srgb, var(--theme-primary) 12%, transparent)" : "transparent", borderLeft: activeView?.id === team._id ? "3px solid var(--theme-primary)" : "3px solid transparent" }}
                  >
                    {renderAvatar(team.name, team.profilePic, 44, "team")}
                    <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
                      <span style={{ fontWeight: 700, fontSize: "0.98rem", color: "var(--theme-text)", whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>{team.name}</span>
                      <span style={{ fontSize: "0.76rem", color: "var(--theme-muted)", fontWeight: 600 }}>Group Chat • {team.athletes?.length || 0} Members</span>
                    </div>
                  </div>
                ))
              )}

              <hr style={{ border: 0, borderBottom: "1px solid var(--theme-border)", margin: "1rem 1.2rem" }} />

              <h3 style={sectionTitleStyle}>My Athletes (1-on-1)</h3>
              {athletes.length === 0 ? (
                <div style={{ padding: "0 1.2rem", fontSize: "0.9rem", color: "var(--theme-muted)", marginBottom: "1rem" }}>No athletes found in your teams.</div>
              ) : (
                athletes.map((ath) => (
                  <div
                    key={ath._id}
                    onClick={() => setActiveView({ type: "dm", id: ath._id, name: ath.name, avatar: ath.profilePic })}
                    style={{ padding: "0.9rem 1.2rem", display: "flex", alignItems: "center", gap: "0.9rem", cursor: "pointer", background: activeView?.id === ath._id ? "color-mix(in srgb, var(--theme-primary) 12%, transparent)" : "transparent", borderLeft: activeView?.id === ath._id ? "3px solid var(--theme-primary)" : "3px solid transparent" }}
                  >
                    {renderAvatar(ath.name, ath.profilePic, 44, "athlete")}
                    <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                      <span style={{ fontWeight: 700, fontSize: "0.98rem", color: "var(--theme-text)", whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>{ath.name}</span>
                      <span style={{ fontSize: "0.76rem", color: "var(--theme-muted)", fontWeight: 600 }}>Athlete Feedback</span>
                    </div>
                  </div>
                ))
              )}

              <hr style={{ border: 0, borderBottom: "1px solid var(--theme-border)", margin: "1rem 1.2rem" }} />

              <h3 style={sectionTitleStyle}>Other Teams To Coach</h3>
              {availableTeams.length === 0 ? (
                <div style={{ padding: "0 1.2rem", fontSize: "0.9rem", color: "var(--theme-muted)", marginBottom: "1rem" }}>No other teams available.</div>
              ) : (
                availableTeams.map((team) => (
                  <div
                    key={team._id}
                    onClick={() => setActiveView({ type: "join", team })}
                    style={{ padding: "0.9rem 1.2rem", display: "flex", alignItems: "center", gap: "0.9rem", cursor: "pointer", background: activeView?.team?._id === team._id ? "var(--theme-surface-2)" : "transparent", borderLeft: activeView?.team?._id === team._id ? "3px solid var(--theme-border-strong)" : "3px solid transparent", opacity: 0.95 }}
                  >
                    {renderAvatar(team.name, team.profilePic, 44, "team")}
                    <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                      <span style={{ fontWeight: 700, fontSize: "0.94rem", color: "var(--theme-text)", whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>{team.name}</span>
                      <span style={{ fontSize: "0.76rem", color: "var(--theme-muted)", fontWeight: 600 }}>Click to view & instruct</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          <div className="card" style={{ flex: 1, display: "flex", flexDirection: "column", padding: 0, overflow: "hidden", ...panelCardStyle }}>
            {!activeView ? (
              <div className="empty-state" style={{ height: "100%", justifyContent: "center", border: "none" }}>
                <button onClick={() => setSidebarOpen(!sidebarOpen)} className="btn-ghost" style={{ position: "absolute", top: 15, left: 15 }}>
                  <Users size={20} />
                </button>
                <MessageSquare size={50} opacity={0.3} />
                <p style={{ marginTop: "1rem", color: "var(--theme-muted)", maxWidth: 300, textAlign: "center", lineHeight: 1.5 }}>Select a Team to open the group chat, or select an Athlete to send direct feedback.</p>
              </div>
            ) : activeView.type === "join" ? (
              <div className="empty-state" style={{ height: "100%", justifyContent: "center", border: "none" }}>
                <Trophy size={60} color="var(--theme-primary)" style={{ marginBottom: "1rem" }} />
                <h2>{activeView.team.name}</h2>
                <p style={{ color: "var(--theme-muted)", marginBottom: "2rem" }}>You are not instructing this team yet.</p>
                <button className="btn-primary" onClick={() => handleJoinTeam(activeView.team._id)}>
                  <UserPlus size={18} /> Join as Coach to Access Hub
                </button>
              </div>
            ) : (
              <>
                <div style={{ padding: "1rem 1.5rem", background: "var(--theme-surface)", borderBottom: "1px solid var(--theme-border)", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <button
                    onClick={() => setShowTeamMemberList((prev) => !prev)}
                    className="btn-ghost"
                    style={{ padding: "0.5rem", borderRadius: 8, background: "var(--theme-surface-2)" }}
                    title="Show team members"
                  >
                    <Users size={18} />
                  </button>
                  <button
                    onClick={() => setSidebarOpen((prev) => !prev)}
                    className="btn-ghost"
                    style={{ padding: "0.5rem", borderRadius: 8, background: "var(--theme-surface-2)" }}
                    title={sidebarOpen ? "Collapse sidebar" : "Open sidebar"}
                  >
                    <ChevronLeft size={18} style={{ transform: sidebarOpen ? "rotate(0deg)" : "rotate(180deg)" }} />
                  </button>
                  {renderAvatar(activeView.name, activeView.avatar, 46, activeView.type === "team_chat" ? "team" : "athlete")}
                  <div>
                    <h3 style={{ margin: 0, fontSize: "1.08rem", color: "var(--theme-text)", fontWeight: 800 }}>{activeView.name}</h3>
                    <span style={{ fontSize: "0.75rem", color: "var(--theme-primary)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                      {activeView.type === "team_chat" ? "Team Instruction & Announcements" : "Athlete Direct Feedback"}
                    </span>
                  </div>
                </div>

                {showTeamMemberList && activeView.type === "team_chat" && (() => {
                  const currentTeam = teams.find((team) => team._id === activeView.id);
                  return (
                    <div style={{ padding: "1rem 1.5rem", background: "var(--theme-surface-2)", borderBottom: "1px solid var(--theme-border)", display: "flex", flexDirection: "column", gap: "1rem" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: "0.95rem", color: "var(--theme-text)" }}>Team Members</div>
                          <div style={{ fontSize: "0.82rem", color: "var(--theme-muted)" }}>{(currentTeam?.athletes?.length || 0) + (currentTeam?.coaches?.length || 0)} members</div>
                        </div>
                        <button
                          onClick={() => setShowTeamMemberList(false)}
                          className="btn-ghost"
                          style={{ padding: "0.5rem", borderRadius: 8, background: "var(--theme-surface)" }}
                        >
                          Close
                        </button>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                        <div>
                          <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--theme-muted)", marginBottom: "0.75rem" }}>Coaches</div>
                          {currentTeam?.coaches?.length ? currentTeam.coaches.map((coach) => (
                            <div key={coach._id} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.65rem 0", borderBottom: "1px solid var(--theme-border)" }}>
                              {renderAvatar(coach.name || coach.user?.name, coach.profilePic || coach.user?.profilePic, 32, "coach")}
                              <div>
                                <div style={{ fontWeight: 700 }}>{coach.name || coach.user?.name || "Coach"}</div>
                                <div style={{ fontSize: "0.78rem", color: "var(--theme-muted)" }}>{coach.user?.email || "Coach account"}</div>
                              </div>
                            </div>
                          )) : <div style={{ color: "var(--theme-muted)", fontSize: "0.9rem" }}>No coaches assigned.</div>}
                        </div>
                        <div>
                          <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--theme-muted)", marginBottom: "0.75rem" }}>Athletes</div>
                          {currentTeam?.athletes?.length ? currentTeam.athletes.map((athlete) => (
                            <div key={athlete._id} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.65rem 0", borderBottom: "1px solid var(--theme-border)" }}>
                              {renderAvatar(athlete.name || athlete.user?.name, athlete.profilePic || athlete.user?.profilePic, 32, "athlete")}
                              <div>
                                <div style={{ fontWeight: 700 }}>{athlete.name || athlete.user?.name || "Athlete"}</div>
                                <div style={{ fontSize: "0.78rem", color: "var(--theme-muted)" }}>{athlete.user?.email || "Athlete account"}</div>
                              </div>
                            </div>
                          )) : <div style={{ color: "var(--theme-muted)", fontSize: "0.9rem" }}>No athletes in this team.</div>}
                        </div>
                      </div>
                    </div>
                  );
                })()}
                <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
                  {messages.some(m => m.isPinned) && (
                    <div style={{ background: "rgba(245,158,11,0.1)", borderBottom: "1px solid rgba(245,158,11,0.2)", padding: "0.5rem 1rem", display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }} onClick={() => {
                        const pinned = messages.slice().reverse().find(m => m.isPinned && m.fileType === "formation");
                        if (pinned) setOpenFormation(pinned.fileUrl);
                    }}>
                      <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#f59e0b", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", flexShrink: 0 }}>📌</div>
                      <div style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                         <span style={{ fontWeight: 800, color: "#fcd34d", fontSize: "0.8rem", marginRight: "0.4rem" }}>Pinned Tactic:</span>
                         <span style={{ fontSize: "0.8rem", color: "var(--theme-text)" }}>{messages.slice().reverse().find(m => m.isPinned)?.text || "Tactical formation shared"}</span>
                      </div>
                      <span style={{ fontSize: "0.7rem", color: "#f59e0b", fontWeight: 700, textTransform: "uppercase" }}>View</span>
                    </div>
                  )}
                  <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem", background: "linear-gradient(180deg, var(--theme-surface-2) 0%, color-mix(in srgb, var(--theme-surface-2) 82%, var(--theme-bg) 18%) 100%)" }}>
                    {messages.length === 0 && <div style={{ textAlign: "center", color: "var(--theme-muted)", fontSize: "0.85rem", marginTop: "auto", marginBottom: "auto" }}>This is the beginning of the message history.</div>}

                  {messages.map((msg, i) => {
                    const isMe = msg.sender?._id === user?._id;
                    const showName = !isMe && (i === 0 || messages[i - 1].sender?._id !== msg.sender?._id);

                    return (
                      <div key={msg._id} style={{ display: "flex", alignSelf: isMe ? "flex-end" : "flex-start", maxWidth: "70%", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start" }}>
                        {showName && (
                          <div style={{ fontSize: "0.76rem", fontWeight: 800, color: "var(--theme-text)", marginBottom: "0.28rem", padding: "0 0.5rem" }}>
                            {msg.sender?.name}
                          </div>
                        )}

                        <div style={{ position: "relative", background: isMe ? "linear-gradient(135deg, var(--theme-primary), var(--theme-primary-dark))" : "var(--theme-surface)", color: isMe ? "#fff" : "var(--theme-text)", padding: "0.9rem 1rem", borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px", boxShadow: msg.isPinned ? "0 0 0 2px #f59e0b, 0 12px 24px rgba(245,158,11,0.3)" : (isMe ? "0 12px 24px rgba(249,115,22,0.25)" : "0 10px 24px rgba(15, 23, 42, 0.08)"), border: isMe && !msg.isPinned ? "none" : "1px solid var(--theme-border)", lineHeight: 1.5, fontSize: "0.95rem", display: "flex", flexDirection: "column", gap: msg.fileUrl ? "0.55rem" : "0" }}>
                          {msg.isPinned && (
                             <div style={{ position: "absolute", top: -10, right: isMe ? "auto" : -10, left: isMe ? -10 : "auto", background: "#f59e0b", color: "#fff", width: 24, height: 24, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 10px rgba(245,158,11,0.5)", zIndex: 10 }}>
                               📌
                             </div>
                          )}
                          {msg.fileUrl && (
                            msg.fileType === "formation" ? (
                              <div style={{ position: "relative" }}>
                                <FormationChatCard formationId={msg.fileUrl} isMe={isMe} portal="coach" />
                                <button 
                                  onClick={async () => {
                                    await fetch(`${API}/api/chat/message/${msg._id}/pin`, { method: "PUT", credentials: "include" });
                                    setMessages(prev => prev.map(m => m._id === msg._id ? { ...m, isPinned: !m.isPinned } : m));
                                  }}
                                  style={{ position: "absolute", top: 8, right: 8, background: msg.isPinned ? "#f59e0b" : "rgba(0,0,0,0.5)", border: "none", borderRadius: "50%", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff", transition: "all 0.2s", backdropFilter: "blur(4px)" }}
                                  title={msg.isPinned ? "Unpin Tactic" : "Pin Tactic"}
                                >
                                  📌
                                </button>
                              </div>
                            ) : msg.fileType === "image" ? (
                              <div
                                style={{ borderRadius: 10, overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)", maxWidth: 250, maxHeight: 250, cursor: "zoom-in", position: "relative" }}
                                onClick={() => setLightboxImage(`${API}${msg.fileUrl}`)}
                                onMouseEnter={(e) => {
                                  const overlay = e.currentTarget.querySelector(".img-overlay");
                                  if (overlay) overlay.style.opacity = "1";
                                }}
                                onMouseLeave={(e) => {
                                  const overlay = e.currentTarget.querySelector(".img-overlay");
                                  if (overlay) overlay.style.opacity = "0";
                                }}
                              >
                                <img src={`${API}${msg.fileUrl}`} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} alt="Attachment" />
                                <div className="img-overlay" style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0, transition: "opacity 0.2s", fontSize: "0.8rem", color: "#fff", fontWeight: 700, letterSpacing: 1 }}>
                                  TAP TO VIEW
                                </div>
                              </div>
                            ) : msg.fileType === "location" ? (
                              <button onClick={() => window.open(msg.fileUrl, "_blank", "noopener,noreferrer")} style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: isMe ? "#fff" : "var(--theme-primary)", background: isMe ? "rgba(255,255,255,0.16)" : "var(--theme-surface-2)", padding: "0.72rem 0.86rem", borderRadius: 10, border: isMe ? "1px solid rgba(255,255,255,0.16)" : "1px solid var(--theme-border)", cursor: "pointer", fontWeight: 700 }}>
                                <MapPin size={18} /> View on Google Maps
                              </button>
                            ) : (
                              <a href={`${API}${msg.fileUrl}`} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: isMe ? "#fff" : "var(--theme-primary)", textDecoration: "none", background: isMe ? "rgba(255,255,255,0.16)" : "var(--theme-surface-2)", padding: "0.72rem 0.86rem", borderRadius: 10, border: isMe ? "1px solid rgba(255,255,255,0.16)" : "1px solid var(--theme-border)", fontWeight: 700 }}>
                                <FileText size={18} /> Document Attachment
                              </a>
                            )
                          )}

                          {msg.text && <div style={{ wordBreak: "break-word", fontWeight: 600 }}>{msg.text}</div>}

                          <div style={{ fontSize: "0.65rem", color: isMe ? "rgba(255,255,255,0.72)" : "var(--theme-muted)", textAlign: "right", marginTop: "0.35rem", fontWeight: 700 }}>
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  </div>
                </div>

                <div style={{ position: "relative" }}>
                  {showAttachMenu && (
                    <div style={{ position: "absolute", bottom: "100%", left: "1rem", marginBottom: "0.5rem", background: "var(--theme-surface)", border: "1px solid var(--theme-border)", borderRadius: "14px", boxShadow: "0 20px 50px rgba(15, 23, 42, 0.16)", display: "flex", flexDirection: "column", padding: "0.5rem", zIndex: 100 }}>
                  {/* Image/document upload */}
                      <button type="button" onClick={() => { setShowAttachMenu(false); fileInputRef.current?.click(); }} style={{ display: "flex", alignItems: "center", gap: "0.8rem", padding: "0.6rem 1.2rem", background: "transparent", border: "none", color: "var(--theme-text)", cursor: "pointer", borderRadius: "10px", textAlign: "left" }} onMouseEnter={(e) => e.currentTarget.style.background = "var(--theme-surface-2)"} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                        <div style={{ background: "linear-gradient(135deg, #a855f7, #6d28d9)", width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", boxShadow: "0 4px 10px rgba(109,40,217,0.3)" }}>
                          <ImageIcon size={18} />
                        </div>
                        <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>Gallery / Document</span>
                      </button>

                      <button type="button" onClick={() => { setShowAttachMenu(false); handleAttachLocation(); }} style={{ display: "flex", alignItems: "center", gap: "0.8rem", padding: "0.6rem 1.2rem", background: "transparent", border: "none", color: "var(--theme-text)", cursor: "pointer", borderRadius: "10px", textAlign: "left" }} onMouseEnter={(e) => e.currentTarget.style.background = "var(--theme-surface-2)"} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                        <div style={{ background: "linear-gradient(135deg, #10b981, #047857)", width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", boxShadow: "0 4px 10px rgba(4,120,87,0.3)" }}>
                          <MapPin size={18} />
                        </div>
                        <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>Location</span>
                      </button>

                      {/* Tactic Option */}
                      <button type="button" onClick={() => { setShowAttachMenu(false); setShowTacticsBoard(true); }} style={{ display: "flex", alignItems: "center", gap: "0.8rem", padding: "0.6rem 1.2rem", background: "transparent", border: "none", color: "var(--theme-text)", cursor: "pointer", borderRadius: "10px", textAlign: "left" }} onMouseEnter={(e) => e.currentTarget.style.background = "var(--theme-surface-2)"} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                        <div style={{ background: "linear-gradient(135deg, #22c55e, #15803d)", width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", boxShadow: "0 4px 10px rgba(34,197,94,0.4)" }}>
                          <Crosshair size={18} />
                        </div>
                        <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>Share Tactic</span>
                      </button>
                    </div>
                  )}

                  <form onSubmit={handleSend} style={{ padding: "1rem", background: "var(--theme-surface)", borderTop: "1px solid var(--theme-border)", display: "flex", gap: "0.8rem", alignItems: "center" }}>
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} style={{ display: "none" }} />
                    <button type="button" onClick={() => setShowAttachMenu(!showAttachMenu)} className="btn-ghost" style={{ padding: "0.8rem", borderRadius: "50%", background: showAttachMenu ? "var(--theme-primary)" : "var(--theme-surface-2)", color: showAttachMenu ? "#fff" : "var(--theme-text)", width: 45, height: 45, transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)", transform: showAttachMenu ? "scale(1.1)" : "scale(1)" }} disabled={uploading}>
                      {uploading ? <Loader2 size={18} className="spinner-icon" /> : <Paperclip size={18} />}
                    </button>

                    <input
                      type="text"
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      maxLength={VALIDATION_LIMITS.messageMax}
                      placeholder="Type an announcement or feedback..."
                      style={{ flex: 1, background: "var(--theme-surface-2)", border: "1px solid var(--theme-border)", borderRadius: 22, padding: "0.85rem 1.2rem", color: "var(--theme-text)", outline: "none", fontWeight: 600 }}
                    />

                    <button type="submit" disabled={!text.trim()} className="btn-primary" style={{ borderRadius: "50%", width: 45, height: 45, padding: 0, display: "flex", alignItems: "center", justifyContent: "center", opacity: text.trim() ? 1 : 0.5 }}>
                      <Send size={18} style={{ marginLeft: -2 }} />
                    </button>
                  </form>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Tactics Board overlay (coach editable) ── */}
      {showTacticsBoard && activeView?.type === "team_chat" && (
        <FormationsBoard
          readOnly={false}
          onClose={() => setShowTacticsBoard(false)}
          onSave={async (formation) => {
            try {
              const method = formation._id ? "PUT" : "POST";
              const url = formation._id ? `${API}/api/formations/${formation._id}` : `${API}/api/formations`;
              const res = await fetch(url, {
                method,
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...formation, teamId: activeView.id }),
              });
              if (res.ok) {
                alert("Tactics saved successfully!");
              }
            } catch (err) {
              console.error("Formation save error", err);
            }
          }}
          onShare={async (formation) => {
            try {
              const res = await fetch(`${API}/api/formations`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...formation, teamId: activeView.id }),
              });
              const data = await res.json();
              if (res.ok && data._id) {
                const roomName = `team_${activeView.id}`;
                socket.emit("send_message", {
                  room: roomName,
                  sender: user._id,
                  text: `📋 Shared a tactic: ${data.name}`,
                  teamGroup: activeView.id,
                  formation: data._id,
                  fileUrl: data._id,
                  fileType: "formation",
                });
                setShowTacticsBoard(false);
              }
            } catch (err) {
              console.error("Formation share error", err);
            }
          }}
        />
      )}
    </>
  );
}
