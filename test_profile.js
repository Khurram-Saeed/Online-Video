// Simple test for Instagram profile photo
const fetch = require('node-fetch');

async function testProfilePhoto() {
  try {
    const response = await fetch('http://localhost:3000/api/instagram/profile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'irfanjunejo'
      })
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers.raw());
    
    if (response.ok) {
      console.log('✅ Profile photo download successful!');
      // Save the file
      const buffer = await response.buffer();
      console.log('File size:', buffer.length, 'bytes');
    } else {
      const error = await response.json();
      console.log('❌ Error:', error);
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testProfilePhoto();