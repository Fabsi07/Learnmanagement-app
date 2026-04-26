import { BrowserRouter, Routes, Route } from 'react-router-dom'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<div>Dashboard</div>} />
        <Route path="/calendar" element={<div>Kalender</div>} />
        <Route path="/study-plan" element={<div>Lernplan</div>} />
      </Routes>
    </BrowserRouter>
  )
}
