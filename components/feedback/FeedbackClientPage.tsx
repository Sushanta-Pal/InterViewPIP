'use client';

import { useRouter } from 'next/navigation';
import Button from '@/components/common/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card';
import type { Session } from '@/lib/userActions';

// Define the props that this component expects to receive from the server page
interface FeedbackClientPageProps {
    session: Session;
}

export default function FeedbackClientPage({ session }: FeedbackClientPageProps) {
    const router = useRouter();
    
    return (
        <Card className="max-w-4xl mx-auto">
            <CardHeader>
                <CardTitle className="text-center text-3xl font-bold">
                    Your Communication Report
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div 
                    className="prose dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: session.feedback.reportText }}
                />
                <div className="text-center mt-8">
                    <Button size="lg" onClick={() => router.push('/dashboard')}>
                        Back to Dashboard
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
