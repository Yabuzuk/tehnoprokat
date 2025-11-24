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
    const { token, tokens, title, body, data } = await req.json()

    // Поддержка как одного токена, так и массива токенов
    const targetTokens = tokens || (token ? [token] : [])
    
    if (targetTokens.length === 0 || !title || !body) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: token/tokens, title, body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Отправляем на локальный push-сервер
    const pushServerUrl = 'http://localhost:3002/api/send-notification' + (tokens ? '-multi' : '')
    
    const payload = tokens 
      ? { tokens: targetTokens, title, body, data }
      : { token: targetTokens[0], title, body, data }

    const response = await fetch(pushServerUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    const result = await response.json()

    return new Response(
      JSON.stringify(result),
      { 
        status: response.ok ? 200 : 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})