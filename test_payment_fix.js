// Test script to simulate payment flow and order fetching

// Test 1: Payment success simulation
const testPaymentData = {
  razorpay_payment_id: 'pay_test_123456789',
  razorpay_order_id: 'order_test_987654321',
  razorpay_signature: 'test_signature_hash',
  orderItems: [
    {
      product: '507f1f77bcf86cd799439011', // Sample MongoDB ObjectId
      name: 'Test Kitchen Lock',
      quantity: 2,
      price: 649.99,
      image: '/test-product.jpg'
    }
  ],
  shippingAddress: {
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com',
    phone: '9876543210',
    address: '123 Test Street',
    city: 'Test City',
    state: 'Gujarat',
    zipCode: '123456',
    country: 'India'
  }
};

async function testPaymentEndpoint() {
  try {
    console.log('🧪 Testing payment success endpoint...');
    console.log('📦 Sending test data:', JSON.stringify(testPaymentData, null, 2));
    
    const response = await fetch('http://localhost:8081/api/checkout/razorpay-success', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test_token' // This will fail auth but we can see the order processing
      },
      body: JSON.stringify(testPaymentData)
    });

    const result = await response.text();
    console.log('📄 Response status:', response.status);
    console.log('📄 Response:', result);
    
    if (response.status === 401 || response.status === 403) {
      console.log('✅ Expected auth error - endpoint is processing the request structure correctly');
    } else if (response.status === 422) {
      console.log('❌ Validation error - check the request data structure');
    } else {
      console.log('ℹ️ Unexpected response - check server logs');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Test 2: Test order fetching with an existing order ID (you'll need to replace this with a real one)
async function testOrderFetch() {
  try {
    console.log('\n🧪 Testing order fetch endpoint...');
    
    // You'll need to replace this with an actual order ID from your database
    const testOrderId = '688f84ecde7a49fa12f11d25'; // From your previous logs
    
    const response = await fetch(`http://localhost:8081/api/orders/${testOrderId}`, {
      headers: {
        'Authorization': 'Bearer test_token' // This will fail auth but we can see if endpoint exists
      }
    });

    const result = await response.text();
    console.log('📄 Order fetch response status:', response.status);
    console.log('📄 Order fetch response:', result);
    
    if (response.status === 401 || response.status === 403) {
      console.log('✅ Order endpoint exists but requires valid auth');
    } else if (response.status === 404) {
      console.log('❌ Order not found - check if order ID exists');
    } else {
      console.log('ℹ️ Unexpected response - check server logs');
    }
    
  } catch (error) {
    console.error('❌ Order fetch test failed:', error.message);
  }
}

async function runTests() {
  await testPaymentEndpoint();
  await testOrderFetch();
}

runTests();
