import { useEffect, useState, useRef } from "react";
import { MessageSquare, Heart, Send, ImageIcon, Loader2, User, Globe, Shield, Users as UsersIcon, TrendingUp, Star } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import "../club/ClubLayout.css";

const API = import.meta.env.VITE_BACKEND_URL;
const glassCard = "var(--theme-surface-3)";
const glassBorder = "1px solid var(--theme-border-soft)";
const softPanel = "var(--theme-overlay-soft)";

export default function AthleteFeed() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  
  // Posting State
  const [content, setContent] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [postContext, setPostContext] = useState({ type: "global", id: null, name: "Global Feed" });
  const [showContextOptions, setShowContextOptions] = useState(false);
  
  // Memberships for posting
  const [myClubs, setMyClubs] = useState([]);
  const [myTeams, setMyTeams] = useState([]);

  const fileInputRef = useRef();
  const [commentingOn, setCommentingOn] = useState(null);
  const [commentText, setCommentText] = useState("");

  useEffect(() => {
    fetchFeed();
    fetchMemberships();
  }, []);

  const fetchFeed = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/post/feed`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setPosts(data);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchMemberships = async () => {
    try {
      // Fetch athlete or coach profile to get clubs
      const profilePath = user.role === "athlete" ? `/api/athlete/me` : `/api/coach/me`;
      const profileRes = await fetch(`${API}${profilePath}`, { credentials: "include" });
      if (profileRes.ok) {
        const profile = await profileRes.json();
        setMyClubs(profile.clubs || []);
      }

      // Fetch teams
      const teamsRes = await fetch(`${API}/api/team/join`, { credentials: "include" }); // Temporary route check, or just /api/team
      const teamsData = await teamsRes.json();
      // Filter teams where user is present
      const joinedTeams = (Array.isArray(teamsData) ? teamsData : []).filter(t => 
        t.athletes?.includes(user._id) || t.coaches?.includes(user._id)
      );
      setMyTeams(joinedTeams);
    } catch (err) { console.error("Error fetching memberships", err); }
  };

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (f) {
      setFile(f);
      setPreview(URL.createObjectURL(f));
    }
  };

  const handleCreatePost = async () => {
    if (!content.trim() && !file) return;
    setCreating(true);
    try {
      let mediaUrl = "";
      if (file) {
        const formData = new FormData();
        formData.append("image", file);
        const uploadRes = await fetch(`${API}/api/upload`, { method: "POST", body: formData });
        const uploadData = await uploadRes.json();
        mediaUrl = uploadData.url;
      }

      const res = await fetch(`${API}/api/post/create`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          content, 
          mediaUrl, 
          mediaType: mediaUrl ? "image" : "",
          clubId: postContext.type === "club" ? postContext.id : null,
          teamId: postContext.type === "team" ? postContext.id : null
        })
      });

      if (res.ok) {
        setContent("");
        setFile(null);
        setPreview(null);
        setPostContext({ type: "global", id: null, name: "Global Feed" });
        fetchFeed();
      }
    } catch (err) { console.error(err); }
    finally { setCreating(false); }
  };

  const handleLike = async (postId) => {
    try {
      const res = await fetch(`${API}/api/post/${postId}/like`, { method: "POST", credentials: "include" });
      if (res.ok) {
        const updatedPost = await res.json();
        setPosts(posts.map(p => p._id === postId ? { ...p, likes: updatedPost.likes } : p));
      }
    } catch (err) { console.error(err); }
  };

  const handleComment = async (postId) => {
    if (!commentText.trim()) return;
    try {
      const res = await fetch(`${API}/api/post/${postId}/comment`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: commentText })
      });
      if (res.ok) {
        const updatedPost = await res.json();
        setPosts(posts.map(p => p._id === postId ? updatedPost : p));
        setCommentText("");
        setCommentingOn(null);
      }
    } catch (err) { console.error(err); }
  };

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", paddingBottom: "3rem" }}>
      <div className="page-header" style={{ marginBottom: "2rem" }}>
      </div>

      {/* Create Post Card - Premium Look */}
      <div className="card" style={{ 
        marginBottom: "2.5rem", 
        padding: "1.5rem", 
        background: glassCard, 
        backdropFilter: "blur(10px)", 
        border: glassBorder,
        borderRadius: "16px",
        boxShadow: "var(--theme-shadow)"
      }}>
        <div style={{ display: "flex", gap: "1rem" }}>
          <div style={{ width: 50, height: 50, borderRadius: "50%", background: "var(--c-surface2)", overflow: "hidden", border: "2px solid var(--c-primary)" }}>
             {user?.profilePic ? <img src={`${API}${user.profilePic}`} style={{width:"100%",height:"100%",objectFit:"cover"}} /> : <User size={24} style={{margin:11}} />}
          </div>
          <div style={{ flex: 1 }}>
            {/* Context Selector Toggle */}
            <div style={{ marginBottom: "0.8rem", position: "relative" }}>
               <button 
                onClick={() => setShowContextOptions(!showContextOptions)}
                style={{ background: "var(--theme-surface-4)", border: "1px solid var(--c-border)", borderRadius: "20px", padding: "0.3rem 0.8rem", color: "var(--c-muted)", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "0.4rem", cursor: "pointer" }}>
                  {postContext.type === "global" ? <Globe size={12}/> : postContext.type === "club" ? <Shield size={12}/> : <UsersIcon size={12}/>}
                  Posting to: <span style={{ color: "var(--c-primary)", fontWeight: 600 }}>{postContext.name}</span>
               </button>
               
               {showContextOptions && (
                 <div className="card" style={{ position: "absolute", top: "110%", left: 0, zIndex: 10, minWidth: 200, padding: "0.5rem", boxShadow: "var(--theme-shadow)" }}>
                    <div onClick={() => { setPostContext({ type: "global", id: null, name: "Global Feed" }); setShowContextOptions(false); }} style={{ padding: "0.5rem", cursor: "pointer", borderRadius: 4, display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem" }}>
                       <Globe size={14}/> Global
                    </div>
                    {myClubs.map(c => (
                       <div key={c._id} onClick={() => { setPostContext({ type: "club", id: c._id, name: c.name }); setShowContextOptions(false); }} style={{ padding: "0.5rem", cursor: "pointer", borderRadius: 4, display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem" }}>
                          <Shield size={14}/> {c.name} (Club)
                       </div>
                    ))}
                    {myTeams.map(t => (
                       <div key={t._id} onClick={() => { setPostContext({ type: "team", id: t._id, name: t.name }); setShowContextOptions(false); }} style={{ padding: "0.5rem", cursor: "pointer", borderRadius: 4, display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem" }}>
                          <UsersIcon size={14}/> {t.name} (Team)
                       </div>
                    ))}
                 </div>
               )}
            </div>

            <textarea 
              placeholder="What's happening on the field?"
              value={content} onChange={e => setContent(e.target.value)}
              style={{ width: "100%", background: "transparent", border: "none", color: "var(--c-text)", outline: "none", resize: "none", fontSize: "1.1rem", minHeight: 90 }}
            />
            {preview && (
              <div style={{ position: "relative", marginTop: "1rem", borderRadius: 12, overflow: "hidden", maxHeight: 400, border: "1px solid var(--c-border)" }}>
                <img src={preview} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                <button 
                  onClick={() => { setFile(null); setPreview(null); }}
                  style={{ position: "absolute", top: 10, right: 10, background: "var(--theme-overlay)", color: "var(--theme-on-primary)", border: "none", borderRadius: "50%", width: 32, height: 32, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  &times;
                </button>
              </div>
            )}
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--theme-border-soft)" }}>
           <div style={{ display: "flex", gap: "1rem" }}>
              <button className="btn-ghost" onClick={() => fileInputRef.current.click()} style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--c-muted)", fontSize: "0.9rem" }}>
                  <ImageIcon size={20} color="var(--c-primary)" /> Photo / Video
              </button>
              <input type="file" hidden ref={fileInputRef} accept="image/*" onChange={handleFileChange} />
           </div>
           <button className="btn-primary" onClick={handleCreatePost} disabled={creating || (!content.trim() && !file)} style={{ borderRadius: "10px", padding: "0.6rem 1.4rem" }}>
              {creating ? <Loader2 size={18} className="spinner-icon" /> : <><Send size={18} /> Publish</>}
           </button>
        </div>
      </div>

      {/* Feed List */}
      {loading ? (
        <div className="loading-state" style={{ marginTop: "4rem" }}><Loader2 size={36} className="spinner-icon" /> <span style={{ color: "var(--c-muted)" }}>Ranking feed by relevance...</span></div>
      ) : posts.length === 0 ? (
        <div className="empty-state" style={{ background: "var(--theme-surface-3)", borderRadius: "16px", padding: "4rem 2rem" }}>
          <MessageSquare size={50} style={{ opacity: 0.3, marginBottom: "1rem" }} />
          <h3>All quiet on the field</h3>
          <p>Be the first to share an update with your community!</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          {posts.map(post => (
            <div key={post._id} className="card social-post-card" style={{ 
              padding: 0, 
              overflow: "hidden", 
              borderRadius: "16px",
              background: "var(--theme-surface-3)",
              border: post.recommended ? "1px solid rgba(0,180,255,0.2)" : glassBorder,
              transition: "transform 0.3s ease",
              cursor: "default"
            }}>
              {/* Algorithm / Context Badges */}
              <div style={{ display: "flex", gap: "0.5rem", padding: "0.8rem 1.2rem 0", flexWrap: "wrap" }}>
                  {post.recommended && (
                    <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", background: "rgba(0,180,255,0.1)", color: "#00b4ff", padding: "0.2rem 0.6rem", borderRadius: "12px", fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase" }}>
                       <Star size={10} fill="#00b4ff" /> Recommended for You
                    </div>
                  )}
                  {post.trending && (
                    <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", background: "rgba(255,80,80,0.1)", color: "#ff5050", padding: "0.2rem 0.6rem", borderRadius: "12px", fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase" }}>
                       <TrendingUp size={10} /> Trending
                    </div>
                  )}
                  {post.team && (
                    <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", background: "var(--theme-surface-4)", color: "var(--c-primary)", padding: "0.2rem 0.6rem", borderRadius: "12px", fontSize: "0.65rem", fontWeight: 600 }}>
                       Team: {post.team.name}
                    </div>
                  )}
                  {post.club && !post.team && (
                    <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", background: "var(--theme-surface-4)", color: "var(--theme-gold)", padding: "0.2rem 0.6rem", borderRadius: "12px", fontSize: "0.65rem", fontWeight: 600 }}>
                       Club: {post.club.name}
                    </div>
                  )}
              </div>

              {/* Post Header */}
              <div style={{ padding: "1rem 1.2rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <div style={{ width: 42, height: 42, borderRadius: "50%", background: "var(--c-surface2)", overflow: "hidden", border: "1px solid var(--c-border)" }}>
                    {post.branding?.profilePic ? <img src={`${API}${post.branding.profilePic}`} style={{width:"100%",height:"100%",objectFit:"cover"}} /> : <User size={20} style={{margin:10}} />}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "1rem" }}>{post.branding?.name}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--c-muted)" }}>{new Date(post.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(post.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div style={{ padding: "0 1.2rem 1.2rem", fontSize: "1rem", lineHeight: 1.6, color: "var(--theme-text-soft)" }}>
                {post.content}
              </div>

              {/* Media with sophisticated display */}
              {post.mediaUrl && (
                <div style={{ width: "100%", background: softPanel, minHeight: 200, display: "flex", alignItems: "center", justifyContent: "center", borderTop: "1px solid var(--theme-border-soft)", borderBottom: "1px solid var(--theme-border-soft)" }}>
                  <img src={`${API}${post.mediaUrl}`} style={{ width: "100%", height: "auto", maxHeight: 600, objectFit: "contain" }} alt="post media" />
                </div>
              )}

              {/* Interaction Bar */}
              <div style={{ padding: "0.7rem 1.2rem", borderTop: "1px solid var(--theme-border-soft)", display: "flex", justifyContent: "space-between" }}>
                 <div style={{ display: "flex", gap: "1.2rem" }}>
                    <button 
                      onClick={() => handleLike(post._id)}
                      style={{ 
                        display: "flex", alignItems: "center", gap: "0.5rem", background: "none", border: "none", 
                        color: post.likes?.includes(user._id) ? "#ff4081" : "var(--c-muted)", 
                        cursor: "pointer", fontSize: "0.95rem", transition: "all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)" 
                      }}
                      onMouseEnter={(e) => e.target.style.transform = "scale(1.1)"}
                      onMouseLeave={(e) => e.target.style.transform = "scale(1)"}
                    >
                      <Heart size={20} fill={post.likes?.includes(user._id) ? "#ff4081" : "none"} strokeWidth={2.5} />
                      <span style={{ fontWeight: 600 }}>{post.likes?.length || 0}</span>
                    </button>
                    
                    <button 
                      onClick={() => setCommentingOn(commentingOn === post._id ? null : post._id)}
                      style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "none", border: "none", color: "var(--c-muted)", cursor: "pointer", fontSize: "0.95rem" }}
                    >
                      <MessageSquare size={20} strokeWidth={2.5} />
                      <span style={{ fontWeight: 600 }}>{post.comments?.length || 0}</span>
                    </button>
                 </div>
              </div>

              {/* Rich Comment Display - Only show when expanded */}
              {commentingOn === post._id && post.comments?.length > 0 && (
                <div style={{ padding: "0.8rem 1.2rem", background: "var(--theme-surface-3)", borderTop: "1px solid var(--theme-border-soft)" }}>
                   {post.comments.map((comm, idx) => (
                     <div key={idx} style={{ padding: "0.5rem 0", fontSize: "0.85rem", display: "flex", gap: "0.7rem", alignItems: "flex-start" }}>
                        <div style={{ width: 24, height: 24, borderRadius: "50%", background: "var(--c-surface2)", overflow: "hidden", marginTop: 2 }}>
                           {comm.user?.profilePic ? <img src={`${API}${comm.user.profilePic}`} style={{width:"100%",height:"100%",objectFit:"cover"}} /> : <User size={12} style={{margin:6}} />}
                        </div>
                        <div style={{ flex: 1 }}>
                           <span style={{ fontWeight: 700, marginRight: "0.5rem", color: "var(--c-primary)" }}>{comm.user?.name}</span>
                           <span style={{ color: "var(--theme-text-soft)" }}>{comm.text}</span>
                        </div>
                     </div>
                   ))}
                </div>
              )}

              {/* Expandable Add Comment Area */}
              {commentingOn === post._id && (
                <div style={{ padding: "1.2rem", borderTop: "1px solid var(--theme-border-soft)", display: "flex", gap: "0.8rem", background: softPanel }}>
                   <input 
                    type="text" placeholder="Share your thoughts..." 
                    autoFocus
                    value={commentText} onChange={e => setCommentText(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleComment(post._id)}
                    style={{ flex: 1, background: "var(--theme-surface-4)", border: "1px solid var(--c-border)", borderRadius: "24px", padding: "0.6rem 1.2rem", color: "var(--c-text)", outline: "none", fontSize: "0.9rem" }}
                   />
                   <button 
                    className="btn-primary" 
                    onClick={() => handleComment(post._id)} 
                    disabled={!commentText.trim()}
                    style={{ borderRadius: "50%", width: 40, height: 40, padding: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
                   >
                     <Send size={18} />
                   </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
