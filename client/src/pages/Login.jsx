import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import loginBg from '../assets/login-bg.png'
const FloatingLeaf = ({ delay, startX, duration }) => (
  <motion.div
    style={{ left: `${startX}%`, top: '-40px', position: 'absolute', zIndex: 1 }}
    animate={{ y: ['0vh', '110vh'], x: [0, 15, -10, 5] }}
    transition={{ duration, delay, repeat: Infinity, ease: 'linear' }}
  >
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M12 2C6 2 2 8 2 14c0 4 2.5 7 6 8 0-4 1-8 4-10-2 3-2 7-2 10 3-1 6-4 6-8 2 1 3 3 3 5 1-2 1-4 1-6 0-6-4-11-8-11z" fill="#52B788" opacity="0.85"/>
    </svg>
  </motion.div>

)
export default function Login() {
  const navigate = useNavigate()
  const [isLogin, setIsLogin] = useState(true)
  const [role, setRole] = useState('student')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [teacherCode, setTeacherCode] = useState('')
  const [classCode, setClassCode] = useState('')
  const handleSignUp = async () => {
    setError('')
    setSuccess('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    // Teacher code validation
    if (role === 'teacher') {
      if (teacherCode !== import.meta.env.VITE_TEACHER_CODE) {
        setError('Invalid teacher code. Please contact your administrator.')
        return
      }
    }

    // Student must provide class code
    if (role === 'student' && !classCode.trim()) {
      setError('Please enter your class code provided by your teacher.')
      return
    }

    setLoading(true)

    // If student, verify class code exists
    let classId = null
    if (role === 'student') {
      const { data: classData, error: classError } = await supabase
        .from('classes')
        .select('id')
        .eq('class_code', classCode.trim().toUpperCase())
        .single()

      if (classError || !classData) {
        setError('Invalid class code. Please check with your teacher.')
        setLoading(false)
        return
      }
      classId = classData.id
    }

    // Create auth account
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    // Create profile row
    const { error: profileError } = await supabase.from('users').insert({
      id: data.user.id,
      full_name: fullName,
      email,
      role,
      class_id: classId,
    })

    if (profileError) {
      setError(profileError.message)
    } else {
      setSuccess('Account created! Please check your email to confirm.')
    }

    setLoading(false)
  }
  const handleLogin = async () => {
    setError('')
    setSuccess('')
    setLoading(true)

    const { data, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (loginError) {
      setError(loginError.message)
      setLoading(false)
      return
    }

    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('id', data.user.id)
      .single()

    if (profileError || !profile) {
      setError('Account profile not found. Please sign up again.')
      await supabase.auth.signOut()
      setLoading(false)
      return
    }

    if (profile.role !== role) {
      setError(`This account is not registered as a ${role}. Please select the correct role.`)
      await supabase.auth.signOut()
      setLoading(false)
      return
    }
    
    if (profile.role === 'student') {
      navigate('/student/dashboard')
    } else if (profile.role === 'teacher') {
      navigate('/teacher/dashboard')
    } else {
      setError('Unknown role. Please contact support.')
      await supabase.auth.signOut()
    }

    setLoading(false)
  }
  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>

      {/* Background image */}
      <img src={loginBg} alt="background" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }} />

      {/* Dark overlay for readability */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.15)', zIndex: 1 }} />

      {/* Floating leaves */}
      {[
        { delay: 0, startX: 10, duration: 8 },
        { delay: 1.5, startX: 25, duration: 11 },
        { delay: 3, startX: 40, duration: 9 },
        { delay: 0.5, startX: 55, duration: 13 },
        { delay: 2, startX: 68, duration: 7 },
        { delay: 4, startX: 78, duration: 10 },
        { delay: 1, startX: 88, duration: 12 },
        { delay: 3.5, startX: 95, duration: 8 },
      ].map((leaf, i) => (
        <FloatingLeaf key={i} {...leaf} />
      ))}

      {/* Centered glass card */}
      <div style={{ position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={isLogin ? 'login' : 'signup'}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            style={{
              background: 'rgba(255,255,255,0.13)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1px solid rgba(255,255,255,0.25)',
              borderRadius: '24px',
              padding: '2.5rem 2rem',
              width: '460px',
              maxWidth: '95vw',
              boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
              color: 'white',
              fontFamily: 'Nunito, sans-serif',
            }}
          >
            {/* App name */}
            <h1 style={{ textAlign: 'center', fontSize: '2rem', fontWeight: 800, marginBottom: '0.25rem' }}>🌿 Earthify</h1>
            <p style={{ textAlign: 'center', fontSize: '0.9rem', opacity: 0.85, marginBottom: '1.5rem' }}>Every small act saves the Earth</p>

            {/* Role selector */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '1.5rem' }}>
              {['student', 'teacher'].map((r) => (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  style={{
                    flex: 1, padding: '0.5rem', borderRadius: '999px', border: '1.5px solid rgba(255,255,255,0.6)', cursor: 'pointer', fontFamily: 'Nunito, sans-serif', fontWeight: 600, fontSize: '0.9rem', transition: 'all 0.2s',
                    background: role === r ? '#52B788' : 'transparent',
                    color: 'white',
                  }}
                >
                  {r === 'student' ? '🎒 Student' : '👩‍🏫 Teacher'}
                </button>
              ))}
            </div>

            {/* Signup only — full name */}
           {!isLogin && (
  <>
    <input
      placeholder="Full Name"
      value={fullName}
      onChange={(e) => setFullName(e.target.value)}
      style={inputStyle}
    />
    {role === 'teacher' && (
      <input
        placeholder="🔑 Teacher Code"
        value={teacherCode}
        onChange={(e) => setTeacherCode(e.target.value)}
        style={inputStyle}
      />
    )}
    {role === 'student' && (
      <input
        placeholder="🏫 Class Code (from your teacher)"
        value={classCode}
        onChange={(e) => setClassCode(e.target.value)}
        style={{ ...inputStyle, textTransform: 'uppercase' }}
      />
    )}
  </>
)}

            {/* Email & password */}
            <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
            <input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} />

            {/* Signup only — confirm password */}
            {!isLogin && (
              <input
                placeholder="Confirm Password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={inputStyle}
              />
            )}

            {/* Error / success messages */}
            {error && <p style={{ color: '#FFB3B3', fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem', textAlign: 'center' }}>{error}</p>}
            {success && <p style={{ color: '#B3FFD1', fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem', textAlign: 'center' }}>{success}</p>}

            {/* Submit button */}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={isLogin ? handleLogin : handleSignUp}
              disabled={loading}
              style={{
                width: '100%', padding: '0.75rem', borderRadius: '12px', border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                background: 'linear-gradient(135deg, #52B788, #2D6A4F)',
                color: 'white', fontWeight: 700, fontSize: '1rem', fontFamily: 'Nunito, sans-serif',
                opacity: loading ? 0.7 : 1, marginBottom: '1rem',
              }}
            >
              {loading ? '...' : isLogin ? 'Login' : 'Create Account'}
            </motion.button>

            {/* Toggle login/signup */}
            <p style={{ textAlign: 'center', fontSize: '0.85rem', opacity: 0.85 }}>
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
              <span
                onClick={() => { setIsLogin(!isLogin); setError(''); setSuccess('') }}
                style={{ color: '#74C69D', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
              >
                {isLogin ? 'Sign Up' : 'Login'}
              </span>
            </p>

          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
const inputStyle = {
  width: '100%',
  padding: '0.85rem 1rem',
  borderRadius: '12px',
  border: '1px solid rgba(255,255,255,0.35)',
  background: 'rgba(255,255,255,0.15)',
  color: 'white',
  fontFamily: 'Nunito, sans-serif',
  fontSize: '1.05rem',
  marginBottom: '1rem',
  outline: 'none',
}