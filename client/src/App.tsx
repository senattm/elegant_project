import { Routes, Route } from 'react-router-dom'
import { MantineProvider } from '@mantine/core'
import Home from './pages/Home'
import Footer from './components/Footer'
import Navbar from './components/Navbar'
import './App.css'

function App() {
  return (
    <MantineProvider>
       <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
      <Footer />
    </MantineProvider>
  )
}

export default App
