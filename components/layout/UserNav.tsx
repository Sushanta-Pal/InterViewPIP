"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "../common/Button";

export default function UserNav() {
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const supabase = createClientComponentClient();
    const router = useRouter();

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUserEmail(user?.email || null);
        };
        fetchUser();
    }, [supabase]);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push('/');
        router.refresh();
    };

    return (
        <div className="flex items-center space-x-4">
            <p className="text-sm font-medium">{userEmail}</p>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
                Sign Out
            </Button>
        </div>
    );
}