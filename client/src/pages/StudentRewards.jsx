import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Star, Gift,  ArrowLeft, Leaf } from "lucide-react"
import { supabase } from "../lib/supabase"
import { useNavigate } from "react-router-dom"
const GlassCard = ({ children, style = {}, ...rest }) => (
  <div
    style={{
      background: "rgba(255,255,255,0.55)",
      backdropFilter: "blur(18px)",
      WebkitBackdropFilter: "blur(18px)",
      borderRadius: "20px",
      border: "1px solid rgba(255,255,255,0.75)",
      boxShadow: "0 8px 32px rgba(45,106,79,0.10)",
      padding: "24px",
      ...style,
    }}
    {...rest}
  >
    {children}
  </div>
)

const categoryEmoji = {
  voucher: "🛍️",
  gift: "🎁",
  certificate: "🏆",
  privilege: "🎮",
  eco: "🌱",
}

const categoryColor = {
  voucher: { bg: "rgba(74,144,217,0.1)", color: "#4A90D9" },
  gift: { bg: "rgba(155,89,182,0.1)", color: "#9B59B6" },
  certificate: { bg: "rgba(240,167,0,0.1)", color: "#f0a500" },
  privilege: { bg: "rgba(255,107,53,0.1)", color: "#FF6B35" },
  eco: { bg: "rgba(82,183,136,0.1)", color: "#52B788" },
}
export default function StudentRewards() {
  const [profile, setProfile] = useState(null)
  const [rewards, setRewards] = useState([])
  const [redemptions, setRedemptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [redeeming, setRedeeming] = useState(null)
  const [successReward, setSuccessReward] = useState(null)
  const [activeTab, setActiveTab] = useState("catalog")
  const navigate = useNavigate()
  const fetchData = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) { navigate("/login"); return }

      const { data: profileData } = await supabase
        .from("users")
        .select("*")
        .eq("id", authUser.id)
        .single()
      setProfile(profileData)

      const { data: classData } = await supabase
  .from("classes")
  .select("teacher_id")
  .eq("id", profileData?.class_id)
  .single()

      const { data: rewardsData } = await supabase
        .from("rewards")
        .select("*")
        .eq("is_active", true)
        .eq("created_by", classData?.teacher_id)
        .order("points_required", { ascending: true })
      setRewards(rewardsData || [])

      const { data: redemptionsData } = await supabase
        .from("redemptions")
        .select("*, rewards(title, category, points_required)")
        .eq("student_id", authUser.id)
        .order("redeemed_at", { ascending: false })
      setRedemptions(redemptionsData || [])

    } catch (err) {
      console.error("Rewards fetch error:", err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let isMounted = true
    const load = async () => { if (isMounted) await fetchData() }
    load()
    return () => { isMounted = false }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  const handleRedeem = async (reward) => {
    if (!profile) return
    if (profile.total_points < reward.points_required) return
    if (reward.quantity_available <= 0) return

    setRedeeming(reward.id)

    try {
      // Insert redemption record
      const { error: redeemErr } = await supabase
        .from("redemptions")
        .insert({
          student_id: profile.id,
          reward_id: reward.id,
          points_spent: reward.points_required,
        })
      if (redeemErr) throw redeemErr

      // Deduct points from student
      const { error: pointsErr } = await supabase
        .from("users")
        .update({ total_points: profile.total_points - reward.points_required })
        .eq("id", profile.id)
      if (pointsErr) throw pointsErr

      // Decrease quantity
      const { error: qtyErr } = await supabase
        .from("rewards")
        .update({ quantity_available: reward.quantity_available - 1 })
        .eq("id", reward.id)
      if (qtyErr) throw qtyErr

      setSuccessReward(reward)
      setTimeout(() => {
        setSuccessReward(null)
        fetchData()
      }, 2500)

    } catch (err) {
      console.error("Redeem error:", err.message)
      alert("Something went wrong. Try again.")
    } finally {
      setRedeeming(null)
    }
  }
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
  )

  const totalPoints = profile?.total_points || 0
  const firstName = profile?.full_name?.split(" ")[0] || "Student"
  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #e0f4ff 0%, #F8F4E3 40%, #d8f3e3 70%, #fff9e6 100%)",
      fontFamily: "'Nunito', sans-serif",
      overflowX: "hidden",
    }}>

      {/* Background blobs */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: -100, right: -100, width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(135,206,235,0.3) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", bottom: -100, left: -100, width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(116,198,157,0.2) 0%, transparent 70%)" }} />
      </div>

      {/* NAVBAR */}
      <motion.nav
        initial={{ opacity: 0, y: -40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{
          position: "sticky", top: 0, zIndex: 100,
          background: "rgba(255,255,255,0.85)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.8)",
          boxShadow: "0 2px 20px rgba(45,106,79,0.08)",
          padding: "0 32px", height: 64,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}
      >
        {/* Back button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate("/student/dashboard")}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            background: "rgba(45,106,79,0.08)",
            border: "none", borderRadius: 10,
            padding: "8px 16px", cursor: "pointer",
            color: "#2D6A4F", fontWeight: 700, fontSize: 14,
          }}
        >
          <ArrowLeft size={16} /> Dashboard
        </motion.button>

        {/* Title */}
        <span style={{
          fontSize: 20, fontWeight: 900,
          background: "linear-gradient(135deg, #2D6A4F, #52B788)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        }}>
          🎁 Rewards Store
        </span>

        {/* Points pill */}
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          background: "rgba(82,183,136,0.12)",
          borderRadius: 50, padding: "8px 16px",
        }}>
          <Star size={14} color="#52B788" fill="#52B788" />
          <span style={{ fontWeight: 800, color: "#2D6A4F", fontSize: 15 }}>
            {totalPoints} XP
          </span>
        </div>
      </motion.nav>

      {/* MAIN CONTENT */}
      <div style={{ position: "relative", zIndex: 1, maxWidth: 1100, margin: "0 auto", padding: "32px 24px 64px" }}>

        {/* Greeting */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          style={{ marginBottom: 32 }}
        >
          <div style={{ fontSize: 13, fontWeight: 700, color: "#74C69D", letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>
            🎁 Rewards Store
          </div>
          <h1 style={{ fontSize: "clamp(26px, 4vw, 40px)", fontWeight: 900, color: "#2D6A4F", margin: 0, letterSpacing: "-1px" }}>
            Spend your XP, {firstName}!
          </h1>
          <p style={{ color: "#5a8a6a", marginTop: 8, fontSize: 15, fontWeight: 500 }}>
            You have <strong style={{ color: "#2D6A4F" }}>{totalPoints} XP</strong> to spend on awesome rewards!
          </p>
        </motion.div>

        {/* TABS */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          style={{ marginBottom: 24 }}
        >
          <div style={{
            display: "flex", gap: 4,
            background: "rgba(255,255,255,0.6)",
            borderRadius: 14, padding: 4,
            border: "1px solid rgba(255,255,255,0.8)",
            width: "fit-content",
          }}>
            {["catalog", "history"].map((tab) => (
              <motion.button
                key={tab}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: "8px 20px", borderRadius: 10,
                  border: "none", cursor: "pointer",
                  fontWeight: 700, fontSize: 14,
                  background: activeTab === tab
                    ? "linear-gradient(135deg, #2D6A4F, #52B788)"
                    : "transparent",
                  color: activeTab === tab ? "#fff" : "#5a8a6a",
                  transition: "all 0.2s",
                }}
              >
                {tab === "catalog" ? "🎁 Catalog" : "🕐 My Redemptions"}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* TAB CONTENT */}
        <AnimatePresence mode="wait">

          {/* CATALOG TAB */}
          {activeTab === "catalog" && (
            <motion.div
              key="catalog"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3 }}
            >
              {rewards.length === 0 ? (
                <GlassCard style={{ textAlign: "center", padding: "48px" }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>🎁</div>
                  <p style={{ color: "#5a8a6a", fontWeight: 600, fontSize: 16 }}>
                    No rewards available yet. Check back soon!
                  </p>
                </GlassCard>
              ) : (
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                  gap: 20,
                }}>
                  {rewards.map((reward, i) => {
                    const canRedeem = totalPoints >= reward.points_required && reward.quantity_available > 0
                    const needMore = reward.points_required - totalPoints
                    const cat = categoryColor[reward.category] || categoryColor.eco
                    const emoji = categoryEmoji[reward.category] || "🎁"

                    return (
                      <motion.div
                        key={reward.id || i}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        whileHover={{ y: -4 }}
                      >
                        <GlassCard style={{ padding: 0, overflow: "hidden", height: "100%" }}>
                          {/* Card top colored band */}
                          <div style={{
                            background: `linear-gradient(135deg, ${cat.color}22, ${cat.color}11)`,
                            padding: "20px 20px 16px",
                            borderBottom: `1px solid ${cat.color}22`,
                          }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                              <div style={{
                                width: 48, height: 48, borderRadius: 14,
                                background: cat.bg,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: 24,
                              }}>
                                {emoji}
                              </div>
                              {/* Points cost badge */}
                              <div style={{
                                display: "flex", alignItems: "center", gap: 4,
                                background: "rgba(255,255,255,0.8)",
                                borderRadius: 10, padding: "6px 12px",
                                border: `1px solid ${cat.color}33`,
                              }}>
                                <Star size={13} color="#52B788" fill="#52B788" />
                                <span style={{ fontWeight: 900, color: "#2D6A4F", fontSize: 15 }}>
                                  {reward.points_required} XP
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Card body */}
                          <div style={{ padding: "16px 20px 20px" }}>
                            <h3 style={{ margin: "0 0 6px", fontSize: 17, fontWeight: 800, color: "#2D6A4F" }}>
                              {reward.title}
                            </h3>
                            <p style={{ margin: "0 0 16px", fontSize: 13, color: "#5a8a6a", lineHeight: 1.5 }}>
                              {reward.description}
                            </p>

                            {/* Quantity */}
                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}>
                              <span style={{
                                fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 6,
                                background: reward.quantity_available > 0 ? "rgba(82,183,136,0.12)" : "rgba(0,0,0,0.06)",
                                color: reward.quantity_available > 0 ? "#2D6A4F" : "#999",
                              }}>
                                {reward.quantity_available > 0 ? `${reward.quantity_available} available` : "Out of stock"}
                              </span>
                              <span style={{
                                fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 6,
                                background: cat.bg, color: cat.color,
                                textTransform: "capitalize",
                              }}>
                                {reward.category}
                              </span>
                            </div>

                            {/* Redeem button */}
                            <motion.button
                              whileHover={canRedeem ? { scale: 1.03 } : {}}
                              whileTap={canRedeem ? { scale: 0.97 } : {}}
                              onClick={() => canRedeem && handleRedeem(reward)}
                              disabled={!canRedeem || redeeming === reward.id}
                              style={{
                                width: "100%", padding: "11px",
                                background: canRedeem
                                  ? "linear-gradient(135deg, #2D6A4F, #52B788)"
                                  : "rgba(0,0,0,0.06)",
                                color: canRedeem ? "#fff" : "#999",
                                border: "none", borderRadius: 12,
                                fontWeight: 800, fontSize: 14,
                                cursor: canRedeem ? "pointer" : "not-allowed",
                                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                              }}
                            >
                              {redeeming === reward.id ? (
                                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                                  <Leaf size={16} />
                                </motion.div>
                              ) : canRedeem ? (
                                <><Gift size={15} /> Redeem Now</>
                              ) : reward.quantity_available <= 0 ? (
                                "Out of Stock"
                              ) : (
                                `Need ${needMore} more XP`
                              )}
                            </motion.button>
                          </div>
                        </GlassCard>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* HISTORY TAB */}
          {activeTab === "history" && (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3 }}
              style={{ display: "flex", flexDirection: "column", gap: 12 }}
            >
              {redemptions.length === 0 ? (
                <GlassCard style={{ textAlign: "center", padding: "48px" }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>🕐</div>
                  <p style={{ color: "#5a8a6a", fontWeight: 600 }}>No redemptions yet. Go spend your XP!</p>
                </GlassCard>
              ) : (
                redemptions.map((r, i) => {
                  const emoji = categoryEmoji[r.rewards?.category] || "🎁"
                  return (
                    <motion.div
                      key={r.id || i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.07 }}
                    >
                      <GlassCard style={{ padding: "16px 20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                          <div style={{
                            width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                            background: "rgba(82,183,136,0.1)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 22,
                          }}>
                            {emoji}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 800, color: "#2D6A4F", fontSize: 15 }}>
                              {r.rewards?.title || "Reward"}
                            </div>
                            <div style={{ fontSize: 12, color: "#74C69D", marginTop: 2 }}>
                              {new Date(r.redeemed_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                            </div>
                          </div>
                          <div style={{
                            display: "flex", alignItems: "center", gap: 4,
                            background: "rgba(224,85,85,0.1)",
                            borderRadius: 8, padding: "4px 12px",
                          }}>
                            <Star size={12} color="#e05555" fill="#e05555" />
                            <span style={{ fontWeight: 800, color: "#e05555", fontSize: 13 }}>
                              -{r.points_spent} XP
                            </span>
                          </div>
                          <div style={{
                            fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 6,
                            background: "rgba(82,183,136,0.12)", color: "#2D6A4F",
                          }}>
                            ✅ Redeemed
                          </div>
                        </div>
                      </GlassCard>
                    </motion.div>
                  )
                })
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* SUCCESS MODAL */}
      <AnimatePresence>
        {successReward && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              style={{
                position: "fixed", top: "50%", left: "50%",
                transform: "translate(-50%, -50%)",
                zIndex: 201, width: "min(380px, 90vw)",
                background: "rgba(255,255,255,0.97)",
                backdropFilter: "blur(24px)",
                borderRadius: 24, padding: "36px 28px",
                textAlign: "center",
                boxShadow: "0 24px 64px rgba(45,106,79,0.2)",
              }}
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.5 }}
                style={{ fontSize: 64, marginBottom: 16 }}
              >
                🎉
              </motion.div>
              <h3 style={{ color: "#2D6A4F", fontSize: 24, fontWeight: 900, margin: "0 0 8px" }}>
                Redeemed!
              </h3>
              <p style={{ color: "#5a8a6a", fontSize: 15, marginBottom: 16 }}>
                You just redeemed <strong style={{ color: "#2D6A4F" }}>{successReward.title}</strong>!
              </p>
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                background: "rgba(224,85,85,0.08)", borderRadius: 10, padding: "10px 16px",
              }}>
                <Star size={14} color="#e05555" fill="#e05555" />
                <span style={{ fontWeight: 800, color: "#e05555" }}>
                  -{successReward.points_required} XP deducted
                </span>
              </div>
              <p style={{ color: "#74C69D", fontSize: 13, marginTop: 12, fontWeight: 600 }}>
                Show this to your teacher to claim your reward! 🌿
              </p>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  )
}
