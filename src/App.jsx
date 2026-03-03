import { BrowserRouter, Routes, Route } from "react-router-dom"
import Menu from "./pages/Menu"
import Cart from "./pages/Cart"
import Navbar from "./components/Navbar"

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Menu />} />
        <Route path="/cart" element={<Cart />} />
      </Routes>
    </BrowserRouter>
  )
}