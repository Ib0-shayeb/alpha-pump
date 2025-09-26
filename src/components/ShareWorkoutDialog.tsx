import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useSocialFeatures } from "@/hooks/useSocialFeatures";
import { Share2, Loader2 } from "lucide-react";

interface ShareWorkoutDialogProps {
  isOpen: boolean;
  onClose: () => void;
  workoutSessionId: string;
  workoutName: string;
}

export const ShareWorkoutDialog = ({ 
  isOpen, 
  onClose, 
  workoutSessionId, 
  workoutName 
}: ShareWorkoutDialogProps) => {
  const [content, setContent] = useState(`Just completed "${workoutName}"! 💪`);
  const { createWorkoutPost, loading } = useSocialFeatures();

  const handleShare = async () => {
    const success = await createWorkoutPost(workoutSessionId, content);
    if (success) {
      onClose();
      setContent(`Just completed "${workoutName}"! 💪`); // Reset for next time
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Share Your Workout
          </DialogTitle>
          <DialogDescription>
            Share your completed workout with the community!
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <Textarea
            placeholder="Tell everyone about your workout..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[100px]"
          />
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Skip
            </Button>
            <Button 
              onClick={handleShare}
              disabled={loading || !content.trim()}
              className="bg-gradient-primary"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sharing...
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4 mr-2" />
                  Share Workout
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};