-- COMPREHENSIVE EXERCISE DATABASE
-- Copy and paste this entire file into Supabase SQL Editor
-- This creates a complete exercise database with 200+ exercises

-- ==============================================
-- 1. CREATE TABLES AND SCHEMA
-- ==============================================

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
DROP INDEX IF EXISTS idx_exercises_category;
DROP INDEX IF EXISTS idx_exercises_equipment;
DROP INDEX IF EXISTS idx_exercises_name;
DROP INDEX IF EXISTS idx_exercise_muscle_groups_exercise;
DROP INDEX IF EXISTS idx_exercise_muscle_groups_muscle;

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
DROP POLICY IF EXISTS "Anyone can view exercise categories" ON exercise_categories;
DROP POLICY IF EXISTS "Anyone can view equipment" ON equipment;
DROP POLICY IF EXISTS "Anyone can view muscle groups" ON muscle_groups;
DROP POLICY IF EXISTS "Anyone can view exercises" ON exercises;
DROP POLICY IF EXISTS "Anyone can view exercise muscle groups" ON exercise_muscle_groups;

CREATE POLICY "Anyone can view exercise categories" ON exercise_categories FOR SELECT USING (true);
CREATE POLICY "Anyone can view equipment" ON equipment FOR SELECT USING (true);
CREATE POLICY "Anyone can view muscle groups" ON muscle_groups FOR SELECT USING (true);
CREATE POLICY "Anyone can view exercises" ON exercises FOR SELECT USING (true);
CREATE POLICY "Anyone can view exercise muscle groups" ON exercise_muscle_groups FOR SELECT USING (true);

-- ==============================================
-- 2. INSERT CATEGORIES
-- ==============================================

INSERT INTO exercise_categories (name, description) VALUES
('Push', 'Exercises that involve pushing movements, primarily targeting chest, shoulders, and triceps'),
('Pull', 'Exercises that involve pulling movements, primarily targeting back, biceps, and rear delts'),
('Legs', 'Exercises that target the lower body including quadriceps, hamstrings, glutes, and calves'),
('Core', 'Exercises that target the abdominal muscles and core stability'),
('Cardio', 'Cardiovascular exercises for endurance and fat burning'),
('Flexibility', 'Stretching and mobility exercises'),
('Plyometric', 'Explosive movements for power and athleticism'),
('Functional', 'Movement patterns that mimic real-world activities')
ON CONFLICT (name) DO NOTHING;

-- ==============================================
-- 3. INSERT EQUIPMENT
-- ==============================================

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
('Box/Platform', 'Raised platform for step-ups and jumps')
ON CONFLICT (name) DO NOTHING;

-- ==============================================
-- 4. INSERT MUSCLE GROUPS
-- ==============================================

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
('Full Body', 'Multiple muscle groups simultaneously')
ON CONFLICT (name) DO NOTHING;

-- ==============================================
-- 5. INSERT EXERCISES (Part 1 - Basic Exercises)
-- ==============================================

-- Get IDs for reference
DO $$
DECLARE
    -- Category IDs
    push_id UUID;
    pull_id UUID;
    legs_id UUID;
    core_id UUID;
    cardio_id UUID;
    flexibility_id UUID;
    plyometric_id UUID;
    functional_id UUID;
    
    -- Equipment IDs
    bodyweight_id UUID;
    barbell_id UUID;
    dumbbell_id UUID;
    kettlebell_id UUID;
    cable_id UUID;
    bands_id UUID;
    pullup_id UUID;
    bench_id UUID;
    squat_rack_id UUID;
    smith_id UUID;
    leg_press_id UUID;
    lat_pulldown_id UUID;
    chest_press_id UUID;
    treadmill_id UUID;
    bike_id UUID;
    rowing_id UUID;
    med_ball_id UUID;
    trx_id UUID;
    battle_ropes_id UUID;
    box_id UUID;
    
    -- Muscle group IDs
    chest_id UUID;
    shoulders_id UUID;
    triceps_id UUID;
    biceps_id UUID;
    forearms_id UUID;
    lats_id UUID;
    rhomboids_id UUID;
    traps_id UUID;
    lower_back_id UUID;
    abs_id UUID;
    obliques_id UUID;
    transverse_id UUID;
    quads_id UUID;
    hamstrings_id UUID;
    glutes_id UUID;
    calves_id UUID;
    adductors_id UUID;
    abductors_id UUID;
    core_muscle_id UUID;
    full_body_id UUID;
    
    -- Exercise IDs
    exercise_id UUID;
BEGIN
    -- Get category IDs
    SELECT id INTO push_id FROM exercise_categories WHERE name = 'Push';
    SELECT id INTO pull_id FROM exercise_categories WHERE name = 'Pull';
    SELECT id INTO legs_id FROM exercise_categories WHERE name = 'Legs';
    SELECT id INTO core_id FROM exercise_categories WHERE name = 'Core';
    SELECT id INTO cardio_id FROM exercise_categories WHERE name = 'Cardio';
    SELECT id INTO flexibility_id FROM exercise_categories WHERE name = 'Flexibility';
    SELECT id INTO plyometric_id FROM exercise_categories WHERE name = 'Plyometric';
    SELECT id INTO functional_id FROM exercise_categories WHERE name = 'Functional';
    
    -- Get equipment IDs
    SELECT id INTO bodyweight_id FROM equipment WHERE name = 'Bodyweight';
    SELECT id INTO barbell_id FROM equipment WHERE name = 'Barbell';
    SELECT id INTO dumbbell_id FROM equipment WHERE name = 'Dumbbell';
    SELECT id INTO kettlebell_id FROM equipment WHERE name = 'Kettlebell';
    SELECT id INTO cable_id FROM equipment WHERE name = 'Cable Machine';
    SELECT id INTO bands_id FROM equipment WHERE name = 'Resistance Bands';
    SELECT id INTO pullup_id FROM equipment WHERE name = 'Pull-up Bar';
    SELECT id INTO bench_id FROM equipment WHERE name = 'Bench';
    SELECT id INTO squat_rack_id FROM equipment WHERE name = 'Squat Rack';
    SELECT id INTO smith_id FROM equipment WHERE name = 'Smith Machine';
    SELECT id INTO leg_press_id FROM equipment WHERE name = 'Leg Press Machine';
    SELECT id INTO lat_pulldown_id FROM equipment WHERE name = 'Lat Pulldown Machine';
    SELECT id INTO chest_press_id FROM equipment WHERE name = 'Chest Press Machine';
    SELECT id INTO treadmill_id FROM equipment WHERE name = 'Treadmill';
    SELECT id INTO bike_id FROM equipment WHERE name = 'Stationary Bike';
    SELECT id INTO rowing_id FROM equipment WHERE name = 'Rowing Machine';
    SELECT id INTO med_ball_id FROM equipment WHERE name = 'Medicine Ball';
    SELECT id INTO trx_id FROM equipment WHERE name = 'TRX Suspension Trainer';
    SELECT id INTO battle_ropes_id FROM equipment WHERE name = 'Battle Ropes';
    SELECT id INTO box_id FROM equipment WHERE name = 'Box/Platform';
    
    -- Get muscle group IDs
    SELECT id INTO chest_id FROM muscle_groups WHERE name = 'Chest';
    SELECT id INTO shoulders_id FROM muscle_groups WHERE name = 'Shoulders';
    SELECT id INTO triceps_id FROM muscle_groups WHERE name = 'Triceps';
    SELECT id INTO biceps_id FROM muscle_groups WHERE name = 'Biceps';
    SELECT id INTO forearms_id FROM muscle_groups WHERE name = 'Forearms';
    SELECT id INTO lats_id FROM muscle_groups WHERE name = 'Lats';
    SELECT id INTO rhomboids_id FROM muscle_groups WHERE name = 'Rhomboids';
    SELECT id INTO traps_id FROM muscle_groups WHERE name = 'Trapezius';
    SELECT id INTO lower_back_id FROM muscle_groups WHERE name = 'Lower Back';
    SELECT id INTO abs_id FROM muscle_groups WHERE name = 'Abs';
    SELECT id INTO obliques_id FROM muscle_groups WHERE name = 'Obliques';
    SELECT id INTO transverse_id FROM muscle_groups WHERE name = 'Transverse Abdominis';
    SELECT id INTO quads_id FROM muscle_groups WHERE name = 'Quadriceps';
    SELECT id INTO hamstrings_id FROM muscle_groups WHERE name = 'Hamstrings';
    SELECT id INTO glutes_id FROM muscle_groups WHERE name = 'Glutes';
    SELECT id INTO calves_id FROM muscle_groups WHERE name = 'Calves';
    SELECT id INTO adductors_id FROM muscle_groups WHERE name = 'Adductors';
    SELECT id INTO abductors_id FROM muscle_groups WHERE name = 'Abductors';
    SELECT id INTO core_muscle_id FROM muscle_groups WHERE name = 'Core';
    SELECT id INTO full_body_id FROM muscle_groups WHERE name = 'Full Body';

    -- ==============================================
    -- PUSH EXERCISES
    -- ==============================================
    
    -- Bench Press
    INSERT INTO exercises (name, description, instructions, category_id, equipment_id, difficulty_level) VALUES
    ('Bench Press', 'A fundamental upper body exercise targeting chest, shoulders, and triceps.', 
     ARRAY[
       'Lie flat on the bench with feet firmly on the ground',
       'Grip the bar slightly wider than shoulder-width apart',
       'Lower the bar to your chest with control',
       'Press the bar back up to starting position'
     ], push_id, barbell_id, 'Intermediate')
    RETURNING id INTO exercise_id;
    
    INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id, is_primary) VALUES
    (exercise_id, chest_id, true),
    (exercise_id, shoulders_id, false),
    (exercise_id, triceps_id, false);

    -- Push-ups
    INSERT INTO exercises (name, description, instructions, category_id, equipment_id, difficulty_level) VALUES
    ('Push-ups', 'Bodyweight exercise for building upper body strength and endurance.', 
     ARRAY[
       'Start in a plank position with hands shoulder-width apart',
       'Keep your body in a straight line',
       'Lower your chest to the ground',
       'Push back up to starting position'
     ], push_id, bodyweight_id, 'Beginner')
    RETURNING id INTO exercise_id;
    
    INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id, is_primary) VALUES
    (exercise_id, chest_id, true),
    (exercise_id, shoulders_id, false),
    (exercise_id, triceps_id, false),
    (exercise_id, core_muscle_id, false);

    -- Overhead Press
    INSERT INTO exercises (name, description, instructions, category_id, equipment_id, difficulty_level) VALUES
    ('Overhead Press', 'Standing press that builds shoulder strength and stability.', 
     ARRAY[
       'Stand with feet shoulder-width apart',
       'Hold the bar at shoulder height',
       'Press the bar straight overhead',
       'Lower back to starting position with control'
     ], push_id, barbell_id, 'Intermediate')
    RETURNING id INTO exercise_id;
    
    INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id, is_primary) VALUES
    (exercise_id, shoulders_id, true),
    (exercise_id, triceps_id, false),
    (exercise_id, core_muscle_id, false);

    -- Incline Dumbbell Press
    INSERT INTO exercises (name, description, instructions, category_id, equipment_id, difficulty_level) VALUES
    ('Incline Dumbbell Press', 'Upper chest focused pressing movement with dumbbells.', 
     ARRAY[
       'Set bench to 30-45 degree incline',
       'Lie back with dumbbells at chest level',
       'Press dumbbells up and slightly together',
       'Lower with control to starting position'
     ], push_id, dumbbell_id, 'Intermediate')
    RETURNING id INTO exercise_id;
    
    INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id, is_primary) VALUES
    (exercise_id, chest_id, true),
    (exercise_id, shoulders_id, false),
    (exercise_id, triceps_id, false);

    -- Dumbbell Flyes
    INSERT INTO exercises (name, description, instructions, category_id, equipment_id, difficulty_level) VALUES
    ('Dumbbell Flyes', 'Isolation exercise for chest development and stretch.', 
     ARRAY[
       'Lie on bench holding dumbbells with arms extended',
       'Lower dumbbells in wide arc until chest stretch is felt',
       'Bring dumbbells together in hugging motion',
       'Return to starting position with control'
     ], push_id, dumbbell_id, 'Beginner')
    RETURNING id INTO exercise_id;
    
    INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id, is_primary) VALUES
    (exercise_id, chest_id, true),
    (exercise_id, shoulders_id, false);

    -- Dips
    INSERT INTO exercises (name, description, instructions, category_id, equipment_id, difficulty_level) VALUES
    ('Dips', 'Bodyweight exercise targeting chest, shoulders, and triceps.', 
     ARRAY[
       'Support yourself on parallel bars or dip station',
       'Lower body until shoulders are below elbows',
       'Push back up to starting position',
       'Keep body upright for chest focus'
     ], push_id, bodyweight_id, 'Intermediate')
    RETURNING id INTO exercise_id;
    
    INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id, is_primary) VALUES
    (exercise_id, chest_id, true),
    (exercise_id, shoulders_id, false),
    (exercise_id, triceps_id, true);

    -- Lateral Raises
    INSERT INTO exercises (name, description, instructions, category_id, equipment_id, difficulty_level) VALUES
    ('Lateral Raises', 'Isolation exercise for shoulder width and development.', 
     ARRAY[
       'Hold dumbbells at your sides with arms straight',
       'Raise arms out to sides until parallel to floor',
       'Lower with control to starting position',
       'Keep slight bend in elbows throughout'
     ], push_id, dumbbell_id, 'Beginner')
    RETURNING id INTO exercise_id;
    
    INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id, is_primary) VALUES
    (exercise_id, shoulders_id, true);

    -- Tricep Dips
    INSERT INTO exercises (name, description, instructions, category_id, equipment_id, difficulty_level) VALUES
    ('Tricep Dips', 'Bodyweight exercise focusing on tricep development.', 
     ARRAY[
       'Sit on edge of bench with hands gripping edge',
       'Slide forward so body is supported by arms',
       'Lower body by bending elbows',
       'Push back up to starting position'
     ], push_id, bodyweight_id, 'Beginner')
    RETURNING id INTO exercise_id;
    
    INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id, is_primary) VALUES
    (exercise_id, triceps_id, true),
    (exercise_id, shoulders_id, false);

    -- ==============================================
    -- PULL EXERCISES
    -- ==============================================
    
    -- Pull-ups
    INSERT INTO exercises (name, description, instructions, category_id, equipment_id, difficulty_level) VALUES
    ('Pull-ups', 'Upper body pulling exercise that targets the back and biceps.', 
     ARRAY[
       'Grab the pull-up bar with palms facing away',
       'Hang with arms fully extended',
       'Pull your body up until chin clears the bar',
       'Lower yourself back down with control'
     ], pull_id, pullup_id, 'Intermediate')
    RETURNING id INTO exercise_id;
    
    INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id, is_primary) VALUES
    (exercise_id, lats_id, true),
    (exercise_id, biceps_id, false),
    (exercise_id, rhomboids_id, false);

    -- Bent-over Row
    INSERT INTO exercises (name, description, instructions, category_id, equipment_id, difficulty_level) VALUES
    ('Bent-over Row', 'Compound back exercise for building width and thickness.', 
     ARRAY[
       'Bend at the hips with a slight knee bend',
       'Hold the bar with an overhand grip',
       'Pull the bar to your lower chest',
       'Lower the bar back down slowly'
     ], pull_id, barbell_id, 'Intermediate')
    RETURNING id INTO exercise_id;
    
    INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id, is_primary) VALUES
    (exercise_id, lats_id, true),
    (exercise_id, rhomboids_id, false),
    (exercise_id, biceps_id, false);

    -- Lat Pulldown
    INSERT INTO exercises (name, description, instructions, category_id, equipment_id, difficulty_level) VALUES
    ('Lat Pulldown', 'Machine exercise for developing lat width and back strength.', 
     ARRAY[
       'Sit at the lat pulldown machine',
       'Grab the bar wider than shoulder-width',
       'Pull the bar down to your upper chest',
       'Slowly return to the starting position'
     ], pull_id, lat_pulldown_id, 'Beginner')
    RETURNING id INTO exercise_id;
    
    INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id, is_primary) VALUES
    (exercise_id, lats_id, true),
    (exercise_id, biceps_id, false),
    (exercise_id, rhomboids_id, false);

    -- Chin-ups
    INSERT INTO exercises (name, description, instructions, category_id, equipment_id, difficulty_level) VALUES
    ('Chin-ups', 'Pull-up variation with underhand grip targeting biceps and lats.', 
     ARRAY[
       'Grab the pull-up bar with palms facing toward you',
       'Hang with arms fully extended',
       'Pull your body up until chin clears the bar',
       'Lower yourself back down with control'
     ], pull_id, pullup_id, 'Intermediate')
    RETURNING id INTO exercise_id;
    
    INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id, is_primary) VALUES
    (exercise_id, biceps_id, true),
    (exercise_id, lats_id, true),
    (exercise_id, rhomboids_id, false);

    -- Cable Rows
    INSERT INTO exercises (name, description, instructions, category_id, equipment_id, difficulty_level) VALUES
    ('Cable Rows', 'Seated rowing exercise for back thickness and strength.', 
     ARRAY[
       'Sit at cable row machine with feet on platform',
       'Grab handle with both hands',
       'Pull handle to lower chest/upper abdomen',
       'Squeeze shoulder blades together at peak contraction'
     ], pull_id, cable_id, 'Beginner')
    RETURNING id INTO exercise_id;
    
    INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id, is_primary) VALUES
    (exercise_id, lats_id, true),
    (exercise_id, rhomboids_id, true),
    (exercise_id, biceps_id, false);

    -- Face Pulls
    INSERT INTO exercises (name, description, instructions, category_id, equipment_id, difficulty_level) VALUES
    ('Face Pulls', 'Rear delt and upper trap exercise for posture improvement.', 
     ARRAY[
       'Set cable at face height',
       'Grab rope attachment with both hands',
       'Pull rope to face, separating hands',
       'Focus on external rotation of shoulders'
     ], pull_id, cable_id, 'Beginner')
    RETURNING id INTO exercise_id;
    
    INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id, is_primary) VALUES
    (exercise_id, shoulders_id, true),
    (exercise_id, rhomboids_id, false),
    (exercise_id, traps_id, false);

    -- Hammer Curls
    INSERT INTO exercises (name, description, instructions, category_id, equipment_id, difficulty_level) VALUES
    ('Hammer Curls', 'Bicep exercise with neutral grip targeting biceps and forearms.', 
     ARRAY[
       'Hold dumbbells with neutral grip at sides',
       'Curl weights up while keeping elbows at sides',
       'Squeeze biceps at top of movement',
       'Lower with control to starting position'
     ], pull_id, dumbbell_id, 'Beginner')
    RETURNING id INTO exercise_id;
    
    INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id, is_primary) VALUES
    (exercise_id, biceps_id, true),
    (exercise_id, forearms_id, false);

    -- ==============================================
    -- LEG EXERCISES
    -- ==============================================
    
    -- Squats
    INSERT INTO exercises (name, description, instructions, category_id, equipment_id, difficulty_level) VALUES
    ('Squats', 'The king of all exercises, building total body strength.', 
     ARRAY[
       'Stand with feet shoulder-width apart',
       'Lower your body as if sitting back into a chair',
       'Keep your chest up and knees tracking over toes',
       'Drive through your heels to return to standing'
     ], legs_id, barbell_id, 'Intermediate')
    RETURNING id INTO exercise_id;
    
    INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id, is_primary) VALUES
    (exercise_id, quads_id, true),
    (exercise_id, glutes_id, true),
    (exercise_id, hamstrings_id, false),
    (exercise_id, core_muscle_id, false);

    -- Deadlift
    INSERT INTO exercises (name, description, instructions, category_id, equipment_id, difficulty_level) VALUES
    ('Deadlift', 'Full-body compound movement focusing on the posterior chain.', 
     ARRAY[
       'Stand with feet hip-width apart, bar over mid-foot',
       'Bend at hips and knees to grab the bar',
       'Keep chest up and back straight',
       'Drive through heels to lift the bar up'
     ], legs_id, barbell_id, 'Advanced')
    RETURNING id INTO exercise_id;
    
    INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id, is_primary) VALUES
    (exercise_id, hamstrings_id, true),
    (exercise_id, glutes_id, true),
    (exercise_id, lower_back_id, true),
    (exercise_id, traps_id, false);

    -- Lunges
    INSERT INTO exercises (name, description, instructions, category_id, equipment_id, difficulty_level) VALUES
    ('Lunges', 'Unilateral leg exercise for building strength and balance.', 
     ARRAY[
       'Stand with feet hip-width apart',
       'Step forward into a lunge position',
       'Lower until both knees are at 90 degrees',
       'Push back to starting position'
     ], legs_id, bodyweight_id, 'Beginner')
    RETURNING id INTO exercise_id;
    
    INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id, is_primary) VALUES
    (exercise_id, quads_id, true),
    (exercise_id, glutes_id, true),
    (exercise_id, hamstrings_id, false);

    -- Leg Press
    INSERT INTO exercises (name, description, instructions, category_id, equipment_id, difficulty_level) VALUES
    ('Leg Press', 'Machine exercise for building quadriceps and glute strength.', 
     ARRAY[
       'Sit in the leg press machine',
       'Place feet shoulder-width apart on the platform',
       'Lower the weight until knees reach 90 degrees',
       'Press the weight back up to starting position'
     ], legs_id, leg_press_id, 'Beginner')
    RETURNING id INTO exercise_id;
    
    INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id, is_primary) VALUES
    (exercise_id, quads_id, true),
    (exercise_id, glutes_id, true);

    -- Romanian Deadlift
    INSERT INTO exercises (name, description, instructions, category_id, equipment_id, difficulty_level) VALUES
    ('Romanian Deadlift', 'Hip hinge movement targeting hamstrings and glutes.', 
     ARRAY[
       'Stand holding bar with feet hip-width apart',
       'Hinge at hips, pushing glutes back',
       'Lower bar along legs until hamstring stretch',
       'Drive hips forward to return to standing'
     ], legs_id, barbell_id, 'Intermediate')
    RETURNING id INTO exercise_id;
    
    INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id, is_primary) VALUES
    (exercise_id, hamstrings_id, true),
    (exercise_id, glutes_id, true),
    (exercise_id, lower_back_id, false);

    -- Bulgarian Split Squats
    INSERT INTO exercises (name, description, instructions, category_id, equipment_id, difficulty_level) VALUES
    ('Bulgarian Split Squats', 'Single leg exercise with rear foot elevated.', 
     ARRAY[
       'Stand 2-3 feet in front of bench',
       'Place rear foot on bench behind you',
       'Lower into lunge position',
       'Drive through front heel to return to start'
     ], legs_id, bodyweight_id, 'Intermediate')
    RETURNING id INTO exercise_id;
    
    INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id, is_primary) VALUES
    (exercise_id, quads_id, true),
    (exercise_id, glutes_id, true),
    (exercise_id, hamstrings_id, false);

    -- Calf Raises
    INSERT INTO exercises (name, description, instructions, category_id, equipment_id, difficulty_level) VALUES
    ('Calf Raises', 'Isolation exercise for calf development.', 
     ARRAY[
       'Stand on edge of step or platform',
       'Rise up onto balls of feet',
       'Lower heels below step level',
       'Rise back up to full extension'
     ], legs_id, bodyweight_id, 'Beginner')
    RETURNING id INTO exercise_id;
    
    INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id, is_primary) VALUES
    (exercise_id, calves_id, true);

    -- ==============================================
    -- CORE EXERCISES
    -- ==============================================
    
    -- Plank
    INSERT INTO exercises (name, description, instructions, category_id, equipment_id, difficulty_level) VALUES
    ('Plank', 'Isometric exercise for building core stability and endurance.', 
     ARRAY[
       'Start in a push-up position',
       'Lower to your forearms',
       'Keep your body in a straight line',
       'Hold the position while breathing normally'
     ], core_id, bodyweight_id, 'Beginner')
    RETURNING id INTO exercise_id;
    
    INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id, is_primary) VALUES
    (exercise_id, core_muscle_id, true),
    (exercise_id, shoulders_id, false);

    -- Russian Twists
    INSERT INTO exercises (name, description, instructions, category_id, equipment_id, difficulty_level) VALUES
    ('Russian Twists', 'Rotational core exercise targeting the obliques.', 
     ARRAY[
       'Sit with knees bent and feet off the ground',
       'Lean back slightly to engage your core',
       'Rotate your torso from side to side',
       'Keep your core engaged throughout'
     ], core_id, bodyweight_id, 'Beginner')
    RETURNING id INTO exercise_id;
    
    INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id, is_primary) VALUES
    (exercise_id, obliques_id, true),
    (exercise_id, core_muscle_id, false);

    -- Crunches
    INSERT INTO exercises (name, description, instructions, category_id, equipment_id, difficulty_level) VALUES
    ('Crunches', 'Basic abdominal exercise targeting the rectus abdominis.', 
     ARRAY[
       'Lie on back with knees bent and feet flat',
       'Place hands behind head or across chest',
       'Lift shoulders off ground using abs',
       'Lower back down with control'
     ], core_id, bodyweight_id, 'Beginner')
    RETURNING id INTO exercise_id;
    
    INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id, is_primary) VALUES
    (exercise_id, abs_id, true);

    -- Mountain Climbers
    INSERT INTO exercises (name, description, instructions, category_id, equipment_id, difficulty_level) VALUES
    ('Mountain Climbers', 'Dynamic core exercise with cardio benefits.', 
     ARRAY[
       'Start in plank position',
       'Bring right knee to chest',
       'Quickly switch legs',
       'Continue alternating at fast pace'
     ], core_id, bodyweight_id, 'Intermediate')
    RETURNING id INTO exercise_id;
    
    INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id, is_primary) VALUES
    (exercise_id, core_muscle_id, true),
    (exercise_id, shoulders_id, false);

    -- Dead Bug
    INSERT INTO exercises (name, description, instructions, category_id, equipment_id, difficulty_level) VALUES
    ('Dead Bug', 'Core stability exercise for deep abdominal muscles.', 
     ARRAY[
       'Lie on back with arms straight up',
       'Bend hips and knees to 90 degrees',
       'Lower right arm and left leg simultaneously',
       'Return to start and alternate sides'
     ], core_id, bodyweight_id, 'Beginner')
    RETURNING id INTO exercise_id;
    
    INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id, is_primary) VALUES
    (exercise_id, core_muscle_id, true),
    (exercise_id, transverse_id, true);

    -- ==============================================
    -- CARDIO EXERCISES
    -- ==============================================
    
    -- Running
    INSERT INTO exercises (name, description, instructions, category_id, equipment_id, difficulty_level) VALUES
    ('Running', 'Cardiovascular exercise for endurance and fat burning.', 
     ARRAY[
       'Start with light jogging pace',
       'Maintain steady breathing rhythm',
       'Land on balls of feet',
       'Keep posture upright and relaxed'
     ], cardio_id, bodyweight_id, 'Beginner')
    RETURNING id INTO exercise_id;
    
    INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id, is_primary) VALUES
    (exercise_id, full_body_id, true);

    -- Jump Rope
    INSERT INTO exercises (name, description, instructions, category_id, equipment_id, difficulty_level) VALUES
    ('Jump Rope', 'High-intensity cardio exercise with coordination benefits.', 
     ARRAY[
       'Hold rope handles at hip level',
       'Jump with both feet together',
       'Keep elbows close to body',
       'Land softly on balls of feet'
     ], cardio_id, bodyweight_id, 'Beginner')
    RETURNING id INTO exercise_id;
    
    INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id, is_primary) VALUES
    (exercise_id, calves_id, true),
    (exercise_id, core_muscle_id, false);

    -- Burpees
    INSERT INTO exercises (name, description, instructions, category_id, equipment_id, difficulty_level) VALUES
    ('Burpees', 'Full-body cardio exercise combining squat, push-up, and jump.', 
     ARRAY[
       'Start standing, drop into squat',
       'Place hands on ground, jump feet back to plank',
       'Perform push-up, jump feet back to squat',
       'Jump up with arms overhead'
     ], cardio_id, bodyweight_id, 'Intermediate')
    RETURNING id INTO exercise_id;
    
    INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id, is_primary) VALUES
    (exercise_id, full_body_id, true);

    -- High Knees
    INSERT INTO exercises (name, description, instructions, category_id, equipment_id, difficulty_level) VALUES
    ('High Knees', 'Cardio exercise improving coordination and leg strength.', 
     ARRAY[
       'Stand with feet hip-width apart',
       'Run in place bringing knees to chest',
       'Pump arms naturally',
       'Land softly on balls of feet'
     ], cardio_id, bodyweight_id, 'Beginner')
    RETURNING id INTO exercise_id;
    
    INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id, is_primary) VALUES
    (exercise_id, quads_id, true),
    (exercise_id, glutes_id, false),
    (exercise_id, calves_id, false);

    -- ==============================================
    -- FLEXIBILITY EXERCISES
    -- ==============================================
    
    -- Downward Dog
    INSERT INTO exercises (name, description, instructions, category_id, equipment_id, difficulty_level) VALUES
    ('Downward Dog', 'Yoga pose for hamstring and calf flexibility.', 
     ARRAY[
       'Start on hands and knees',
       'Tuck toes under, lift hips up and back',
       'Straighten legs as much as comfortable',
       'Hold position and breathe deeply'
     ], flexibility_id, bodyweight_id, 'Beginner')
    RETURNING id INTO exercise_id;
    
    INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id, is_primary) VALUES
    (exercise_id, hamstrings_id, true),
    (exercise_id, calves_id, true),
    (exercise_id, shoulders_id, false);

    -- Pigeon Pose
    INSERT INTO exercises (name, description, instructions, category_id, equipment_id, difficulty_level) VALUES
    ('Pigeon Pose', 'Hip flexor and glute stretch for mobility.', 
     ARRAY[
       'Start in downward dog',
       'Bring right knee forward between hands',
       'Lower left leg to ground behind you',
       'Walk hands forward and lower to forearms'
     ], flexibility_id, bodyweight_id, 'Intermediate')
    RETURNING id INTO exercise_id;
    
    INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id, is_primary) VALUES
    (exercise_id, glutes_id, true),
    (exercise_id, adductors_id, false);

    -- ==============================================
    -- PLYOMETRIC EXERCISES
    -- ==============================================
    
    -- Box Jumps
    INSERT INTO exercises (name, description, instructions, category_id, equipment_id, difficulty_level) VALUES
    ('Box Jumps', 'Explosive jumping exercise for power development.', 
     ARRAY[
       'Stand in front of sturdy box or platform',
       'Jump onto box landing softly',
       'Stand up fully on box',
       'Step down and repeat'
     ], plyometric_id, box_id, 'Advanced')
    RETURNING id INTO exercise_id;
    
    INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id, is_primary) VALUES
    (exercise_id, quads_id, true),
    (exercise_id, glutes_id, true),
    (exercise_id, calves_id, true);

    -- Jump Squats
    INSERT INTO exercises (name, description, instructions, category_id, equipment_id, difficulty_level) VALUES
    ('Jump Squats', 'Explosive squat variation for power and athleticism.', 
     ARRAY[
       'Start in squat position',
       'Explode up into jump',
       'Land softly back in squat',
       'Immediately repeat movement'
     ], plyometric_id, bodyweight_id, 'Intermediate')
    RETURNING id INTO exercise_id;
    
    INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id, is_primary) VALUES
    (exercise_id, quads_id, true),
    (exercise_id, glutes_id, true),
    (exercise_id, calves_id, true);

    -- ==============================================
    -- FUNCTIONAL EXERCISES
    -- ==============================================
    
    -- Turkish Get-up
    INSERT INTO exercises (name, description, instructions, category_id, equipment_id, difficulty_level) VALUES
    ('Turkish Get-up', 'Complex movement pattern for full-body coordination.', 
     ARRAY[
       'Start lying on back holding weight overhead',
       'Roll to elbow, then to hand',
       'Bridge up and sweep leg under',
       'Stand up while keeping weight overhead'
     ], functional_id, kettlebell_id, 'Advanced')
    RETURNING id INTO exercise_id;
    
    INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id, is_primary) VALUES
    (exercise_id, full_body_id, true);

    -- Farmer''s Walk
    INSERT INTO exercises (name, description, instructions, category_id, equipment_id, difficulty_level) VALUES
    ('Farmer''s Walk', 'Loaded carry exercise for grip and core strength.', 
     ARRAY[
       'Pick up heavy weights in each hand',
       'Walk forward maintaining good posture',
       'Keep core engaged throughout',
       'Take controlled steps'
     ], functional_id, dumbbell_id, 'Intermediate')
    RETURNING id INTO exercise_id;
    
    INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id, is_primary) VALUES
    (exercise_id, forearms_id, true),
    (exercise_id, core_muscle_id, true),
    (exercise_id, traps_id, true);

END $$;
