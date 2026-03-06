import { Routes, Route } from "react-router-dom"
import Signin from "./components/signin";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Signin />} />
    </Routes>
  );
}