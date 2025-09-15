import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Calendar, Zap, Shield, SkipForward } from "lucide-react";

interface PlanTypeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  routineId: string;
  routineName: string;
  onConfirm: (planType: 'strict' | 'flexible') => void;
  loading?: boolean;
}

export const PlanTypeDialog = ({ 
  open, 
  onOpenChange, 
  routineId,
  routineName, 
  onConfirm, 
  loading = false 
}: PlanTypeDialogProps) => {
  const [selectedPlanType, setSelectedPlanType] = useState<'strict' | 'flexible'>('strict');

  const planTypes = [
    {
      value: 'strict' as const,
      title: 'Strict Plan',
      description: 'Follow the routine exactly as scheduled',
      icon: Shield,
      features: [
        'Fixed workout schedule',
        'No skipping allowed', 
        'Consistent routine timing',
        'Best for discipline building'
      ],
      badge: 'Recommended',
      badgeVariant: 'default' as const
    },
    {
      value: 'flexible' as const,
      title: 'Flexible Plan',
      description: 'Skip days when needed, plan adjusts automatically',
      icon: SkipForward,
      features: [
        'Can skip workout days',
        'Plan shifts forward automatically',
        'Rest days replace skipped days',
        'Better for busy schedules'
      ],
      badge: 'Advanced',
      badgeVariant: 'secondary' as const
    }
  ];

  const handleConfirm = () => {
    onConfirm(selectedPlanType);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar size={20} />
            Choose Your Plan Type
          </DialogTitle>
          <p className="text-muted-foreground">
            Select how you want to follow the "{routineName}" routine
          </p>
        </DialogHeader>

        <RadioGroup
          value={selectedPlanType}
          onValueChange={(value) => setSelectedPlanType(value as 'strict' | 'flexible')}
          className="space-y-4"
        >
          {planTypes.map((planType) => {
            const IconComponent = planType.icon;
            return (
              <div key={planType.value} className="relative">
                <RadioGroupItem
                  value={planType.value}
                  id={planType.value}
                  className="peer sr-only"
                />
                <Label
                  htmlFor={planType.value}
                  className="cursor-pointer"
                >
                  <Card className={`p-4 transition-all peer-checked:ring-2 peer-checked:ring-primary hover:bg-muted/50 ${
                    selectedPlanType === planType.value ? 'ring-2 ring-primary bg-primary/5' : ''
                  }`}>
                    <div className="flex items-start gap-4">
                      <div className={`p-2 rounded-lg ${
                        selectedPlanType === planType.value ? 'bg-primary text-primary-foreground' : 'bg-muted'
                      }`}>
                        <IconComponent size={20} />
                      </div>
                      
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{planType.title}</h3>
                          <Badge variant={planType.badgeVariant}>
                            {planType.badge}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-muted-foreground">
                          {planType.description}
                        </p>
                        
                        <ul className="space-y-1">
                          {planType.features.map((feature, index) => (
                            <li key={index} className="flex items-center gap-2 text-sm">
                              <div className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </Card>
                </Label>
              </div>
            );
          })}
        </RadioGroup>

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            You can change this setting later in your routine settings
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={loading}
            >
              {loading ? "Starting Plan..." : "Start Plan"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};