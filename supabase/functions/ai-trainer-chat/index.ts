import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ParsedRoutine {
  name: string;
  description?: string;
  days: Array<{
    name: string;
    description?: string;
    exercises: Array<{
      name: string;
      sets: number;
      reps: string;
      weight?: string;
      restSeconds?: number;
      notes?: string;
    }>;
  }>;
}

// Function to parse AI-generated routine text
function parseAIRoutine(routineText: string): ParsedRoutine {
  console.log('Parsing routine text:', routineText);
  
  const lines = routineText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  let routineName = 'AI Generated Workout';
  const days: Array<{
    name: string;
    description?: string;
    exercises: Array<{
      name: string;
      sets: number;
      reps: string;
      weight?: string;
      restSeconds?: number;
      notes?: string;
    }>;
  }> = [];
  
  let currentDay: any = null;
  
  for (const line of lines) {
    // Extract workout name
    if (line.startsWith('**Workout Name:**')) {
      routineName = line.replace('**Workout Name:**', '').trim();
      continue;
    }
    
    // Check for day headers
    const dayMatch = line.match(/^\*\*Day (\d+):?\s*(.+)?\*\*/);
    if (dayMatch) {
      if (currentDay) {
        days.push(currentDay);
      }
      
      const dayNumber = parseInt(dayMatch[1]);
      const dayName = dayMatch[2] ? dayMatch[2].trim() : `Day ${dayNumber}`;
      
      currentDay = {
        name: dayName,
        description: '',
        exercises: []
      };
      continue;
    }
    
    // Parse exercises
    if (line.startsWith('* **Exercise:**') && currentDay) {
      // Extract exercise details using regex
      const exerciseMatch = line.match(/\* \*\*Exercise:\*\* (.+?) \| \*\*Sets:\*\* (\d+) \| \*\*Reps:\*\* ([^|]+?)(?:\s*\|\s*\*\*Rest:\*\* (.+?))?$/);
      
      if (exerciseMatch) {
        const [, exerciseName, sets, reps, rest] = exerciseMatch;
        
        // Parse rest time
        let restSeconds = 60;
        if (rest) {
          const restMatch = rest.match(/(\d+)(?:-(\d+))?\s*(seconds?|minutes?)/i);
          if (restMatch) {
            const [, min, max, unit] = restMatch;
            let time = parseInt(min);
            if (max) {
              time = Math.floor((parseInt(min) + parseInt(max)) / 2);
            }
            if (unit.toLowerCase().startsWith('minute')) {
              time *= 60;
            }
            restSeconds = time;
          }
        }
        
        currentDay.exercises.push({
          name: exerciseName.trim(),
          sets: parseInt(sets),
          reps: reps.trim(),
          restSeconds
        });
      } else {
        // Fallback for simpler exercise formats
        const simpleName = line.replace(/^\* \*\*Exercise:\*\*/, '').trim();
        if (simpleName) {
          currentDay.exercises.push({
            name: simpleName,
            sets: 3,
            reps: '8-12',
            restSeconds: 60
          });
        }
      }
    }
  }
  
  // Add the last day if it exists
  if (currentDay) {
    days.push(currentDay);
  }
  
  console.log('Parsed routine:', { routineName, daysCount: days.length });
  
  return {
    name: routineName,
    description: 'AI generated workout routine',
    days
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('AI Trainer Chat function called')
    
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
    if (!GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY is not configured')
      throw new Error('GEMINI_API_KEY is not configured')
    }
    
    console.log('GEMINI_API_KEY found')

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    console.log('Authorization header present:', !!authHeader)
    
    if (!authHeader) {
      console.error('No authorization header found')
      return new Response('No authorization header', { status: 401, headers: corsHeaders })
    }

    // Create client with service role for database operations
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Verifying user token...')
    
    // Extract the token from the Authorization header
    const token = authHeader.replace('Bearer ', '')
    
    // Create a temporary client with anon key to verify the user's JWT
    const authClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const {
      data: { user },
      error: userError
    } = await authClient.auth.getUser(token)

    if (userError) {
      console.error('Error getting user:', userError)
      return new Response(`Authentication error: ${userError.message}`, { status: 401, headers: corsHeaders })
    }

    if (!user) {
      console.error('No user found in token')
      return new Response('No user found', { status: 401, headers: corsHeaders })
    }

    console.log('User authenticated:', user.id)

    const { message, conversationId, clientTools } = await req.json()
    console.log('Request body parsed:', { message: message?.slice(0, 50), conversationId, clientTools })

    if (!message) {
      console.error('No message provided in request')
      return new Response('Missing message', { status: 400, headers: corsHeaders })
    }

    console.log('Received message from user:', user.id, 'Message:', message)

    // Get user profile and fitness data for context
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('display_name, height, weight, date_of_birth, gender, activity_level, fitness_goals, preferred_units')
      .eq('user_id', user.id)
      .maybeSingle()

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Error fetching profile:', profileError)
    }

    // Get recent workout sessions for context
    const { data: recentWorkouts } = await supabaseClient
      .from('workout_sessions')
      .select(`
        name, 
        created_at,
        workout_exercises(
          exercise_name,
          workout_sets(weight, reps)
        )
      `)
      .eq('user_id', user.id)
      .not('end_time', 'is', null)
      .order('created_at', { ascending: false })
      .limit(5)

    // Get active routines
    const { data: activeRoutines } = await supabaseClient
      .from('client_routine_assignments')
      .select(`
        plan_type,
        start_date,
        workout_routines(name, description, days_per_week)
      `)
      .eq('client_id', user.id)
      .eq('is_active', true)

    // Get conversation history
    let conversationHistory = []
    if (conversationId) {
      const { data: messages } = await supabaseClient
        .from('ai_messages')
        .select('role, content')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(20)

      conversationHistory = messages || []
    }

    // Prepare context for AI
    const userContext = {
      profile: profile || {},
      recentWorkouts: recentWorkouts || [],
      activeRoutines: activeRoutines || [],
      conversationHistory
    }

    console.log('User context:', JSON.stringify(userContext, null, 2))

    // Build system prompt with user context
    const systemPrompt = `You are an expert AI fitness coach and personal trainer. You provide personalized fitness advice, workout plans, nutrition guidance, and motivation.

USER PROFILE:
${profile ? `
- Name: ${profile.display_name || 'Not provided'}
- Age: ${profile.date_of_birth ? new Date().getFullYear() - new Date(profile.date_of_birth).getFullYear() : 'Not provided'}
- Gender: ${profile.gender || 'Not provided'}
- Height: ${profile.height ? `${profile.height}cm` : 'Not provided'}
- Weight: ${profile.weight ? `${profile.weight}kg` : 'Not provided'}
- Activity Level: ${profile.activity_level || 'Not provided'}
- Fitness Goals: ${profile.fitness_goals?.join(', ') || 'Not provided'}
- Preferred Units: ${profile.preferred_units || 'metric'}
` : 'Profile not complete'}

RECENT WORKOUTS:
${recentWorkouts && recentWorkouts.length > 0 ? 
  recentWorkouts.map(w => `- ${w.name} (${new Date(w.created_at).toDateString()}): ${
    w.workout_exercises?.map(e => 
      `${e.exercise_name} ${e.workout_sets?.map(s => `${s.weight || 0}kg x ${s.reps || 0}`).join(', ')}`
    ).join(', ') || 'No exercises'
  }`).join('\n') : 'No recent workouts'}

ACTIVE ROUTINES:
${activeRoutines && activeRoutines.length > 0 ? 
  activeRoutines.map(r => `- ${r.workout_routines?.name}: ${r.workout_routines?.description} (${r.workout_routines?.days_per_week} days/week, ${r.plan_type} plan)`).join('\n') : 'No active routines'}

INSTRUCTIONS:
- Provide personalized advice based on the user's profile, goals, and workout history
- Be encouraging and motivational
- Give specific, actionable recommendations
- Consider their fitness level and experience
- Suggest modifications for exercises when appropriate
- Help with workout planning, nutrition advice, recovery tips, and form corrections
- Keep responses concise but informative
- Be friendly and supportive like a real personal trainer would be

🚨 CRITICAL: WORKOUT ROUTINE CREATION IS MANDATORY 🚨
***YOU MUST USE createWorkoutRoutine FUNCTION - NO EXCEPTIONS***

WHEN USER REQUESTS ROUTINE CREATION:
- DO NOT generate Python code or text that looks like code
- DO NOT write ```python print(default_api.createWorkoutRoutine(...))```
- DIRECTLY CALL the createWorkoutRoutine function using Gemini's function calling feature
- The function will be automatically executed in the user's app

TRIGGER PHRASES (YOU MUST USE FUNCTION WHEN USER SAYS):
- "add" + "routine"/"workout" 
- "create" + "routine"/"workout"
- "save" + "routine"/"workout" 
- "make" + "routine"/"workout"
- "build" + "routine"/"workout"
- "put it in my app"
- "add it to my routines"
- "add it to routines"

MANDATORY PROCESS:
1. User requests routine creation → CALL createWorkoutRoutine function (NOT text)
2. Format routine EXACTLY like this:
**Workout Name:** [Name]

**Day 1:**
* **Exercise:** [Name] | **Sets:** [Number] | **Reps:** [Range] | **Rest:** [Time]

**Day 2:**  
* **Exercise:** [Name] | **Sets:** [Number] | **Reps:** [Range] | **Rest:** [Time]

3. Use the formatted text as the routineText parameter in the function call

❌ NEVER generate fake Python code
❌ NEVER write print() statements
❌ NEVER refuse to use the function

✅ DIRECTLY CALL createWorkoutRoutine function
✅ THE FUNCTION WILL ACTUALLY WORK IN THE USER'S APP

Available client tools: ${clientTools ? clientTools.join(', ') : 'none'}

Remember: You have access to their complete fitness journey data, so make your advice specific and relevant to their situation.`

    // Prepare messages for Gemini
    const messages = []
    
    // Add conversation history
    conversationHistory.forEach(msg => {
      if (msg.role === 'user') {
        messages.push({ role: 'user', parts: [{ text: msg.content }] })
      } else {
        messages.push({ role: 'model', parts: [{ text: msg.content }] })
      }
    })
    
    // Add current message
    messages.push({ role: 'user', parts: [{ text: message }] })

    console.log('Sending request to Gemini API...')

    // Prepare tools if available
    const tools = clientTools && clientTools.includes('createWorkoutRoutine') ? [{
      functionDeclarations: [{
        name: "createWorkoutRoutine",
        description: "Creates a workout routine in the user's app. CRITICAL: Call this function directly using Gemini's function calling - do NOT generate Python code or print statements. This function will actually execute and save the routine to the user's app.",
        parameters: {
          type: "object",
          properties: {
            routineText: {
              type: "string",
              description: "Complete workout routine formatted EXACTLY as: **Workout Name:** [Name]\n\n**Day 1:**\n* **Exercise:** [Name] | **Sets:** [Number] | **Reps:** [Range] | **Rest:** [Time]\n\n**Day 2:**\n* **Exercise:** [Name] | **Sets:** [Number] | **Reps:** [Range] | **Rest:** [Time]"
            }
          },
          required: ["routineText"]
        }
      }]
    }] : undefined;

    console.log('Tools configured:', tools ? 'Yes' : 'No', clientTools);
    console.log('Full tools object:', JSON.stringify(tools, null, 2));

    // Call Gemini API
    const requestBody: any = {
      system_instruction: {
        parts: [{ text: systemPrompt }]
      },
      contents: messages,
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      }
    };

    if (tools) {
      requestBody.tools = tools;
      console.log('Adding tools to request:', JSON.stringify(tools, null, 2));
      console.log('Full request body:', JSON.stringify(requestBody, null, 2));
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Gemini API error:', response.status, response.statusText, errorText)
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    console.log('Gemini response:', JSON.stringify(data, null, 2))

    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text
    const toolCalls = data.candidates?.[0]?.content?.parts?.filter((part: any) => part.functionCall) || []
    
    let finalResponse = aiResponse || '';
    
    // Process tool calls if any
    if (toolCalls.length > 0) {
      console.log('Processing tool calls:', toolCalls.length);
      
      for (const toolCall of toolCalls) {
        const functionCall = toolCall.functionCall;
        console.log('Function call detected:', functionCall.name, functionCall.args);
        
        if (functionCall.name === 'createWorkoutRoutine') {
          const routineText = functionCall.args?.routineText;
          
          if (routineText) {
            try {
              // Parse and create the workout routine
              const routineData = parseAIRoutine(routineText);
              console.log('Parsed routine data:', routineData);
              
              // Create the workout routine in the database
              const { data: routine, error: routineError } = await supabaseClient
                .from('workout_routines')
                .insert({
                  name: routineData.name,
                  description: routineData.description || 'AI generated workout routine',
                  days_per_week: routineData.days.length,
                  user_id: user.id,
                  created_at: new Date().toISOString()
                })
                .select()
                .single();

              if (routineError) {
                console.error('Error creating routine:', routineError);
                finalResponse = "I apologize, there was an error creating your workout routine. Please try again.";
              } else {
                // Create routine days and exercises
                for (const [dayIndex, day] of routineData.days.entries()) {
                  const { data: routineDay, error: dayError } = await supabaseClient
                    .from('routine_days')
                    .insert({
                      routine_id: routine.id,
                      name: day.name,
                      description: day.description || '',
                      day_number: dayIndex + 1
                    })
                    .select()
                    .single();

                  if (dayError) {
                    console.error('Error creating routine day:', dayError);
                    continue;
                  }

                  // Create exercises for this day
                  for (const [exerciseIndex, exercise] of day.exercises.entries()) {
                    await supabaseClient
                      .from('routine_exercises')
                      .insert({
                        routine_day_id: routineDay.id,
                        exercise_name: exercise.name,
                        sets: exercise.sets,
                        reps: exercise.reps,
                        weight_suggestion: exercise.weight || null,
                        rest_time_seconds: exercise.restSeconds || 60,
                        notes: exercise.notes || null,
                        order_index: exerciseIndex
                      });
                  }
                }

                finalResponse = `Perfect! I've successfully created your "${routineData.name}" workout routine with ${routineData.days.length} days. You can find it in your workout routines and start using it right away!`;
                console.log('Routine created successfully:', routine.id);
              }
            } catch (parseError) {
              console.error('Error parsing routine:', parseError);
              finalResponse = "I had trouble parsing the workout routine format. Let me try creating it again with the proper format.";
            }
          } else {
            finalResponse = "I need the workout routine text to create your routine. Please try again.";
          }
        }
      }
    }
    
    if (!finalResponse && toolCalls.length === 0) {
      throw new Error('No response from Gemini API')
    }

    // Process tool calls for response
    const processedToolCalls = toolCalls.map((part: any) => ({
      name: part.functionCall?.name || 'unknown',
      parameters: part.functionCall?.args || {}
    }));

    // Store or update conversation
    let finalConversationId = conversationId
    
    if (!conversationId) {
      // Create new conversation
      const { data: newConversation, error: convError } = await supabaseClient
        .from('ai_conversations')
        .insert({
          user_id: user.id,
          title: message.slice(0, 50) + (message.length > 50 ? '...' : '')
        })
        .select()
        .single()

      if (convError) {
        console.error('Error creating conversation:', convError)
        throw convError
      }

      finalConversationId = newConversation.id
    }

    // Store user message
    const { error: userMsgError } = await supabaseClient
      .from('ai_messages')
      .insert({
        conversation_id: finalConversationId,
        role: 'user',
        content: message
      })

    if (userMsgError) {
      console.error('Error storing user message:', userMsgError)
      throw userMsgError
    }

    // Store AI response
    const { error: aiMsgError } = await supabaseClient
      .from('ai_messages')
      .insert({
        conversation_id: finalConversationId,
        role: 'assistant',
        content: finalResponse || 'I processed your request.'
      })

    if (aiMsgError) {
      console.error('Error storing AI message:', aiMsgError)
      throw aiMsgError
    }

    // Update conversation timestamp
    const { error: updateError } = await supabaseClient
      .from('ai_conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', finalConversationId)

    if (updateError) {
      console.error('Error updating conversation:', updateError)
    }

    console.log('Successfully processed chat message')

    return new Response(JSON.stringify({
      response: finalResponse || 'I\'ve processed your request and used the available tools.',
      conversationId: finalConversationId,
      toolCalls: processedToolCalls
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Error in ai-trainer-chat function:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})