import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Service Account из Firebase Console
const SERVICE_ACCOUNT = {
  "type": "service_account",
  "project_id": "newagent-c434a",
  "private_key_id": "ВСТАВЬТЕ_ИЗ_JSON",
  "private_key": "ВСТАВЬТЕ_ИЗ_JSON",
  "client_email": "ВСТАВЬТЕ_ИЗ_JSON",
  "client_id": "ВСТАВЬТЕ_ИЗ_JSON",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "ВСТАВЬТЕ_ИЗ_JSON"
}

async function getAccessToken() {
  const jwtHeader = btoa(JSON.stringify({ alg: "RS256", typ: "JWT" }))
  const now = Math.floor(Date.now() / 1000)
  const jwtClaimSet = btoa(JSON.stringify({
    iss: SERVICE_ACCOUNT.client_email,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now
  }))
  
  const signatureInput = `${jwtHeader}.${jwtClaimSet}`
  
  // Импортируем приватный ключ
  const privateKey = await crypto.subtle.importKey(
    "pkcs8",
    pemToArrayBuffer(SERVICE_ACCOUNT.private_key),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  )
  
  // Подписываем
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    privateKey,
    new TextEncoder().encode(signatureInput)
  )
  
  const jwt = `${signatureInput}.${btoa(String.fromCharCode(...new Uint8Array(signature)))}`
  
  // Получаем токен
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
  })
  
  const data = await response.json()
  return data.access_token
}

function pemToArrayBuffer(pem: string) {
  const b64 = pem.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\n/g, '')
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { token, title, body, data } = await req.json()
    
    const accessToken = await getAccessToken()
    
    const response = await fetch(
      `https://fcm.googleapis.com/v1/projects/newagent-c434a/messages:send`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: {
            token,
            notification: { title, body },
            data: data || {},
            android: {
              priority: 'high',
              notification: {
                sound: 'default',
                click_action: 'FCM_PLUGIN_ACTIVITY'
              }
            }
          }
        }),
      }
    )

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