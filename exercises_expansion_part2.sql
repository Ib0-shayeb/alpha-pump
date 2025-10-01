-- COMPREHENSIVE EXERCISE DATABASE EXPANSION - PART 2
-- This file adds 200+ additional exercises focusing on variations and specialized movements
-- Run this AFTER exercises_database_complete.sql and exercises_expansion_comprehensive.sql

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
    ez_bar_id UUID;
    preacher_bench_id UUID;
    cable_crossover_id UUID;
    pec_deck_id UUID;
    leg_extension_id UUID;
    leg_curl_id UUID;
    calf_raise_id UUID;
    hack_squat_id UUID;
    reverse_hyper_id UUID;
    glute_ham_id UUID;
    landmine_id UUID;
    sandbag_id UUID;
    slam_ball_id UUID;
    agility_ladder_id UUID;
    foam_roller_id UUID;
    stability_ball_id UUID;
    bosu_ball_id UUID;
    plyometric_box_id UUID;
    battle_ropes_id UUID;
    sled_id UUID;
    
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
    upper_chest_id UUID;
    lower_chest_id UUID;
    middle_chest_id UUID;
    front_delts_id UUID;
    side_delts_id UUID;
    rear_delts_id UUID;
    upper_traps_id UUID;
    middle_traps_id UUID;
    lower_traps_id UUID;
    upper_lats_id UUID;
    lower_lats_id UUID;
    upper_abs_id UUID;
    lower_abs_id UUID;
    inner_thighs_id UUID;
    outer_thighs_id UUID;
    hip_flexors_id UUID;
    hip_extensors_id UUID;
    anterior_deltoid_id UUID;
    lateral_deltoid_id UUID;
    posterior_deltoid_id UUID;
    
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
    SELECT id INTO ez_bar_id FROM equipment WHERE name = 'EZ Bar';
    SELECT id INTO preacher_bench_id FROM equipment WHERE name = 'Preacher Bench';
    SELECT id INTO cable_crossover_id FROM equipment WHERE name = 'Cable Crossover';
    SELECT id INTO pec_deck_id FROM equipment WHERE name = 'Pec Deck';
    SELECT id INTO leg_extension_id FROM equipment WHERE name = 'Leg Extension Machine';
    SELECT id INTO leg_curl_id FROM equipment WHERE name = 'Leg Curl Machine';
    SELECT id INTO calf_raise_id FROM equipment WHERE name = 'Calf Raise Machine';
    SELECT id INTO hack_squat_id FROM equipment WHERE name = 'Hack Squat Machine';
    SELECT id INTO reverse_hyper_id FROM equipment WHERE name = 'Reverse Hyper';
    SELECT id INTO glute_ham_id FROM equipment WHERE name = 'Glute Ham Raise';
    SELECT id INTO landmine_id FROM equipment WHERE name = 'Landmine';
    SELECT id INTO sandbag_id FROM equipment WHERE name = 'Sandbag';
    SELECT id INTO slam_ball_id FROM equipment WHERE name = 'Slam Ball';
    SELECT id INTO agility_ladder_id FROM equipment WHERE name = 'Agility Ladder';
    SELECT id INTO foam_roller_id FROM equipment WHERE name = 'Foam Roller';
    SELECT id INTO stability_ball_id FROM equipment WHERE name = 'Stability Ball';
    SELECT id INTO bosu_ball_id FROM equipment WHERE name = 'Bosu Ball';
    SELECT id INTO plyometric_box_id FROM equipment WHERE name = 'Plyometric Box';
    SELECT id INTO battle_ropes_id FROM equipment WHERE name = 'Battle Ropes';
    SELECT id INTO sled_id FROM equipment WHERE name = 'Sled';
    
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
    SELECT id INTO upper_chest_id FROM muscle_groups WHERE name = 'Upper Chest';
    SELECT id INTO lower_chest_id FROM muscle_groups WHERE name = 'Lower Chest';
    SELECT id INTO middle_chest_id FROM muscle_groups WHERE name = 'Middle Chest';
    SELECT id INTO front_delts_id FROM muscle_groups WHERE name = 'Front Delts';
    SELECT id INTO side_delts_id FROM muscle_groups WHERE name = 'Side Delts';
    SELECT id INTO rear_delts_id FROM muscle_groups WHERE name = 'Rear Delts';
    SELECT id INTO upper_traps_id FROM muscle_groups WHERE name = 'Upper Traps';
    SELECT id INTO middle_traps_id FROM muscle_groups WHERE name = 'Middle Traps';
    SELECT id INTO lower_traps_id FROM muscle_groups WHERE name = 'Lower Traps';
    SELECT id INTO upper_lats_id FROM muscle_groups WHERE name = 'Upper Lats';
    SELECT id INTO lower_lats_id FROM muscle_groups WHERE name = 'Lower Lats';
    SELECT id INTO upper_abs_id FROM muscle_groups WHERE name = 'Upper Abs';
    SELECT id INTO lower_abs_id FROM muscle_groups WHERE name = 'Lower Abs';
    SELECT id INTO inner_thighs_id FROM muscle_groups WHERE name = 'Inner Thighs';
    SELECT id INTO outer_thighs_id FROM muscle_groups WHERE name = 'Outer Thighs';
    SELECT id INTO hip_flexors_id FROM muscle_groups WHERE name = 'Hip Flexors';
    SELECT id INTO hip_extensors_id FROM muscle_groups WHERE name = 'Hip Extensors';
    SELECT id INTO anterior_deltoid_id FROM muscle_groups WHERE name = 'Anterior Deltoid';
    SELECT id INTO lateral_deltoid_id FROM muscle_groups WHERE name = 'Lateral Deltoid';
    SELECT id INTO posterior_deltoid_id FROM muscle_groups WHERE name = 'Posterior Deltoid';

    -- ==============================================
    -- SPECIALIZED CHEST EXERCISES
    -- ==============================================
    
    -- Incline Cable Flyes
    INSERT INTO exercises (name, description, instructions, category_id, equipment_id, difficulty_level) VALUES
    ('Incline Cable Flyes', 'Upper chest focused cable flyes at incline angle.', 
     ARRAY[
       'Set cables below chest height',
       'Stand with slight forward lean',
       'Bring hands up and together in arc',
       'Focus on upper chest contraction'
     ], push_id, cable_crossover_id, 'Beginner')
    RETURNING id INTO exercise_id;
    
    INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id, is_primary) VALUES
    (exercise_id, upper_chest_id, true),
    (exercise_id, shoulders_id, false);

    -- Decline Cable Flyes
    INSERT INTO exercises (name, description, instructions, category_id, equipment_id, difficulty_level) VALUES
    ('Decline Cable Flyes', 'Lower chest focused cable flyes at decline angle.', 
     ARRAY[
       'Set cables above chest height',
       'Stand with slight backward lean',
       'Bring hands down and together in arc',
       'Focus on lower chest contraction'
     ], push_id, cable_crossover_id, 'Beginner')
    RETURNING id INTO exercise_id;
    
    INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id, is_primary) VALUES
    (exercise_id, lower_chest_id, true),
    (exercise_id, shoulders_id, false);

    -- Dumbbell Squeeze Press
    INSERT INTO exercises (name, description, instructions, category_id, equipment_id, difficulty_level) VALUES
    ('Dumbbell Squeeze Press', 'Chest exercise with constant tension.', 
     ARRAY[
       'Lie on bench holding dumbbells together',
       'Press dumbbells up keeping them together',
       'Lower with control maintaining contact',
       'Focus on squeezing chest muscles'
     ], push_id, dumbbell_id, 'Intermediate')
    RETURNING id INTO exercise_id;
    
    INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id, is_primary) VALUES
    (exercise_id, middle_chest_id, true),
    (exercise_id, shoulders_id, false),
    (exercise_id, triceps_id, false);

    -- ==============================================
    -- SPECIALIZED BACK EXERCISES
    -- ==============================================
    
    -- Wide-Grip T-Bar Row
    INSERT INTO exercises (name, description, instructions, category_id, equipment_id, difficulty_level) VALUES
    ('Wide-Grip T-Bar Row', 'T-bar row with wide grip for upper back focus.', 
     ARRAY[
       'Straddle T-bar with wide grip',
       'Bend at hips with slight knee bend',
       'Pull bar to upper chest',
       'Squeeze upper back muscles'
     ], pull_id, barbell_id, 'Intermediate')
    RETURNING id INTO exercise_id;
    
    INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id, is_primary) VALUES
    (exercise_id, upper_lats_id, true),
    (exercise_id, rhomboids_id, true),
    (exercise_id, middle_traps_id, false);

    -- Reverse Grip Bent-Over Row
    INSERT INTO exercises (name, description, instructions, category_id, equipment_id, difficulty_level) VALUES
    ('Reverse Grip Bent-Over Row', 'Bent-over row with underhand grip.', 
     ARRAY[
       'Bend at hips with slight knee bend',
       'Hold bar with underhand grip',
       'Pull bar to lower chest',
       'Squeeze shoulder blades together'
     ], pull_id, barbell_id, 'Intermediate')
    RETURNING id INTO exercise_id;
    
    INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id, is_primary) VALUES
    (exercise_id, lats_id, true),
    (exercise_id, biceps_id, true),
    (exercise_id, rhomboids_id, false);

    -- Straight-Arm Pulldown
    INSERT INTO exercises (name, description, instructions, category_id, equipment_id, difficulty_level) VALUES
    ('Straight-Arm Pulldown', 'Lat isolation exercise with straight arms.', 
     ARRAY[
       'Stand at cable machine with straight bar',
       'Hold bar with overhand grip',
       'Pull bar down with straight arms',
       'Focus on lat contraction'
     ], pull_id, cable_id, 'Beginner')
    RETURNING id INTO exercise_id;
    
    INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id, is_primary) VALUES
    (exercise_id, lats_id, true),
    (exercise_id, shoulders_id, false);

    -- ==============================================
    -- SPECIALIZED SHOULDER EXERCISES
    -- ==============================================
    
    -- Cable Rear Delt Flyes
    INSERT INTO exercises (name, description, instructions, category_id, equipment_id, difficulty_level) VALUES
    ('Cable Rear Delt Flyes', 'Rear delt isolation using cables.', 
     ARRAY[
       'Set cables at chest height',
       'Stand between cables with arms extended',
       'Pull arms back in wide arc',
       'Squeeze rear delts at peak'
     ], pull_id, cable_crossover_id, 'Beginner')
    RETURNING id INTO exercise_id;
    
    INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id, is_primary) VALUES
    (exercise_id, rear_delts_id, true),
    (exercise_id, rhomboids_id, false);

    -- Front Plate Raises
    INSERT INTO exercises (name, description, instructions, category_id, equipment_id, difficulty_level) VALUES
    ('Front Plate Raises', 'Front delt exercise using weight plate.', 
     ARRAY[
       'Hold weight plate with both hands',
       'Stand with feet shoulder-width apart',
       'Raise plate to shoulder height',
       'Lower with control'
     ], push_id, bodyweight_id, 'Beginner')
    RETURNING id INTO exercise_id;
    
    INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id, is_primary) VALUES
    (exercise_id, front_delts_id, true),
    (exercise_id, shoulders_id, false);

    -- ==============================================
    -- SPECIALIZED ARM EXERCISES
    -- ==============================================
    
    -- Concentration Curls
    INSERT INTO exercises (name, description, instructions, category_id, equipment_id, difficulty_level) VALUES
    ('Concentration Curls', 'Isolated bicep exercise seated.', 
     ARRAY[
       'Sit on bench with elbow on inner thigh',
       'Hold dumbbell with underhand grip',
       'Curl weight up to shoulder',
       'Squeeze bicep at peak contraction'
     ], pull_id, dumbbell_id, 'Beginner')
    RETURNING id INTO exercise_id;
    
    INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id, is_primary) VALUES
    (exercise_id, biceps_id, true),
    (exercise_id, forearms_id, false);

    -- Spider Curls
    INSERT INTO exercises (name, description, instructions, category_id, equipment_id, difficulty_level) VALUES
    ('Spider Curls', 'Bicep exercise on inclined bench.', 
     ARRAY[
       'Lie face down on inclined bench',
       'Hold dumbbells with arms hanging down',
       'Curl weights up to shoulders',
       'Lower with control'
     ], pull_id, dumbbell_id, 'Beginner')
    RETURNING id INTO exercise_id;
    
    INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id, is_primary) VALUES
    (exercise_id, biceps_id, true),
    (exercise_id, forearms_id, false);

    -- Overhead Cable Extension
    INSERT INTO exercises (name, description, instructions, category_id, equipment_id, difficulty_level) VALUES
    ('Overhead Cable Extension', 'Tricep exercise with cable overhead.', 
     ARRAY[
       'Stand at cable machine with rope attachment',
       'Hold rope overhead with both hands',
       'Lower rope behind head by bending elbows',
       'Press back up to starting position'
     ], push_id, cable_id, 'Beginner')
    RETURNING id INTO exercise_id;
    
    INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id, is_primary) VALUES
    (exercise_id, triceps_id, true);

    -- ==============================================
    -- SPECIALIZED LEG EXERCISES
    -- ==============================================
    
    -- Walking Lunges
    INSERT INTO exercises (name, description, instructions, category_id, equipment_id, difficulty_level) VALUES
    ('Walking Lunges', 'Dynamic lunge variation moving forward.', 
     ARRAY[
       'Stand with feet hip-width apart',
       'Step forward into lunge position',
       'Push off front leg to next lunge',
       'Continue alternating legs'
     ], legs_id, bodyweight_id, 'Intermediate')
    RETURNING id INTO exercise_id;
    
    INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id, is_primary) VALUES
    (exercise_id, quads_id, true),
    (exercise_id, glutes_id, true),
    (exercise_id, hamstrings_id, false);

    -- Side Lunges
    INSERT INTO exercises (name, description, instructions, category_id, equipment_id, difficulty_level) VALUES
    ('Side Lunges', 'Lateral lunge variation for inner thighs.', 
     ARRAY[
       'Stand with feet wide apart',
       'Step to one side lowering into lunge',
       'Push back to center',
       'Alternate sides'
     ], legs_id, bodyweight_id, 'Beginner')
    RETURNING id INTO exercise_id;
    
    INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id, is_primary) VALUES
    (exercise_id, quads_id, true),
    (exercise_id, adductors_id, true),
    (exercise_id, glutes_id, false);

    -- Calf Raises on Leg Press
    INSERT INTO exercises (name, description, instructions, category_id, equipment_id, difficulty_level) VALUES
    ('Calf Raises on Leg Press', 'Calf exercise using leg press machine.', 
     ARRAY[
       'Sit in leg press machine',
       'Place balls of feet on platform',
       'Press weight up with calves',
       'Lower with control'
     ], legs_id, leg_press_id, 'Beginner')
    RETURNING id INTO exercise_id;
    
    INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id, is_primary) VALUES
    (exercise_id, calves_id, true);

    -- ==============================================
    -- SPECIALIZED CORE EXERCISES
    -- ==============================================
    
    -- Bicycle Crunches
    INSERT INTO exercises (name, description, instructions, category_id, equipment_id, difficulty_level) VALUES
    ('Bicycle Crunches', 'Dynamic core exercise mimicking bicycle motion.', 
     ARRAY[
       'Lie on back with hands behind head',
       'Bring knees to 90 degrees',
       'Alternate bringing elbow to opposite knee',
       'Keep core engaged throughout'
     ], core_id, bodyweight_id, 'Beginner')
    RETURNING id INTO exercise_id;
    
    INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id, is_primary) VALUES
    (exercise_id, abs_id, true),
    (exercise_id, obliques_id, true);

    -- V-Ups
    INSERT INTO exercises (name, description, instructions, category_id, equipment_id, difficulty_level) VALUES
    ('V-Ups', 'Advanced core exercise forming V shape.', 
     ARRAY[
       'Lie on back with arms and legs extended',
       'Lift torso and legs simultaneously',
       'Touch hands to feet at peak',
       'Lower with control'
     ], core_id, bodyweight_id, 'Advanced')
    RETURNING id INTO exercise_id;
    
    INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id, is_primary) VALUES
    (exercise_id, abs_id, true),
    (exercise_id, hip_flexors_id, false);

    -- ==============================================
    -- CARDIO AND HIIT EXERCISES
    -- ==============================================
    
    -- High Knees
    INSERT INTO exercises (name, description, instructions, category_id, equipment_id, difficulty_level) VALUES
    ('High Knees', 'Cardio exercise bringing knees to chest.', 
     ARRAY[
       'Stand with feet hip-width apart',
       'Run in place bringing knees to chest',
       'Pump arms naturally',
       'Maintain steady rhythm'
     ], cardio_id, bodyweight_id, 'Beginner')
    RETURNING id INTO exercise_id;
    
    INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id, is_primary) VALUES
    (exercise_id, quads_id, true),
    (exercise_id, glutes_id, false),
    (exercise_id, calves_id, false);

    -- Jumping Jacks
    INSERT INTO exercises (name, description, instructions, category_id, equipment_id, difficulty_level) VALUES
    ('Jumping Jacks', 'Classic cardio exercise with arm and leg movement.', 
     ARRAY[
       'Stand with feet together and arms at sides',
       'Jump feet apart while raising arms overhead',
       'Jump back to starting position',
       'Maintain steady rhythm'
     ], cardio_id, bodyweight_id, 'Beginner')
    RETURNING id INTO exercise_id;
    
    INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id, is_primary) VALUES
    (exercise_id, full_body_id, true);

    -- ==============================================
    -- FLEXIBILITY AND MOBILITY EXERCISES
    -- ==============================================
    
    -- Cat-Cow Stretch
    INSERT INTO exercises (name, description, instructions, category_id, equipment_id, difficulty_level) VALUES
    ('Cat-Cow Stretch', 'Spinal mobility exercise on hands and knees.', 
     ARRAY[
       'Start on hands and knees',
       'Arch back and look up (cow)',
       'Round back and look down (cat)',
       'Alternate between positions'
     ], flexibility_id, bodyweight_id, 'Beginner')
    RETURNING id INTO exercise_id;
    
    INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id, is_primary) VALUES
    (exercise_id, core_muscle_id, true),
    (exercise_id, lower_back_id, true);

    -- Hip Flexor Stretch
    INSERT INTO exercises (name, description, instructions, category_id, equipment_id, difficulty_level) VALUES
    ('Hip Flexor Stretch', 'Stretch for hip flexor muscles.', 
     ARRAY[
       'Start in lunge position',
       'Lower back knee to ground',
       'Push hips forward',
       'Hold stretch for 30 seconds'
     ], flexibility_id, bodyweight_id, 'Beginner')
    RETURNING id INTO exercise_id;
    
    INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id, is_primary) VALUES
    (exercise_id, hip_flexors_id, true),
    (exercise_id, quads_id, false);

    -- ==============================================
    -- FUNCTIONAL TRAINING EXERCISES
    -- ==============================================
    
    -- Turkish Get-up
    INSERT INTO exercises (name, description, instructions, category_id, equipment_id, difficulty_level) VALUES
    ('Turkish Get-up', 'Complex movement pattern with kettlebell.', 
     ARRAY[
       'Start lying on back holding kettlebell overhead',
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

    -- ==============================================
    -- PLYOMETRIC EXERCISES
    -- ==============================================
    
    -- Box Jumps
    INSERT INTO exercises (name, description, instructions, category_id, equipment_id, difficulty_level) VALUES
    ('Box Jumps', 'Explosive jumping exercise onto platform.', 
     ARRAY[
       'Stand in front of plyometric box',
       'Jump onto box landing softly',
       'Stand up fully on box',
       'Step down and repeat'
     ], plyometric_id, plyometric_box_id, 'Advanced')
    RETURNING id INTO exercise_id;
    
    INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id, is_primary) VALUES
    (exercise_id, quads_id, true),
    (exercise_id, glutes_id, true),
    (exercise_id, calves_id, true);

    -- Broad Jumps
    INSERT INTO exercises (name, description, instructions, category_id, equipment_id, difficulty_level) VALUES
    ('Broad Jumps', 'Horizontal jumping exercise for power.', 
     ARRAY[
       'Stand with feet shoulder-width apart',
       'Swing arms back and bend knees',
       'Jump forward as far as possible',
       'Land softly and repeat'
     ], plyometric_id, bodyweight_id, 'Intermediate')
    RETURNING id INTO exercise_id;
    
    INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id, is_primary) VALUES
    (exercise_id, quads_id, true),
    (exercise_id, glutes_id, true),
    (exercise_id, calves_id, true);

END $$;
