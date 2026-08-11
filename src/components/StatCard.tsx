import type { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/core';

type StatCardProps = {
  title: string;
  value: string;
  icon: ReactNode;
  valueClassName?: string;
};

export default function StatCard({ title, value, icon, valueClassName = 'text-foreground' }: StatCardProps) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-gray-500">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${valueClassName}`} dir="ltr">
          {value}
        </div>
      </CardContent>
    </Card>
  );
}
