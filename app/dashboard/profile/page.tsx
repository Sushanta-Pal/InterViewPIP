import { UserProfile } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/common/Card";
import CustomProfileForm from "./_components/CustomProfileForm";

export default async function ProfilePage() {
    
  const user = await currentUser();

  // CORRECTED: Read all initial data from the metadata object.
  const initialData = {
    fullName: user?.unsafeMetadata?.fullName as string || '',
    university: user?.unsafeMetadata?.university as string || '',
    roll: user?.unsafeMetadata?.roll as string || '',
    dob: user?.unsafeMetadata?.dob as string || '',
    stream: user?.unsafeMetadata?.stream as string || '',
    gender: user?.unsafeMetadata?.gender as string || '',
  };

  return (
    <div className="p-4 md:p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Your Profile</h1>
        <p className="text-slate-500">
          Manage your personal information and account settings.
        </p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your custom profile details.</CardDescription>
            </CardHeader>
            <CardContent>
              <CustomProfileForm initialData={initialData} />
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-2">
            <Card>
                <CardHeader>
                  <CardTitle>Account & Security</CardTitle>
                  <CardDescription>Manage your name, email, phone, password, and security settings.</CardDescription>
                </CardHeader>
                <CardContent>
                    <UserProfile routing="hash" /> 
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}