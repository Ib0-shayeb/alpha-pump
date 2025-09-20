import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    console.log('Getting user from Supabase...')
    const {
      data: { user },
      error: userError
    } = await supabaseClient.auth.getUser(authHeader.replace('Bearer ', ''))

    if (userError) {
      console.error('Error getting user:', userError)
      return new Response(`Authentication error: ${userError.message}`, { status: 401, headers: corsHeaders })
    }

    if (!user) {
      console.error('No user found in token')
      return new Response('No user found', { status: 401, headers: corsHeaders })
    }

    console.log('User authenticated:', user.id)

    const { message, conversationId } = await req.json()
    console.log('Request body parsed:', { message: message?.slice(0, 50), conversationId })

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
- If they ask about creating workout routines, you can recommend specific exercises and rep ranges
- Keep responses concise but informative
- Be friendly and supportive like a real personal trainer would be

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

    // Call Gemini API
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
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
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Gemini API error:', response.status, response.statusText, errorText)
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    console.log('Gemini response:', JSON.stringify(data, null, 2))

    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text
    if (!aiResponse) {
      throw new Error('No response from Gemini API')
    }

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
        content: aiResponse
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
      response: aiResponse,
      conversationId: finalConversationId
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