import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SERVICE_ACCOUNT = {
  "type": "service_account",
  "project_id": "newagent-c434a",
  "private_key_id": "eb080ef12e28e5c87b423de0c7b19c1c0e14e282",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQDX2Jgz3yOjbstd\nJaU2pJenR8X5H8UVGL71i8lTEhjsPwb2Hujfui96X/mcho++3mP+L4K7lE9wr0PM\nuTMvmzjJHGwft3q+Jqmo1zwlVKy68nFMNNVBQQqcZ2sUhmeUx7khJWH7Ao4wQPcI\naqMdJHO1k7rSBVKWoGHvrC4EOnEuzbAyvjMbgNKemMA6TqYT8fL7aCIc/imeKr2s\ngjeaQOTlufoDbubQ3O8OKrByq/Ta1I63TslQuksS1146KilT9V4ZNSlEqPOMK9/T\nk7uCA71li81WPEVLy5qEBZK5SgKN2EZUyk4jQH0iaIVNH64YWaGDiO+AJcMamrG9\nMJP1y8/dAgMBAAECgf8KwNNaQD25fFVqQsCxdj7FNjSTBXRhxAE5jSOpyKtNzum5\nIh/aYB1voLrid9G1baXMqXW2cG4Shbx4glsaN0Lvrk99i+l55lOw7ksYrJVoe97K\nlnym3yhhR8mjjtd6tXx3z6/LDKBfeEdsAHmxk5V6/Du42GOnZE45zdguRh2MqX+e\n26363S4PNLCycGpxm+r2RuBMGDs5bI08h6tXLvygwaXw2vxRVVq8ihUlLVXCeiuQ\nJjn0gKAmJNYIw4ENnmEE0otrSX1XfVDBKxjkcnjH+Ky8U2jQOzvuNKwOzSnG39Dd\nLMJMiNdDVyUIxjQh9GNN5t99qAtUU2f+D1t8+G0CgYEA+bVzgxZRYUCA0AlbjM7V\ng19YmcHtgkZatub+VTQxYclZy36loXZtjTz2qS0PvtWTrSJYqBBUxhrO74Bt66RC\nGzV8AgTPKQ7whEfCYNwDdODkluRoAenfDCm27SObLW1xGWu+nw7Q7T04pLWy23ur\nxxFHBrkCB4dPZ5EZ41EeZgcCgYEA3Ui9GN4sO/Ai1M4BgnPcDHIrfDbnKb3XnEFA\nS4Vsr1kdL6d0SA3utLfZyG4Z1CnBhHCYJ81nwp+1qdZ1htfZ1W/kgJZMVmrQSfxk\n2ZWD76G9j2TZEkRizTAglS1f+WJaWgAVafhPazIliCniBoIIYl94tuXkfrdoX+LO\n0cy6QfsCgYEA2/KF4os/90eXrqbvauGsk+Dh690zVTKfKMfici5c6OMwItxVDBmC\neYufQHiei9sYDsJYEQEBitWGPNOE/rBaQhkkN6sAxguQsxN6FVL2AHcvIfHh4v2b\nJ91+cPaR8ruZiWisKPIl+TGZuQsKleUi8182jqdbMEJxIKpggSesfPUCgYB7I91H\nF2vaNvnLHpCsfbj4nBgi2ZKuIdz4MT+MR0WCFr8tI6yL5GTv4FerN8nbzRjJkLa7\nf4y8O5AmYRep4Dhyk/++puT4OhyK749XneJ72a/ZOi+qALBSqvOW0FdWOis5Zk6E\nWBAqAQ/txBDpujbcN3C/pxMOiRXmNhsNmTYVPQKBgQCjuygWqSisDCbAeYoGwZNe\nhy66inM84wojHZiG/T2h9YaFn0lB0KD0ziWzZZIMsJIfeELZa9m8ecFfsifIrlm7\n4WV4/lj6RLiQGSnO2VQXei2HvBHhM+7t4hV6y1Od6l2X1p5FIsFjjxpW80FH7++y\nXwE7sBBAqLR1ltmfJCT8Bg==\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-fbsvc@newagent-c434a.iam.gserviceaccount.com",
  "client_id": "113467611762080539371",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40newagent-c434a.iam.gserviceaccount.com"
}

async function getAccessToken() {
  const jwtHeader = btoa(JSON.stringify({ alg: "RS256", typ: "JWT" }))
  const now = Math.floor(Date.now() / 1000)
  const jwtClaimSet = btoa(JSON.stringify({
    iss: SERVICE_ACCOUNT.client_email,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: SERVICE_ACCOUNT.token_uri,
    exp: now + 3600,
    iat: now
  }))
  
  const signatureInput = `${jwtHeader}.${jwtClaimSet}`
  
  const privateKey = await crypto.subtle.importKey(
    "pkcs8",
    pemToArrayBuffer(SERVICE_ACCOUNT.private_key),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  )
  
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    privateKey,
    new TextEncoder().encode(signatureInput)
  )
  
  const jwt = `${signatureInput}.${btoa(String.fromCharCode(...new Uint8Array(signature)))}`
  
  const response = await fetch(SERVICE_ACCOUNT.token_uri, {
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
      `https://fcm.googleapis.com/v1/projects/${SERVICE_ACCOUNT.project_id}/messages:send`,
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
      JSON.stringify({ error: error.message, stack: error.stack }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})