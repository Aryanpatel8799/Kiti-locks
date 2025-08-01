# 🚀 Shiprocket API Error Solutions

## Current Error: 403 Forbidden - "Unauthorized. You do not have permission for this action."

### 🔍 Root Cause Analysis
The Shiprocket account doesn't have the necessary API permissions to access the courier serviceability endpoint. This is a common issue with Shiprocket accounts that haven't been fully activated or don't have the required API access level.

### ✅ Solutions (In Order of Priority)

#### 1. **Contact Shiprocket Support** (Recommended)
- **Email**: support@shiprocket.in
- **Phone**: 1800-102-0909
- **Request**: Enable API permissions for your account
- **Mention**: You need access to the following API endpoints:
  - `/v1/external/courier/serviceability/`
  - `/v1/external/orders/create/adhoc`
  - `/v1/external/courier/track/awb/{awb}`
  - `/v1/external/orders/cancel`

#### 2. **Verify Account Activation**
- Log into your Shiprocket dashboard
- Check if your account is fully activated
- Ensure all required documents are uploaded
- Verify your business details are complete

#### 3. **Check API Access Level**
- Navigate to Shiprocket Dashboard → Settings → API
- Ensure API access is enabled
- Check if you have the required API permissions
- Verify your API credentials are correct

#### 4. **Alternative: Manual Order Creation**
If API access cannot be enabled immediately, you can:
- Create orders manually in Shiprocket dashboard
- Use the tracking functionality through the dashboard
- Export order data and import to Shiprocket

### 🔧 Technical Fixes Implemented

#### Enhanced Error Handling
```typescript
// New permission checking function
export const checkShiprocketPermissions = async () => {
  // Tests API access and returns detailed permission status
}
```

#### Better Error Messages
```typescript
// Specific error handling for 403 errors
if (error.response && error.response.status === 403) {
  throw new Error(`Shiprocket API Permission Error: ${errorMessage}. Please contact Shiprocket support to enable API permissions for your account.`);
}
```

#### API Status Endpoint
```typescript
// New endpoint to check API status
GET /api/shiprocket/status
```

### 📋 Action Items

#### Immediate Actions:
1. ✅ **Enhanced Error Handling** - Implemented better error messages
2. ✅ **Permission Checking** - Added API status verification
3. ✅ **User Guidance** - Clear instructions for resolving issues

#### Next Steps:
1. **Contact Shiprocket Support** - Enable API permissions
2. **Test API Access** - Use the new status endpoint
3. **Monitor Integration** - Check if permissions are granted

### 🛠️ Testing the Fix

#### Check API Status:
```bash
curl -X GET "http://localhost:3000/api/shiprocket/status" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Expected Response (Before Fix):
```json
{
  "success": true,
  "data": {
    "api_accessible": false,
    "permissions": {
      "canCreateOrders": false,
      "canTrackOrders": false,
      "canCancelOrders": false,
      "error": "Shiprocket account does not have API permissions"
    },
    "recommendations": [
      "Contact Shiprocket support to enable API permissions",
      "Verify your Shiprocket account is fully activated",
      "Check if your account has the required API access level"
    ]
  }
}
```

#### Expected Response (After Fix):
```json
{
  "success": true,
  "data": {
    "api_accessible": true,
    "permissions": {
      "canCreateOrders": true,
      "canTrackOrders": true,
      "canCancelOrders": true
    },
    "recommendations": []
  }
}
```

### 📞 Support Contacts

#### Shiprocket Support:
- **Email**: support@shiprocket.in
- **Phone**: 1800-102-0909
- **Live Chat**: Available on shiprocket.in

#### Technical Support:
- **Documentation**: https://docs.shiprocket.in/
- **API Reference**: https://docs.shiprocket.in/reference
- **Status Page**: https://status.shiprocket.in/

### 🔄 Fallback Strategy

If API access cannot be enabled:

1. **Manual Order Creation**: Create orders manually in Shiprocket dashboard
2. **CSV Import**: Export order data and import to Shiprocket
3. **Webhook Integration**: Use webhooks for order updates
4. **Alternative Shipping**: Consider other shipping providers

### 📊 Monitoring

#### Check Integration Status:
```bash
# Test authentication
curl -X POST "https://apiv2.shiprocket.in/v1/external/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"YOUR_EMAIL","password":"YOUR_PASSWORD"}'

# Test API access
curl -X GET "https://apiv2.shiprocket.in/v1/external/courier/serviceability/" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

### 🎯 Success Criteria

The integration will be considered successful when:
- ✅ API authentication works
- ✅ Serviceability check returns 200 OK
- ✅ Order creation works
- ✅ Order tracking works
- ✅ Order cancellation works

### 📝 Notes

- The current error is a **permission issue**, not a code issue
- The authentication is working correctly
- The API endpoints are correct
- The issue is on Shiprocket's side (account permissions)
- Contacting Shiprocket support is the recommended solution 