// ============================================================
// FILE: src/pages/StudentDashboard.jsx
// PURPOSE: The main hub students see after logging in.
//          Shows their points, streak, today's challenge,
//          leaderboard, submission form, and history.
// ============================================================

// --- IMPORTS ---
// React itself + hooks we need:
//   useState  = lets us store data that changes (like form text)
//   useEffect = lets us run code when the page loads
import  { useState, useEffect } from "react";

// framer-motion gives us smooth animations.
// motion.div = a <div> that can animate
// AnimatePresence = lets elements animate OUT when they disappear
import { motion, AnimatePresence } from "framer-motion";

// react-parallax-tilt makes cards tilt when you hover them (3D effect)
import Tilt from "react-parallax-tilt";

// Icons from lucide-react — each import is one icon component
import {
  Leaf,        // 🌿 leaf icon
  Flame,       // 🔥 streak fire
  Star,        // ⭐ points star
  Trophy,      // 🏆 leaderboard
  Camera,      // 📷 upload photo
  CheckCircle, // ✅ completed
  ChevronRight,// › arrow
  LogOut,      // exit icon
  Zap,         // ⚡ bonus icon
  Award,       // 🎖 badge
  X,           // ✕ close button
  Upload,      // ↑ upload arrow
  Clock,       // 🕐 history
  TreePine,
  Gift    // 🌲 decoration
} from "lucide-react";

// Our Supabase client — talks to the database
import { supabase } from "../lib/supabase";

// useNavigate lets us send the user to a different page
import { useNavigate } from "react-router-dom";


// ============================================================
// SECTION 1: ANIMATION BLUEPRINTS (variants)
// Framer Motion uses "variants" — named animation states.
// "hidden" = starting state, "show" = ending state.
// ============================================================

// fadeUp: element starts invisible 30px below, slides up + fades in
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

// staggerContainer: parent that staggers its children 0.1s apart
// So child 1 animates, then 0.1s later child 2, etc.
const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

// fallIn: used for the navbar — falls from above
const fallIn = {
  hidden: { opacity: 0, y: -40 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

// slideRight: slides in from the left



// ============================================================
// SECTION 2: HELPER SUB-COMPONENTS
// Small reusable pieces used inside the dashboard.
// ============================================================

// --- GlassCard ---
// A card with a frosted-glass look (glassmorphism).
// "children" = whatever JSX you put between <GlassCard>...</GlassCard>
// "className" = extra CSS classes you can add from outside
// "...rest" = any other props (like onClick, style, etc.)
const GlassCard = ({ children, className = "", ...rest }) => (
  <div
    className={`glass-card ${className}`}
    style={{
      // Semi-transparent white background — this creates the "glass" look
      background: "rgba(255, 255, 255, 0.55)",
      // Blur the content BEHIND this card (the backdrop)
      backdropFilter: "blur(18px)",
      WebkitBackdropFilter: "blur(18px)", // needed for Safari browser
      borderRadius: "20px",
      // Subtle white border on top/left to mimic light reflection
      border: "1px solid rgba(255,255,255,0.75)",
      // Soft shadow so card lifts off the background
      boxShadow: "0 8px 32px rgba(45,106,79,0.10), 0 2px 8px rgba(45,106,79,0.06)",
      padding: "24px",
    }}
    {...rest} // spread any extra props onto the div
  >
    {children}
  </div>
);


// --- PointsRing ---
// An SVG circular progress ring showing the student's XP.
// Props:
//   points     = current points earned
//   maxPoints  = the goal (e.g. 500 for the level)
const PointsRing = ({ points = 0, maxPoints = 500 }) => {
  const size = 140;          // ring diameter in pixels
  const strokeW = 12;        // thickness of the ring line
  const radius = (size - strokeW) / 2; // radius of circle
  const circumference = 2 * Math.PI * radius; // total ring length
  // How much of the ring to fill = progress fraction × total length
  const progress = Math.min(points / maxPoints, 1); // clamp 0–1
  const offset = circumference * (1 - progress);    // unfilled portion

  return (
    <div style={{ position: "relative", width: size, height: size }}>
      {/* The SVG ring itself */}
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        {/* Background track (the grey unfilled ring) */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none"
          stroke="rgba(45,106,79,0.12)"
          strokeWidth={strokeW}
        />
        {/* Animated filled arc */}
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none"
          stroke="url(#ringGradient)"
          strokeWidth={strokeW}
          strokeLinecap="round"
          strokeDasharray={circumference}
          // Animate from empty (circumference) to the progress offset
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.4, ease: "easeOut" }}
        />
        {/* Gradient definition used by the arc above */}
        <defs>
          <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#52B788" />
            <stop offset="100%" stopColor="#74C69D" />
          </linearGradient>
        </defs>
      </svg>

      {/* Text in the centre of the ring */}
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
      }}>
        <Star size={18} color="#52B788" fill="#52B788" />
        {/* Animate the number counting up */}
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ fontSize: 28, fontWeight: 800, color: "#2D6A4F", lineHeight: 1 }}
        >
          {points}
        </motion.span>
        <span style={{ fontSize: 11, color: "#74C69D", fontWeight: 600 }}>XP</span>
      </div>
    </div>
  );
};


// --- StreakBadge ---
// Shows the student's current daily streak.
const StreakBadge = ({ streak = 0 }) => (
  <div style={{
    display: "flex", alignItems: "center", gap: 8,
    background: "linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)",
    borderRadius: 50, padding: "8px 18px",
    boxShadow: "0 4px 16px rgba(255,107,53,0.3)",
  }}>
    {/* Flame icon pulses gently */}
    <motion.div
      animate={{ scale: [1, 1.15, 1] }}
      transition={{ repeat: Infinity, duration: 1.4 }}
    >
      <Flame size={20} color="#fff" fill="#fff" />
    </motion.div>
    <span style={{ color: "#fff", fontWeight: 800, fontSize: 18 }}>{streak}</span>
    <span style={{ color: "rgba(255,255,255,0.85)", fontSize: 12, fontWeight: 600 }}>day streak</span>
  </div>
);


// ============================================================
// SECTION 3: THE MAIN DASHBOARD COMPONENT
// ============================================================
const StudentDashboard = () => {

  // ---------- STATE ----------
  // useState(initialValue) returns [value, setterFunction]
  // Calling the setter re-renders the component with the new value.

  const [user,        setUser]        = useState(null);   // logged-in user object
  const [profile,     setProfile]     = useState(null);   // row from "users" table
  const [challenges,  setChallenges]  = useState([]);     // array of challenge objects
  const [todayChallenge, setTodayChallenge] = useState(null); // today's featured challenge
  const [submissions, setSubmissions] = useState([]);     // student's past submissions
  const [leaderboard, setLeaderboard] = useState([]);     // top students array
  const [loading,     setLoading]     = useState(true);   // show spinner while fetching

  // Submission form state
  const [showSubmitModal, setShowSubmitModal] = useState(false); // modal open?
  const [submitChallenge, setSubmitChallenge] = useState(null);  // which challenge to submit
  const [submitNote,      setSubmitNote]      = useState("");    // text note
  const [submitImage,     setSubmitImage]     = useState(null);  // selected File object
  const [submitPreview,   setSubmitPreview]   = useState(null);  // image preview URL
  const [submitting,      setSubmitting]      = useState(false); // prevent double-submit
  const [submitSuccess,   setSubmitSuccess]   = useState(false); // show success message

  // Active tab in submission history
  const [activeTab, setActiveTab] = useState("challenges"); // "challenges" | "history"
  const [selectedChallenge, setSelectedChallenge] = useState(null)

  const navigate = useNavigate(); // lets us call navigate("/login") etc.


  // ---------- LOAD DATA ON MOUNT ----------
  // useEffect runs the function inside it after the component first renders.
  // The empty [] array means "only run once, not on every re-render".


  // ---------- MAIN DATA FETCH ----------
  // async function = can use "await" inside it to wait for database calls
const fetchDashboardData = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) { navigate("/login"); return; }
      setUser(authUser);

      const { data: profileData } = await supabase
        .from("users")
        .select("*")
        .eq("id", authUser.id)
        .single();
      setProfile(profileData);

      const { data: challengeData } = await supabase
        .from("challenges")
        .select("*")
        .eq("is_active", true)
        .eq("class_id", profileData?.class_id)
        .order("difficulty_level", { ascending: true });
      setChallenges(challengeData || []);
      if (challengeData?.length) setTodayChallenge(challengeData[0]);

      const { data: subData } = await supabase
        .from("submissions")
        .select("*, challenges(title, points_reward, category)")
        .eq("student_id", authUser.id)
        .order("submitted_at", { ascending: false })
        .limit(10);
      setSubmissions(subData || []);

      const { data: lbData } = await supabase
  .from("users")
  .select("id, full_name, total_points, streak")
  .eq("role", "student")
  .eq("class_id", profileData?.class_id)
  .order("total_points", { ascending: false })
  .limit(5);
setLeaderboard(lbData || []);

    } catch (err) {
      console.error("Dashboard load error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      if (isMounted) await fetchDashboardData();
    };
    loadData();
    return () => { isMounted = false; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  


  // ---------- SIGN OUT ----------
  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate("/login");
  }


  // ---------- IMAGE PICKER ----------
  // Called when the user selects a file in the <input type="file">
  const handleImageChange = (e) => {
    const file = e.target.files[0]; // get the first selected file
    if (!file) return;
    setSubmitImage(file);
    // createObjectURL makes a temporary browser URL so we can preview it
    setSubmitPreview(URL.createObjectURL(file));
  };


  // ---------- SUBMIT A CHALLENGE ----------
  const handleSubmit = async () => {
    if (!submitChallenge || !submitNote.trim()) return; // guard
    setSubmitting(true);

    try {
      let imageUrl = null;

      // 1. If a photo was attached, upload it to Supabase Storage
      if (submitImage) {
        // Build a unique filename: studentID/timestamp.ext
        const ext = submitImage.name.split(".").pop(); // e.g. "jpg"
        const path = `${user.id}/${Date.now()}.${ext}`;

        const { error: uploadErr } = await supabase.storage
          .from("submission-images") // bucket name
          .upload(path, submitImage);

        if (uploadErr) throw uploadErr;

        // Get the public URL so teachers can view it
        const { data: urlData } = supabase.storage
          .from("submission-images")
          .getPublicUrl(path);
        imageUrl = urlData.publicUrl;
      }

      // 2. Insert a new row into the "submissions" table
      const { error: subErr } = await supabase
        .from("submissions")
        .insert({
          student_id:   user.id,
          challenge_id: submitChallenge.id,
          description:  submitNote.trim(),
          image_url:    imageUrl,
          status:       "pending", // teacher must approve
        });
      if (subErr) throw subErr;

      // 3. Show success state, then close modal after 2 seconds
      setSubmitSuccess(true);
      setTimeout(() => {
        setShowSubmitModal(false);
        setSubmitSuccess(false);
        setSubmitNote("");
        setSubmitImage(null);
        setSubmitPreview(null);
        fetchDashboardData(); // refresh to show new submission in history
      }, 2000);

    } catch (err) {
      console.error("Submit error:", err.message);
      alert("Oops! Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  };


  // ============================================================
  // RENDER — what actually appears on screen
  // ============================================================

  // Show a loading screen while data is being fetched
  if (loading) return (
    <div style={{
      minHeight: "100vh", display: "flex",
      alignItems: "center", justifyContent: "center",
      background: "linear-gradient(135deg, #e8f5e9 0%, #F8F4E3 60%, #d4edda 100%)",
    }}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
      >
        <Leaf size={48} color="#2D6A4F" />
      </motion.div>
    </div>
  );

  // Convenience: first name only (fallback to "Student" if name isn't set)
 const firstName = profile?.full_name?.split(" ")[0] || "Student";
  // Total points from profile (default 0)
  const totalPoints = profile?.total_points || 0;
  const streak = profile?.streak || 0;


  return (
    // The outermost wrapper — full page, scrollable
    <div style={{
      minHeight: "100vh",
      // Layered gradient: light green top → cream middle → light green bottom
      background: "linear-gradient(160deg, #CFEFFF 0%, #F5F1DC 35%, #C8F0D2 70%, #FFF6D5 100%)",
      fontFamily: "'Nunito', 'Segoe UI', sans-serif",
      overflowX: "hidden", // prevent horizontal scroll from animations
    }}>

      {/* ─────── DECORATIVE BACKGROUND SHAPES ─────── */}
      {/* These are big blurry blobs behind everything — pure decoration */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        {/* Top-right blob */}
        <div style={{
          position: "absolute", top: -120, right: -120,
          width: 480, height: 480, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(116,198,157,0.22) 0%, transparent 70%)",
        }} />
        {/* Bottom-left blob */}
        <div style={{
          position: "absolute", bottom: -80, left: -80,
          width: 360, height: 360, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(45,106,79,0.10) 0%, transparent 70%)",
        }} />
      </div>

      {/* ─────── NAVBAR ─────── */}
      {/*
        motion.nav: animated navigation bar
        variants={fallIn}: use the "fallIn" blueprint defined at top
        initial="hidden": start in hidden state
        animate="show": animate to show state
      */}
      <motion.nav
        variants={fallIn} initial="hidden" animate="show"
        style={{
          position: "sticky", top: 0, zIndex: 100,
          // Same glass effect as GlassCard but for the navbar
          background: "rgba(255,255,255,0.88)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.8)",
          boxShadow: "0 12px 40px rgba(27,94,32,0.12)",
          padding: "0 32px",
          height: 64,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}
      >
        {/* Left: Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          >
            <TreePine size={28} color="#2D6A4F" />
          </motion.div>
          <span style={{
            fontSize: 22, fontWeight: 900, letterSpacing: "-0.5px",
            background: "linear-gradient(135deg, #2D6A4F, #52B788)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>
            Earthify
          </span>
          <span style={{
            fontSize: 11, fontWeight: 700, color: "#74C69D",
            background: "rgba(116,198,157,0.15)",
            borderRadius: 6, padding: "2px 8px",
          }}>V2</span>
        </div>

        {/* Right: user info + sign out */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {/* Points pill */}
          <div style={{
            display: "flex", alignItems: "center", gap: 6,
            background: "rgba(82,183,136,0.12)",
            borderRadius: 50, padding: "6px 14px",
          }}>
            <Star size={14} color="#52B788" fill="#52B788" />
            <span style={{ fontWeight: 800, color: "#2D6A4F", fontSize: 14 }}>
              {totalPoints} XP
            </span>
          </div>

          {/* Avatar circle with first initial */}
          <div style={{
            width: 38, height: 38, borderRadius: "50%",
            background: "linear-gradient(135deg, #2D6A4F, #52B788)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontWeight: 800, fontSize: 16,
          }}>
            {firstName[0].toUpperCase()}
          </div>
          <motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
  onClick={() => navigate("/student/rewards")}
  style={{
    display: "flex", alignItems: "center", gap: 6,
    background: "rgba(82,183,136,0.12)",
    border: "1px solid rgba(82,183,136,0.2)",
    borderRadius: 10, padding: "7px 14px", cursor: "pointer",
    color: "#2D6A4F", fontWeight: 700, fontSize: 13,
  }}
>
  <Gift size={14} /> Rewards
</motion.button>

          {/* Sign out button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSignOut}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "rgba(255,100,100,0.1)",
              border: "1px solid rgba(255,100,100,0.2)",
              borderRadius: 10, padding: "7px 14px", cursor: "pointer",
              color: "#e05555", fontWeight: 700, fontSize: 13,
            }}
          >
            <LogOut size={14} /> Sign Out
          </motion.button>
        </div>
      </motion.nav>


      {/* ─────── MAIN CONTENT AREA ─────── */}
      {/*
        This is the scrollable page body below the navbar.
        position: relative + zIndex: 1 lifts it above the background blobs.
      */}
      <div style={{ position: "relative", zIndex: 1, maxWidth: 1200, margin: "0 auto", padding: "32px 24px 64px" }}>

        {/* === HERO GREETING SECTION === */}
        <motion.div
          variants={staggerContainer} initial="hidden" animate="show"
          style={{ marginBottom: 36 }}
        >
          {/* Greeting text */}
          <motion.div variants={fadeUp}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#74C69D", letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>
              🌿 Welcome back
            </div>
            <h1 style={{
              fontSize: "clamp(28px, 4vw, 44px)", // responsive font size
              fontWeight: 900, color: "#2D6A4F",
              margin: 0, lineHeight: 1.1, letterSpacing: "-1px",
            }}>
              Hey, {firstName}! 👋
            </h1>
            <p style={{ color: "#5a8a6a", marginTop: 8, fontSize: 16, fontWeight: 500 }}>
              Ready to make Earth a little greener today?
            </p>
          </motion.div>

          {/* Quick stats row */}
          <motion.div
            variants={fadeUp}
            style={{ display: "flex", gap: 12, marginTop: 20, flexWrap: "wrap" }}
          >
            <StreakBadge streak={streak} />

            {/* Submissions count badge */}
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              background: "rgba(45,106,79,0.08)",
              borderRadius: 50, padding: "8px 18px",
            }}>
              <CheckCircle size={18} color="#2D6A4F" />
              <span style={{ fontWeight: 700, color: "#2D6A4F" }}>
                {submissions.length} Submissions
              </span>
            </div>
          </motion.div>
        </motion.div>


        {/* === MAIN GRID (2 columns on wide screens, 1 on mobile) === */}
        <div style={{
          display: "grid",
          // "1fr 340px" = main area takes remaining space, sidebar is fixed 340px
          // On small screens this collapses to 1 column
          gridTemplateColumns: "1fr min(340px, 100%)",
          gap: 24,
          alignItems: "start", // cards don't stretch to equal height
        }}>

          {/* ══════════════════════════════════════════
              LEFT COLUMN: Points ring + Today's Challenge + Tab panel
          ══════════════════════════════════════════ */}
          <motion.div
            
            style={{ display: "flex", flexDirection: "column", gap: 24 }}
          >

            {/* ─── POINTS + LEVEL CARD ─── */}
            <motion.div
  initial={{ opacity: 0, y: 60 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.7, delay: 0.2 }}
>
              <GlassCard>
                <div style={{ display: "flex", alignItems: "center", gap: 28, flexWrap: "wrap" }}>

                  {/* The animated ring */}
                  <PointsRing points={totalPoints} maxPoints={500} />

                  {/* Level info beside the ring */}
                  <div style={{ flex: 1, minWidth: 180 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#74C69D", textTransform: "uppercase", letterSpacing: 1 }}>
                      Your Progress
                    </div>
                    <div style={{ fontSize: 32, fontWeight: 900, color: "#2D6A4F", lineHeight: 1.1 }}>
                      {/* Level = 1 + floor(points / 100) — simple levelling formula */}
                      Level {Math.floor(totalPoints / 100) + 1}
                    </div>
                    <div style={{ fontSize: 14, color: "#5a8a6a", marginTop: 4 }}>
                      {500 - (totalPoints % 500)} XP to next level
                    </div>

                    {/* Progress bar */}
                    <div style={{
                      marginTop: 12, height: 8, borderRadius: 8,
                      background: "rgba(45,106,79,0.10)", overflow: "hidden",
                    }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(totalPoints % 500) / 500 * 100}%` }}
                        transition={{ duration: 1.2, ease: "easeOut" }}
                        style={{
                          height: "100%", borderRadius: 8,
                          background: "linear-gradient(90deg, #52B788, #74C69D)",
                        }}
                      />
                    </div>

                    {/* Bonus tip */}
                    <div style={{
                      marginTop: 14, display: "flex", alignItems: "center", gap: 6,
                      background: "rgba(116,198,157,0.12)",
                      borderRadius: 10, padding: "8px 14px",
                    }}>
                      <Zap size={14} color="#52B788" />
                      <span style={{ fontSize: 13, color: "#2D6A4F", fontWeight: 600 }}>
                        Complete a challenge to earn more XP!
                      </span>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </motion.div>


            {/* ─── TAB SWITCHER: Challenges / History ─── */}
            <motion.div
  initial={{ opacity: 0, y: 60 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.7, delay: 0.9 }}
>
              {/* Tab buttons */}
              <div style={{
                display: "flex", gap: 4, marginBottom: 16,
                background: "rgba(255,255,255,0.6)",
                borderRadius: 14, padding: 4,
                border: "1px solid rgba(255,255,255,0.8)",
                width: "fit-content",
              }}>
                {/* Map over our two tabs */}
                {["challenges", "history"].map((tab) => (
                  <motion.button
                    key={tab}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setActiveTab(tab)}
                    style={{
                      padding: "8px 20px", borderRadius: 10,
                      border: "none", cursor: "pointer",
                      fontWeight: 700, fontSize: 14,
                      // Active tab: filled green. Inactive: transparent
                      background: activeTab === tab
                        ? "linear-gradient(135deg, #2D6A4F, #52B788)"
                        : "transparent",
                      color: activeTab === tab ? "#fff" : "#5a8a6a",
                      transition: "all 0.2s",
                      textTransform: "capitalize",
                    }}
                  >
                    {tab === "challenges" ? "🌿 Challenges" : "🕐 My History"}
                  </motion.button>
                ))}
              </div>

              {/* Tab content — AnimatePresence allows exit animations */}
              <AnimatePresence mode="wait">

                {/* ─── CHALLENGES TAB ─── */}
                {activeTab === "challenges" && (
                  <motion.div
                    key="challenges"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -16 }}
                    transition={{ duration: 0.3 }}
                    style={{ display: "flex", flexDirection: "column", gap: 16 }}
                  >
                    {challenges.length === 0 ? (
                      <GlassCard>
                        <p style={{ textAlign: "center", color: "#74C69D" }}>No challenges yet!</p>
                      </GlassCard>
                    ) : (
                      challenges.map((challenge, index) => (
                        // Tilt: wraps card to give 3D tilt on hover
                        <Tilt
                          key={challenge.id}
                          tiltMaxAngleX={6}    // max 6° tilt on X axis
                          tiltMaxAngleY={6}    // max 6° tilt on Y axis
                          glareEnable={true}   // show a glare shine effect
                          glareMaxOpacity={0.1}
                          scale={1.01}         // slight scale on hover
                        >
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            // Each card delays a bit more than the previous
                            transition={{ delay: index * 0.88 }}
                          >
                            <GlassCard style={{ padding: 20, cursor: "pointer" }} onClick={() => setSelectedChallenge(challenge)}>
                              <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>

                                {/* Category icon circle */}
                                <div style={{
                                  width: 48, height: 48, borderRadius: 14, flexShrink: 0,
                                  background: "linear-gradient(135deg, #2D6A4F22, #52B78822)",
                                  display: "flex", alignItems: "center", justifyContent: "center",
                                  fontSize: 24,
                                }}>
                                  {/* Emoji based on category — fallback to 🌱 */}
                                  {challenge.category === "water"    ? "💧"
                                  : challenge.category === "energy"  ? "⚡"
                                  : challenge.category === "waste"   ? "♻️"
                                  : challenge.category === "nature"  ? "🌳"
                                  : "🌱"}
                                </div>

                                {/* Challenge text */}
                                <div style={{ flex: 1 }}>
                                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#2D6A4F" }}>
                                      {challenge.title}
                                    </h3>
                                    {/* Points badge */}
                                    <span style={{
                                      background: "linear-gradient(135deg, #52B788, #74C69D)",
                                      color: "#fff", fontWeight: 800, fontSize: 12,
                                      borderRadius: 8, padding: "3px 10px", whiteSpace: "nowrap",
                                    }}>
                                      +{challenge.points_reward} XP
                                    </span>
                                  </div>
                                  <p style={{ margin: "6px 0 12px", fontSize: 13, color: "#5a8a6a", lineHeight: 1.5 }}>
                                    {challenge.description}
                                  </p>

                                  {/* Difficulty pills */}
                                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                    <span style={{
                                      fontSize: 11, fontWeight: 700, padding: "3px 10px",
                                      borderRadius: 6,
                                      background: challenge.difficulty_level === 1 ? "#d4edda"
                                               : challenge.difficulty_level === 2 ? "#fff3cd" : "#f8d7da",
                                      color: challenge.difficulty_level === 1 ? "#2D6A4F"
                                           : challenge.difficulty_level === 2 ? "#856404" : "#721c24",
                                    }}>
                                      {challenge.difficulty_level === 1 ? "Easy"
                                     : challenge.difficulty_level === 2 ? "Medium" : "Hard"}
                                    </span>

                                    {/* Submit button */}
                                    <motion.button
                                      whileHover={{ scale: 1.03 }}
                                      whileTap={{ scale: 0.97 }}
                                      onClick={() => {
                                        setSubmitChallenge(challenge); // remember which challenge
                                        setShowSubmitModal(true);      // open the modal
                                      }}
                                      style={{
                                        marginLeft: "auto",
                                        display: "flex", alignItems: "center", gap: 6,
                                        background: "linear-gradient(135deg, #2D6A4F, #52B788)",
                                        color: "#fff", border: "none",
                                        borderRadius: 10, padding: "7px 16px",
                                        cursor: "pointer", fontWeight: 700, fontSize: 13,
                                      }}
                                    >
                                      <Upload size={13} /> Submit
                                    </motion.button>
                                  </div>
                                </div>
                              </div>
                            </GlassCard>
                          </motion.div>
                        </Tilt>
                      ))
                    )}
                  </motion.div>
                )}

                {/* ─── HISTORY TAB ─── */}
                {activeTab === "history" && (
                  <motion.div
                    key="history"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -16 }}
                    transition={{ duration: 0.3 }}
                    style={{ display: "flex", flexDirection: "column", gap: 12 }}
                  >
                    {submissions.length === 0 ? (
                      <GlassCard>
                        <div style={{ textAlign: "center", padding: "24px 0" }}>
                          <Clock size={40} color="#74C69D" style={{ margin: "0 auto 12px", display: "block" }} />
                          <p style={{ color: "#74C69D", fontWeight: 600 }}>No submissions yet. Go complete a challenge!</p>
                        </div>
                      </GlassCard>
                    ) : (
                      submissions.map((sub, i) => (
                        <motion.div
                          key={sub.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.06 }}
                        >
                          <GlassCard style={{ padding: "16px 20px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>

                              {/* Status dot */}
                              <div style={{
                                width: 10, height: 10, borderRadius: "50%", flexShrink: 0,
                                background: sub.status === "approved" ? "#52B788"
                                          : sub.status === "rejected" ? "#e05555"
                                          : "#f0a500", // pending = orange
                              }} />

                              <div style={{ flex: 1 }}>
                                {/* Challenge title from the joined "challenges" table */}
                                <div style={{ fontWeight: 700, color: "#2D6A4F", fontSize: 14 }}>
                                  {sub.challenges?.title || "Challenge"}
                                </div>
                                <div style={{ fontSize: 12, color: "#74C69D", marginTop: 2 }}>
                                  {/* Format the date nicely */}
                                  {new Date(sub.submitted_at).toLocaleDateString("en-US", {
                                    month: "short", day: "numeric", year: "numeric"
                                  })}
                                </div>
                              </div>

                              {/* Status chip */}
                              <span style={{
                                fontSize: 11, fontWeight: 700, borderRadius: 6, padding: "3px 10px",
                                background: sub.status === "approved" ? "#d4edda"
                                          : sub.status === "rejected" ? "#f8d7da" : "#fff3cd",
                                color: sub.status === "approved" ? "#2D6A4F"
                                     : sub.status === "rejected" ? "#721c24" : "#856404",
                                textTransform: "capitalize",
                              }}>
                                {sub.status}
                              </span>
                            </div>
                          </GlassCard>
                        </motion.div>
                      ))
                    )}
                  </motion.div>
                )}

              </AnimatePresence>
            </motion.div>
          </motion.div>


          {/* ══════════════════════════════════════════
              RIGHT SIDEBAR: Today's Challenge + Leaderboard
          ══════════════════════════════════════════ */}
          <motion.div
            
            style={{ display: "flex", flexDirection: "column", gap: 24 }}
          >

            {/* ─── TODAY'S CHALLENGE ─── */}
            <motion.div
  initial={{ opacity: 0, y: 60 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.7, delay: 1.6 }}
>
              <GlassCard>
                {/* Section header */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 10,
                    background: "linear-gradient(135deg, #2D6A4F, #52B788)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Leaf size={16} color="#fff" />
                  </div>
                  <span style={{ fontWeight: 800, color: "#2D6A4F", fontSize: 15 }}>Today's Challenge</span>
                </div>

                {todayChallenge ? (
                  <>
                    {/* Challenge image (if exists) */}
                    {todayChallenge.reference_image_url && (
                      <img
                        src={todayChallenge.reference_image_url}
                        alt={todayChallenge.title}
                        style={{ width: "100%", borderRadius: 14, height: 140, objectFit: "cover", marginBottom: 14 }}
                      />
                    )}

                    {/* If no image, show a placeholder */}
                    {!todayChallenge.reference_image_url && (
                      <div style={{
                        width: "100%", height: 100, borderRadius: 14, marginBottom: 14,
                        background: "linear-gradient(135deg, #d8f3e3, #c7ebd4)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 40,
                      }}>🌿</div>
                    )}

                    <h3 style={{ margin: "0 0 6px", fontSize: 17, fontWeight: 800, color: "#2D6A4F" }}>
                      {todayChallenge.title}
                    </h3>
                    <p style={{ fontSize: 13, color: "#5a8a6a", lineHeight: 1.5, margin: "0 0 14px" }}>
                      {todayChallenge.description}
                    </p>

                    {/* Reward + CTA row */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{
                        display: "flex", alignItems: "center", gap: 6,
                        background: "rgba(116,198,157,0.15)",
                        borderRadius: 8, padding: "6px 12px",
                      }}>
                        <Star size={14} color="#52B788" fill="#52B788" />
                        <span style={{ fontWeight: 800, color: "#2D6A4F", fontSize: 14 }}>
                          {todayChallenge.points_reward} XP
                        </span>
                      </div>

                      <motion.button
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => { setSubmitChallenge(todayChallenge); setShowSubmitModal(true); }}
                        style={{
                          display: "flex", alignItems: "center", gap: 6,
                          background: "linear-gradient(135deg, #2D6A4F, #52B788)",
                          color: "#fff", border: "none", borderRadius: 12,
                          padding: "10px 20px", cursor: "pointer",
                          fontWeight: 800, fontSize: 14,
                          boxShadow: "0 4px 16px rgba(45,106,79,0.3)",
                        }}
                      >
                        Do It! <ChevronRight size={16} />
                      </motion.button>
                    </div>
                  </>
                ) : (
                  <p style={{ color: "#74C69D", textAlign: "center" }}>No challenge today!</p>
                )}
              </GlassCard>
            </motion.div>


            {/* ─── LEADERBOARD ─── */}
            <motion.div
  initial={{ opacity: 0, y: 60 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.7, delay: 2.3 }}
>
              <GlassCard>
  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
    <div style={{
      width: 32, height: 32, borderRadius: 10,
      background: "linear-gradient(135deg, #f0a500, #f7c550)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <Trophy size={16} color="#fff" />
    </div>
    <span style={{ fontWeight: 800, color: "#2D6A4F", fontSize: 15 }}>🏆 Eco Heroes</span>
  </div>

  {leaderboard.length === 0 ? (
    <div style={{ textAlign: "center", padding: "20px 0" }}>
      <div style={{ fontSize: 32, marginBottom: 8 }}>🌱</div>
      <p style={{ color: "#74C69D", fontWeight: 600, fontSize: 13 }}>
        No heroes yet — be the first!
      </p>
    </div>
  ) : (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {leaderboard.map((student, index) => {
        const isMe = student.id === user?.id
        const medal = ["🥇", "🥈", "🥉"][index] || `${index + 1}`
        return (
          <motion.div
            key={student.id || index}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "10px 14px", borderRadius: 12,
              background: isMe
                ? "linear-gradient(135deg, rgba(45,106,79,0.12), rgba(82,183,136,0.10))"
                : index === 0
                ? "linear-gradient(135deg, rgba(240,167,0,0.08), rgba(247,197,80,0.05))"
                : "rgba(255,255,255,0.5)",
              border: isMe
                ? "1px solid rgba(82,183,136,0.4)"
                : index === 0
                ? "1px solid rgba(240,167,0,0.2)"
                : "1px solid transparent",
            }}
          >
            {/* Medal */}
            <span style={{ fontSize: 18, width: 24, textAlign: "center" }}>{medal}</span>

            {/* Avatar */}
            <div style={{
              width: 34, height: 34, borderRadius: "50%",
              background: index === 0
                ? "linear-gradient(135deg, #f0a500, #f7c550)"
                : "linear-gradient(135deg, #2D6A4F, #74C69D)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", fontWeight: 800, fontSize: 13, flexShrink: 0,
            }}>
              {(student.full_name || "?")[0].toUpperCase()}
            </div>

            {/* Name */}
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#2D6A4F" }}>
                {student.full_name || "Student"}
                {isMe && (
                  <span style={{ fontSize: 11, color: "#52B788", marginLeft: 6 }}>
                    (you)
                  </span>
                )}
              </div>
              {/* Level under name */}
              <div style={{ fontSize: 11, color: "#74C69D", fontWeight: 600 }}>
                Level {Math.floor((student.total_points || 0) / 100) + 1}
              </div>
            </div>

            {/* Points */}
            <div style={{
              display: "flex", alignItems: "center", gap: 4,
              background: "rgba(82,183,136,0.1)",
              borderRadius: 8, padding: "4px 10px",
            }}>
              <Star size={12} color="#52B788" fill="#52B788" />
              <span style={{ fontWeight: 800, color: "#2D6A4F", fontSize: 13 }}>
                {student.total_points || 0}
              </span>
            </div>
          </motion.div>
        )
      })}
    </div>
  )}

  {/* Current student rank if not in top 5 */}
  {leaderboard.length > 0 && !leaderboard.find(s => s.id === user?.id) && (
    <div style={{
      marginTop: 12, padding: "10px 14px", borderRadius: 12,
      background: "rgba(45,106,79,0.06)",
      border: "1px dashed rgba(82,183,136,0.3)",
      display: "flex", alignItems: "center", gap: 8,
    }}>
      <span style={{ fontSize: 13, color: "#74C69D", fontWeight: 600 }}>
        📍 You're not in top 5 yet — keep going!
      </span>
    </div>
  )}
</GlassCard>
            </motion.div>

          </motion.div>
        </div>
      </div>


      {/* ─────── SUBMISSION MODAL ─────── */}
      {/*
        AnimatePresence: when showSubmitModal becomes false,
        the modal animates out (opacity → 0) before being removed from DOM.
      */}
      <AnimatePresence>
        {showSubmitModal && (
  <>
    {/* Overlay */}
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={() => setShowSubmitModal(false)}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        background: "rgba(0,0,0,0.4)",
        backdropFilter: "blur(4px)",
      }}
    />

    {/* Right Drawer */}
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        height: "100vh",
        width: "min(480px, 95vw)",
        zIndex: 201,
        background: "rgba(255,255,255,0.97)",
        backdropFilter: "blur(24px)",
        boxShadow: "-8px 0 40px rgba(27,67,50,0.2)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {submitSuccess ? (
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: 24,
          }}
        >
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 0.5 }}
            style={{ fontSize: 64, marginBottom: 16 }}
          >
            🎉
          </motion.div>

          <h3
            style={{
              color: "#1B4332",
              fontSize: 24,
              fontWeight: 800,
              marginBottom: 8,
            }}
          >
            Submitted!
          </h3>

          <p
            style={{
              color: "#5a8a6a",
              fontSize: 14,
            }}
          >
            Waiting for your teacher to approve it. Keep it up! 🌿
          </p>
        </motion.div>
      ) : (
        <>
          {/* Fixed Header */}
          <div
            style={{
              padding: "24px 28px 16px",
              borderBottom: "1px solid rgba(27,67,50,0.08)",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#74C69D",
                    textTransform: "uppercase",
                    letterSpacing: 1,
                  }}
                >
                  Submit Challenge
                </div>

                <h2
                  style={{
                    margin: "4px 0 0",
                    fontSize: 22,
                    fontWeight: 800,
                    color: "#1B4332",
                  }}
                >
                  {submitChallenge?.title}
                </h2>
              </div>

              <button
                onClick={() => setShowSubmitModal(false)}
                style={{
                  background: "rgba(0,0,0,0.06)",
                  border: "none",
                  borderRadius: 10,
                  width: 36,
                  height: 36,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <X size={18} color="#1B4332" />
              </button>
            </div>
          </div>

          {/* Scrollable Body */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "20px 28px",
            }}
          >
            {/* XP Reminder */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "rgba(116,198,157,0.12)",
                borderRadius: 10,
                padding: "10px 14px",
                marginBottom: 20,
              }}
            >
              <Award size={18} color="#52B788" />
              <span
                style={{
                  color: "#1B4332",
                  fontWeight: 700,
                  fontSize: 14,
                }}
              >
                Earn {submitChallenge?.points_reward} XP on approval
              </span>
            </div>

            {/* Note */}
            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  display: "block",
                  fontWeight: 700,
                  color: "#1B4332",
                  fontSize: 14,
                  marginBottom: 8,
                }}
              >
                Tell us what you did 📝
              </label>

              <textarea
                value={submitNote}
                onChange={(e) => setSubmitNote(e.target.value)}
                placeholder="I turned off the lights in every room before leaving..."
                rows={5}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: 12,
                  border: "2px solid rgba(27,67,50,0.15)",
                  background: "rgba(255,255,255,0.8)",
                  fontSize: 14,
                  color: "#1B4332",
                  resize: "vertical",
                  outline: "none",
                  fontFamily: "inherit",
                  boxSizing: "border-box",
                }}
                onFocus={(e) =>
                  (e.target.style.borderColor = "#52B788")
                }
                onBlur={(e) =>
                  (e.target.style.borderColor =
                    "rgba(27,67,50,0.15)")
                }
              />
            </div>

            {/* Image Upload */}
            <div style={{ marginBottom: 24 }}>
              <label
                style={{
                  display: "block",
                  fontWeight: 700,
                  color: "#1B4332",
                  fontSize: 14,
                  marginBottom: 8,
                }}
              >
                Add a photo (optional) 📷
              </label>

              {submitPreview ? (
                <div style={{ position: "relative" }}>
                  <img
                    src={submitPreview}
                    alt="Preview"
                    style={{
                      width: "100%",
                      borderRadius: 12,
                      maxHeight: 220,
                      objectFit: "cover",
                    }}
                  />

                  <button
                    onClick={() => {
                      setSubmitImage(null);
                      setSubmitPreview(null);
                    }}
                    style={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      background: "rgba(0,0,0,0.5)",
                      border: "none",
                      borderRadius: 8,
                      width: 28,
                      height: 28,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                    }}
                  >
                    <X size={14} color="#fff" />
                  </button>
                </div>
              ) : (
                <label
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 8,
                    padding: "24px 16px",
                    border: "2px dashed rgba(82,183,136,0.4)",
                    borderRadius: 12,
                    cursor: "pointer",
                    background: "rgba(116,198,157,0.04)",
                  }}
                >
                  <Camera size={28} color="#74C69D" />

                  <span
                    style={{
                      fontSize: 13,
                      color: "#74C69D",
                      fontWeight: 600,
                    }}
                  >
                    Click to upload a photo
                  </span>

                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    style={{ display: "none" }}
                  />
                </label>
              )}
            </div>
          </div>

          {/* Fixed Footer */}
          <div
            style={{
              padding: "16px 28px",
              borderTop: "1px solid rgba(27,67,50,0.08)",
              flexShrink: 0,
              background: "rgba(255,255,255,0.97)",
            }}
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSubmit}
              disabled={submitting || !submitNote.trim()}
              style={{
                width: "100%",
                padding: "14px",
                background:
                  submitting || !submitNote.trim()
                    ? "rgba(82,183,136,0.4)"
                    : "linear-gradient(135deg, #1B4332, #2D6A4F)",
                color: "#fff",
                border: "none",
                borderRadius: 14,
                fontWeight: 800,
                fontSize: 16,
                cursor:
                  submitting || !submitNote.trim()
                    ? "not-allowed"
                    : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                boxShadow: "0 4px 16px rgba(27,67,50,0.25)",
              }}
            >
              {submitting ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{
                    repeat: Infinity,
                    duration: 1,
                    ease: "linear",
                  }}
                >
                  <Leaf size={18} />
                </motion.div>
              ) : (
                <>
                  <CheckCircle size={18} />
                  Submit Challenge
                </>
              )}
            </motion.button>
          </div>
        </>
      )}
    </motion.div>
  </>
)}
      </AnimatePresence>
      {/* CHALLENGE DETAIL PANEL */}
<AnimatePresence>
  {selectedChallenge && (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={() => setSelectedChallenge(null)}
        style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
      />
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        style={{
          position: "fixed",
          top: 0, right: 0,
          height: "100vh",
          width: "min(460px, 95vw)",
          zIndex: 201,
          background: "rgba(255,255,255,0.97)",
          backdropFilter: "blur(24px)",
          boxShadow: "-8px 0 40px rgba(45,106,79,0.2)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div style={{
          padding: "24px 28px 16px",
          borderBottom: "1px solid rgba(45,106,79,0.08)",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#74C69D", textTransform: "uppercase", letterSpacing: 1 }}>
                Challenge Details
              </div>
              <h2 style={{ margin: "4px 0 0", fontSize: 20, fontWeight: 800, color: "#2D6A4F" }}>
                {selectedChallenge.title}
              </h2>
            </div>
            <button
              onClick={() => setSelectedChallenge(null)}
              style={{ background: "rgba(0,0,0,0.06)", border: "none", borderRadius: 10, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
            >
              <X size={18} color="#2D6A4F" />
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 28px" }}>

          {/* Reference image */}
          {selectedChallenge.reference_image_url && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#74C69D", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
                Reference Image
              </div>
              <img
                src={selectedChallenge.reference_image_url}
                alt="reference"
                style={{ width: "100%", borderRadius: 14, maxHeight: 220, objectFit: "cover" }}
              />
            </div>
          )}

          {/* Description */}
          <div style={{
            background: "rgba(45,106,79,0.06)", borderRadius: 12,
            padding: "14px 16px", marginBottom: 20,
            border: "1px solid rgba(45,106,79,0.1)",
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#74C69D", marginBottom: 6, textTransform: "uppercase" }}>
              What to do
            </div>
            <p style={{ margin: 0, color: "#2D6A4F", fontSize: 14, lineHeight: 1.6 }}>
              {selectedChallenge.description}
            </p>
          </div>

          {/* Details row */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "rgba(82,183,136,0.12)",
              borderRadius: 10, padding: "8px 14px",
            }}>
              <Star size={14} color="#52B788" fill="#52B788" />
              <span style={{ fontWeight: 800, color: "#2D6A4F", fontSize: 14 }}>
                {selectedChallenge.points_reward} XP
              </span>
            </div>
            <div style={{
              fontSize: 13, fontWeight: 700, padding: "8px 14px", borderRadius: 10,
              background: selectedChallenge.difficulty_level === 1 ? "#d4edda"
                       : selectedChallenge.difficulty_level === 2 ? "#fff3cd" : "#f8d7da",
              color: selectedChallenge.difficulty_level === 1 ? "#2D6A4F"
                   : selectedChallenge.difficulty_level === 2 ? "#856404" : "#721c24",
            }}>
              {selectedChallenge.difficulty_level === 1 ? "🟢 Easy"
             : selectedChallenge.difficulty_level === 2 ? "🟡 Medium" : "🔴 Hard"}
            </div>
            <div style={{
              fontSize: 13, fontWeight: 700, padding: "8px 14px", borderRadius: 10,
              background: "rgba(116,198,157,0.12)", color: "#2D6A4F",
            }}>
              📅 Due: {new Date(selectedChallenge.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </div>
          </div>
        </div>

        {/* Fixed footer */}
        <div style={{
          padding: "16px 28px",
          borderTop: "1px solid rgba(45,106,79,0.08)",
          flexShrink: 0,
          background: "rgba(255,255,255,0.97)",
        }}>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setSubmitChallenge(selectedChallenge)
              setSelectedChallenge(null)
              setShowSubmitModal(true)
            }}
            style={{
              width: "100%", padding: "14px",
              background: "linear-gradient(135deg, #2D6A4F, #52B788)",
              color: "#fff", border: "none", borderRadius: 14,
              fontWeight: 800, fontSize: 16, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              boxShadow: "0 4px 16px rgba(45,106,79,0.3)",
            }}
          >
            <Upload size={16} /> Submit This Challenge
          </motion.button>
        </div>
      </motion.div>
    </>
  )}
</AnimatePresence>

    </div>
  );
};

export default StudentDashboard;
