# AgriPickup — REST API Documentation

## Base URL
`/api`

## Core Endpoints
### Health
- `GET /api/health` -> System health and timestamp.

### Authentication
- `POST /api/auth/register` -> Register customer or seller.
- `POST /api/auth/login` -> Authenticate and issue JWT.
- `GET /api/auth/me` -> Fetch current session user profile.

### Nurseries & Sellers
- `GET /api/nurseries` -> List verified Karnataka nurseries with geo-filter.
- `GET /api/nurseries/:id` -> Single nursery details and pickup guidelines.

### Products
- `GET /api/products` -> List products (filterable by category, nursery, search).
- `GET /api/products/:id` -> Product details, stock status, seller verification.

### Plant Doctor AI
- `POST /api/plant-doctor/analyze` -> Upload plant photo for multimodal disease assessment and product matching.
- `GET /api/plant-doctor/history` -> Retrieve authenticated user's diagnosis history.
- `DELETE /api/plant-doctor/history/:id` -> Delete diagnosis record and private photo.
