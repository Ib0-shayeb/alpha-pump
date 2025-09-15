import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Shield, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface PrivacySettings {
  trainer_can_see_weight: boolean;
  trainer_can_see_height: boolean;
  trainer_can_see_personal_info: boolean;
  trainer_can_see_workout_history: boolean;
}

export const PrivacySettings = () => {
  const [settings, setSettings] = useState<PrivacySettings>({
    trainer_can_see_weight: true,
    trainer_can_see_height: true,
    trainer_can_see_personal_info: true,
    trainer_can_see_workout_history: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchPrivacySettings();
  }, [user]);

  const fetchPrivacySettings = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('trainer_can_see_weight, trainer_can_see_height, trainer_can_see_personal_info, trainer_can_see_workout_history')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        setSettings({
          trainer_can_see_weight: data.trainer_can_see_weight ?? true,
          trainer_can_see_height: data.trainer_can_see_height ?? true,
          trainer_can_see_personal_info: data.trainer_can_see_personal_info ?? true,
          trainer_can_see_workout_history: data.trainer_can_see_workout_history ?? true,
        });
      }
    } catch (error) {
      console.error('Error fetching privacy settings:', error);
      toast({
        title: "Error",
        description: "Failed to load privacy settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key: keyof PrivacySettings, value: boolean) => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ [key]: value })
        .eq('user_id', user.id);

      if (error) throw error;

      setSettings(prev => ({ ...prev, [key]: value }));
      
      toast({
        title: "Privacy settings updated",
        description: "Your trainer visibility preferences have been saved",
      });
    } catch (error) {
      console.error('Error updating privacy setting:', error);
      toast({
        title: "Error",
        description: "Failed to update privacy settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const privacyOptions = [
    {
      key: 'trainer_can_see_personal_info' as keyof PrivacySettings,
      title: 'Personal Information',
      description: 'Allow trainers to see your fitness goals, activity level, and bio',
      icon: Eye,
    },
    {
      key: 'trainer_can_see_height' as keyof PrivacySettings,
      title: 'Height',
      description: 'Allow trainers to see your height measurement',
      icon: Eye,
    },
    {
      key: 'trainer_can_see_weight' as keyof PrivacySettings,
      title: 'Weight',
      description: 'Allow trainers to see your weight measurement',
      icon: Eye,
    },
    {
      key: 'trainer_can_see_workout_history' as keyof PrivacySettings,
      title: 'Workout History',
      description: 'Allow trainers to see your past workout sessions and progress',
      icon: Eye,
    },
  ];

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield size={20} />
            Privacy Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-muted rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield size={20} />
          Privacy Settings
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Control what information your trainers can see about you
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {privacyOptions.map((option) => {
          const IconComponent = settings[option.key] ? Eye : EyeOff;
          return (
            <div key={option.key} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <IconComponent 
                  size={16} 
                  className={settings[option.key] ? "text-green-600" : "text-muted-foreground"} 
                />
                <div className="flex-1">
                  <Label className="text-base">{option.title}</Label>
                  <p className="text-sm text-muted-foreground">{option.description}</p>
                </div>
              </div>
              <Switch
                checked={settings[option.key]}
                onCheckedChange={(checked) => updateSetting(option.key, checked)}
                disabled={saving}
              />
            </div>
          );
        })}
        
        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-start gap-3">
            <Shield size={16} className="text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-sm">Privacy Information</h4>
              <p className="text-xs text-muted-foreground mt-1">
                Only your connected trainers can see the information you allow. Other users cannot access your private data.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};