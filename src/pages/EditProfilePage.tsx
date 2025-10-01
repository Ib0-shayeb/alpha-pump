import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, User, Ruler, Weight, Calendar, MapPin, Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface UserProfile {
  user_id: string;
  display_name?: string;
  username?: string;
  avatar_url?: string;
  bio?: string;
  height_cm?: number;
  weight_kg?: number;
  date_of_birth?: string;
  location?: string;
  interests?: string[];
  fitness_goals?: string[];
  experience_level?: string;
  preferred_workout_times?: string[];
  social_media_links?: {
    instagram?: string;
    twitter?: string;
    tiktok?: string;
  };
  privacy_settings?: {
    show_weight: boolean;
    show_height: boolean;
    show_workouts: boolean;
    show_social_activity: boolean;
  };
  followerCount: number;
  followingCount: number;
}

const EditProfilePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState({
    display_name: '',
    username: '',
    bio: '',
    height_cm: '',
    weight_kg: '',
    date_of_birth: '',
    location: '',
    interests: '',
    fitness_goals: '',
    experience_level: '',
    preferred_workout_times: '',
    instagram: '',
    twitter: '',
    tiktok: '',
    show_weight: true,
    show_height: true,
    show_workouts: true,
    show_social_activity: true
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      console.log('Fetching profile for user:', user.id);
      
      // Get profile data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileError) {
        console.error('Profile error:', profileError);
        if (profileError.code === 'PGRST116') {
          // Profile doesn't exist, create a basic one
          console.log('Profile not found, creating basic profile');
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert({
              user_id: user.id,
              display_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
              username: user.email?.split('@')[0] || `user_${user.id.slice(0, 8)}`,
              bio: '',
              height_cm: null,
              weight_kg: null,
              date_of_birth: null,
              location: '',
              interests: [],
              fitness_goals: [],
              experience_level: 'beginner',
              preferred_workout_times: [],
              social_media_links: {},
              privacy_settings: {
                show_weight: true,
                show_height: true,
                show_workouts: true,
                show_social_activity: true
              }
            })
            .select()
            .single();

          if (createError) throw createError;
          setProfile(newProfile);
          populateEditForm(newProfile);
        } else {
          throw profileError;
        }
      } else {
        console.log('Profile found:', profileData);
        setProfile(profileData);
        populateEditForm(profileData);
      }

      // Get follower counts
      const { data: followersData, error: followersError } = await supabase
        .from('user_follows')
        .select('id')
        .eq('following_id', user.id);

      if (followersError) {
        console.error('Followers error:', followersError);
      } else {
        const followerCount = followersData?.length || 0;
        setProfile(prev => prev ? { ...prev, followerCount } : null);
      }

      const { data: followingData, error: followingError } = await supabase
        .from('user_follows')
        .select('id')
        .eq('follower_id', user.id);

      if (followingError) {
        console.error('Following error:', followingError);
      } else {
        const followingCount = followingData?.length || 0;
        setProfile(prev => prev ? { ...prev, followingCount } : null);
      }

    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const populateEditForm = (profileData: UserProfile) => {
    setEditForm({
      display_name: profileData.display_name || '',
      username: profileData.username || '',
      bio: profileData.bio || '',
      height_cm: profileData.height_cm?.toString() || '',
      weight_kg: profileData.weight_kg?.toString() || '',
      date_of_birth: profileData.date_of_birth || '',
      location: profileData.location || '',
      interests: profileData.interests?.join(', ') || '',
      fitness_goals: profileData.fitness_goals?.join(', ') || '',
      experience_level: profileData.experience_level || 'beginner',
      preferred_workout_times: profileData.preferred_workout_times?.join(', ') || '',
      instagram: profileData.social_media_links?.instagram || '',
      twitter: profileData.social_media_links?.twitter || '',
      tiktok: profileData.social_media_links?.tiktok || '',
      show_weight: profileData.privacy_settings?.show_weight ?? true,
      show_height: profileData.privacy_settings?.show_height ?? true,
      show_workouts: profileData.privacy_settings?.show_workouts ?? true,
      show_social_activity: profileData.privacy_settings?.show_social_activity ?? true
    });
  };

  const handleSaveProfile = async () => {
    if (!user || !profile) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: editForm.display_name || null,
          username: editForm.username || null,
          bio: editForm.bio || null,
          height_cm: editForm.height_cm ? parseInt(editForm.height_cm) : null,
          weight_kg: editForm.weight_kg ? parseFloat(editForm.weight_kg) : null,
          date_of_birth: editForm.date_of_birth || null,
          location: editForm.location || null,
          interests: editForm.interests ? editForm.interests.split(',').map(i => i.trim()).filter(i => i) : [],
          fitness_goals: editForm.fitness_goals ? editForm.fitness_goals.split(',').map(g => g.trim()).filter(g => g) : [],
          experience_level: editForm.experience_level || 'beginner',
          preferred_workout_times: editForm.preferred_workout_times ? editForm.preferred_workout_times.split(',').map(t => t.trim()).filter(t => t) : [],
          social_media_links: {
            instagram: editForm.instagram || null,
            twitter: editForm.twitter || null,
            tiktok: editForm.tiktok || null
          },
          privacy_settings: {
            show_weight: editForm.show_weight,
            show_height: editForm.show_height,
            show_workouts: editForm.show_workouts,
            show_social_activity: editForm.show_social_activity
          }
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Profile updated successfully!');
      navigate('/profile');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout title="Edit Profile">
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="h-20 bg-muted rounded"></div>
            </Card>
          ))}
        </div>
      </Layout>
    );
  }

  if (!profile) {
    return (
      <Layout title="Edit Profile">
        <div className="text-center py-8">
          <User className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Profile not found</h3>
          <p className="text-muted-foreground mb-4">
            We couldn't load your profile information.
          </p>
          <Button onClick={() => navigate('/profile')}>
            Back to Profile
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Edit Profile">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/profile')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Profile
          </Button>
        </div>

        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="display_name">Display Name</Label>
                <Input
                  id="display_name"
                  value={editForm.display_name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, display_name: e.target.value }))}
                  placeholder="Enter your display name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={editForm.username}
                  onChange={(e) => setEditForm(prev => ({ ...prev, username: e.target.value }))}
                  placeholder="Enter your username"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={editForm.bio}
                onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                placeholder="Tell us about yourself..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={editForm.location}
                onChange={(e) => setEditForm(prev => ({ ...prev, location: e.target.value }))}
                placeholder="City, Country"
              />
            </div>
          </CardContent>
        </Card>

        {/* Physical Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Physical Stats
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="height_cm">Height (cm)</Label>
                <Input
                  id="height_cm"
                  type="number"
                  value={editForm.height_cm}
                  onChange={(e) => setEditForm(prev => ({ ...prev, height_cm: e.target.value }))}
                  placeholder="170"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weight_kg">Weight (kg)</Label>
                <Input
                  id="weight_kg"
                  type="number"
                  step="0.1"
                  value={editForm.weight_kg}
                  onChange={(e) => setEditForm(prev => ({ ...prev, weight_kg: e.target.value }))}
                  placeholder="70.5"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date_of_birth">Date of Birth</Label>
                <Input
                  id="date_of_birth"
                  type="date"
                  value={editForm.date_of_birth}
                  onChange={(e) => setEditForm(prev => ({ ...prev, date_of_birth: e.target.value }))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fitness Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Fitness Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="experience_level">Experience Level</Label>
              <Select
                value={editForm.experience_level}
                onValueChange={(value) => setEditForm(prev => ({ ...prev, experience_level: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select experience level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                  <SelectItem value="expert">Expert</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="interests">Interests (comma-separated)</Label>
              <Input
                id="interests"
                value={editForm.interests}
                onChange={(e) => setEditForm(prev => ({ ...prev, interests: e.target.value }))}
                placeholder="Weightlifting, Cardio, Yoga, Swimming"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fitness_goals">Fitness Goals (comma-separated)</Label>
              <Input
                id="fitness_goals"
                value={editForm.fitness_goals}
                onChange={(e) => setEditForm(prev => ({ ...prev, fitness_goals: e.target.value }))}
                placeholder="Build muscle, Lose weight, Improve endurance"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="preferred_workout_times">Preferred Workout Times (comma-separated)</Label>
              <Input
                id="preferred_workout_times"
                value={editForm.preferred_workout_times}
                onChange={(e) => setEditForm(prev => ({ ...prev, preferred_workout_times: e.target.value }))}
                placeholder="Morning, Afternoon, Evening"
              />
            </div>
          </CardContent>
        </Card>

        {/* Social Media */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Social Media Links
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="instagram">Instagram</Label>
                <Input
                  id="instagram"
                  value={editForm.instagram}
                  onChange={(e) => setEditForm(prev => ({ ...prev, instagram: e.target.value }))}
                  placeholder="@username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="twitter">Twitter</Label>
                <Input
                  id="twitter"
                  value={editForm.twitter}
                  onChange={(e) => setEditForm(prev => ({ ...prev, twitter: e.target.value }))}
                  placeholder="@username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tiktok">TikTok</Label>
                <Input
                  id="tiktok"
                  value={editForm.tiktok}
                  onChange={(e) => setEditForm(prev => ({ ...prev, tiktok: e.target.value }))}
                  placeholder="@username"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Privacy Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Privacy Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Show Weight</Label>
                  <p className="text-sm text-muted-foreground">Display your weight on your profile</p>
                </div>
                <input
                  type="checkbox"
                  checked={editForm.show_weight}
                  onChange={(e) => setEditForm(prev => ({ ...prev, show_weight: e.target.checked }))}
                  className="h-4 w-4"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Show Height</Label>
                  <p className="text-sm text-muted-foreground">Display your height on your profile</p>
                </div>
                <input
                  type="checkbox"
                  checked={editForm.show_height}
                  onChange={(e) => setEditForm(prev => ({ ...prev, show_height: e.target.checked }))}
                  className="h-4 w-4"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Show Workouts</Label>
                  <p className="text-sm text-muted-foreground">Display your workout activity</p>
                </div>
                <input
                  type="checkbox"
                  checked={editForm.show_workouts}
                  onChange={(e) => setEditForm(prev => ({ ...prev, show_workouts: e.target.checked }))}
                  className="h-4 w-4"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Show Social Activity</Label>
                  <p className="text-sm text-muted-foreground">Display your social interactions</p>
                </div>
                <input
                  type="checkbox"
                  checked={editForm.show_social_activity}
                  onChange={(e) => setEditForm(prev => ({ ...prev, show_social_activity: e.target.checked }))}
                  className="h-4 w-4"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSaveProfile}
            disabled={saving}
            className="flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default EditProfilePage;

