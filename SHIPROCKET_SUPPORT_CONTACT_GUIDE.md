# 📞 Shiprocket Support Contact Guide

## 🚨 Current Issue
Your Shiprocket account doesn't have the necessary API permissions to create orders programmatically.

## 📋 Contact Information

### Primary Contact Methods:
- **Email**: support@shiprocket.in
- **Phone**: 1800-102-0909
- **Live Chat**: Available on shiprocket.in (bottom right corner)

### Business Hours:
- **Monday to Friday**: 9:00 AM - 6:00 PM IST
- **Saturday**: 9:00 AM - 2:00 PM IST

## 📝 What to Tell Shiprocket Support

### Subject Line:
```
"API Permissions Required for Order Creation Integration"
```

### Email Template:
```
Dear Shiprocket Support Team,

I am trying to integrate Shiprocket API with my e-commerce platform but encountering permission errors.

Error Details:
- Error: 403 Forbidden - "Unauthorized. You do not have permission for this action."
- Account Email: [YOUR_SHIPROCKET_EMAIL]
- Account ID: [YOUR_ACCOUNT_ID if available]

Required API Endpoints:
1. /v1/external/courier/serviceability/ - For checking courier availability
2. /v1/external/orders/create/adhoc - For creating orders
3. /v1/external/courier/track/awb/{awb} - For tracking orders
4. /v1/external/orders/cancel - For canceling orders

Current Status:
- ✅ Authentication is working (can get access token)
- ❌ API endpoints return 403 permission errors
- ❌ Cannot create orders programmatically

Request:
Please enable API permissions for my account to access the above endpoints for automated order creation and management.

Business Use Case:
- Automatically create Shiprocket orders when customers place orders on my website
- Track shipments and provide real-time updates to customers
- Manage order cancellations through the API

Please let me know if you need any additional information or documentation.

Thank you for your assistance.

Best regards,
[YOUR_NAME]
[YOUR_BUSINESS_NAME]
[YOUR_CONTACT_NUMBER]
```

## 🗣️ Phone Call Script

### When calling 1800-102-0909:

**Agent**: "Hello, how can I help you?"

**You**: "Hi, I need help with API permissions for my Shiprocket account. I'm getting 403 permission errors when trying to create orders through the API."

**Agent**: "Can you provide your account details?"

**You**: "My account email is [YOUR_EMAIL]. I can successfully authenticate and get an access token, but when I try to access API endpoints like courier serviceability or order creation, I get permission denied errors."

**Agent**: "What specific endpoints are you trying to access?"

**You**: "I need access to these endpoints:
1. Courier serviceability check
2. Order creation
3. Order tracking
4. Order cancellation

I'm building an e-commerce integration that automatically creates Shiprocket orders when customers place orders on my website."

**Agent**: "I'll help you enable these permissions. Let me check your account status."

## 🔍 Account Verification Steps

### Before Contacting Support:
1. **Log into Shiprocket Dashboard**
   - Go to https://app.shiprocket.in/
   - Verify your account is active

2. **Check Account Status**
   - Navigate to Settings → Account
   - Ensure all required documents are uploaded
   - Verify business details are complete

3. **Check API Settings**
   - Go to Settings → API
   - Note if API access is enabled/disabled
   - Check if there are any pending approvals

## 📊 Information to Provide Support

### Account Details:
- **Email**: [Your Shiprocket email]
- **Business Name**: [Your business name]
- **Account Type**: [Individual/Company]
- **Integration Type**: E-commerce platform integration

### Technical Details:
- **API Endpoints Needed**:
  - `GET /v1/external/courier/serviceability/`
  - `POST /v1/external/orders/create/adhoc`
  - `GET /v1/external/courier/track/awb/{awb}`
  - `POST /v1/external/orders/cancel`

- **Error Details**:
  - Status Code: 403
  - Error Message: "Unauthorized. You do not have permission for this action."
  - Authentication: Working (can get access token)

## ⏱️ Expected Timeline

### Typical Resolution Time:
- **Email Support**: 24-48 hours
- **Phone Support**: Immediate assistance
- **Account Activation**: 1-2 business days

### Follow-up:
- If no response within 24 hours, call the support number
- Keep the ticket number for reference
- Follow up every 2-3 days if needed

## 🔄 Alternative Solutions

### If API permissions cannot be enabled:

1. **Manual Order Creation**
   - Create orders manually in Shiprocket dashboard
   - Export order data from your system
   - Import to Shiprocket via CSV

2. **Webhook Integration**
   - Use webhooks for order updates
   - Set up automated notifications

3. **Third-party Integration**
   - Consider other shipping providers
   - Use middleware services

## 📞 Support Escalation

### If initial support doesn't help:

1. **Ask for Escalation**
   - Request to speak with a technical specialist
   - Ask for API team support

2. **Provide Technical Details**
   - Share error logs
   - Explain your integration requirements

3. **Follow Up**
   - Keep detailed records of all communications
   - Document all promises and timelines

## ✅ Success Indicators

### You'll know it's working when:
- ✅ API status endpoint returns `api_accessible: true`
- ✅ Order creation works without permission errors
- ✅ Tracking API calls succeed
- ✅ No more 403 errors

## 📱 Additional Resources

### Shiprocket Documentation:
- **API Docs**: https://docs.shiprocket.in/
- **Status Page**: https://status.shiprocket.in/
- **Community Forum**: Available on shiprocket.in

### Testing After Permissions are Enabled:
```bash
# Test API status
curl -X GET "http://localhost:3000/api/shiprocket/status" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Expected response:
{
  "success": true,
  "data": {
    "api_accessible": true,
    "permissions": {
      "canCreateOrders": true,
      "canTrackOrders": true,
      "canCancelOrders": true
    }
  }
}
```

## 🎯 Action Items

### Immediate (Today):
1. ✅ Contact Shiprocket support via email
2. ✅ Call support number if no response
3. ✅ Provide all required information

### Follow-up (This Week):
1. ✅ Check for support response
2. ✅ Test API permissions once enabled
3. ✅ Verify order creation works

### Long-term (Next Week):
1. ✅ Monitor API performance
2. ✅ Set up error monitoring
3. ✅ Document the integration process 