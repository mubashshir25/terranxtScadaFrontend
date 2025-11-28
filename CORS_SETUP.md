# CORS Configuration Guide

## Frontend Solution (Development)

The frontend is now configured with a proxy in `package.json` that will forward requests to `http://localhost:8000` during development. This avoids CORS issues in development.

**Note:** You'll need to restart the React development server after adding the proxy configuration.

## Backend Solution (Recommended for Production)

For production or if you want to fix CORS at the backend level, you need to configure CORS on your backend server. Here are examples for common backend frameworks:

### FastAPI (Python)

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3001",  # React dev server
        "http://localhost:3000",  # Alternative React port
        # Add your production frontend URL here
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Express.js (Node.js)

```javascript
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors({
  origin: [
    'http://localhost:3001',
    'http://localhost:3000',
    // Add your production frontend URL here
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
```

### Flask (Python)

```python
from flask import Flask
from flask_cors import CORS

app = Flask(__name__)
CORS(app, origins=[
    "http://localhost:3001",
    "http://localhost:3000",
], supports_credentials=True)
```

### Django (Python)

```python
# settings.py
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3001",
    "http://localhost:3000",
]

CORS_ALLOW_CREDENTIALS = True

# Install: pip install django-cors-headers
# Add 'corsheaders' to INSTALLED_APPS
# Add 'corsheaders.middleware.CorsMiddleware' to MIDDLEWARE
```

## Environment Variables

For production, create a `.env` file in the frontend root:

```
REACT_APP_API_URL=http://your-backend-url.com
```

The frontend code will automatically use this URL in production builds.

