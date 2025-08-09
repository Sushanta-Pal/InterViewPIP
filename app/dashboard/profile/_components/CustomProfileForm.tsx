'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Label } from '@/components/common/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/common/Select';

interface CustomProfileFormProps {
  initialData: {
    fullName: string;
    university: string;
    roll: string;
    dob: string;
    stream: string;
    gender: string;
  };
}

export default function CustomProfileForm({ initialData }: CustomProfileFormProps) {
  const { user } = useUser();
  const [formData, setFormData] = useState(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsLoading(true);
    setMessage('');

    try {
      // CORRECTED: All form data, including fullName, now goes into the metadata object.
      // Do NOT pass firstName or lastName directly to user.update().
      await user.update({
        unsafeMetadata: formData,
      });

      setMessage('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="fullName">Full Name</Label>
        <Input
          id="fullName"
          name="fullName"
          value={formData.fullName}
          onChange={handleChange}
          placeholder="e.g., Sushanta Pal"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="university">University</Label>
        <Input
          id="university"
          name="university"
          value={formData.university}
          onChange={handleChange}
          placeholder="e.g., Haldia Institute of Technology"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="roll">University Roll No.</Label>
        <Input
          id="roll"
          name="roll"
          value={formData.roll}
          onChange={handleChange}
          placeholder="e.g., 123456789"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="dob">Date of Birth</Label>
        <Input
          id="dob"
          name="dob"
          type="date"
          value={formData.dob}
          onChange={handleChange}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="stream">Stream / Department</Label>
        <Input
          id="stream"
          name="stream"
          value={formData.stream}
          onChange={handleChange}
          placeholder="e.g., Computer Science"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="gender">Gender</Label>
        <Select name="gender" value={formData.gender} onValueChange={(value) => handleSelectChange('gender', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select gender" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="male">Male</SelectItem>
            <SelectItem value="female">Female</SelectItem>
            <SelectItem value="non-binary">Non-binary</SelectItem>
            <SelectItem value="other">Other</SelectItem>
            <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col items-start gap-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Save Changes'}
        </Button>
        {message && <p className="text-sm text-green-600 dark:text-green-500">{message}</p>}
      </div>
    </form>
  );
}