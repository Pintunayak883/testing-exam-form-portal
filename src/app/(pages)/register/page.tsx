"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import axios from "axios";
import ClipLoader from "react-spinners/ClipLoader";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

// Signup form ka data type
interface SignupFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export default function SignupPage() {
  const [formData, setFormData] = useState<SignupFormData>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();

  // Validation functions add karo
  const validateName = (name: string): string | null => {
    if (!name) return "Name is required";
    if (name.length < 2) return "Name must be at least 2 characters long";
    if (!/^[a-zA-Z\s]+$/.test(name))
      return "Name can only contain letters and spaces";
    if (name.length > 50) return "Name cannot exceed 50 characters";
    return null;
  };

  const validateEmail = (email: string): string | null => {
    if (!email) return "Email is required";
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (/\s/.test(email)) return "Email cannot contain spaces";
    if (!emailRegex.test(email)) return "Please enter a valid email address";
    if (email.length > 100) return "Email cannot exceed 100 characters";
    return null;
  };

  const validatePassword = (password: string): string | null => {
    if (!password) return "Password is required";
    if (password.length < 8)
      return "Password must be at least 8 characters long";
    if (password.length > 50) return "Password cannot exceed 50 characters";
    if (/\s/.test(password)) return "Password cannot contain spaces";
    if (!/[A-Z]/.test(password))
      return "Password must contain at least one uppercase letter";
    if (!/[a-z]/.test(password))
      return "Password must contain at least one lowercase letter";
    if (!/[0-9]/.test(password))
      return "Password must contain at least one number";
    if (!/[^a-zA-Z0-9]/.test(password))
      return "Password must contain at least one special character";
    return null;
  };

  const validateConfirmPassword = (
    password: string,
    confirmPassword: string
  ): string | null => {
    if (!confirmPassword) return "Please confirm your password";
    if (password !== confirmPassword) return "Passwords do not match";
    return null;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === "name" && /[^a-zA-Z\s]/.test(value)) {
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const nameError = validateName(formData.name);
    const emailError = validateEmail(formData.email);
    const passwordError = validatePassword(formData.password);
    const confirmPasswordError = validateConfirmPassword(
      formData.password,
      formData.confirmPassword
    );

    if (nameError) {
      toast.error(nameError);
      setIsLoading(false);
      return;
    }
    if (emailError) {
      toast.error(emailError);
      setIsLoading(false);
      return;
    }
    if (passwordError) {
      toast.error(passwordError);
      setIsLoading(false);
      return;
    }
    if (confirmPasswordError) {
      toast.error(confirmPasswordError);
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.post("/api/auth/signup", {
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });

      toast.success("Signup successful! Redirecting to login...");
      setTimeout(() => router.push("/login"), 2000);
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const msg =
          error.response?.data?.message || "Signup failed. Please try again.";
        toast.error(msg);
      } else {
        toast.error("Something went wrong. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center bg-gradient-to-r from-blue-500 to-indigo-700 px-4">
      <div className="my-5 w-full max-w-md bg-white/90 backdrop-blur-md rounded-xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center text-indigo-700 mb-6">
          Sign Up for Exam Form Portal
        </h1>

        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          <div>
            <Label htmlFor="name" className="text-indigo-700 font-medium">
              Full Name
            </Label>
            <Input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your full name"
              required
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="email" className="text-indigo-700 font-medium">
              Email
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
              className="mt-2"
            />
          </div>

          <div className="relative">
            <Label htmlFor="password" className="text-indigo-700 font-medium">
              Password
            </Label>
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
              className="mt-2 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-9 text-indigo-700"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <div className="relative">
            <Label
              htmlFor="confirmPassword"
              className="text-indigo-700 font-medium"
            >
              Confirm Password
            </Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm your password"
              required
              className="mt-2 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-9 text-indigo-700"
              tabIndex={-1}
            >
              {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <Button
            type="submit"
            className="w-full bg-indigo-700 text-white hover:bg-indigo-800 transition-all rounded-lg py-2"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex justify-center items-center space-x-2">
                <ClipLoader size={20} color="#ffffff" />
                <span>Signing up...</span>
              </span>
            ) : (
              "Sign Up"
            )}
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-indigo-700">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-indigo-900 hover:underline font-bold"
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
