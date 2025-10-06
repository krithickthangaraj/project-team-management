import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../../api/axios";
import useAuth from "../../hooks/useAuth";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = new URLSearchParams();
      data.append("username", form.email);
      data.append("password", form.password);

      const res = await api.post("/auth/login", data, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      const { access_token, user } = res.data;
      login({ user, access_token, remember });

      // redirect based on role
      switch (user.role) {
        case "admin":
          navigate("/admin/dashboard", { replace: true });
          break;
        case "owner":
          navigate("/owner/dashboard", { replace: true });
          break;
        default:
          navigate("/member/dashboard", { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <div className="mx-auto grid max-w-6xl grid-cols-1 md:grid-cols-2 min-h-screen">
        <div className="hidden md:flex flex-col justify-center p-12 bg-gradient-to-br from-black via-gray-900 to-gray-800 text-white">
          <div className="mb-8">
            <div className="h-12 w-12 rounded-2xl bg-white text-black flex items-center justify-center font-bold">PT</div>
          </div>
          <h2 className="text-4xl font-semibold leading-tight">Project Team Management</h2>
          <p className="mt-4 text-gray-300">Collaborate, assign tasks, and lead your teams with clarity.</p>
          <div className="mt-8 grid grid-cols-2 gap-4">
            <div className="rounded-2xl bg-white/10 p-4">
              <p className="text-sm text-gray-300">Fast onboarding</p>
              <p className="mt-1 text-lg font-medium">Sign in and get going</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-4">
              <p className="text-sm text-gray-300">Role based</p>
              <p className="mt-1 text-lg font-medium">Dashboards that fit you</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center p-6 md:p-12">
          <div className="w-full max-w-md bg-white/80 backdrop-blur-xl border border-gray-200 shadow-2xl rounded-3xl p-8">
            <div className="mb-6 text-center">
              <h1 className="text-3xl font-semibold text-gray-900">Welcome back</h1>
              <p className="mt-2 text-gray-500">Sign in to continue to your dashboard</p>
            </div>

            {error && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-4 focus:ring-gray-200"
                  required
                  autoComplete="email"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                <div className="mt-1 relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-gray-300 px-4 py-2.5 pr-12 focus:outline-none focus:ring-4 focus:ring-gray-200"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute inset-y-0 right-2 my-1 rounded-lg px-3 text-sm text-gray-600 hover:bg-gray-100"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-black px-4 py-3 text-white font-semibold shadow-lg hover:bg-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-200 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? "Signing in..." : "Sign in"}
              </button>
            </form>

            <div className="mt-4 flex items-center justify-between text-sm">
              <label className="inline-flex items-center gap-2 text-gray-600">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-black focus:ring-black"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                Remember me
              </label>
              <button type="button" className="text-gray-600 hover:underline">Forgot password?</button>
            </div>

            <p className="mt-6 text-center text-sm text-gray-600">
              Don’t have an account? {" "}
              <Link to="/register" className="font-semibold text-gray-900 hover:underline">Create one</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
