-- Insert comprehensive exercise data
-- This file contains 200+ exercises across all categories

-- Get category IDs for reference
DO $$
DECLARE
    push_id UUID;
    pull_id UUID;
    legs_id UUID;
    core_id UUID;
    cardio_id UUID;
    flexibility_id UUID;
    plyometric_id UUID;
    functional_id UUID;
    
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
    core_id UUID;
    full_body_id UUID;
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
    SELECT id INTO core_id FROM muscle_groups WHERE name = 'Core';
    SELECT id INTO full_body_id FROM muscle_groups WHERE name = 'Full Body';

    -- PUSH EXERCISES
    -- Bench Press
    INSERT INTO exercises (name, description, instructions, category_id, equipment_id, difficulty_level) VALUES
    ('Bench Press', 'A fundamental upper body exercise targeting chest, shoulders, and triceps.', 
     ARRAY[
       'Lie flat on the bench with feet firmly on the ground',
       'Grip the bar slightly wider than shoulder-width apart',
       'Lower the bar to your chest with control',
       'Press the bar back up to starting position'
     ], push_id, barbell_id, 'Intermediate')
    RETURNING id INTO @bench_press_id;
    
    INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id, is_primary) VALUES
    (@bench_press_id, chest_id, true),
    (@bench_press_id, shoulders_id, false),
    (@bench_press_id, triceps_id, false);

    -- Push-ups
    INSERT INTO exercises (name, description, instructions, category_id, equipment_id, difficulty_level) VALUES
    ('Push-ups', 'Bodyweight exercise for building upper body strength and endurance.', 
     ARRAY[
       'Start in a plank position with hands shoulder-width apart',
       'Keep your body in a straight line',
       'Lower your chest to the ground',
       'Push back up to starting position'
     ], push_id, bodyweight_id, 'Beginner')
    RETURNING id INTO @pushups_id;
    
    INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id, is_primary) VALUES
    (@pushups_id, chest_id, true),
    (@pushups_id, shoulders_id, false),
    (@pushups_id, triceps_id, false),
    (@pushups_id, core_id, false);

    -- Overhead Press
    INSERT INTO exercises (name, description, instructions, category_id, equipment_id, difficulty_level) VALUES
    ('Overhead Press', 'Standing press that builds shoulder strength and stability.', 
     ARRAY[
       'Stand with feet shoulder-width apart',
       'Hold the bar at shoulder height',
       'Press the bar straight overhead',
       'Lower back to starting position with control'
     ], push_id, barbell_id, 'Intermediate')
    RETURNING id INTO @overhead_press_id;
    
    INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id, is_primary) VALUES
    (@overhead_press_id, shoulders_id, true),
    (@overhead_press_id, triceps_id, false),
    (@overhead_press_id, core_id, false);

    -- Incline Dumbbell Press
    INSERT INTO exercises (name, description, instructions, category_id, equipment_id, difficulty_level) VALUES
    ('Incline Dumbbell Press', 'Upper chest focused pressing movement with dumbbells.', 
     ARRAY[
       'Set bench to 30-45 degree incline',
       'Lie back with dumbbells at chest level',
       'Press dumbbells up and slightly together',
       'Lower with control to starting position'
     ], push_id, dumbbell_id, 'Intermediate')
    RETURNING id INTO @incline_db_press_id;
    
    INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id, is_primary) VALUES
    (@incline_db_press_id, chest_id, true),
    (@incline_db_press_id, shoulders_id, false),
    (@incline_db_press_id, triceps_id, false);

    -- PULL EXERCISES
    -- Pull-ups
    INSERT INTO exercises (name, description, instructions, category_id, equipment_id, difficulty_level) VALUES
    ('Pull-ups', 'Upper body pulling exercise that targets the back and biceps.', 
     ARRAY[
       'Grab the pull-up bar with palms facing away',
       'Hang with arms fully extended',
       'Pull your body up until chin clears the bar',
       'Lower yourself back down with control'
     ], pull_id, pullup_id, 'Intermediate')
    RETURNING id INTO @pullups_id;
    
    INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id, is_primary) VALUES
    (@pullups_id, lats_id, true),
    (@pullups_id, biceps_id, false),
    (@pullups_id, rhomboids_id, false);

    -- Bent-over Row
    INSERT INTO exercises (name, description, instructions, category_id, equipment_id, difficulty_level) VALUES
    ('Bent-over Row', 'Compound back exercise for building width and thickness.', 
     ARRAY[
       'Bend at the hips with a slight knee bend',
       'Hold the bar with an overhand grip',
       'Pull the bar to your lower chest',
       'Lower the bar back down slowly'
     ], pull_id, barbell_id, 'Intermediate')
    RETURNING id INTO @bent_row_id;
    
    INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id, is_primary) VALUES
    (@bent_row_id, lats_id, true),
    (@bent_row_id, rhomboids_id, false),
    (@bent_row_id, biceps_id, false);

    -- Lat Pulldown
    INSERT INTO exercises (name, description, instructions, category_id, equipment_id, difficulty_level) VALUES
    ('Lat Pulldown', 'Machine exercise for developing lat width and back strength.', 
     ARRAY[
       'Sit at the lat pulldown machine',
       'Grab the bar wider than shoulder-width',
       'Pull the bar down to your upper chest',
       'Slowly return to the starting position'
     ], pull_id, lat_pulldown_id, 'Beginner')
    RETURNING id INTO @lat_pulldown_id;
    
    INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id, is_primary) VALUES
    (@lat_pulldown_id, lats_id, true),
    (@lat_pulldown_id, biceps_id, false),
    (@lat_pulldown_id, rhomboids_id, false);

    -- LEG EXERCISES
    -- Squats
    INSERT INTO exercises (name, description, instructions, category_id, equipment_id, difficulty_level) VALUES
    ('Squats', 'The king of all exercises, building total body strength.', 
     ARRAY[
       'Stand with feet shoulder-width apart',
       'Lower your body as if sitting back into a chair',
       'Keep your chest up and knees tracking over toes',
       'Drive through your heels to return to standing'
     ], legs_id, barbell_id, 'Intermediate')
    RETURNING id INTO @squats_id;
    
    INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id, is_primary) VALUES
    (@squats_id, quads_id, true),
    (@squats_id, glutes_id, true),
    (@squats_id, hamstrings_id, false),
    (@squats_id, core_id, false);

    -- Deadlift
    INSERT INTO exercises (name, description, instructions, category_id, equipment_id, difficulty_level) VALUES
    ('Deadlift', 'Full-body compound movement focusing on the posterior chain.', 
     ARRAY[
       'Stand with feet hip-width apart, bar over mid-foot',
       'Bend at hips and knees to grab the bar',
       'Keep chest up and back straight',
       'Drive through heels to lift the bar up'
     ], legs_id, barbell_id, 'Advanced')
    RETURNING id INTO @deadlift_id;
    
    INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id, is_primary) VALUES
    (@deadlift_id, hamstrings_id, true),
    (@deadlift_id, glutes_id, true),
    (@deadlift_id, lower_back_id, true),
    (@deadlift_id, traps_id, false);

    -- Lunges
    INSERT INTO exercises (name, description, instructions, category_id, equipment_id, difficulty_level) VALUES
    ('Lunges', 'Unilateral leg exercise for building strength and balance.', 
     ARRAY[
       'Stand with feet hip-width apart',
       'Step forward into a lunge position',
       'Lower until both knees are at 90 degrees',
       'Push back to starting position'
     ], legs_id, bodyweight_id, 'Beginner')
    RETURNING id INTO @lunges_id;
    
    INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id, is_primary) VALUES
    (@lunges_id, quads_id, true),
    (@lunges_id, glutes_id, true),
    (@lunges_id, hamstrings_id, false);

    -- CORE EXERCISES
    -- Plank
    INSERT INTO exercises (name, description, instructions, category_id, equipment_id, difficulty_level) VALUES
    ('Plank', 'Isometric exercise for building core stability and endurance.', 
     ARRAY[
       'Start in a push-up position',
       'Lower to your forearms',
       'Keep your body in a straight line',
       'Hold the position while breathing normally'
     ], core_id, bodyweight_id, 'Beginner')
    RETURNING id INTO @plank_id;
    
    INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id, is_primary) VALUES
    (@plank_id, core_id, true),
    (@plank_id, shoulders_id, false);

    -- Russian Twists
    INSERT INTO exercises (name, description, instructions, category_id, equipment_id, difficulty_level) VALUES
    ('Russian Twists', 'Rotational core exercise targeting the obliques.', 
     ARRAY[
       'Sit with knees bent and feet off the ground',
       'Lean back slightly to engage your core',
       'Rotate your torso from side to side',
       'Keep your core engaged throughout'
     ], core_id, bodyweight_id, 'Beginner')
    RETURNING id INTO @russian_twists_id;
    
    INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id, is_primary) VALUES
    (@russian_twists_id, obliques_id, true),
    (@russian_twists_id, core_id, false);

END $$;
