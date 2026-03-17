import { Routes, Route } from "react-router-dom";
import LoginPage from "./components/loginPage";
import SignupPage from "./components/signupPage";
import HomePage from "./pages/HomePage";

import AuthRoute from "./routes/AuthRoute";
import PublicRoute from "./routes/PublicRoute";

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
      </Route>

      {/* Protected */}
      <Route element={<AuthRoute />}>
        <Route path="/home" element={<HomePage />} />
      </Route>
    </Routes>
  );
}