import { Layout } from "@/components/Layout";
import AITrainerChat from "@/components/AITrainerChat";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bot, Star, Award, Zap } from "lucide-react";

export default function AITrainer() {
  return (
    <Layout title="AI Fitness Coach">
      <div className="space-y-6">
        {/* AI Trainer Profile Card */}
        <Card>
          <CardHeader>
            <div className="flex items-start gap-4">
              <Avatar className="w-16 h-16">
                <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground text-xl">
                  <Bot className="w-8 h-8" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <CardTitle className="text-2xl">AI Fitness Coach</CardTitle>
                  <Badge variant="default" className="bg-gradient-to-r from-primary to-primary/80">
                    <Zap className="w-3 h-3 mr-1" />
                    AI Powered
                  </Badge>
                </div>
                <div className="flex items-center gap-1 mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                  <span className="text-sm text-muted-foreground ml-2">5.0 • AI Certified</span>
                </div>
                <CardDescription className="text-base">
                  Your personal AI fitness coach powered by advanced AI. I provide personalized workout plans, 
                  nutrition advice, and fitness guidance based on your goals and progress. Available 24/7 to help 
                  you achieve your fitness objectives.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
              {[
                "Strength Training",
                "Weight Loss", 
                "Muscle Building",
                "Nutrition",
                "Recovery",
                "Form Correction"
              ].map((specialization) => (
                <Badge key={specialization} variant="secondary" className="text-center">
                  {specialization}
                </Badge>
              ))}
            </div>

            <div className="flex items-center gap-4 mt-4 pt-4 border-t">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">AI-Certified Personal Trainer</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Nutrition Specialist</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Exercise Physiologist</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Chat Interface */}
        <AITrainerChat />
      </div>
    </Layout>
  );
}