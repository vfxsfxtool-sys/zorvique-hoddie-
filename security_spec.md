# Zorvique Firestore Security Specification

## 1. Data Invariants
1. Storefront public reads are allowed ONLY on `siteSettings`, `homepage`, `heroSlides`, `collections`, `testimonials`, `pages`, and `products` where `status == "published"`.
2. `discountCodes` supports `get` by exact uppercase code ID, never `list`, preventing promo code enumeration.
3. Public `create` on `orders` must enforce `status == "new"`, `paymentStatus in ["pending", "verification"]`, `courier == ""`, `trackingNo == ""`, valid customer PII bounds, non-empty `items` (1..30), non-negative totals, and `createdAt == request.time`.
4. Public `read`, `update`, and `delete` on `orders` and `subscribers` are strictly forbidden; only verified admins may access PII.
5. Public `create` on `subscribers` must contain only `email` (valid email string <= 254 chars) and `createdAt == request.time`.
6. Admin access requires `request.auth != null && request.auth.token.email_verified == true` AND either `request.auth.token.email == "lessuse611@gmail.com"` or `exists(/databases/$(database)/documents/admins/$(request.auth.token.email))`.
7. Only the owner (`lessuse611@gmail.com`) may list or mutate `admins/{email}` documents.
8. Draft products (`status == "draft"`) are unreadable by unauthenticated clients or non-admins.
9. All string fields enforce explicit `.size()` bounds and all IDs enforce `isValidId()` (`^[a-zA-Z0-9_-]+$`) or `isValidEmailId()`.
10. Order `createdAt` is immutable on update.
11. `productReviews` stores non-PII reviews keyed deterministically as `{productId}_{uid}`; creation/update/delete require verified auth (`email_verified == true`), `authorUid == request.auth.uid`, integer `rating` 1..5, strict field bounds, and server timestamps (`request.time`).

## 2. The "Dirty Dozen" Attack Payloads (All Must Fail with PERMISSION_DENIED)
1. **Unauthenticated Draft Product Read**: `get(/products/draft-hoodie)` as anonymous user -> DENIED.
2. **Unauthenticated Product List Without Published Filter**: `list(/products)` without `where("status", "==", "published")` -> DENIED.
3. **Promo Code Enumeration**: `list(/discountCodes)` as anonymous user -> DENIED.
4. **Order PII Scraping**: `get(/orders/ord-1)` or `list(/orders)` as anonymous user -> DENIED.
5. **Order Status Spoofing on Create**: `create(/orders/ord-bad)` with `status: "confirmed"` or `paymentStatus: "paid"` -> DENIED.
6. **Order Shadow Field Injection**: `create(/orders/ord-shadow)` adding `isVerified: true` -> DENIED.
7. **Order Timestamp Spoofing**: `create(/orders/ord-time)` with client-forged `createdAt` != `request.time` -> DENIED.
8. **Subscriber Shadow Field / Read**: `create(/subscribers/sub-1)` with extra `role: "admin"` or `get(/subscribers/sub-1)` as anonymous user -> DENIED.
9. **Privilege Escalation (Self-Admin Write)**: `create(/admins/attacker@evil.com)` by non-owner authenticated user -> DENIED.
10. **Unverified Admin Email Spoof**: Write to `/products/p1` with `email == "lessuse611@gmail.com"` and `email_verified: false` -> DENIED.
11. **Path Variable ID Poisoning**: `create(/orders/bad$id/...)` or 500-char ID -> DENIED.
12. **Resource Exhaustion (Oversized String)**: `create(/subscribers/sub-big)` with 5000-char email -> DENIED.
13. **Review Auth / Identity / Schema Spoofing**: Anonymous review write, unverified email review write, forged `authorUid != request.auth.uid`, float/out-of-range rating (`6` or `4.5`), shadow field (`verifiedPurchase: true`), or editing another user's review -> DENIED.
