import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Signup() {
    const backend_url = import.meta.env.VITE_BACKEND_URL;
    const navigate = useNavigate();
    const { checkAuth } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();

        const formData = new FormData(e.target);

        const name = formData.get("name");
        const email = formData.get("email");
        const password = formData.get("password");
        const role = formData.get("role");

        const res = await fetch(`${backend_url}/api/auth/signup`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({
                name,
                email,
                password,
                role,
            }),
        });

        if (res.ok) {
            const authenticated = await checkAuth();
            if (authenticated) {
                navigate("/home", { replace: true });
            }
        } else {
            const data = await res.json();
            console.log(data.message);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <fieldset>
                <legend>Signup</legend>

                <label>Name</label>
                <input type="text" name="name" required />
                <br />

                <label>Email</label>
                <input type="email" name="email" required />
                <br />

                <label>Password</label>
                <input type="password" name="password" required />
                <br />

                <label>Role</label>
                <select name="role" required>
                    <option value="">Select role</option>
                    <option value="athlete">Athlete</option>
                    <option value="coach">Coach</option>
                    <option value="club">Club</option>
                </select>
                <br />

                <button type="submit">Signup</button>
            </fieldset>
        </form>
    );
}
