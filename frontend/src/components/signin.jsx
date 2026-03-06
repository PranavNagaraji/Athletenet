export default function Signin() {
  const backend_url = import.meta.env.VITE_BACKEND_URL;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    await fetch(`${backend_url}/signin`, {
      method: 'POST',
      body: formData,
    });
    console.log("Login request sent!");
  }
  return (
    <form onSubmit={handleSubmit}>
      <fieldset>
        <legend>Login</legend>

        <input type="text" name="username" placeholder="Username" />
        <br />

        <input type="password" name="password" placeholder="Password" />
        <br />

        <button type="submit">Login</button>
      </fieldset>
    </form>
  );
}