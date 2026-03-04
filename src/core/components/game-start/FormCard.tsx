import React from 'react';
import { Card, CardContent } from "@/core/components/ui/card";

interface FormCardProps {
  children: React.ReactNode;
  className?: string;
}

const FormCard: React.FC<FormCardProps> = ({ children, className = "" }) => {
  return (
    <Card className={`w-full ${className}`}>
      <CardContent className="space-y-6 pt-6">
        {children}
      </CardContent>
    </Card>
  );
};

export default FormCard;
