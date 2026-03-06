export default function Signup() {
    const backend_url = import.meta.env.VITE_BACKEND_URL;

    const handleSubmit = async (e) => {
        e.preventDefault();

        const formData = new FormData(e.target);

        const response = await fetch(`${backend_url}/signup`, {
            method: "POST",
            body: formData,
        });

        if (response.ok) {
            console.log("Signup successful!");
        } else {
            console.log("Signup failed!");
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <fieldset>
                <legend>Signup</legend>

                <input type="text" name="username" placeholder="Username" />
                <br />

                <input type="email" name="email" placeholder="Email" />
                <br />

                <input type="password" name="password" placeholder="Password" />
                <br />

                <button type="submit">Signup</button>
            </fieldset>
        </form>
    );
}