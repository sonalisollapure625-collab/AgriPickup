# AgriPickup — Database Schema Design

## Entities
1. **User**: Authentication, role (`CUSTOMER`, `SELLER`, `ADMIN`), active status.
2. **CustomerProfile**: Customer details, preferences, addresses.
3. **SellerProfile**: Seller contact, verification credentials.
4. **Nursery**: Physical nursery shop details in Karnataka (Bangalore, Mandya, etc.), geo-coordinates, pickup & delivery settings.
5. **Category**: Agricultural taxonomy (Flowering Plants, Fruit Saplings, Seeds, Organic Fertilizers, Bio-pesticides, Tools).
6. **Product**: Product listings with pricing, units, stock, verification status.
7. **ProductImage**: High-resolution and catalog asset imagery.
8. **Inventory**: Stock tracking and batch management.
9. **Reservation**: Advance nursery bookings and pickup time slots.
10. **Order & OrderItem**: Purchase transactions, fulfillment method (PICKUP vs HOME_DELIVERY).
11. **Payment**: Transaction ID, provider, status (PENDING, COMPLETED, FAILED, REFUNDED).
12. **DeliveryDetails**: Delivery address, contact, instructions.
13. **Review**: Customer feedback on products and verified nurseries.
14. **Notification**: In-app notifications for order alerts, disease diagnostics, stock updates.
15. **AuditLog**: Admin activity and verification tracking.
16. **PlantDiagnosisHistory**: Farmers' plant diagnostic reports, preliminary findings, treatment advice, and matching verified products.
