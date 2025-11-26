import { Routes, Route } from 'react-router-dom'
import { MantineProvider } from '@mantine/core'
import Home from './pages/Home'
import Footer from './components/Footer'
import './App.css'

function App() {
  return (
    <MantineProvider>
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
      <Footer />
    </MantineProvider>
  )
}

export default App
