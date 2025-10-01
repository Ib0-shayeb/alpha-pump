-- Create comprehensive exercise database
-- This migration creates tables for exercises, categories, equipment, and muscle groups

-- Create exercise categories table
CREATE TABLE IF NOT EXISTS exercise_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create equipment table
CREATE TABLE IF NOT EXISTS equipment (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create muscle groups table
CREATE TABLE IF NOT EXISTS muscle_groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create exercises table
CREATE TABLE IF NOT EXISTS exercises (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  instructions TEXT[],
  category_id UUID REFERENCES exercise_categories(id) ON DELETE SET NULL,
  equipment_id UUID REFERENCES equipment(id) ON DELETE SET NULL,
  video_url VARCHAR(500),
  image_url VARCHAR(500),
  difficulty_level VARCHAR(20) CHECK (difficulty_level IN ('Beginner', 'Intermediate', 'Advanced')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create exercise muscle groups junction table
CREATE TABLE IF NOT EXISTS exercise_muscle_groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
  muscle_group_id UUID REFERENCES muscle_groups(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(exercise_id, muscle_group_id)
);

-- Create indexes for better performance
CREATE INDEX idx_exercises_category ON exercises(category_id);
CREATE INDEX idx_exercises_equipment ON exercises(equipment_id);
CREATE INDEX idx_exercises_name ON exercises(name);
CREATE INDEX idx_exercise_muscle_groups_exercise ON exercise_muscle_groups(exercise_id);
CREATE INDEX idx_exercise_muscle_groups_muscle ON exercise_muscle_groups(muscle_group_id);

-- Enable RLS
ALTER TABLE exercise_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE muscle_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_muscle_groups ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Allow everyone to read exercise data
CREATE POLICY "Anyone can view exercise categories" ON exercise_categories FOR SELECT USING (true);
CREATE POLICY "Anyone can view equipment" ON equipment FOR SELECT USING (true);
CREATE POLICY "Anyone can view muscle groups" ON muscle_groups FOR SELECT USING (true);
CREATE POLICY "Anyone can view exercises" ON exercises FOR SELECT USING (true);
CREATE POLICY "Anyone can view exercise muscle groups" ON exercise_muscle_groups FOR SELECT USING (true);

-- Insert exercise categories
INSERT INTO exercise_categories (name, description) VALUES
('Push', 'Exercises that involve pushing movements, primarily targeting chest, shoulders, and triceps'),
('Pull', 'Exercises that involve pulling movements, primarily targeting back, biceps, and rear delts'),
('Legs', 'Exercises that target the lower body including quadriceps, hamstrings, glutes, and calves'),
('Core', 'Exercises that target the abdominal muscles and core stability'),
('Cardio', 'Cardiovascular exercises for endurance and fat burning'),
('Flexibility', 'Stretching and mobility exercises'),
('Plyometric', 'Explosive movements for power and athleticism'),
('Functional', 'Movement patterns that mimic real-world activities');

-- Insert equipment types
INSERT INTO equipment (name, description) VALUES
('Bodyweight', 'No equipment required, using only body weight'),
('Barbell', 'Long metal bar with weights on both ends'),
('Dumbbell', 'Short bar with weights, used in pairs'),
('Kettlebell', 'Cast iron weight with a handle'),
('Cable Machine', 'Machine with adjustable cables and pulleys'),
('Resistance Bands', 'Elastic bands for resistance training'),
('Pull-up Bar', 'Horizontal bar for hanging exercises'),
('Bench', 'Adjustable bench for various exercises'),
('Squat Rack', 'Frame with safety bars for squatting'),
('Smith Machine', 'Barbell fixed in a vertical track'),
('Leg Press Machine', 'Machine for leg pressing movements'),
('Lat Pulldown Machine', 'Machine for lat pulldown exercises'),
('Chest Press Machine', 'Machine for chest pressing movements'),
('Treadmill', 'Cardio machine for running/walking'),
('Stationary Bike', 'Cardio machine for cycling'),
('Rowing Machine', 'Cardio machine that simulates rowing'),
('Medicine Ball', 'Weighted ball for various exercises'),
('TRX Suspension Trainer', 'Suspension training system'),
('Battle Ropes', 'Heavy ropes for cardio and strength'),
('Box/Platform', 'Raised platform for step-ups and jumps');

-- Insert muscle groups
INSERT INTO muscle_groups (name, description) VALUES
('Chest', 'Pectoral muscles'),
('Shoulders', 'Deltoid muscles'),
('Triceps', 'Back of the upper arm'),
('Biceps', 'Front of the upper arm'),
('Forearms', 'Muscles of the lower arm'),
('Lats', 'Latissimus dorsi - large back muscles'),
('Rhomboids', 'Muscles between shoulder blades'),
('Trapezius', 'Upper back and neck muscles'),
('Lower Back', 'Erector spinae and supporting muscles'),
('Abs', 'Rectus abdominis - six-pack muscles'),
('Obliques', 'Side abdominal muscles'),
('Transverse Abdominis', 'Deep core stabilizing muscles'),
('Quadriceps', 'Front thigh muscles'),
('Hamstrings', 'Back thigh muscles'),
('Glutes', 'Buttock muscles'),
('Calves', 'Lower leg muscles'),
('Adductors', 'Inner thigh muscles'),
('Abductors', 'Outer thigh muscles'),
('Core', 'All abdominal and stabilizing muscles'),
('Full Body', 'Multiple muscle groups simultaneously');
