# AgriPickup — Architecture Overview

## 1. System Summary
AgriPickup is an agricultural marketplace connecting farmers, gardening enthusiasts, and agricultural buyers with verified local nurseries and agricultural input sellers across Karnataka. The platform features order placement, nursery reservations, pickup/home delivery coordination, and an integrated **Plant Doctor AI** diagnostic module.

## 2. Core Pillars
- **Decoupled Client & Server**: React (Vite) client consumes Express REST API.
- **Relational Domain Integrity**: Modeled in PostgreSQL with Prisma ORM.
- **Verified Local Ecosystem**: Strict verification gatekeepers for Karnataka nursery sellers.
- **Plant Doctor AI**: Multimodal vision analysis supporting preliminary disease identification, agricultural extension guidance, and contextual matching with verified agricultural products.

## 3. Communication Patterns
- Client to Server: JSON REST endpoints over HTTPS (`/api/v1/*`).
- Authentication: Stateless JWT bearer tokens with secure token storage.
- Storage: Dedicated uploads directory for plant diagnostic photos with authenticated access control.
