import fetch from 'node-fetch'

const SUPABASE_URL = 'https://niakqdolcdwxtrkbqmdi.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw'

async function testEdgeFunction(agentId) {
  try {
    console.log(`🧪 Testando Edge Function com agentId: ${agentId}`)
    
    const response = await fetch(`${SUPABASE_URL}/functions/v1/agent-whatsapp-manager/generate-qr`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({ agentId })
    })
    
    const data = await response.json()
    
    console.log(`📊 Status: ${response.status}`)
    console.log(`📄 Resposta:`, JSON.stringify(data, null, 2))
    
    if (response.ok && data.success) {
      console.log('✅ Edge Function funcionando corretamente!')
    } else {
      console.log('❌ Edge Function com erro:', data.error)
    }
    
  } catch (error) {
    console.error('❌ Erro ao testar Edge Function:', error)
  }
}

// Testar com diferentes agentIds
const agentIds = [
  'default-agent',
  'test-agent',
  'demo-agent',
  'lucas-agent'
]

for (const agentId of agentIds) {
  await testEdgeFunction(agentId)
  console.log('---')
} 