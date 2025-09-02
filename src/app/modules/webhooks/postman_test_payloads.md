# Postman Test Payloads for Webhooks Module

## API Endpoint

```
POST {{base_url}}/webhooks/msg91-whatsapp-status
```

## Headers

```
Content-Type: application/json
Accept: application/json
```

---

## 1. Unlock Contact Intimation - Failed Status (Triggers SMS Fallback)

### Request Body:

```json
{
  "status": "failed",
  "mobile": "+919876543210",
  "content": "{\"body_1\":{\"text\":\"1234567890\"},\"body_2\":{\"text\":\"John Doe\"},\"body_3\":{\"text\":\"+919876543210\"},\"body_4\":{\"text\":\"john.doe@example.com\"}}",
  "templateName": "unlock_contact_intimation_v1",
  "CRQID": "webhook-test-123",
  "requestId": "msg91-req-456",
  "failureReason": "User blocked the number",
  "uuid": "test-uuid-789",
  "integratedNumber": "+919876543210",
  "messageType": "template",
  "direction": "outbound",
  "templateLanguage": "en",
  "statusUpdatedAt": "2024-01-15T10:30:00Z"
}
```

### Expected Response:

```json
{
  "statusCode": 200,
  "success": true,
  "message": "Fallback SMS sent successfully",
  "data": {
    "originalStatus": "failed",
    "templateName": "unlock_contact_intimation_v1",
    "mobile": "+919876543210",
    "fallbackResult": "sms-sent-confirmation"
  }
}
```

---

## 2. Order Confirmation - Failed Status (Triggers SMS Fallback)

### Request Body:

```json
{
  "status": "failed",
  "mobile": "+919876543210",
  "content": "{\"body_1\":{\"text\":\"John Doe\"},\"body_2\":{\"text\":\"₹\"},\"body_3\":{\"text\":\"1000\"},\"body_4\":{\"text\":\"ORD123456\"}}",
  "templateName": "order_confirmation_v1",
  "CRQID": "webhook-test-456",
  "requestId": "msg91-req-789",
  "failureReason": "User blocked the number",
  "uuid": "test-uuid-123",
  "integratedNumber": "+919876543210",
  "messageType": "template",
  "direction": "outbound",
  "templateLanguage": "en",
  "statusUpdatedAt": "2024-01-15T10:30:00Z"
}
```

### Expected Response:

```json
{
  "statusCode": 200,
  "success": true,
  "message": "Fallback SMS sent successfully",
  "data": {
    "originalStatus": "failed",
    "templateName": "order_confirmation_v1",
    "mobile": "+919876543210",
    "fallbackResult": "sms-sent-confirmation"
  }
}
```

---

## 3. Delivered Status (No Action Required)

### Request Body:

```json
{
  "status": "delivered",
  "mobile": "+919876543210",
  "templateName": "unlock_contact_intimation_v1",
  "CRQID": "webhook-test-789",
  "requestId": "msg91-req-123",
  "uuid": "test-uuid-456",
  "integratedNumber": "+919876543210",
  "messageType": "template",
  "direction": "outbound",
  "templateLanguage": "en",
  "statusUpdatedAt": "2024-01-15T10:30:00Z"
}
```

### Expected Response:

```json
{
  "statusCode": 200,
  "success": true,
  "message": "No action required for non-failed message",
  "data": {
    "status": "delivered",
    "templateName": "unlock_contact_intimation_v1"
  }
}
```

---

## 4. Invalid Payload (Missing Required Fields)

### Request Body:

```json
{
  "status": "failed",
  "mobile": "+919876543210"
}
```

### Expected Response:

```json
{
  "statusCode": 200,
  "success": false,
  "message": "Content is required for failed messages",
  "data": {
    "error": "Content is required for failed messages"
  }
}
```

---

## 5. Unsupported Template

### Request Body:

```json
{
  "status": "failed",
  "mobile": "+919876543210",
  "content": "{\"body_1\":{\"text\":\"Test\"}}",
  "templateName": "unsupported_template_v1",
  "CRQID": "webhook-test-999",
  "requestId": "msg91-req-999",
  "failureReason": "User blocked the number",
  "uuid": "test-uuid-999",
  "integratedNumber": "+919876543210",
  "messageType": "template",
  "direction": "outbound",
  "templateLanguage": "en",
  "statusUpdatedAt": "2024-01-15T10:30:00Z"
}
```

### Expected Response:

```json
{
  "statusCode": 200,
  "success": false,
  "message": "Template unsupported_template_v1 not supported for fallback",
  "data": {
    "error": "Unsupported template"
  }
}
```

---

## 6. Empty Payload

### Request Body:

```json
{}
```

### Expected Response:

```json
{
  "statusCode": 400,
  "success": false,
  "message": "Empty webhook payload received",
  "data": null
}
```

---

## 7. Read Status (No Action Required)

### Request Body:

```json
{
  "status": "read",
  "mobile": "+919876543210",
  "templateName": "unlock_contact_intimation_v1",
  "CRQID": "webhook-test-read",
  "requestId": "msg91-req-read",
  "uuid": "test-uuid-read",
  "integratedNumber": "+919876543210",
  "messageType": "template",
  "direction": "outbound",
  "templateLanguage": "en",
  "statusUpdatedAt": "2024-01-15T10:30:00Z"
}
```

### Expected Response:

```json
{
  "statusCode": 200,
  "success": true,
  "message": "No action required for non-failed message",
  "data": {
    "status": "read",
    "templateName": "unlock_contact_intimation_v1"
  }
}
```

---

## Quick Copy-Paste for Testing

### For Unlock Contact Intimation (Primary Test):

```json
{
  "status": "failed",
  "mobile": "+919876543210",
  "content": "{\"body_1\":{\"text\":\"1234567890\"},\"body_2\":{\"text\":\"John Doe\"},\"body_3\":{\"text\":\"+919876543210\"},\"body_4\":{\"text\":\"john.doe@example.com\"}}",
  "templateName": "unlock_contact_intimation_v1",
  "CRQID": "webhook-test-123",
  "requestId": "msg91-req-456",
  "failureReason": "User blocked the number",
  "uuid": "test-uuid-789",
  "integratedNumber": "+919876543210",
  "messageType": "template",
  "direction": "outbound",
  "templateLanguage": "en",
  "statusUpdatedAt": "2024-01-15T10:30:00Z"
}
```

### For Order Confirmation:

```json
{
  "status": "failed",
  "mobile": "+919876543210",
  "content": "{\"body_1\":{\"text\":\"John Doe\"},\"body_2\":{\"text\":\"₹\"},\"body_3\":{\"text\":\"1000\"},\"body_4\":{\"text\":\"ORD123456\"}}",
  "templateName": "order_confirmation_v1",
  "CRQID": "webhook-test-456",
  "requestId": "msg91-req-789",
  "failureReason": "User blocked the number",
  "uuid": "test-uuid-123",
  "integratedNumber": "+919876543210",
  "messageType": "template",
  "direction": "outbound",
  "templateLanguage": "en",
  "statusUpdatedAt": "2024-01-15T10:30:00Z"
}
```

---

## Testing Instructions

1. **Set up Postman**:

   - Method: `POST`
   - URL: `{{base_url}}/webhooks/msg91-whatsapp-status`
   - Headers: `Content-Type: application/json`

2. **Copy the payload** you want to test from above

3. **Paste into Postman** body (raw JSON)

4. **Send the request** and verify the response matches expected format

5. **Test different scenarios**:
   - Failed status (triggers SMS fallback)
   - Delivered/Read status (no action)
   - Invalid payload (validation errors)
   - Unsupported template (error handling)

---

## Environment Variables

Set up these variables in Postman:

- `base_url`: Your server URL (e.g., `http://localhost:5000`)
