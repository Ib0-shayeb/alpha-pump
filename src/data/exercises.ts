export interface Exercise {
  id: string;
  name: string;
  category: string;
  description: string;
  instructions: string[];
  muscles: string[];
  equipment: string;
}

export const exercises: Exercise[] = [
  // Push Exercises
  {
    id: "bench-press",
    name: "Bench Press",
    category: "Push",
    description: "A fundamental upper body exercise targeting chest, shoulders, and triceps.",
    instructions: [
      "Lie flat on the bench with feet firmly on the ground",
      "Grip the bar slightly wider than shoulder-width apart",
      "Lower the bar to your chest with control",
      "Press the bar back up to starting position"
    ],
    muscles: ["Chest", "Shoulders", "Triceps"],
    equipment: "Barbell"
  },
  {
    id: "push-ups",
    name: "Push-ups",
    category: "Push",
    description: "Bodyweight exercise for building upper body strength and endurance.",
    instructions: [
      "Start in a plank position with hands shoulder-width apart",
      "Keep your body in a straight line",
      "Lower your chest to the ground",
      "Push back up to starting position"
    ],
    muscles: ["Chest", "Shoulders", "Triceps"],
    equipment: "Bodyweight"
  },
  {
    id: "overhead-press",
    name: "Overhead Press",
    category: "Push",
    description: "Standing press that builds shoulder strength and stability.",
    instructions: [
      "Stand with feet shoulder-width apart",
      "Hold the bar at shoulder height",
      "Press the bar straight overhead",
      "Lower back to starting position with control"
    ],
    muscles: ["Shoulders", "Triceps", "Core"],
    equipment: "Barbell"
  },
  // Pull Exercises
  {
    id: "pull-ups",
    name: "Pull-ups",
    category: "Pull",
    description: "Upper body pulling exercise that targets the back and biceps.",
    instructions: [
      "Grab the pull-up bar with palms facing away",
      "Hang with arms fully extended",
      "Pull your body up until chin clears the bar",
      "Lower yourself back down with control"
    ],
    muscles: ["Lats", "Biceps", "Rhomboids"],
    equipment: "Pull-up Bar"
  },
  {
    id: "bent-over-row",
    name: "Bent-over Row",
    category: "Pull",
    description: "Compound back exercise for building width and thickness.",
    instructions: [
      "Bend at the hips with a slight knee bend",
      "Hold the bar with an overhand grip",
      "Pull the bar to your lower chest",
      "Lower the bar back down slowly"
    ],
    muscles: ["Lats", "Rhomboids", "Biceps"],
    equipment: "Barbell"
  },
  {
    id: "lat-pulldown",
    name: "Lat Pulldown",
    category: "Pull",
    description: "Machine exercise for developing lat width and back strength.",
    instructions: [
      "Sit at the lat pulldown machine",
      "Grab the bar wider than shoulder-width",
      "Pull the bar down to your upper chest",
      "Slowly return to the starting position"
    ],
    muscles: ["Lats", "Biceps", "Rhomboids"],
    equipment: "Cable Machine"
  },
  // Legs
  {
    id: "squats",
    name: "Squats",
    category: "Legs",
    description: "The king of all exercises, building total body strength.",
    instructions: [
      "Stand with feet shoulder-width apart",
      "Lower your body as if sitting back into a chair",
      "Keep your chest up and knees tracking over toes",
      "Drive through your heels to return to standing"
    ],
    muscles: ["Quadriceps", "Glutes", "Hamstrings"],
    equipment: "Barbell"
  },
  {
    id: "deadlift",
    name: "Deadlift",
    category: "Legs",
    description: "Full-body compound movement focusing on the posterior chain.",
    instructions: [
      "Stand with feet hip-width apart, bar over mid-foot",
      "Bend at hips and knees to grab the bar",
      "Keep chest up and back straight",
      "Drive through heels to lift the bar up"
    ],
    muscles: ["Hamstrings", "Glutes", "Lower Back"],
    equipment: "Barbell"
  },
  {
    id: "lunges",
    name: "Lunges",
    category: "Legs",
    description: "Unilateral leg exercise for building strength and balance.",
    instructions: [
      "Stand with feet hip-width apart",
      "Step forward into a lunge position",
      "Lower until both knees are at 90 degrees",
      "Push back to starting position"
    ],
    muscles: ["Quadriceps", "Glutes", "Hamstrings"],
    equipment: "Bodyweight"
  },
  {
    id: "leg-press",
    name: "Leg Press",
    category: "Legs",
    description: "Machine exercise for building quadriceps and glute strength.",
    instructions: [
      "Sit in the leg press machine",
      "Place feet shoulder-width apart on the platform",
      "Lower the weight until knees reach 90 degrees",
      "Press the weight back up to starting position"
    ],
    muscles: ["Quadriceps", "Glutes"],
    equipment: "Leg Press Machine"
  },
  // Core
  {
    id: "plank",
    name: "Plank",
    category: "Core",
    description: "Isometric exercise for building core stability and endurance.",
    instructions: [
      "Start in a push-up position",
      "Lower to your forearms",
      "Keep your body in a straight line",
      "Hold the position while breathing normally"
    ],
    muscles: ["Core", "Shoulders"],
    equipment: "Bodyweight"
  },
  {
    id: "russian-twists",
    name: "Russian Twists",
    category: "Core",
    description: "Rotational core exercise targeting the obliques.",
    instructions: [
      "Sit with knees bent and feet off the ground",
      "Lean back slightly to engage your core",
      "Rotate your torso from side to side",
      "Keep your core engaged throughout"
    ],
    muscles: ["Obliques", "Core"],
    equipment: "Bodyweight"
  }
];

export const exerciseCategories = ["Push", "Pull", "Legs", "Core"];