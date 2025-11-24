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
    
    const response = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Authorization': 'key=AAAAlZPBDzs:APA91bHtNJeIx0YLsCSQ95x6gafsT2ADwbx7IIfICKFWIh_b21wG6zTvEp9zYOeN-JMe-7GttOA5LFfkosbvSyVJ2plPZNnj-FqL64HMrTCTQPAHlJS3J6iKSwtbjO8C6p6EHgzcIYOW',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: token,
        priority: 'high',
        notification: {
          title,
          body,
          sound: 'default',
          click_action: 'FCM_PLUGIN_ACTIVITY'
        },
        data: data || {}
      }),
    })

    const result = await response.json()
    
    return new Response(
      JSON.stringify({ success: response.ok, status: response.status, result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})