/**
 * Quick CrossMint API Test with timeout
 */

const testAddress = "0x678bCC985D12C5fF769A2F4A5ff323A2029284Bb";
const apiKey = "ck_staging_5zjWiW7TV26xSe1p117tHktSNAQmTwSLu51cB326brCKVc3DW8j5JDGx6yki39kDpAGjWd7fgrK7g17d9cCJeciWAG4ugruJABAMPS2PUxR2ECAwKnNju4pTKaSS1GkHZvvobJdPsJSHQxKnfBDHSZM9yKhsVHh8v9P6BiueSVF1aB3W5YN4kGY6mz3m85McCUTwre9rBCjTMbdy3kEkeCoP";

async function testQuickAPI() {
  try {
    console.log('🔍 Quick CrossMint API test...');
    
    const balanceUrl = `https://staging.crossmint.com/api/v1-alpha2/wallets/${testAddress}/balances?tokens=usdc,eth`;
    
    console.log('📡 Making request to:', balanceUrl);
    
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await fetch(balanceUrl, {
      method: 'GET',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json'
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    console.log('✅ Response received, status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Data received:', JSON.stringify(data, null, 2));
      
      // Look for USDC
      data.forEach(token => {
        if (token.token === 'usdc') {
          const ethSepoliaBalance = Number(token.balances['ethereum-sepolia']) / Math.pow(10, token.decimals);
          console.log(`💰 Found USDC on ethereum-sepolia: ${ethSepoliaBalance}`);
        }
      });
    } else {
      const error = await response.text();
      console.log('❌ API Error:', response.status, error);
    }
    
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('⏱️ Request timed out after 5 seconds');
    } else {
      console.error('❌ Test failed:', error.message);
    }
  }
}

testQuickAPI();