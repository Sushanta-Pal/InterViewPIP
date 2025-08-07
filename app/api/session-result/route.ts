// app/api/session-result/route.ts

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getUserProfile } from '@/lib/userActions'; // We can reuse this server-safe function

export async function GET(request: Request) {
    const { userId } = auth();
    if (!userId) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
        return new NextResponse("Session ID is required", { status: 400 });
    }

    try {
        const userProfile = await getUserProfile(userId);
        if (!userProfile || !userProfile.session_history) {
            // Return a specific status that the client can check
            return NextResponse.json({ status: 'pending' }, { status: 200 });
        }

        const session = userProfile.session_history.find(s => s.id === sessionId);

        if (session && session.feedback) {
            // Found the completed session, return it
            return NextResponse.json(session, { status: 200 });
        } else {
            // The session isn't in the history yet, or feedback is missing
            return NextResponse.json({ status: 'pending' }, { status: 200 });
        }

    } catch (error) {
        console.error("Error fetching session result:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
