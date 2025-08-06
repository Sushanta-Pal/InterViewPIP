// components/ui/StatCard.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/common/Card";

const StatCard = ({ title, value, icon, description }: { title: string, value: string | number, icon: React.ReactNode, description: string }) => {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                {icon}
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p>
            </CardContent>
        </Card>
    );
};

export default StatCard;