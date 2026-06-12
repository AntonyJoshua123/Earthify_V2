import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import StudentDashboard from './pages/StudentDashboard'
import TeacherDashboard from './pages/TeacherDashboard'
import StudentRewards from './pages/StudentRewards'


function App() {
  return (
    <BrowserRouter>
      
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/student/dashboard" element={<StudentDashboard />} />
        <Route path="/student/rewards" element={<StudentRewards />} />
        <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
        
      </Routes>
    </BrowserRouter>
  )
}

export default App