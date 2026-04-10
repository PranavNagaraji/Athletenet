import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext";
import { isStrongPassword, isValidEmail, normalizeText } from "../utils/formValidation";

export default function LoginPage() {
  const backend_url = import.meta.env.VITE_BACKEND_URL;
  const navigate = useNavigate();
  const { checkAuth } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const email = normalizeText(formData.get("email"));
    const password = formData.get("password");

    if (!isValidEmail(email) || !isStrongPassword(password)) {
      return;
    }

    const res = await fetch(`${backend_url}/api/auth/login`, {
      method: 'POST',
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
      credentials: "include",  // needed for cookie
    });

    if (res.ok) { //auto redirect to home after signup
      const authenticated = await checkAuth();
      if (authenticated) {
        navigate("/home", { replace: true });
      }
    } else {
      console.log("Login failed");
    }
  };
  return (
    <form onSubmit={handleSubmit}>
      <fieldset>
        <legend>Login</legend>

        <label>Email</label>
        <input type="email" name="email" placeholder="example@domain.com" required maxLength={120} />
        <br />

        <label>Password</label>
        <input type="password" name="password" placeholder="Password" required minLength={8} maxLength={128} />
        <br />

        <button type="submit">Login</button>
        <div>Do not have an account? <Link to="/signup">Signup</Link></div>
      </fieldset>
    </form>
  );
}
