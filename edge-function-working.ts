import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { token, title, body, data } = await req.json()
    
    console.log('📨 Sending to:', token.substring(0, 20) + '...')
    
    const fcmResponse = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'key=AAAAlZPBDzs:APA91bHtNJeIx0YLsCSQ95x6gafsT2ADwbx7IIfICKFWIh_b21wG6zTvEp9zYOeN-JMe-7GttOA5LFfkosbvSyVJ2plPZNnj-FqL64HMrTCTQPAHlJS3J6iKSwtbjO8C6p6EHgzcIYOW'
      },
      body: JSON.stringify({
        to: token,
        priority: 'high',
        notification: {
          title: title,
          body: body,
          sound: 'default'
        },
        data: data || {}
      })
    })

    const text = await fcmResponse.text()
    console.log('📊 Response:', text)
    
    let result
    try {
      result = JSON.parse(text)
    } catch {
      result = { raw: text }
    }
    
    return new Response(
      JSON.stringify({ 
        success: fcmResponse.ok, 
        status: fcmResponse.status, 
        result 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('❌ Error:', error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})