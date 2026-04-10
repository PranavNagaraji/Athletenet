import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { VALIDATION_LIMITS, isStrongPassword, isValidEmail, normalizeText } from "../utils/formValidation";

export default function Signup() {
    const backend_url = import.meta.env.VITE_BACKEND_URL;
    const navigate = useNavigate();
    const { checkAuth } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();

        const formData = new FormData(e.target);

        const name = normalizeText(formData.get("name"));
        const email = normalizeText(formData.get("email"));
        const password = formData.get("password");
        const role = formData.get("role");

        if (
            name.length < VALIDATION_LIMITS.nameMin ||
            !isValidEmail(email) ||
            !isStrongPassword(password)
        ) {
            return;
        }

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
                <input type="text" name="name" required minLength={VALIDATION_LIMITS.nameMin} maxLength={VALIDATION_LIMITS.nameMax} />
                <br />

                <label>Email</label>
                <input type="email" name="email" required maxLength={120} />
                <br />

                <label>Password</label>
                <input type="password" name="password" required minLength={8} maxLength={128} />
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
