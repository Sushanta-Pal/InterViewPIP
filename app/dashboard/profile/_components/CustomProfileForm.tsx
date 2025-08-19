'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Label } from '@/components/common/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/common/Select';
import type { UserProfile } from '@/lib/types';

interface CustomProfileFormProps {
  initialData: UserProfile;
}

export default function CustomProfileForm({ initialData }: CustomProfileFormProps) {
  const [formData, setFormData] = useState(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    const response = await fetch('/api/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
    });
    
    const result = await response.json();

    if (response.ok) {
      setMessage('Profile updated successfully!');
      router.refresh();
    } else {
      setMessage(result.error || 'An error occurred. Please try again.');
    }

    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="full_name">Full Name</Label>
        <Input id="full_name" name="full_name" value={formData.full_name} onChange={handleChange} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="university">University</Label>
        <Input id="university" name="university" value={formData.university} onChange={handleChange} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="roll_number">University Roll No.</Label>
        <Input id="roll_number" name="roll_number" value={formData.roll_number} onChange={handleChange} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="date_of_birth">Date of Birth</Label>
        <Input id="date_of_birth" name="date_of_birth" type="date" value={formData.date_of_birth} onChange={handleChange} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="department">Stream / Department</Label>
        <Input id="department" name="department" value={formData.department} onChange={handleChange} />
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
            <SelectItem value="other">Other</SelectItem>
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