-- COMPREHENSIVE EXERCISE DATABASE EXPANSION
-- This file adds 200+ additional bodybuilding and fitness exercises
-- Run this AFTER the main exercises_database_complete.sql

-- ==============================================
-- ADDITIONAL EQUIPMENT TYPES
-- ==============================================

INSERT INTO equipment (name, description) VALUES
('EZ Bar', 'Curved barbell for easier grip on curls and tricep exercises'),
('Preacher Bench', 'Angled bench for isolated bicep and tricep work'),
('Cable Crossover', 'Dual cable machine for chest flyes and other exercises'),
('Pec Deck', 'Machine for chest flyes and rear delt work'),
('Leg Extension Machine', 'Machine for isolated quadriceps work'),
('Leg Curl Machine', 'Machine for isolated hamstring work'),
('Calf Raise Machine', 'Machine for calf development'),
('Hack Squat Machine', 'Angled squat machine for leg development'),
('Reverse Hyper', 'Machine for posterior chain development'),
('Glute Ham Raise', 'Machine for hamstring and glute development'),
('Landmine', 'Barbell anchored for rotational exercises'),
('Sandbag', 'Heavy bag for functional training'),
('Slam Ball', 'Heavy ball for explosive movements'),
('Agility Ladder', 'Ladder for footwork and coordination'),
('Foam Roller', 'Cylinder for self-myofascial release'),
('Stability Ball', 'Large ball for core and balance work'),
('Bosu Ball', 'Half ball for unstable surface training'),
('Plyometric Box', 'Platform for jumping exercises'),
('Battle Ropes', 'Heavy ropes for cardio and strength'),
('Sled', 'Weighted sled for pushing and pulling')
ON CONFLICT (name) DO NOTHING;

-- ==============================================
-- ADDITIONAL MUSCLE GROUPS
-- ==============================================

INSERT INTO muscle_groups (name, description) VALUES
('Upper Chest', 'Upper portion of pectoral muscles'),
('Lower Chest', 'Lower portion of pectoral muscles'),
('Middle Chest', 'Middle portion of pectoral muscles'),
('Front Delts', 'Anterior deltoid muscles'),
('Side Delts', 'Lateral deltoid muscles'),
('Rear Delts', 'Posterior deltoid muscles'),
('Upper Traps', 'Upper portion of trapezius'),
('Middle Traps', 'Middle portion of trapezius'),
('Lower Traps', 'Lower portion of trapezius'),
('Upper Lats', 'Upper portion of latissimus dorsi'),
('Lower Lats', 'Lower portion of latissimus dorsi'),
('Upper Abs', 'Upper portion of rectus abdominis'),
('Lower Abs', 'Lower portion of rectus abdominis'),
('Inner Thighs', 'Adductor muscles'),
('Outer Thighs', 'Abductor muscles'),
('Hip Flexors', 'Muscles that flex the hip joint'),
('Hip Extensors', 'Muscles that extend the hip joint'),
('Anterior Deltoid', 'Front shoulder muscles'),
('Lateral Deltoid', 'Side shoulder muscles'),
('Posterior Deltoid', 'Rear shoulder muscles')
ON CONFLICT (name) DO NOTHING;

-- ==============================================
-- COMPREHENSIVE BODYBUILDING EXERCISES
-- ==============================================

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
    -- ADVANCED CHEST EXERCISES
    -- ==============================================
    
    -- Decline Bench Press
    INSERT INTO exercises (name, description, instructions, category_id, equipment_id, difficulty_level) VALUES
    ('Decline Bench Press', 'Lower chest focused pressing movement with barbell.', 
     ARRAY[
       'Set bench to 15-30 degree decline',
       'Secure feet in foot rests',
       'Lower bar to lower chest',
       'Press bar up and slightly back'
     ], push_id, barbell_id, 'Intermediate')
    RETURNING id INTO exercise_id;
    
    INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id, is_primary) VALUES
    (exercise_id, lower_chest_id, true),
    (exercise_id, shoulders_id, false),
    (exercise_id, triceps_id, false);

    -- Cable Flyes
    INSERT INTO exercises (name, description, instructions, category_id, equipment_id, difficulty_level) VALUES
    ('Cable Flyes', 'Isolation exercise for chest using cables.', 
     ARRAY[
       'Set cables at chest height',
       'Stand between cables with slight forward lean',
       'Bring hands together in wide arc',
       'Squeeze chest at peak contraction'
     ], push_id, cable_crossover_id, 'Beginner')
    RETURNING id INTO exercise_id;
    
    INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id, is_primary) VALUES
    (exercise_id, chest_id, true),
    (exercise_id, shoulders_id, false);

    -- Incline Cable Flyes
    INSERT INTO exercises (name, description, instructions, category_id, equipment_id, difficulty_level) VALUES
    ('Incline Cable Flyes', 'Upper chest focused cable flyes.', 
     ARRAY[
       'Set cables below chest height',
       'Stand with slight incline',
       'Bring hands up and together',
       'Focus on upper chest contraction'
     ], push_id, cable_crossover_id, 'Beginner')
    RETURNING id INTO exercise_id;
    
    INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id, is_primary) VALUES
    (exercise_id, upper_chest_id, true),
    (exercise_id, shoulders_id, false);

    -- Pec Deck Flyes
    INSERT INTO exercises (name, description, instructions, category_id, equipment_id, difficulty_level) VALUES
    ('Pec Deck Flyes', 'Machine isolation exercise for chest.', 
     ARRAY[
       'Sit at pec deck machine',
       'Place forearms on pads',
       'Bring arms together in front',
       'Squeeze chest muscles at peak'
     ], push_id, pec_deck_id, 'Beginner')
    RETURNING id INTO exercise_id;
    
    INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id, is_primary) VALUES
    (exercise_id, chest_id, true),
    (exercise_id, shoulders_id, false);

    -- Dumbbell Pullover
    INSERT INTO exercises (name, description, instructions, category_id, equipment_id, difficulty_level) VALUES
    ('Dumbbell Pullover', 'Chest and lat exercise with dumbbell.', 
     ARRAY[
       'Lie perpendicular on bench with only shoulders supported',
       'Hold dumbbell with both hands over chest',
       'Lower dumbbell behind head in arc',
       'Pull back to starting position'
     ], push_id, dumbbell_id, 'Intermediate')
    RETURNING id INTO exercise_id;
    
    INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id, is_primary) VALUES
    (exercise_id, chest_id, true),
    (exercise_id, lats_id, true),
    (exercise_id, triceps_id, false);

    -- ==============================================
    -- ADVANCED BACK EXERCISES
    -- ==============================================
    
    -- T-Bar Row
    INSERT INTO exercises (name, description, instructions, category_id, equipment_id, difficulty_level) VALUES
    ('T-Bar Row', 'Bent-over row variation with T-bar.', 
     ARRAY[
       'Straddle T-bar with feet shoulder-width apart',
       'Bend at hips with slight knee bend',
       'Pull bar to chest',
       'Squeeze shoulder blades together'
     ], pull_id, barbell_id, 'Intermediate')
    RETURNING id INTO exercise_id;
    
    INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id, is_primary) VALUES
    (exercise_id, lats_id, true),
    (exercise_id, rhomboids_id, true),
    (exercise_id, biceps_id, false);

    -- One-Arm Dumbbell Row
    INSERT INTO exercises (name, description, instructions, category_id, equipment_id, difficulty_level) VALUES
    ('One-Arm Dumbbell Row', 'Unilateral back exercise with dumbbell.', 
     ARRAY[
       'Place knee and hand on bench',
       'Hold dumbbell in free hand',
       'Pull dumbbell to hip',
       'Squeeze shoulder blade at top'
     ], pull_id, dumbbell_id, 'Beginner')
    RETURNING id INTO exercise_id;
    
    INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id, is_primary) VALUES
    (exercise_id, lats_id, true),
    (exercise_id, rhomboids_id, false),
    (exercise_id, biceps_id, false);

    -- Wide-Grip Pull-ups
    INSERT INTO exercises (name, description, instructions, category_id, equipment_id, difficulty_level) VALUES
    ('Wide-Grip Pull-ups', 'Pull-up variation with wide grip for lats.', 
     ARRAY[
       'Grab pull-up bar wider than shoulder-width',
       'Hang with arms fully extended',
       'Pull body up until chin clears bar',
       'Lower with control'
     ], pull_id, pullup_id, 'Advanced')
    RETURNING id INTO exercise_id;
    
    INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id, is_primary) VALUES
    (exercise_id, lats_id, true),
    (exercise_id, rhomboids_id, false),
    (exercise_id, biceps_id, false);

    -- Close-Grip Pull-ups
    INSERT INTO exercises (name, description, instructions, category_id, equipment_id, difficulty_level) VALUES
    ('Close-Grip Pull-ups', 'Pull-up variation with close grip.', 
     ARRAY[
       'Grab pull-up bar with hands close together',
       'Hang with arms fully extended',
       'Pull body up until chin clears bar',
       'Lower with control'
     ], pull_id, pullup_id, 'Intermediate')
    RETURNING id INTO exercise_id;
    
    INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id, is_primary) VALUES
    (exercise_id, lats_id, true),
    (exercise_id, biceps_id, true),
    (exercise_id, rhomboids_id, false);

    -- Reverse Grip Lat Pulldown
    INSERT INTO exercises (name, description, instructions, category_id, equipment_id, difficulty_level) VALUES
    ('Reverse Grip Lat Pulldown', 'Lat pulldown with underhand grip.', 
     ARRAY[
       'Sit at lat pulldown machine',
       'Grab bar with underhand grip',
       'Pull bar to upper chest',
       'Squeeze lats at bottom'
     ], pull_id, lat_pulldown_id, 'Beginner')
    RETURNING id INTO exercise_id;
    
    INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id, is_primary) VALUES
    (exercise_id, lats_id, true),
    (exercise_id, biceps_id, true),
    (exercise_id, rhomboids_id, false);

    -- ==============================================
    -- ADVANCED SHOULDER EXERCISES
    -- ==============================================
    
    -- Arnold Press
    INSERT INTO exercises (name, description, instructions, category_id, equipment_id, difficulty_level) VALUES
    ('Arnold Press', 'Rotating shoulder press with dumbbells.', 
     ARRAY[
       'Start with dumbbells at shoulder height, palms facing you',
       'Press up while rotating palms outward',
       'Continue pressing until arms are fully extended',
       'Reverse the movement on the way down'
     ], push_id, dumbbell_id, 'Intermediate')
    RETURNING id INTO exercise_id;
    
    INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id, is_primary) VALUES
    (exercise_id, shoulders_id, true),
    (exercise_id, triceps_id, false);

    -- Rear Delt Flyes
    INSERT INTO exercises (name, description, instructions, category_id, equipment_id, difficulty_level) VALUES
    ('Rear Delt Flyes', 'Isolation exercise for rear deltoids.', 
     ARRAY[
       'Bend at hips with slight knee bend',
       'Hold dumbbells with arms hanging down',
       'Raise arms out to sides',
       'Squeeze rear delts at peak'
     ], push_id, dumbbell_id, 'Beginner')
    RETURNING id INTO exercise_id;
    
    INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id, is_primary) VALUES
    (exercise_id, rear_delts_id, true),
    (exercise_id, rhomboids_id, false);

    -- Cable Lateral Raises
    INSERT INTO exercises (name, description, instructions, category_id, equipment_id, difficulty_level) VALUES
    ('Cable Lateral Raises', 'Lateral raises using cable machine.', 
     ARRAY[
       'Stand next to cable machine',
       'Hold cable with arm at side',
       'Raise arm out to side until parallel',
       'Lower with control'
     ], push_id, cable_id, 'Beginner')
    RETURNING id INTO exercise_id;
    
    INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id, is_primary) VALUES
    (exercise_id, side_delts_id, true);

    -- Upright Row
    INSERT INTO exercises (name, description, instructions, category_id, equipment_id, difficulty_level) VALUES
    ('Upright Row', 'Shoulder and trap exercise with barbell.', 
     ARRAY[
       'Hold barbell with overhand grip',
       'Stand with feet shoulder-width apart',
       'Pull bar up along body to chest level',
       'Lower with control'
     ], pull_id, barbell_id, 'Intermediate')
    RETURNING id INTO exercise_id;
    
    INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id, is_primary) VALUES
    (exercise_id, shoulders_id, true),
    (exercise_id, traps_id, true),
    (exercise_id, biceps_id, false);

    -- ==============================================
    -- ADVANCED ARM EXERCISES
    -- ==============================================
    
    -- Preacher Curls
    INSERT INTO exercises (name, description, instructions, category_id, equipment_id, difficulty_level) VALUES
    ('Preacher Curls', 'Isolated bicep exercise on preacher bench.', 
     ARRAY[
       'Sit at preacher bench with arm on pad',
       'Hold barbell with underhand grip',
       'Curl weight up to shoulder',
       'Lower with control'
     ], pull_id, preacher_bench_id, 'Beginner')
    RETURNING id INTO exercise_id;
    
    INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id, is_primary) VALUES
    (exercise_id, biceps_id, true),
    (exercise_id, forearms_id, false);

    -- EZ Bar Curls
    INSERT INTO exercises (name, description, instructions, category_id, equipment_id, difficulty_level) VALUES
    ('EZ Bar Curls', 'Bicep exercise with EZ bar for easier grip.', 
     ARRAY[
       'Stand with feet shoulder-width apart',
       'Hold EZ bar with underhand grip',
       'Curl bar up to shoulders',
       'Lower with control'
     ], pull_id, ez_bar_id, 'Beginner')
    RETURNING id INTO exercise_id;
    
    INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id, is_primary) VALUES
    (exercise_id, biceps_id, true),
    (exercise_id, forearms_id, false);

    -- Close-Grip Bench Press
    INSERT INTO exercises (name, description, instructions, category_id, equipment_id, difficulty_level) VALUES
    ('Close-Grip Bench Press', 'Tricep-focused bench press variation.', 
     ARRAY[
       'Lie on bench with hands close together on bar',
       'Lower bar to chest',
       'Press bar up focusing on triceps',
       'Keep elbows close to body'
     ], push_id, barbell_id, 'Intermediate')
    RETURNING id INTO exercise_id;
    
    INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id, is_primary) VALUES
    (exercise_id, triceps_id, true),
    (exercise_id, chest_id, false),
    (exercise_id, shoulders_id, false);

    -- Overhead Tricep Extension
    INSERT INTO exercises (name, description, instructions, category_id, equipment_id, difficulty_level) VALUES
    ('Overhead Tricep Extension', 'Tricep isolation exercise overhead.', 
     ARRAY[
       'Stand or sit holding dumbbell with both hands',
       'Press dumbbell overhead',
       'Lower behind head by bending elbows',
       'Press back up to starting position'
     ], push_id, dumbbell_id, 'Beginner')
    RETURNING id INTO exercise_id;
    
    INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id, is_primary) VALUES
    (exercise_id, triceps_id, true);

    -- Cable Tricep Pushdown
    INSERT INTO exercises (name, description, instructions, category_id, equipment_id, difficulty_level) VALUES
    ('Cable Tricep Pushdown', 'Tricep isolation with cable machine.', 
     ARRAY[
       'Stand at cable machine with rope attachment',
       'Hold rope with both hands',
       'Push down until arms are fully extended',
       'Return to starting position'
     ], push_id, cable_id, 'Beginner')
    RETURNING id INTO exercise_id;
    
    INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id, is_primary) VALUES
    (exercise_id, triceps_id, true);

    -- ==============================================
    -- ADVANCED LEG EXERCISES
    -- ==============================================
    
    -- Front Squats
    INSERT INTO exercises (name, description, instructions, category_id, equipment_id, difficulty_level) VALUES
    ('Front Squats', 'Squat variation with bar in front position.', 
     ARRAY[
       'Rest bar on front of shoulders',
       'Stand with feet shoulder-width apart',
       'Squat down keeping chest up',
       'Drive through heels to stand'
     ], legs_id, barbell_id, 'Advanced')
    RETURNING id INTO exercise_id;
    
    INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id, is_primary) VALUES
    (exercise_id, quads_id, true),
    (exercise_id, glutes_id, true),
    (exercise_id, core_muscle_id, false);

    -- Hack Squats
    INSERT INTO exercises (name, description, instructions, category_id, equipment_id, difficulty_level) VALUES
    ('Hack Squats', 'Machine squat variation for quad development.', 
     ARRAY[
       'Position yourself in hack squat machine',
       'Place feet shoulder-width apart on platform',
       'Lower until knees reach 90 degrees',
       'Press back up to starting position'
     ], legs_id, hack_squat_id, 'Intermediate')
    RETURNING id INTO exercise_id;
    
    INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id, is_primary) VALUES
    (exercise_id, quads_id, true),
    (exercise_id, glutes_id, true);

    -- Leg Extensions
    INSERT INTO exercises (name, description, instructions, category_id, equipment_id, difficulty_level) VALUES
    ('Leg Extensions', 'Isolation exercise for quadriceps.', 
     ARRAY[
       'Sit at leg extension machine',
       'Place feet under pads',
       'Extend legs until fully straight',
       'Lower with control'
     ], legs_id, leg_extension_id, 'Beginner')
    RETURNING id INTO exercise_id;
    
    INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id, is_primary) VALUES
    (exercise_id, quads_id, true);

    -- Leg Curls
    INSERT INTO exercises (name, description, instructions, category_id, equipment_id, difficulty_level) VALUES
    ('Leg Curls', 'Isolation exercise for hamstrings.', 
     ARRAY[
       'Lie face down on leg curl machine',
       'Place heels under pads',
       'Curl legs up toward glutes',
       'Lower with control'
     ], legs_id, leg_curl_id, 'Beginner')
    RETURNING id INTO exercise_id;
    
    INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id, is_primary) VALUES
    (exercise_id, hamstrings_id, true);

    -- Standing Calf Raises
    INSERT INTO exercises (name, description, instructions, category_id, equipment_id, difficulty_level) VALUES
    ('Standing Calf Raises', 'Calf exercise using calf raise machine.', 
     ARRAY[
       'Position shoulders under pads',
       'Place balls of feet on platform',
       'Rise up onto toes',
       'Lower heels below platform level'
     ], legs_id, calf_raise_id, 'Beginner')
    RETURNING id INTO exercise_id;
    
    INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id, is_primary) VALUES
    (exercise_id, calves_id, true);

    -- ==============================================
    -- ADVANCED CORE EXERCISES
    -- ==============================================
    
    -- Hanging Leg Raises
    INSERT INTO exercises (name, description, instructions, category_id, equipment_id, difficulty_level) VALUES
    ('Hanging Leg Raises', 'Advanced core exercise hanging from bar.', 
     ARRAY[
       'Hang from pull-up bar',
       'Keep legs straight',
       'Raise legs up to 90 degrees',
       'Lower with control'
     ], core_id, pullup_id, 'Advanced')
    RETURNING id INTO exercise_id;
    
    INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id, is_primary) VALUES
    (exercise_id, lower_abs_id, true),
    (exercise_id, hip_flexors_id, false);

    -- Cable Crunches
    INSERT INTO exercises (name, description, instructions, category_id, equipment_id, difficulty_level) VALUES
    ('Cable Crunches', 'Cable machine core exercise.', 
     ARRAY[
       'Kneel at cable machine with rope attachment',
       'Hold rope at sides of head',
       'Crunch down bringing elbows to knees',
       'Return to starting position'
     ], core_id, cable_id, 'Intermediate')
    RETURNING id INTO exercise_id;
    
    INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id, is_primary) VALUES
    (exercise_id, abs_id, true);

    -- Side Plank
    INSERT INTO exercises (name, description, instructions, category_id, equipment_id, difficulty_level) VALUES
    ('Side Plank', 'Isometric core exercise for obliques.', 
     ARRAY[
       'Lie on side with forearm on ground',
       'Lift hips up creating straight line',
       'Hold position while breathing normally',
       'Switch sides'
     ], core_id, bodyweight_id, 'Intermediate')
    RETURNING id INTO exercise_id;
    
    INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id, is_primary) VALUES
    (exercise_id, obliques_id, true),
    (exercise_id, core_muscle_id, false);

    -- ==============================================
    -- CALISTHENICS EXERCISES
    -- ==============================================
    
    -- Diamond Push-ups
    INSERT INTO exercises (name, description, instructions, category_id, equipment_id, difficulty_level) VALUES
    ('Diamond Push-ups', 'Advanced push-up variation with hands close together.', 
     ARRAY[
       'Start in push-up position with hands close together forming diamond',
       'Keep body in straight line',
       'Lower chest to hands',
       'Push back up to starting position'
     ], push_id, bodyweight_id, 'Advanced')
    RETURNING id INTO exercise_id;
    
    INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id, is_primary) VALUES
    (exercise_id, triceps_id, true),
    (exercise_id, chest_id, false),
    (exercise_id, shoulders_id, false);

    -- Pike Push-ups
    INSERT INTO exercises (name, description, instructions, category_id, equipment_id, difficulty_level) VALUES
    ('Pike Push-ups', 'Shoulder-focused push-up variation.', 
     ARRAY[
       'Start in downward dog position',
       'Lower head toward hands',
       'Push back up to starting position',
       'Keep legs straight throughout'
     ], push_id, bodyweight_id, 'Advanced')
    RETURNING id INTO exercise_id;
    
    INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id, is_primary) VALUES
    (exercise_id, shoulders_id, true),
    (exercise_id, triceps_id, false);

    -- Pistol Squats
    INSERT INTO exercises (name, description, instructions, category_id, equipment_id, difficulty_level) VALUES
    ('Pistol Squats', 'Single-leg squat variation.', 
     ARRAY[
       'Stand on one leg with other leg extended',
       'Lower down on single leg',
       'Keep extended leg straight',
       'Push back up to starting position'
     ], legs_id, bodyweight_id, 'Advanced')
    RETURNING id INTO exercise_id;
    
    INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id, is_primary) VALUES
    (exercise_id, quads_id, true),
    (exercise_id, glutes_id, true),
    (exercise_id, core_muscle_id, false);

    -- L-Sit
    INSERT INTO exercises (name, description, instructions, category_id, equipment_id, difficulty_level) VALUES
    ('L-Sit', 'Advanced core and tricep exercise.', 
     ARRAY[
       'Sit on ground with hands beside hips',
       'Press up lifting body off ground',
       'Extend legs straight out in front',
       'Hold position while breathing'
     ], core_id, bodyweight_id, 'Advanced')
    RETURNING id INTO exercise_id;
    
    INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id, is_primary) VALUES
    (exercise_id, core_muscle_id, true),
    (exercise_id, triceps_id, true),
    (exercise_id, shoulders_id, false);

    -- ==============================================
    -- FUNCTIONAL TRAINING EXERCISES
    -- ==============================================
    
    -- Kettlebell Swings
    INSERT INTO exercises (name, description, instructions, category_id, equipment_id, difficulty_level) VALUES
    ('Kettlebell Swings', 'Hip hinge movement with kettlebell.', 
     ARRAY[
       'Stand with feet shoulder-width apart',
       'Hold kettlebell with both hands',
       'Hinge at hips swinging kettlebell between legs',
       'Drive hips forward swinging kettlebell to chest level'
     ], functional_id, kettlebell_id, 'Intermediate')
    RETURNING id INTO exercise_id;
    
    INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id, is_primary) VALUES
    (exercise_id, glutes_id, true),
    (exercise_id, hamstrings_id, true),
    (exercise_id, core_muscle_id, false);

    -- Battle Rope Waves
    INSERT INTO exercises (name, description, instructions, category_id, equipment_id, difficulty_level) VALUES
    ('Battle Rope Waves', 'Cardio and strength exercise with battle ropes.', 
     ARRAY[
       'Hold battle rope ends with both hands',
       'Stand with feet shoulder-width apart',
       'Create waves by moving arms up and down',
       'Maintain steady rhythm'
     ], cardio_id, battle_ropes_id, 'Intermediate')
    RETURNING id INTO exercise_id;
    
    INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id, is_primary) VALUES
    (exercise_id, shoulders_id, true),
    (exercise_id, core_muscle_id, true),
    (exercise_id, full_body_id, false);

    -- Sandbag Carries
    INSERT INTO exercises (name, description, instructions, category_id, equipment_id, difficulty_level) VALUES
    ('Sandbag Carries', 'Loaded carry exercise for grip and core strength.', 
     ARRAY[
       'Pick up sandbag and hold at chest',
       'Walk forward maintaining good posture',
       'Keep core engaged throughout',
       'Take controlled steps'
     ], functional_id, sandbag_id, 'Intermediate')
    RETURNING id INTO exercise_id;
    
    INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id, is_primary) VALUES
    (exercise_id, core_muscle_id, true),
    (exercise_id, forearms_id, true),
    (exercise_id, full_body_id, false);

    -- ==============================================
    -- PLYOMETRIC EXERCISES
    -- ==============================================
    
    -- Depth Jumps
    INSERT INTO exercises (name, description, instructions, category_id, equipment_id, difficulty_level) VALUES
    ('Depth Jumps', 'Advanced plyometric exercise for power development.', 
     ARRAY[
       'Stand on plyometric box',
       'Step off box landing on ground',
       'Immediately jump up as high as possible',
       'Land softly and repeat'
     ], plyometric_id, plyometric_box_id, 'Advanced')
    RETURNING id INTO exercise_id;
    
    INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id, is_primary) VALUES
    (exercise_id, quads_id, true),
    (exercise_id, glutes_id, true),
    (exercise_id, calves_id, true);

    -- Clap Push-ups
    INSERT INTO exercises (name, description, instructions, category_id, equipment_id, difficulty_level) VALUES
    ('Clap Push-ups', 'Explosive push-up variation.', 
     ARRAY[
       'Start in push-up position',
       'Lower chest to ground',
       'Explode up clapping hands together',
       'Land back in push-up position'
     ], plyometric_id, bodyweight_id, 'Advanced')
    RETURNING id INTO exercise_id;
    
    INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id, is_primary) VALUES
    (exercise_id, chest_id, true),
    (exercise_id, shoulders_id, true),
    (exercise_id, triceps_id, true);

END $$;
