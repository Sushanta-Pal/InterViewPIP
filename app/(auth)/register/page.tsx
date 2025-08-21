// File: /app/register/page.tsx

"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation"; // Correct import for App Router
import { Button } from "@/components/common/Button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/common/Card";
import { Input } from "@/components/common/Input";
import { Label } from "@/components/common/Label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/common/Select";

export default function RegisterPage() {
  const router = useRouter(); // Initialize the router for navigation

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [university, setUniversity] = useState("");
  const [department, setDepartment] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [gender, setGender] = useState("");
  const [dob, setDob] = useState("");

  // UI feedback state
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    // --- Start of Added Validation ---
    // Add client-side validation to catch issues before sending.
    if (!gender) {
      setError("Please select a gender.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    // --- End of Added Validation ---

    setIsLoading(true);

    const response = await fetch('/api/auth/sign-up', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            email, 
            password, 
            full_name: fullName,
            roll_number: rollNumber,
            university,
            department,
            phone_number: phoneNumber,
            gender,
            date_of_birth: dob,
        }),
    });

    const data = await response.json();

    if (response.ok) {
      // Registration was successful, now redirect to the login page.
      router.push('/login');
    } else {
      // An error occurred, display it to the user.
      setError(data.error || "An unexpected error occurred.");
    }

    setIsLoading(false);
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50 py-8 px-4">
      <Card className="w-full max-w-lg shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Create an Account</CardTitle>
          <CardDescription>Fill in the details below to get started.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input id="fullName" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required disabled={isLoading} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={isLoading} />
              </div>
               <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} disabled={isLoading} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rollNumber">Roll Number</Label>
                <Input id="rollNumber" type="text" value={rollNumber} onChange={(e) => setRollNumber(e.target.value)} required disabled={isLoading} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="university">University</Label>
                <Input id="university" type="text" value={university} onChange={(e) => setUniversity(e.target.value)} required disabled={isLoading} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input id="department" type="text" value={department} onChange={(e) => setDepartment(e.target.value)} required disabled={isLoading} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input id="phoneNumber" type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} required disabled={isLoading} />
              </div>
               <div className="space-y-2">
                <Label htmlFor="dob">Date of Birth</Label>
                <Input id="dob" type="date" value={dob} onChange={(e) => setDob(e.target.value)} required disabled={isLoading} />
              </div>
               <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select onValueChange={setGender} value={gender} required disabled={isLoading}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                </Select>
              </div>

              {error && <p className="text-red-500 text-sm col-span-2 text-center">{error}</p>}
              
              <Button type="submit" className="w-full col-span-2 mt-2" disabled={isLoading}>
                {isLoading ? 'Signing Up...' : 'Sign Up'}
              </Button>
            </div>
          </form>
        </CardContent>
        <CardFooter className="text-sm justify-center">
          <p>Already have an account? <Link href="/login" className="font-semibold text-blue-600 hover:underline">Log in</Link></p>
        </CardFooter>
      </Card>
    </div>
  );
}
