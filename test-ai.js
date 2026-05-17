const fs = require('fs');

async function runAITest() {
  const BASE_URL = 'http://localhost:5000/api';
  const email = `ai_tester_${Date.now()}@example.com`;
  const password = 'password123';
  let token = '';
  let productId = '';
  let analysisId = '';

  console.log('--- ADIM 1: Kimlik Oluşturma ---');
  const regRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'AI Tester', email, password })
  });
  const regData = await regRes.json();
  if (!regData.success) throw new Error('Kayıt başarısız');
  token = regData.data.accessToken;
  console.log('✅ Token alındı.\n');

  console.log('--- ADIM 2: Örnek Ürün Ekleme ---');
  const prodRes = await fetch(`${BASE_URL}/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({
      name: 'Yazlık Beyaz T-Shirt',
      category: 'Giyim',
      brand: 'InceAyar',
      advantages: 'Terletmez, kolay ütülenir, %100 pamuk',
      features: { 'Beden': 'M', 'Renk': 'Beyaz' }
    })
  });
  const prodData = await prodRes.json();
  if (!prodData.success) throw new Error('Ürün oluşturma başarısız');
  productId = prodData.data._id;
  console.log(`✅ Ürün eklendi (ID: ${productId}).\n`);

  console.log('--- ADIM 3: Analizi Başlat (Langgraph) ---');
  const startRes = await fetch(`${BASE_URL}/analyses/start/${productId}`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const startData = await startRes.json();
  if (!startData.success) throw new Error('Analiz başlatılamadı');
  analysisId = startData.data.analysisId;
  console.log(`✅ Langgraph süreci tetiklendi (Analiz ID: ${analysisId}).\n`);

  console.log('--- ADIM 4: SSE Akışını İzleme (Canlı Progress) ---');
  const streamRes = await fetch(`${BASE_URL}/analyses/${analysisId}/stream`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (!streamRes.body) throw new Error('Stream alınamadı');

  // Node 18+ async iterables for stream
  let bufferText = '';
  for await (const chunk of streamRes.body) {
    bufferText += Buffer.from(chunk).toString('utf-8');
    
    let boundary = bufferText.indexOf('\n\n');
    while (boundary !== -1) {
      const message = bufferText.slice(0, boundary);
      bufferText = bufferText.slice(boundary + 2);
      
      if (message.startsWith('data: ')) {
        const payload = message.replace('data: ', '').trim();
        
        const agentMatch = payload.match(/"agent"\s*:\s*"([^"]+)"/);
        if (agentMatch) {
          console.log(`🔄 [AJAN BİLDİRİMİ]: ${agentMatch[1].toUpperCase()} ajanından sonuç alındı.`);
        }
        
        const statusMatch = payload.match(/"status"\s*:\s*"([^"]+)"/);
        if (statusMatch) {
          console.log(`🏁 [DURUM BİLDİRİMİ]: Süreç ${statusMatch[1].toUpperCase()} oldu.`);
        }
      }
      boundary = bufferText.indexOf('\n\n');
    }
    
    if (bufferText.includes('"status":"completed"') || bufferText.includes('"status":"failed"')) {
      console.log('🏁 Stream sonlandı.');
      break;
    }
  }

  console.log('\n--- ADIM 5: Tamamlanan Analiz Verisini Çekme ---');
  const finalRes = await fetch(`${BASE_URL}/analyses/${analysisId}`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const finalData = await finalRes.json();
  console.log('📄 NİHAİ ANALİZ SONUCU:');
  console.log(JSON.stringify(finalData.data, null, 2));
}

runAITest().catch(console.error);
