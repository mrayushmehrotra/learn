# API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication
Currently, no authentication is required. All endpoints are public.

## Endpoints

### Users

#### GET /users
Get all users for dropdown display.

**Response:**
```json
[
  {
    "_id": "string",
    "name": "string",
    "totalPoints": "number",
    "avatar": "string",
    "rank": "number"
  }
]
```

#### POST /users
Create a new user.

**Request Body:**
```json
{
  "name": "string (required, 2-50 chars)",
  "avatar": "string (optional, valid URL)"
}
```

**Response:**
```json
{
  "_id": "string",
  "name": "string",
  "totalPoints": 0,
  "avatar": "string",
  "createdAt": "date",
  "updatedAt": "date"
}
```

### Claims

#### POST /claim/:userId
Claim random points (1-10) for a specific user.

**Parameters:**
- `userId` (string, required): MongoDB ObjectId

**Response:**
```json
{
  "pointsClaimed": "number",
  "message": "string",
  "leaderboard": [
    {
      "_id": "string",
      "name": "string",
      "totalPoints": "number",
      "avatar": "string",
      "rank": "number"
    }
  ]
}
```

### Leaderboard

#### GET /leaderboard
Get paginated leaderboard with rankings.

**Query Parameters:**
- `page` (number, optional, default: 1): Page number
- `limit` (number, optional, default: 10): Items per page (max: 100)

**Response:**
```json
{
  "users": [
    {
      "_id": "string",
      "name": "string",
      "totalPoints": "number",
      "avatar": "string",
      "rank": "number"
    }
  ],
  "pagination": {
    "currentPage": "number",
    "totalPages": "number",
    "totalUsers": "number",
    "hasNextPage": "boolean",
    "hasPrevPage": "boolean"
  }
}
```

### History

#### GET /history
Get claim history with optional user filtering.

**Query Parameters:**
- `userId` (string, optional): Filter by specific user

**Response:**
```json
[
  {
    "_id": "string",
    "userId": {
      "_id": "string",
      "name": "string",
      "avatar": "string"
    },
    "pointsClaimed": "number",
    "timestamp": "date"
  }
]
```

## Error Responses

All endpoints return errors in the following format:

```json
{
  "success": false,
  "error": "Error message",
  "details": ["Additional error details (optional)"]
}
```

### Common HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `404` - Not Found
- `500` - Internal Server Error

## Rate Limiting
Currently no rate limiting is implemented, but it's recommended for production use.

## CORS
CORS is enabled for all origins in development. Configure appropriately for production.