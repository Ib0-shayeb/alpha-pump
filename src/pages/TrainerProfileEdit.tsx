import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, X, Save, Star, Award } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface TrainerProfileData {
  display_name: string;
  bio: string;
  about: string;
  avatar_url: string;
  years_experience: number;
  specializations: string[];
  certifications: string[];
}

export const TrainerProfileEdit = () => {
  const [profile, setProfile] = useState<TrainerProfileData>({
    display_name: '',
    bio: '',
    about: '',
    avatar_url: '',
    years_experience: 0,
    specializations: [],
    certifications: []
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newSpecialization, setNewSpecialization] = useState('');
  const [newCertification, setNewCertification] = useState('');
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('display_name, bio, about, avatar_url, years_experience, specializations, certifications')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setProfile({
          display_name: data.display_name || '',
          bio: data.bio || '',
          about: data.about || '',
          avatar_url: data.avatar_url || '',
          years_experience: data.years_experience || 0,
          specializations: data.specializations || [],
          certifications: data.certifications || []
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Error",
        description: "Failed to load profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: profile.display_name,
          bio: profile.bio,
          about: profile.about,
          avatar_url: profile.avatar_url,
          years_experience: profile.years_experience,
          specializations: profile.specializations,
          certifications: profile.certifications,
          role: 'trainer' // Ensure role is set to trainer
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Error",
        description: "Failed to save profile",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const addSpecialization = () => {
    if (newSpecialization.trim() && !profile.specializations.includes(newSpecialization.trim())) {
      setProfile(prev => ({
        ...prev,
        specializations: [...prev.specializations, newSpecialization.trim()]
      }));
      setNewSpecialization('');
    }
  };

  const removeSpecialization = (index: number) => {
    setProfile(prev => ({
      ...prev,
      specializations: prev.specializations.filter((_, i) => i !== index)
    }));
  };

  const addCertification = () => {
    if (newCertification.trim() && !profile.certifications.includes(newCertification.trim())) {
      setProfile(prev => ({
        ...prev,
        certifications: [...prev.certifications, newCertification.trim()]
      }));
      setNewCertification('');
    }
  };

  const removeCertification = (index: number) => {
    setProfile(prev => ({
      ...prev,
      certifications: prev.certifications.filter((_, i) => i !== index)
    }));
  };

  if (loading) {
    return (
      <Layout title="Edit Trainer Profile">
        <div className="animate-pulse space-y-6">
          <Card className="p-6">
            <div className="space-y-4">
              <div className="h-4 bg-muted rounded w-1/4"></div>
              <div className="h-10 bg-muted rounded"></div>
            </div>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Edit Trainer Profile">
      <div className="space-y-6">
        {/* Header */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Edit Trainer Profile</h1>
            <Button onClick={handleSave} disabled={saving} className="flex items-center gap-2">
              <Save size={16} />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>

          <div className="flex items-start space-x-6">
            <Avatar className="w-24 h-24">
              <AvatarImage src={profile.avatar_url} />
              <AvatarFallback className="text-xl">
                {profile.display_name?.split(' ').map(n => n[0]).join('') || 'T'}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-4">
              <div>
                <Label htmlFor="display_name">Display Name</Label>
                <Input
                  id="display_name"
                  value={profile.display_name}
                  onChange={(e) => setProfile(prev => ({ ...prev, display_name: e.target.value }))}
                  placeholder="Your full name"
                />
              </div>

              <div>
                <Label htmlFor="avatar_url">Profile Picture URL</Label>
                <Input
                  id="avatar_url"
                  value={profile.avatar_url}
                  onChange={(e) => setProfile(prev => ({ ...prev, avatar_url: e.target.value }))}
                  placeholder="https://example.com/your-photo.jpg"
                />
              </div>

              <div>
                <Label htmlFor="years_experience">Years of Experience</Label>
                <Input
                  id="years_experience"
                  type="number"
                  min="0"
                  value={profile.years_experience}
                  onChange={(e) => setProfile(prev => ({ ...prev, years_experience: parseInt(e.target.value) || 0 }))}
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Bio Section */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Bio</h2>
          <Textarea
            value={profile.bio}
            onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
            placeholder="A short description about yourself"
            rows={3}
          />
        </Card>

        {/* About Section */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">About</h2>
          <Textarea
            value={profile.about}
            onChange={(e) => setProfile(prev => ({ ...prev, about: e.target.value }))}
            placeholder="Tell potential clients about your background, training philosophy, and expertise..."
            rows={6}
          />
        </Card>

        {/* Specializations */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Specializations</h2>
          
          <div className="flex gap-2 mb-4">
            <Input
              value={newSpecialization}
              onChange={(e) => setNewSpecialization(e.target.value)}
              placeholder="Add a specialization (e.g., Weight Loss, Strength Training)"
              onKeyDown={(e) => e.key === 'Enter' && addSpecialization()}
            />
            <Button onClick={addSpecialization} size="sm">
              <Plus size={16} />
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {profile.specializations.map((spec, index) => (
              <Badge key={index} variant="secondary" className="flex items-center gap-1">
                {spec}
                <button
                  onClick={() => removeSpecialization(index)}
                  className="ml-1 hover:text-destructive"
                >
                  <X size={12} />
                </button>
              </Badge>
            ))}
          </div>
        </Card>

        {/* Certifications */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Award className="w-5 h-5" />
            Certifications
          </h2>
          
          <div className="flex gap-2 mb-4">
            <Input
              value={newCertification}
              onChange={(e) => setNewCertification(e.target.value)}
              placeholder="Add a certification (e.g., NASM-CPT, ACE Personal Trainer)"
              onKeyDown={(e) => e.key === 'Enter' && addCertification()}
            />
            <Button onClick={addCertification} size="sm">
              <Plus size={16} />
            </Button>
          </div>

          <div className="space-y-2">
            {profile.certifications.map((cert, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <p className="font-medium">{cert}</p>
                <button
                  onClick={() => removeCertification(index)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </Layout>
  );
};