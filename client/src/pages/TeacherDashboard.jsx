import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Leaf, CheckCircle, XCircle, Clock,
  Plus, LogOut, Users, BookOpen, Star,
  Eye, TreePine, Upload, X,
  AlertCircle,Gift
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";


const fallIn = {
  hidden: { opacity: 0, y: -40 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};
const GlassCard = ({ children, className = "", style = {}, ...rest }) => (
  <div
    className={className}
    style={{
      background: "rgba(255,255,255,0.60)",
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      borderRadius: "20px",
      border: "1px solid rgba(255,255,255,0.80)",
      boxShadow: "0 8px 32px rgba(27,67,50,0.12), 0 2px 8px rgba(27,67,50,0.08)",
      padding: "24px",
      ...style,
    }}
    {...rest}
  >
    {children}
  </div>
);
const StatCard = ({ icon, label, value, color, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 40 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, delay }}
  >
    <GlassCard style={{ padding: "20px 24px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{
          width: 48, height: 48, borderRadius: 14, flexShrink: 0,
          background: `${color}22`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {icon}
        </div>
        <div>
          <div style={{ fontSize: 13, color: "#5a8a6a", fontWeight: 600 }}>{label}</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: "#1B4332", lineHeight: 1.1 }}>{value}</div>
        </div>
      </div>
    </GlassCard>
  </motion.div>
);
const TeacherDashboard = () => {
  const [profile,     setProfile]     = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [students,    setStudents]    = useState([]);
  const [challenges,  setChallenges]  = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [activeTab,   setActiveTab]   = useState("submissions");

  // Review modal state
  const [reviewModal,    setReviewModal]    = useState(false);
  const [selectedSub,    setSelectedSub]    = useState(null);
  const [pointsToAward,  setPointsToAward]  = useState("");
  const [reviewing,      setReviewing]      = useState(false);

  // Create challenge modal state
  const [createModal,    setCreateModal]    = useState(false);
  const [newTitle,       setNewTitle]       = useState("");
  const [newDesc,        setNewDesc]        = useState("");
  const [newPoints,      setNewPoints]      = useState("");
  const [newCategory,    setNewCategory]    = useState("nature");
  const [newDifficulty,  setNewDifficulty]  = useState(1);
  const [newImage,       setNewImage]       = useState(null);
  const [newImagePreview,setNewImagePreview]= useState(null);
  const [creating,       setCreating]       = useState(false);

  // Class code creation state 
  const [classModal, setClassModal] = useState(false)
  const [newClassName, setNewClassName] = useState('')
  const [creatingClass, setCreatingClass] = useState(false)
  const [myClasses, setMyClasses] = useState([])
  const [newDueDate, setNewDueDate] = useState('')

  const [rewards, setRewards] = useState([])
const [rewardModal, setRewardModal] = useState(false)
const [newRewardTitle, setNewRewardTitle] = useState("")
const [newRewardDesc, setNewRewardDesc] = useState("")
const [newRewardPoints, setNewRewardPoints] = useState("")
const [newRewardCategory, setNewRewardCategory] = useState("eco")
const [newRewardQty, setNewRewardQty] = useState("")
const [creatingReward, setCreatingReward] = useState(false)

  const navigate = useNavigate();
  const fetchData = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) { navigate("/login"); return; }

      const { data: profileData } = await supabase
        .from("users")
        .select("*")
        .eq("id", authUser.id)
        .single();
      setProfile(profileData);

      if (profileData?.role !== "teacher") {
        navigate("/login");
        return;
      }

      // Fetch all pending submissions with student + challenge info
      const { data: subData } = await supabase
        .from("submissions")
        .select("*, users(full_name, email), challenges(title, points_reward)")
        .order("submitted_at", { ascending: false });
      setSubmissions(subData || []);

      // Fetch all students with their points
     // Get teacher's classes first
const { data: teacherClasses } = await supabase
  .from("classes")
  .select("id")
  .eq("teacher_id", authUser.id);

const classIds = teacherClasses?.map(c => c.id) || [];


// Get only students in teacher's classes
const { data: studentData } = await supabase
  .from("users")
  .select("*")
  .eq("role", "student")
  .in("class_id", classIds.length > 0 ? classIds : ["none"])
  .order("total_points", { ascending: false });
  
setStudents(studentData || []);

      // Fetch all challenges
      const { data: challengeData } = await supabase
  .from("challenges")
  .select("*")
  .eq("created_by", authUser.id)
  .order("created_at", { ascending: false });
setChallenges(challengeData || []);
        // Add this inside fetchData after fetching challenges
const { data: classData } = await supabase
  .from('classes')
  .select('*')
  .eq('teacher_id', authUser.id)
setMyClasses(classData || [])

const { data: rewardsData } = await supabase
  .from("rewards")
  .select("*")
  .eq("created_by", authUser.id)
  .order("points_required", { ascending: true });
setRewards(rewardsData || []);

    } catch (err) {
      console.error("Teacher dashboard error:", err.message);
    } finally {
      setLoading(false);
    }
  

  };

  useEffect(() => {
    let isMounted = true;
    const load = async () => { if (isMounted) await fetchData(); };
    load();
    return () => { isMounted = false; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const handleReview = async (status) => {
    if (!selectedSub) return;
    setReviewing(true);

    try {
      const awarded = status === "approved" ? parseInt(pointsToAward) || 0 : 0;

      // Update submission status
      const { error: subErr } = await supabase
        .from("submissions")
        .update({ status, points_awarded: awarded })
        .eq("id", selectedSub.id);
      if (subErr) throw subErr;

      // If approved, add points to student + insert into points table
      if (status === "approved" && awarded > 0) {
        const { error: pointErr } = await supabase
          .from("points")
          .insert({
            student_id: selectedSub.student_id,
            submission_id: selectedSub.id,
            points: awarded,
          });
        if (pointErr) throw pointErr;

        // Update student's total_points
        const student = students.find(s => s.id === selectedSub.student_id);
        const newTotal = (student?.total_points || 0) + awarded;
        await supabase
          .from("users")
          .update({ total_points: newTotal })
          .eq("id", selectedSub.student_id);
          // After updating total_points, call streak function
await supabase.rpc('update_streak', { p_student_id: selectedSub.student_id })
      }

      setReviewModal(false);
      setSelectedSub(null);
      setPointsToAward("");
      await fetchData();

    } catch (err) {
      console.error("Review error:", err.message);
      alert("Something went wrong. Try again.");
    } finally {
      setReviewing(false);
    }
  };
  const handleCreateChallenge = async () => {
if (!newTitle.trim() || !newDesc.trim() || !newPoints || !newDueDate) return;    setCreating(true);

    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      let imageUrl = null;

      if (newImage) {
        const ext = newImage.name.split(".").pop().toLowerCase();
const safeName = `${Date.now()}.${ext === 'jfif' ? 'jpg' : ext}`;
        const path = `challenges/${safeName}`;
        const { error: uploadErr } = await supabase.storage
          .from("challenge-images")
          .upload(path, newImage);
        if (uploadErr) throw uploadErr;

        const { data: urlData } = supabase.storage
          .from("challenge-images")
          .getPublicUrl(path);
        imageUrl = urlData.publicUrl;
      }

      const { error: createErr } = await supabase
  .from("challenges")
  .insert({
    title: newTitle.trim(),
    description: newDesc.trim(),
    points_reward: parseInt(newPoints),
    category: newCategory,
    difficulty_level: newDifficulty,
    reference_image_url: imageUrl,
    created_by: authUser.id,
    is_active: true,
    due_date: newDueDate,
    class_id: myClasses[0]?.id || null,
  });
      if (createErr) throw createErr;

      setCreateModal(false);
      setNewTitle(""); setNewDesc(""); setNewPoints("");
      setNewCategory("nature"); setNewDifficulty(1);
      setNewImage(null); setNewImagePreview(null);
      setNewDueDate('');

      await fetchData();

    } catch (err) {
      console.error("Create error:", err.message);
      alert("Something went wrong. Try again.");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteChallenge = async (challengeId) => {
    if (!window.confirm("Hide this challenge from students?")) return

    try {
      const { error } = await supabase
        .from("challenges")
        .update({ is_active: false })
        .eq("id", challengeId)

      if (error) throw error
      await fetchData()
    } catch (err) {
      console.error("Delete error:", err.message)
      alert("Something went wrong. Try again.")
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };
  const generateClassCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let code = ''
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return code
  }

  const handleCreateClass = async () => {
    if (!newClassName.trim()) return
    setCreatingClass(true)

    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      const classCode = generateClassCode()

      const { error } = await supabase
        .from('classes')
        .insert({
          class_name: newClassName.trim(),
          class_code: classCode,
          teacher_id: authUser.id,
        })

      if (error) throw error

      setClassModal(false)
      setNewClassName('')
      await fetchData()

    } catch (err) {
      console.error('Create class error:', err.message)
      alert('Something went wrong. Try again.')
    } finally {
      setCreatingClass(false)
    }
  }
  const handleCreateReward = async () => {
    if (!newRewardTitle.trim() || !newRewardDesc.trim() || !newRewardPoints || !newRewardQty) return
    setCreatingReward(true)

    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()

      const { error } = await supabase
        .from("rewards")
        .insert({
          title: newRewardTitle.trim(),
          description: newRewardDesc.trim(),
          points_required: parseInt(newRewardPoints),
          quantity_available: parseInt(newRewardQty),
          category: newRewardCategory,
          created_by: authUser.id,
          is_active: true,
        })

      if (error) throw error

      setRewardModal(false)
      setNewRewardTitle("")
      setNewRewardDesc("")
      setNewRewardPoints("")
      setNewRewardQty("")
      setNewRewardCategory("eco")
      await fetchData()

    } catch (err) {
      console.error("Create reward error:", err.message)
      alert("Something went wrong. Try again.")
    } finally {
      setCreatingReward(false)
    }
  }

  const handleDeleteReward = async (rewardId) => {
    if (!window.confirm("Remove this reward from the catalog?")) return

    try {
      const { error } = await supabase
        .from("rewards")
        .update({ is_active: false })
        .eq("id", rewardId)

      if (error) throw error
      await fetchData()
    } catch (err) {
      console.error("Delete reward error:", err.message)
      alert("Something went wrong. Try again.")
    }
  }
  if (loading) return (
    <div style={{
      minHeight: "100vh", display: "flex",
      alignItems: "center", justifyContent: "center",
      background: "linear-gradient(135deg, #1B4332 0%, #2D6A4F 50%, #40916C 100%)",
    }}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
      >
        <Leaf size={48} color="#74C69D" />
      </motion.div>
    </div>
  );

  const firstName = profile?.full_name?.split(" ")[0] || "Teacher";
  const pendingCount = submissions.filter(s => s.status === "pending").length;
  const approvedCount = submissions.filter(s => s.status === "approved").length;
  const totalStudents = students.length;
  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #e8f5e9 0%, #f0f7f4 35%, #e0f2e9 70%, #f5f0e8 100%)",
      fontFamily: "'Nunito', 'Segoe UI', sans-serif",
      overflowX: "hidden",
    }}>

      {/* Background blobs */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{
          position: "absolute", top: -100, right: -100,
          width: 500, height: 500, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(27,67,50,0.12) 0%, transparent 70%)",
        }} />
        <div style={{
          position: "absolute", bottom: -100, left: -100,
          width: 400, height: 400, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(64,145,108,0.10) 0%, transparent 70%)",
        }} />
        <div style={{
          position: "absolute", top: "50%", right: "20%",
          width: 300, height: 300, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(240,167,0,0.07) 0%, transparent 70%)",
        }} />
      </div>

      {/* NAVBAR */}
      <motion.nav
        variants={fallIn} initial="hidden" animate="show"
        style={{
          position: "sticky", top: 0, zIndex: 100,
          background: "rgba(27,67,50,0.92)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(116,198,157,0.2)",
          boxShadow: "0 4px 24px rgba(27,67,50,0.25)",
          padding: "0 32px", height: 64,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ repeat: Infinity, duration: 4 }}
          >
            <TreePine size={28} color="#74C69D" />
          </motion.div>
          <span style={{
            fontSize: 22, fontWeight: 900,
            background: "linear-gradient(135deg, #74C69D, #52B788)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>Earthify</span>
          <span style={{
            fontSize: 11, fontWeight: 700, color: "#2D6A4F",
            background: "rgba(116,198,157,0.2)",
            borderRadius: 6, padding: "2px 8px",
          }}>Teacher</span>
        </div>

        {/* Right side */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {/* Pending badge */}
          {pendingCount > 0 && (
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                background: "rgba(240,167,0,0.2)",
                border: "1px solid rgba(240,167,0,0.4)",
                borderRadius: 50, padding: "6px 14px",
              }}
            >
              <AlertCircle size={14} color="#f0a500" />
              <span style={{ fontWeight: 800, color: "#f0a500", fontSize: 13 }}>
                {pendingCount} pending
              </span>
            </motion.div>
          )}

          {/* Avatar */}
          <div style={{
            width: 38, height: 38, borderRadius: "50%",
            background: "linear-gradient(135deg, #52B788, #74C69D)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#1B4332", fontWeight: 900, fontSize: 16,
          }}>
            {firstName[0].toUpperCase()}
          </div>

          <span style={{ color: "#74C69D", fontWeight: 700, fontSize: 14 }}>
            {firstName}
          </span>

          {/* Sign out */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSignOut}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "rgba(255,100,100,0.15)",
              border: "1px solid rgba(255,100,100,0.3)",
              borderRadius: 10, padding: "7px 14px", cursor: "pointer",
              color: "#ff8080", fontWeight: 700, fontSize: 13,
            }}
          >
            <LogOut size={14} /> Sign Out
          </motion.button>
        </div>
      </motion.nav>

      {/* MAIN CONTENT */}
      <div style={{ position: "relative", zIndex: 1, maxWidth: 1200, margin: "0 auto", padding: "32px 24px 64px" }}>

        {/* Greeting */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          style={{ marginBottom: 32 }}
        >
          <div style={{ fontSize: 13, fontWeight: 700, color: "#52B788", letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>
            👩‍🏫 Teacher Portal
          </div>
          <h1 style={{
            fontSize: "clamp(26px, 4vw, 40px)",
            fontWeight: 900, color: "#1B4332",
            margin: 0, lineHeight: 1.1, letterSpacing: "-1px",
          }}>
            Welcome, {firstName}! 🌿
          </h1>
          <p style={{ color: "#5a8a6a", marginTop: 8, fontSize: 15, fontWeight: 500 }}>
            Review submissions, manage challenges, and track your students.
          </p>
        </motion.div>

        {/* STAT CARDS ROW */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 16, marginBottom: 32,
        }}>
          <StatCard icon={<Clock size={22} color="#f0a500" />} label="Pending Reviews" value={pendingCount} color="#f0a500" delay={0.2} />
          <StatCard icon={<CheckCircle size={22} color="#52B788" />} label="Approved" value={approvedCount} color="#52B788" delay={0.4} />
          <StatCard icon={<Users size={22} color="#4A90D9" />} label="Total Students" value={totalStudents} color="#4A90D9" delay={0.6} />
          <StatCard icon={<BookOpen size={22} color="#9B59B6" />} label="Challenges" value={challenges.length} color="#9B59B6" delay={0.8} />
        </div>

        {/* TAB BAR + CREATE BUTTON */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.0 }}
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}
        >
          {/* Tabs */}
          <div style={{
            display: "flex", gap: 4,
            background: "rgba(255,255,255,0.6)",
            borderRadius: 14, padding: 4,
            border: "1px solid rgba(255,255,255,0.8)",
          }}>
            {["submissions", "students", "challenges", "classes", "rewards"].map((tab) => (
              <motion.button
                key={tab}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: "8px 20px", borderRadius: 10,
                  border: "none", cursor: "pointer",
                  fontWeight: 700, fontSize: 14,
                  background: activeTab === tab
                    ? "linear-gradient(135deg, #1B4332, #2D6A4F)"
                    : "transparent",
                  color: activeTab === tab ? "#fff" : "#5a8a6a",
                  transition: "all 0.2s", textTransform: "capitalize",
                }}
              >
                {tab === "submissions" ? `📋 Submissions ${pendingCount > 0 ? `(${pendingCount})` : ""}`
 : tab === "students" ? "👥 Students"
 : tab === "challenges" ? "🌿 Challenges"
 : tab === "rewards" ? "🎁 Rewards"
 : "🏫 Classes"
 }
              </motion.button>
            ))}
          </div>

          {/* Create challenge button */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setCreateModal(true)}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              background: "linear-gradient(135deg, #1B4332, #2D6A4F)",
              color: "#fff", border: "none", borderRadius: 12,
              padding: "10px 20px", cursor: "pointer",
              fontWeight: 800, fontSize: 14,
              boxShadow: "0 4px 16px rgba(27,67,50,0.3)",
            }}
          >
            <Plus size={16} /> New Challenge
          </motion.button>
        </motion.div>

        {/* TAB CONTENT */}
        <AnimatePresence mode="wait">

          {/* SUBMISSIONS TAB */}
          {activeTab === "submissions" && (
            <motion.div
              key="submissions"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3 }}
              style={{ display: "flex", flexDirection: "column", gap: 12 }}
            >
              {submissions.length === 0 ? (
                <GlassCard style={{ textAlign: "center", padding: "48px" }}>
                  <CheckCircle size={48} color="#74C69D" style={{ margin: "0 auto 16px", display: "block" }} />
                  <p style={{ color: "#5a8a6a", fontWeight: 600, fontSize: 16 }}>All caught up! No submissions yet.</p>
                </GlassCard>
              ) : (
                submissions.map((sub, i) => (
                  <motion.div
                    key={sub.id || i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                  >
                    <GlassCard style={{ padding: "16px 20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>

                        {/* Status dot */}
                        <div style={{
                          width: 12, height: 12, borderRadius: "50%", flexShrink: 0,
                          background: sub.status === "approved" ? "#52B788"
                                    : sub.status === "rejected" ? "#e05555" : "#f0a500",
                          boxShadow: sub.status === "pending" ? "0 0 8px rgba(240,165,0,0.6)" : "none",
                        }} />

                        {/* Student avatar */}
                        <div style={{
                          width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
                          background: "linear-gradient(135deg, #1B4332, #52B788)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          color: "#fff", fontWeight: 800, fontSize: 15,
                        }}>
                          {(sub.users?.full_name || "?")[0].toUpperCase()}
                        </div>

                        {/* Info */}
                        <div style={{ flex: 1, minWidth: 150 }}>
                          <div style={{ fontWeight: 800, color: "#1B4332", fontSize: 15 }}>
                            {sub.users?.full_name || "Student"}
                          </div>
                          <div style={{ fontSize: 13, color: "#5a8a6a", marginTop: 2 }}>
                            {sub.challenges?.title || "Challenge"} • {new Date(sub.submitted_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </div>
                        </div>

                        {/* Points awarded */}
                        {sub.status === "approved" && (
                          <div style={{
                            display: "flex", alignItems: "center", gap: 4,
                            background: "rgba(82,183,136,0.12)",
                            borderRadius: 8, padding: "4px 12px",
                          }}>
                            <Star size={13} color="#52B788" fill="#52B788" />
                            <span style={{ fontWeight: 800, color: "#2D6A4F", fontSize: 13 }}>
                              {sub.points_awarded} XP
                            </span>
                          </div>
                        )}

                        {/* Status chip */}
                        <span style={{
                          fontSize: 12, fontWeight: 700, borderRadius: 8, padding: "4px 12px",
                          background: sub.status === "approved" ? "#d4edda"
                                    : sub.status === "rejected" ? "#f8d7da" : "#fff3cd",
                          color: sub.status === "approved" ? "#1B4332"
                               : sub.status === "rejected" ? "#721c24" : "#856404",
                          textTransform: "capitalize",
                        }}>
                          {sub.status}
                        </span>

                        {/* Review button — only for pending */}
                        {sub.status === "pending" && (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => { setSelectedSub(sub); setReviewModal(true); }}
                            style={{
                              display: "flex", alignItems: "center", gap: 6,
                              background: "linear-gradient(135deg, #1B4332, #2D6A4F)",
                              color: "#fff", border: "none", borderRadius: 10,
                              padding: "8px 16px", cursor: "pointer",
                              fontWeight: 700, fontSize: 13,
                            }}
                          >
                            <Eye size={14} /> Review
                          </motion.button>
                        )}
                      </div>
                    </GlassCard>
                  </motion.div>
                ))
              )}
            </motion.div>
          )}

          {/* STUDENTS TAB */}
          {activeTab === "students" && (
            <motion.div
              key="students"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3 }}
              style={{ display: "flex", flexDirection: "column", gap: 12 }}
            >
              {students.length === 0 ? (
                <GlassCard style={{ textAlign: "center", padding: "48px" }}>
                  <Users size={48} color="#74C69D" style={{ margin: "0 auto 16px", display: "block" }} />
                  <p style={{ color: "#5a8a6a", fontWeight: 600 }}>No students registered yet.</p>
                </GlassCard>
              ) : (
                students.map((student, i) => (
                  <motion.div
                    key={student.id || i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                  >
                    <GlassCard style={{ padding: "16px 20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>

                        {/* Rank */}
                        <span style={{ fontSize: 20, width: 28, textAlign: "center" }}>
                          {["🥇","🥈","🥉"][i] || `${i+1}.`}
                        </span>

                        {/* Avatar */}
                        <div style={{
                          width: 42, height: 42, borderRadius: "50%", flexShrink: 0,
                          background: "linear-gradient(135deg, #1B4332, #52B788)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          color: "#fff", fontWeight: 800, fontSize: 16,
                        }}>
                          {(student.full_name || "?")[0].toUpperCase()}
                        </div>

                        {/* Name + email */}
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 800, color: "#1B4332", fontSize: 15 }}>
                            {student.full_name}
                          </div>
                          <div style={{ fontSize: 12, color: "#74C69D" }}>{student.email}</div>
                        </div>

                        {/* Streak */}
                        <div style={{
                          display: "flex", alignItems: "center", gap: 4,
                          background: "rgba(255,107,53,0.1)",
                          borderRadius: 8, padding: "4px 10px",
                        }}>
                          <span style={{ fontSize: 14 }}>🔥</span>
                          <span style={{ fontWeight: 700, color: "#FF6B35", fontSize: 13 }}>
                            {student.streak || 0}
                          </span>
                        </div>

                        {/* Points */}
                        <div style={{
                          display: "flex", alignItems: "center", gap: 4,
                          background: "rgba(82,183,136,0.12)",
                          borderRadius: 8, padding: "4px 12px",
                        }}>
                          <Star size={13} color="#52B788" fill="#52B788" />
                          <span style={{ fontWeight: 800, color: "#1B4332", fontSize: 14 }}>
                            {student.total_points || 0} XP
                          </span>
                        </div>

                        {/* Level */}
                        <div style={{
                          fontSize: 12, fontWeight: 700,
                          color: "#9B59B6",
                          background: "rgba(155,89,182,0.1)",
                          borderRadius: 8, padding: "4px 10px",
                        }}>
                          Lvl {Math.floor((student.total_points || 0) / 100) + 1}
                        </div>
                      </div>
                    </GlassCard>
                  </motion.div>
                ))
              )}
            </motion.div>
          )}

          {/* CHALLENGES TAB */}
          {activeTab === "challenges" && (
            <motion.div
              key="challenges"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3 }}
              style={{ display: "flex", flexDirection: "column", gap: 12 }}
            >
              {challenges.map((ch, i) => (
                <motion.div
                  key={ch.id || i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                >
                  <GlassCard style={{ padding: "16px 20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                        background: "linear-gradient(135deg, #1B433222, #2D6A4F22)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 22,
                      }}>
                        {ch.category === "water" ? "💧"
                        : ch.category === "energy" ? "⚡"
                        : ch.category === "waste" ? "♻️"
                        : "🌱"}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 800, color: "#1B4332", fontSize: 15 }}>{ch.title}</div>
                        <div style={{ fontSize: 12, color: "#5a8a6a", marginTop: 2 }}>{ch.description?.slice(0, 80)}...</div>
                      </div>
                      <div style={{
                        display: "flex", alignItems: "center", gap: 4,
                        background: "rgba(82,183,136,0.12)",
                        borderRadius: 8, padding: "4px 12px",
                      }}>
                        <Star size={13} color="#52B788" fill="#52B788" />
                        <span style={{ fontWeight: 800, color: "#1B4332", fontSize: 13 }}>{ch.points_reward} XP</span>
                      </div>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 6,
                        background: ch.difficulty_level === 1 ? "#d4edda" : ch.difficulty_level === 2 ? "#fff3cd" : "#f8d7da",
                        color: ch.difficulty_level === 1 ? "#1B4332" : ch.difficulty_level === 2 ? "#856404" : "#721c24",
                      }}>
                        {ch.difficulty_level === 1 ? "Easy" : ch.difficulty_level === 2 ? "Medium" : "Hard"}
                      </span>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 6,
                        background: ch.is_active ? "rgba(82,183,136,0.15)" : "rgba(0,0,0,0.06)",
                        color: ch.is_active ? "#1B4332" : "#999",
                      }}>
                        {ch.is_active ? "Active" : "Inactive"}
                      </span>
                      {/* Delete button */}
<motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
  onClick={() => handleDeleteChallenge(ch.id)}
  style={{
    display: "flex", alignItems: "center", gap: 4,
    background: "rgba(224,85,85,0.1)",
    border: "1px solid rgba(224,85,85,0.2)",
    borderRadius: 8, padding: "4px 10px",
    cursor: "pointer", color: "#e05555",
    fontWeight: 700, fontSize: 12,
  }}
>
  <X size={12} /> Hide
</motion.button>
                    </div>
                    
                  </GlassCard>
                </motion.div>
              ))}
            </motion.div>
          )}
          {/* CLASSES TAB */}
{activeTab === "classes" && (
  <motion.div
    key="classes"
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -16 }}
    transition={{ duration: 0.3 }}
    style={{ display: "flex", flexDirection: "column", gap: 12 }}
  >
    {/* Create class button */}
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setClassModal(true)}
        style={{
          display: "flex", alignItems: "center", gap: 8,
          background: "linear-gradient(135deg, #1B4332, #2D6A4F)",
          color: "#fff", border: "none", borderRadius: 12,
          padding: "12px 20px", cursor: "pointer",
          fontWeight: 800, fontSize: 14, marginBottom: 8,
          boxShadow: "0 4px 16px rgba(27,67,50,0.3)",
        }}
      >
        <Plus size={16} /> Create New Class
      </motion.button>
    </motion.div>

    {myClasses.length === 0 ? (
      <GlassCard style={{ textAlign: "center", padding: "48px" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🏫</div>
        <p style={{ color: "#5a8a6a", fontWeight: 600, fontSize: 16 }}>
          No classes yet. Create your first class!
        </p>
      </GlassCard>
    ) : (
      myClasses.map((cls, i) => (
        <motion.div
          key={cls.id || i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.07 }}
        >
          <GlassCard style={{ padding: "20px 24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14, flexShrink: 0,
                background: "linear-gradient(135deg, #1B433222, #2D6A4F22)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 24,
              }}>🏫</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, color: "#1B4332", fontSize: 16 }}>
                  {cls.class_name}
                </div>
                <div style={{ fontSize: 13, color: "#5a8a6a", marginTop: 2 }}>
                  Created {new Date(cls.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </div>
              </div>
              {/* Class code badge */}
              <div style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                background: "linear-gradient(135deg, #1B4332, #2D6A4F)",
                borderRadius: 12, padding: "10px 16px",
              }}>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.7)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>
                  Class Code
                </div>
                <div style={{ fontSize: 20, fontWeight: 900, color: "#fff", letterSpacing: 3 }}>
                  {cls.class_code}
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      ))
    )}
  </motion.div>
)}
{/* REWARDS TAB */}
{activeTab === "rewards" && (
  <motion.div
    key="rewards"
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -16 }}
    transition={{ duration: 0.3 }}
    style={{ display: "flex", flexDirection: "column", gap: 12 }}
  >
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setRewardModal(true)}
        style={{
          display: "flex", alignItems: "center", gap: 8,
          background: "linear-gradient(135deg, #1B4332, #2D6A4F)",
          color: "#fff", border: "none", borderRadius: 12,
          padding: "12px 20px", cursor: "pointer",
          fontWeight: 800, fontSize: 14, marginBottom: 8,
          boxShadow: "0 4px 16px rgba(27,67,50,0.3)",
        }}
      >
        <Plus size={16} /> Add New Reward
      </motion.button>
    </motion.div>

    {rewards.length === 0 ? (
      <GlassCard style={{ textAlign: "center", padding: "48px" }}>
        <Gift size={48} color="#74C69D" style={{ margin: "0 auto 16px", display: "block" }} />
        <p style={{ color: "#5a8a6a", fontWeight: 600, fontSize: 16 }}>
          No rewards yet. Add your first reward!
        </p>
      </GlassCard>
    ) : (
      rewards.map((reward, i) => (
        <motion.div
          key={reward.id || i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.07 }}
        >
          <GlassCard style={{ padding: "16px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                background: "linear-gradient(135deg, #1B433222, #2D6A4F22)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 22,
              }}>
                {reward.category === "voucher" ? "🛍️"
               : reward.category === "gift" ? "🎁"
               : reward.category === "certificate" ? "🏆"
               : reward.category === "privilege" ? "🎮"
               : "🌱"}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, color: "#1B4332", fontSize: 15 }}>{reward.title}</div>
                <div style={{ fontSize: 12, color: "#5a8a6a", marginTop: 2 }}>{reward.description}</div>
              </div>
              <div style={{
                display: "flex", alignItems: "center", gap: 4,
                background: "rgba(82,183,136,0.12)",
                borderRadius: 8, padding: "4px 12px",
              }}>
                <Star size={13} color="#52B788" fill="#52B788" />
                <span style={{ fontWeight: 800, color: "#1B4332", fontSize: 13 }}>{reward.points_required} XP</span>
              </div>
              <span style={{
                fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 6,
                background: reward.quantity_available > 0 ? "rgba(82,183,136,0.15)" : "rgba(0,0,0,0.06)",
                color: reward.quantity_available > 0 ? "#1B4332" : "#999",
              }}>
                {reward.quantity_available} left
              </span>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleDeleteReward(reward.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 4,
                  background: "rgba(224,85,85,0.1)",
                  border: "1px solid rgba(224,85,85,0.2)",
                  borderRadius: 8, padding: "4px 10px",
                  cursor: "pointer", color: "#e05555",
                  fontWeight: 700, fontSize: 12,
                }}
              >
                <X size={12} /> Remove
              </motion.button>
            </div>
          </GlassCard>
        </motion.div>
      ))
    )}
  </motion.div>
)}

        </AnimatePresence>
      </div>

      {/* REVIEW MODAL */}
      <AnimatePresence>
        {reviewModal && selectedSub && (
  <>
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={() => setReviewModal(false)}
      style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
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
      {/* Fixed header */}
      <div style={{
        padding: "24px 28px 16px",
        borderBottom: "1px solid rgba(27,67,50,0.08)",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#74C69D", textTransform: "uppercase", letterSpacing: 1 }}>
              Reviewing Submission
            </div>
            <h2 style={{ margin: "4px 0 0", fontSize: 20, fontWeight: 800, color: "#1B4332" }}>
              {selectedSub.challenges?.title}
            </h2>
            <div style={{ fontSize: 13, color: "#5a8a6a", marginTop: 4 }}>
              by {selectedSub.users?.full_name}
            </div>
          </div>
          <button
            onClick={() => setReviewModal(false)}
            style={{ background: "rgba(0,0,0,0.06)", border: "none", borderRadius: 10, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
          >
            <X size={18} color="#1B4332" />
          </button>
        </div>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 28px" }}>

        {/* Submission image */}
        {selectedSub.image_url && (
          <img
            src={selectedSub.image_url}
            alt="submission"
            
            style={{ width: "100%", borderRadius: 14, maxHeight: 220, objectFit: "cover", marginBottom: 16 }}
          />
          
        )}

        {/* Student's description */}
        <div style={{
          background: "rgba(45,106,79,0.06)", borderRadius: 12,
          padding: "14px 16px", marginBottom: 20,
          border: "1px solid rgba(45,106,79,0.1)",
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#74C69D", marginBottom: 6, textTransform: "uppercase" }}>
            Student's Note
          </div>
          <p style={{ margin: 0, color: "#1B4332", fontSize: 14, lineHeight: 1.6 }}>
            {selectedSub.description || selectedSub.notes || "No note provided."}
          </p>
        </div>

        {/* Points input */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", fontWeight: 700, color: "#1B4332", fontSize: 14, marginBottom: 8 }}>
            Points to award (max: {selectedSub.challenges?.points_reward})
          </label>
          <input
            type="number"
            value={pointsToAward}
            onChange={(e) => setPointsToAward(e.target.value)}
            placeholder={`0 – ${selectedSub.challenges?.points_reward}`}
            max={selectedSub.challenges?.points_reward}
            min={0}
            style={{
              width: "100%", padding: "12px 14px",
              borderRadius: 12, border: "2px solid rgba(27,67,50,0.15)",
              background: "rgba(255,255,255,0.8)",
              fontSize: 16, color: "#1B4332", outline: "none",
              fontFamily: "inherit", boxSizing: "border-box",
            }}
            onFocus={(e) => e.target.style.borderColor = "#52B788"}
            onBlur={(e) => e.target.style.borderColor = "rgba(27,67,50,0.15)"}
          />
        </div>
      </div>

      {/* Fixed footer with action buttons */}
      <div style={{
        padding: "16px 28px",
        borderTop: "1px solid rgba(27,67,50,0.08)",
        flexShrink: 0,
        background: "rgba(255,255,255,0.97)",
        display: "flex", gap: 12,
      }}>
        <motion.button
          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          onClick={() => handleReview("approved")}
          disabled={reviewing}
          style={{
            flex: 1, padding: "13px",
            background: "linear-gradient(135deg, #1B4332, #2D6A4F)",
            color: "#fff", border: "none", borderRadius: 12,
            fontWeight: 800, fontSize: 15,
            cursor: reviewing ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            opacity: reviewing ? 0.7 : 1,
          }}
        >
          <CheckCircle size={16} /> Approve
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          onClick={() => handleReview("rejected")}
          disabled={reviewing}
          style={{
            flex: 1, padding: "13px",
            background: "rgba(224,85,85,0.1)",
            border: "2px solid rgba(224,85,85,0.3)",
            color: "#e05555", borderRadius: 12,
            fontWeight: 800, fontSize: 15,
            cursor: reviewing ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            opacity: reviewing ? 0.7 : 1,
          }}
        >
          <XCircle size={16} /> Reject
        </motion.button>
      </div>
    </motion.div>
  </>
)}
      </AnimatePresence>

      {/* CREATE CHALLENGE MODAL */}
      <AnimatePresence>
       {createModal && (
  <>
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={() => setCreateModal(false)}
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: "rgba(0,0,0,0.4)",
        backdropFilter: "blur(4px)",
      }}
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
      {/* Fixed header */}
      <div style={{
        padding: "24px 28px 16px",
        borderBottom: "1px solid rgba(27,67,50,0.08)",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#74C69D", textTransform: "uppercase", letterSpacing: 1 }}>
              Create New
            </div>
            <h2 style={{ margin: "4px 0 0", fontSize: 22, fontWeight: 800, color: "#1B4332" }}>
              🌿 New Challenge
            </h2>
          </div>
          <button
            onClick={() => setCreateModal(false)}
            style={{
              background: "rgba(0,0,0,0.06)", border: "none",
              borderRadius: 10, width: 36, height: 36,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <X size={18} color="#1B4332" />
          </button>
        </div>
      </div>

      {/* Scrollable content */}
      <div style={{
        flex: 1,
        overflowY: "auto",
        padding: "20px 28px",
      }}>
        {/* Title */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontWeight: 700, color: "#1B4332", fontSize: 14, marginBottom: 8 }}>
            Challenge Title
          </label>
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="e.g. Plant a Tree Today"
            style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "2px solid rgba(27,67,50,0.15)", background: "rgba(255,255,255,0.8)", fontSize: 14, color: "#1B4332", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
            onFocus={(e) => e.target.style.borderColor = "#52B788"}
            onBlur={(e) => e.target.style.borderColor = "rgba(27,67,50,0.15)"}
          />
        </div>

        {/* Description */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontWeight: 700, color: "#1B4332", fontSize: 14, marginBottom: 8 }}>
            Description
          </label>
          <textarea
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            placeholder="Describe what students need to do..."
            rows={3}
            style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "2px solid rgba(27,67,50,0.15)", background: "rgba(255,255,255,0.8)", fontSize: 14, color: "#1B4332", outline: "none", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }}
            onFocus={(e) => e.target.style.borderColor = "#52B788"}
            onBlur={(e) => e.target.style.borderColor = "rgba(27,67,50,0.15)"}
          />
        </div>

        {/* Points + Category + Difficulty */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
          <div>
            <label style={{ display: "block", fontWeight: 700, color: "#1B4332", fontSize: 13, marginBottom: 8 }}>Points</label>
            <input
              type="number" value={newPoints}
              onChange={(e) => setNewPoints(e.target.value)}
              placeholder="20"
              style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "2px solid rgba(27,67,50,0.15)", background: "rgba(255,255,255,0.8)", fontSize: 14, color: "#1B4332", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
              onFocus={(e) => e.target.style.borderColor = "#52B788"}
              onBlur={(e) => e.target.style.borderColor = "rgba(27,67,50,0.15)"}
            />
          </div>
          <div>
            <label style={{ display: "block", fontWeight: 700, color: "#1B4332", fontSize: 13, marginBottom: 8 }}>Category</label>
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "2px solid rgba(27,67,50,0.15)", background: "rgba(255,255,255,0.8)", fontSize: 14, color: "#1B4332", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
            >
              <option value="nature">🌳 Nature</option>
              <option value="water">💧 Water</option>
              <option value="energy">⚡ Energy</option>
              <option value="waste">♻️ Waste</option>
            </select>
          </div>
          <div>
            <label style={{ display: "block", fontWeight: 700, color: "#1B4332", fontSize: 13, marginBottom: 8 }}>Difficulty</label>
            <select
              value={newDifficulty}
              onChange={(e) => setNewDifficulty(parseInt(e.target.value))}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "2px solid rgba(27,67,50,0.15)", background: "rgba(255,255,255,0.8)", fontSize: 14, color: "#1B4332", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
            >
              <option value={1}>Easy</option>
              <option value={2}>Medium</option>
              <option value={3}>Hard</option>
            </select>
          </div>
        </div>
        {/* Due Date */}
<div style={{ marginBottom: 16 }}>
  <label style={{ display: "block", fontWeight: 700, color: "#1B4332", fontSize: 14, marginBottom: 8 }}>
    Due Date
  </label>
  <input
    type="date"
    value={newDueDate}
    onChange={(e) => setNewDueDate(e.target.value)}
    min={new Date().toISOString().split('T')[0]}
    style={{
      width: "100%", padding: "12px 14px",
      borderRadius: 12, border: "2px solid rgba(27,67,50,0.15)",
      background: "rgba(255,255,255,0.8)",
      fontSize: 14, color: "#1B4332", outline: "none",
      fontFamily: "inherit", boxSizing: "border-box"
    }}
    onFocus={(e) => e.target.style.borderColor = "#52B788"}
    onBlur={(e) => e.target.style.borderColor = "rgba(27,67,50,0.15)"}
  />
</div>

        {/* Reference image */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: "block", fontWeight: 700, color: "#1B4332", fontSize: 14, marginBottom: 8 }}>
            Reference Image (optional)
          </label>
          {newImagePreview ? (
            <div style={{ position: "relative" }}>
              <img src={newImagePreview} alt="preview" style={{ width: "100%", borderRadius: 12, maxHeight: 160, objectFit: "cover" }} />
              <button
                onClick={() => { setNewImage(null); setNewImagePreview(null); }}
                style={{ position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,0.5)", border: "none", borderRadius: 8, width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
              >
                <X size={14} color="#fff" />
              </button>
            </div>
          ) : (
            <label style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "20px", border: "2px dashed rgba(82,183,136,0.4)", borderRadius: 12, cursor: "pointer", background: "rgba(116,198,157,0.04)" }}>
              <Upload size={24} color="#74C69D" />
              <span style={{ fontSize: 13, color: "#74C69D", fontWeight: 600 }}>Click to upload reference image</span>
              <input
                type="file" accept="image/*"
                onChange={(e) => { const f = e.target.files[0]; if(f){ setNewImage(f); setNewImagePreview(URL.createObjectURL(f)); }}}
                style={{ display: "none" }}
              />
            </label>
          )}
        </div>
      </div>

      {/* Fixed footer with button */}
      <div style={{
        padding: "16px 28px",
        borderTop: "1px solid rgba(27,67,50,0.08)",
        flexShrink: 0,
        background: "rgba(255,255,255,0.97)",
      }}>
        <motion.button
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={handleCreateChallenge}
          disabled={creating || !newTitle.trim() || !newDesc.trim() || !newPoints}
          style={{
            width: "100%", padding: "14px",
            background: creating || !newTitle.trim() || !newDesc.trim() || !newPoints
              ? "rgba(45,106,79,0.3)"
              : "linear-gradient(135deg, #1B4332, #2D6A4F)",
            color: "#fff", border: "none", borderRadius: 14,
            fontWeight: 800, fontSize: 16,
            cursor: creating || !newTitle.trim() || !newDesc.trim() || !newPoints ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            boxShadow: "0 4px 16px rgba(27,67,50,0.25)",
          }}
        >
          {creating ? (
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
              <Leaf size={18} />
            </motion.div>
          ) : (
            <><Plus size={18} /> Create Challenge</>
          )}
        </motion.button>
      </div>
    </motion.div>
  </>
)}
{/* CREATE CLASS MODAL */}
<AnimatePresence>
  {classModal && (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={() => setClassModal(false)}
        style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.85, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.85, y: 40 }}
        transition={{ type: "spring", stiffness: 300, damping: 26 }}
        style={{
          position: "fixed", top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 201, width: "min(420px, 92vw)",
          background: "rgba(255,255,255,0.95)",
          backdropFilter: "blur(24px)",
          borderRadius: 24, padding: 28,
          boxShadow: "0 24px 64px rgba(27,67,50,0.2)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#1B4332" }}>
            🏫 Create Class
          </h2>
          <button
            onClick={() => setClassModal(false)}
            style={{ background: "rgba(0,0,0,0.06)", border: "none", borderRadius: 10, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
          >
            <X size={18} color="#1B4332" />
          </button>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", fontWeight: 700, color: "#1B4332", fontSize: 14, marginBottom: 8 }}>
            Class Name
          </label>
          <input
            value={newClassName}
            onChange={(e) => setNewClassName(e.target.value)}
            placeholder="e.g. Grade 5 - Green Heroes"
            style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "2px solid rgba(27,67,50,0.15)", background: "rgba(255,255,255,0.8)", fontSize: 14, color: "#1B4332", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
            onFocus={(e) => e.target.style.borderColor = "#52B788"}
            onBlur={(e) => e.target.style.borderColor = "rgba(27,67,50,0.15)"}
          />
        </div>

        <div style={{
          background: "rgba(116,198,157,0.1)", borderRadius: 12,
          padding: "12px 16px", marginBottom: 20,
          border: "1px solid rgba(82,183,136,0.2)",
        }}>
          <div style={{ fontSize: 13, color: "#2D6A4F", fontWeight: 600 }}>
            💡 A unique 6-character class code will be automatically generated. Share it with your students so they can join your class when signing up.
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={handleCreateClass}
          disabled={creatingClass || !newClassName.trim()}
          style={{
            width: "100%", padding: "14px",
            background: creatingClass || !newClassName.trim()
              ? "rgba(45,106,79,0.3)"
              : "linear-gradient(135deg, #1B4332, #2D6A4F)",
            color: "#fff", border: "none", borderRadius: 14,
            fontWeight: 800, fontSize: 16,
            cursor: creatingClass || !newClassName.trim() ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}
        >
          {creatingClass ? (
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
              <Leaf size={18} />
            </motion.div>
          ) : (
            <><Plus size={16} /> Create Class</>
          )}
        </motion.button>
      </motion.div>
    </>
  )}
</AnimatePresence>
      </AnimatePresence>
      {/* CREATE REWARD MODAL */}
<AnimatePresence>
  {rewardModal && (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={() => setRewardModal(false)}
        style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
      />
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        style={{
          position: "fixed", top: 0, right: 0,
          height: "100vh", width: "min(440px, 95vw)",
          zIndex: 201,
          background: "rgba(255,255,255,0.97)",
          backdropFilter: "blur(24px)",
          boxShadow: "-8px 0 40px rgba(27,67,50,0.2)",
          display: "flex", flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div style={{ padding: "24px 28px 16px", borderBottom: "1px solid rgba(27,67,50,0.08)", flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#1B4332" }}>
              🎁 New Reward
            </h2>
            <button
              onClick={() => setRewardModal(false)}
              style={{ background: "rgba(0,0,0,0.06)", border: "none", borderRadius: 10, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
            >
              <X size={18} color="#1B4332" />
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 28px" }}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontWeight: 700, color: "#1B4332", fontSize: 14, marginBottom: 8 }}>
              Reward Title
            </label>
            <input
              value={newRewardTitle}
              onChange={(e) => setNewRewardTitle(e.target.value)}
              placeholder="e.g. Eco Champion Certificate"
              style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "2px solid rgba(27,67,50,0.15)", background: "rgba(255,255,255,0.8)", fontSize: 14, color: "#1B4332", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
              onFocus={(e) => e.target.style.borderColor = "#52B788"}
              onBlur={(e) => e.target.style.borderColor = "rgba(27,67,50,0.15)"}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontWeight: 700, color: "#1B4332", fontSize: 14, marginBottom: 8 }}>
              Description
            </label>
            <textarea
              value={newRewardDesc}
              onChange={(e) => setNewRewardDesc(e.target.value)}
              placeholder="Describe the reward..."
              rows={3}
              style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "2px solid rgba(27,67,50,0.15)", background: "rgba(255,255,255,0.8)", fontSize: 14, color: "#1B4332", outline: "none", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }}
              onFocus={(e) => e.target.style.borderColor = "#52B788"}
              onBlur={(e) => e.target.style.borderColor = "rgba(27,67,50,0.15)"}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
            <div>
              <label style={{ display: "block", fontWeight: 700, color: "#1B4332", fontSize: 13, marginBottom: 8 }}>Points Required</label>
              <input
                type="number" value={newRewardPoints}
                onChange={(e) => setNewRewardPoints(e.target.value)}
                placeholder="50"
                style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "2px solid rgba(27,67,50,0.15)", background: "rgba(255,255,255,0.8)", fontSize: 14, color: "#1B4332", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
                onFocus={(e) => e.target.style.borderColor = "#52B788"}
                onBlur={(e) => e.target.style.borderColor = "rgba(27,67,50,0.15)"}
              />
            </div>
            <div>
              <label style={{ display: "block", fontWeight: 700, color: "#1B4332", fontSize: 13, marginBottom: 8 }}>Quantity Available</label>
              <input
                type="number" value={newRewardQty}
                onChange={(e) => setNewRewardQty(e.target.value)}
                placeholder="10"
                style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "2px solid rgba(27,67,50,0.15)", background: "rgba(255,255,255,0.8)", fontSize: 14, color: "#1B4332", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
                onFocus={(e) => e.target.style.borderColor = "#52B788"}
                onBlur={(e) => e.target.style.borderColor = "rgba(27,67,50,0.15)"}
              />
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontWeight: 700, color: "#1B4332", fontSize: 13, marginBottom: 8 }}>Category</label>
            <select
              value={newRewardCategory}
              onChange={(e) => setNewRewardCategory(e.target.value)}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "2px solid rgba(27,67,50,0.15)", background: "rgba(255,255,255,0.8)", fontSize: 14, color: "#1B4332", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
            >
              <option value="eco">🌱 Eco Reward</option>
              <option value="certificate">🏆 Certificate</option>
              <option value="privilege">🎮 Privilege</option>
              <option value="gift">🎁 Physical Gift</option>
              <option value="voucher">🛍️ Voucher</option>
            </select>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: "16px 28px", borderTop: "1px solid rgba(27,67,50,0.08)", flexShrink: 0, background: "rgba(255,255,255,0.97)" }}>
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={handleCreateReward}
            disabled={creatingReward || !newRewardTitle.trim() || !newRewardDesc.trim() || !newRewardPoints || !newRewardQty}
            style={{
              width: "100%", padding: "14px",
              background: creatingReward || !newRewardTitle.trim() || !newRewardDesc.trim() || !newRewardPoints || !newRewardQty
                ? "rgba(45,106,79,0.3)"
                : "linear-gradient(135deg, #1B4332, #2D6A4F)",
              color: "#fff", border: "none", borderRadius: 14,
              fontWeight: 800, fontSize: 16,
              cursor: creatingReward || !newRewardTitle.trim() || !newRewardDesc.trim() || !newRewardPoints || !newRewardQty ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}
          >
            {creatingReward ? (
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                <Leaf size={18} />
              </motion.div>
            ) : (
              <><Plus size={16} /> Add Reward</>
            )}
          </motion.button>
        </div>
      </motion.div>
    </>
  )}
</AnimatePresence>

    </div>
  );
};

export default TeacherDashboard;