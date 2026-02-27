# Admin API Reference

Base URL: `https://api.aufraeumhelden.com`

All endpoints are prefixed with the base URL. The frontend reads the base from the `VITE_API_BASE` environment variable at build time, falling back to the hardcoded value above.

## Authentication

### Token storage

| Key | Storage | Description |
|-----|---------|-------------|
| `aust_access_token` | `localStorage` | JWT access token, injected as `Authorization: Bearer <token>` on every protected request |
| `aust_refresh_token` | `localStorage` | JWT refresh token, used to obtain a new access token on 401 |
| `aust_user` | `localStorage` | Decoded user object (`{ email, name, role }`) serialized as JSON |

### Token refresh flow

1. Every `apiFetch()` call injects `Authorization: Bearer <access_token>`.
2. On `401`, the client attempts one token refresh via `POST /api/v1/auth/refresh`.
3. If refresh succeeds, the original request is retried with the new token.
4. If refresh fails, `auth.logout()` is called and the user is redirected to `/admin/login`.

### Public endpoints (no token required)

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `GET /api/v1/estimates/images/{key}` (image/video proxy)

All other endpoints require a valid JWT.

---

## Error handling

On non-2xx responses the client reads the body as JSON and throws an `ApiError`:

```typescript
class ApiError extends Error {
  status: number;   // HTTP status code
  message: string;  // body.message or "Fehler {status}"
}
```

---

## 1. Auth

### POST /api/v1/auth/login

Authenticates a user and returns access and refresh tokens.

**Authentication:** Public (no token required)

**Request body:**

```typescript
{
  email: string;    // User email address
  password: string; // Plaintext password
}
```

**Response:**

```typescript
interface LoginResponse {
  access_token: string;  // JWT access token
  refresh_token: string; // JWT refresh token
  token_type: string;    // "Bearer"
  expires_in: number;    // Seconds until access token expires
}
```

The JWT payload is decoded client-side to extract `{ email, name, role }` for the auth store.

**Example:**

```bash
curl -X POST https://api.aufraeumhelden.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"secret"}'
```

**Used by:** `src/lib/stores/auth.svelte.ts` — `AuthStore.login()`

---

### POST /api/v1/auth/refresh

Exchanges a refresh token for a new access/refresh token pair.

**Authentication:** Public (no token required)

**Request body:**

```typescript
{
  refresh_token: string;
}
```

**Response:** Same shape as `LoginResponse` above.

**Example:**

```bash
curl -X POST https://api.aufraeumhelden.com/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refresh_token":"<refresh_token>"}'
```

**Used by:** `src/lib/stores/auth.svelte.ts` — `AuthStore.refreshToken()`; `src/lib/utils/api.svelte.ts` — automatic retry on 401

---

### POST /api/v1/auth/register

Creates a new admin user.

**Authentication:** Required (admin JWT)

**Request body:**

```typescript
{
  name: string;                      // Display name
  email: string;                     // Login email
  password: string;                  // Plaintext password (min 8 chars)
  role: "admin" | "operator";        // Access role
}
```

**Response:** Unspecified (success or error).

**Example:**

```bash
curl -X POST https://api.aufraeumhelden.com/api/v1/auth/register \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Max Muster","email":"max@example.com","password":"secret123","role":"admin"}'
```

**Used by:** `src/routes/admin/settings/+page.svelte` — `handleCreate()`

---

### POST /api/v1/auth/change-password

Changes the authenticated user's own password.

**Authentication:** Required (admin JWT)

**Request body:**

```typescript
{
  current_password: string;
  new_password: string;
}
```

**Response:** Unspecified (success or error).

**Example:**

```bash
curl -X POST https://api.aufraeumhelden.com/api/v1/auth/change-password \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"current_password":"old","new_password":"new1234"}'
```

**Used by:** `src/routes/admin/settings/+page.svelte` — `handleChangePassword()`

---

## 2. Dashboard

### GET /api/v1/admin/dashboard

Returns KPI counts, recent activity, and overbooked calendar dates.

**Authentication:** Required

**Query parameters:** None

**Response:**

```typescript
interface DashboardData {
  open_quotes: number;       // Quotes with status "pending"
  pending_offers: number;    // Offers awaiting customer response
  todays_bookings: number;   // Confirmed bookings for today
  total_customers: number;   // All-time customer count
  recent_activity: {
    type: string;            // Activity type identifier
    description: string;     // Human-readable description
    created_at: string;      // ISO 8601 timestamp
    status?: string;         // Optional status badge value
  }[];
  conflict_dates: {
    date: string;            // YYYY-MM-DD
    booked: number;          // Number of booked slots
    capacity: number;        // Configured daily capacity
  }[];
}
```

**Example:**

```bash
curl https://api.aufraeumhelden.com/api/v1/admin/dashboard \
  -H "Authorization: Bearer <token>"
```

**Used by:** `src/routes/admin/+page.svelte`

---

## 3. Quotes

### GET /api/v1/admin/quotes

Returns a paginated list of quotes with optional status and search filters.

**Authentication:** Required

**Query parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `status` | string | No | Filter by status: `pending`, `volume_estimated`, `offer_generated`, `offer_sent`, `accepted`, `done`, `paid` |
| `search` | string | No | Full-text search across customer name and email |
| `limit` | integer | No | Page size (default: 20) |
| `offset` | integer | No | Pagination offset (default: 0) |

**Response:**

```typescript
interface QuotesResponse {
  quotes: {
    id: string;
    customer_name: string | null;
    customer_email: string;
    origin_city: string | null;
    destination_city: string | null;
    volume_m3: number | null;
    status: string;
    created_at: string;        // ISO 8601
  }[];
  total: number;               // Total matching records (for pagination)
}
```

**Example:**

```bash
curl "https://api.aufraeumhelden.com/api/v1/admin/quotes?status=pending&limit=20&offset=0" \
  -H "Authorization: Bearer <token>"
```

**Used by:** `src/routes/admin/quotes/+page.svelte` — `loadQuotes()`; also used inline for customer typeahead search via `GET /api/v1/admin/customers`

---

### POST /api/v1/admin/quotes

Creates a new quote manually.

**Authentication:** Required

**Request body:**

```typescript
{
  customer_id: string;               // Existing customer UUID
  origin: {
    street: string;
    city: string;
    postal_code: string | null;
    floor: string | null;            // e.g. "EG", "1. OG", "DG"
    elevator: boolean | null;
  };
  destination: {
    street: string;
    city: string;
    postal_code: string | null;
    floor: string | null;
    elevator: boolean | null;
  };
  notes: string | null;              // Free-text notes (services, floor info, etc.)
  preferred_date?: string;           // YYYY-MM-DD
  distance_km?: number;              // Override distance in km
  estimated_volume_m3?: number;      // Manual volume (manual mode only)
  items_list?: string;               // Comma-separated item summary (manual mode only)
}
```

**Response:**

```typescript
{
  id: string;  // UUID of the new quote
}
```

**Example:**

```bash
curl -X POST https://api.aufraeumhelden.com/api/v1/admin/quotes \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": "uuid-here",
    "origin": {"street": "Musterstr. 1", "city": "Berlin", "postal_code": "10115", "floor": "2. OG", "elevator": false},
    "destination": {"street": "Beispielweg 5", "city": "Hamburg", "postal_code": "20095", "floor": "EG", "elevator": true},
    "notes": "Montage, Halteverbot Auszug",
    "preferred_date": "2026-03-15"
  }'
```

**Used by:** `src/routes/admin/quotes/+page.svelte` — `handleCreateQuote()`

---

### GET /api/v1/quotes/{id}

Returns full detail for a single quote including customer, addresses, estimation items, and linked offers.

**Authentication:** Required

**Path parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Quote UUID |

**Response:**

```typescript
interface QuoteDetail {
  quote: {
    id: string;
    volume_m3: number | null;
    distance_km: number;
    notes: string | null;
    status: string;
    customer_message: string | null;   // Original message from public form
    created_at: string;                // ISO 8601
  };
  customer: {
    id: string;
    name: string | null;
    email: string;
    phone: string | null;
  };
  origin_address: {
    id: string;
    street: string;
    city: string;
    postal_code: string | null;
    floor: string | null;
    elevator: boolean | null;
  } | null;
  destination_address: {
    id: string;
    street: string;
    city: string;
    postal_code: string | null;
    floor: string | null;
    elevator: boolean | null;
  } | null;
  estimations: {
    id: string;
    method: string;                    // "depth_sensor" | "video"
    status: string;                    // "processing" | "completed" | "failed"
    total_volume_m3: number | null;
    item_count: number;
    created_at: string;
    source_video_url: string | null;   // Relative path, prefix with API_BASE for display
    source_image_urls: string[];       // Relative paths, prefix with API_BASE for display
  }[];
  items: {
    name: string;
    volume_m3: number;
    quantity: number;
    confidence: number;                // 0–1 confidence score from vision model
    crop_url: string | null;           // Relative path to cropped image
    source_image_url: string | null;   // Relative path to source image
    bbox: number[] | null;             // Bounding box [x1, y1, x2, y2] in pixels
    crop_s3_key: string | null;
    bbox_image_index: number | null;   // Which source image contains the bbox
    seen_in_images: number[] | null;   // Indices of source images where item appears
    category: string | null;
    dimensions: unknown | null;        // Detected physical dimensions
  }[];
  offers: {
    id: string;
    total_brutto_cents: number | null;
    status: string;
    created_at: string;
  }[];
  latest_offer: {
    offer_id: string;
    persons: number;
    hours: number;
    rate_cents: number;
    total_netto_cents: number;
    total_brutto_cents: number;
    line_items: {
      label: string;
      remark: string | null;
      quantity: number;
      unit_price_cents: number;
      total_cents: number;
      is_labor: boolean;
    }[];
  } | null;
}
```

**Example:**

```bash
curl https://api.aufraeumhelden.com/api/v1/quotes/uuid-here \
  -H "Authorization: Bearer <token>"
```

**Used by:** `src/routes/admin/quotes/[id]/+page.svelte` — `loadQuote()`

---

### PATCH /api/v1/quotes/{id}

Updates mutable fields on a quote (volume, distance, notes).

**Authentication:** Required

**Path parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Quote UUID |

**Request body (all fields optional):**

```typescript
{
  estimated_volume_m3?: number | null;
  distance_km?: number;
  notes?: string | null;
  preferred_date?: string;            // YYYY-MM-DD
}
```

**Response:** Unspecified (success or error).

**Example:**

```bash
curl -X PATCH https://api.aufraeumhelden.com/api/v1/quotes/uuid-here \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"estimated_volume_m3": 28.5, "notes": "Montage"}'
```

**Used by:** `src/routes/admin/quotes/[id]/+page.svelte` — `saveQuote()`

---

### PUT /api/v1/quotes/{id}/estimation-items

Bulk-replaces the estimation items on a quote. Sends the full list; the backend deletes existing items and inserts these.

**Authentication:** Required

**Path parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Quote UUID |

**Request body:**

```typescript
{
  items: {
    name: string;
    volume_m3: number;
    quantity: number;
    confidence: number;
    crop_s3_key: string | null;
    bbox: number[] | null;             // [x1, y1, x2, y2]
    bbox_image_index: number | null;
    seen_in_images: number[] | null;
    category: string | null;
    dimensions: unknown | null;
  }[];
}
```

**Response:** Unspecified (success or error).

**Example:**

```bash
curl -X PUT https://api.aufraeumhelden.com/api/v1/quotes/uuid-here/estimation-items \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"items":[{"name":"Sofa","volume_m3":1.2,"quantity":1,"confidence":0.9,"crop_s3_key":null,"bbox":null,"bbox_image_index":null,"seen_in_images":null,"category":"furniture","dimensions":null}]}'
```

**Used by:** `src/routes/admin/quotes/[id]/+page.svelte` — `saveItems()`

---

### POST /api/v1/admin/quotes/{id}/status

Sets the quote status to any valid status value directly (flexible status transition).

**Authentication:** Required

**Path parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Quote UUID |

**Request body:**

```typescript
{
  status: "pending" | "volume_estimated" | "offer_generated" | "offer_sent" | "accepted" | "done" | "paid" | "rejected" | "cancelled";
}
```

**Response:** Unspecified (success or error).

**Example:**

```bash
curl -X POST https://api.aufraeumhelden.com/api/v1/admin/quotes/uuid-here/status \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"status":"accepted"}'
```

**Used by:** `src/routes/admin/quotes/[id]/+page.svelte` — `setQuoteStatus()`

---

### POST /api/v1/admin/quotes/{id}/delete

Soft-deletes a quote.

**Authentication:** Required

**Path parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Quote UUID |

**Request body:** Empty.

**Response:** Unspecified (success or error).

**Example:**

```bash
curl -X POST https://api.aufraeumhelden.com/api/v1/admin/quotes/uuid-here/delete \
  -H "Authorization: Bearer <token>"
```

**Used by:** `src/routes/admin/quotes/[id]/+page.svelte` — `deleteQuote()`

---

## 4. Estimates

### POST /api/v1/estimates/depth-sensor

Uploads one or more room photos. The backend runs a depth-sensor/vision pipeline to detect furniture, compute volume per item, and stores an `EstimationEntry` linked to the quote.

**Authentication:** Required

**Request body:** `multipart/form-data`

| Field | Type | Description |
|-------|------|-------------|
| `quote_id` | string | UUID of the quote to attach the estimation to |
| `images` | File[] | One or more image files (JPG, PNG, WebP, HEIC — max 50 MB each) |

**Response:**

```typescript
{
  id: string;
  status: "processing" | "completed" | "failed";
}[]
```

The frontend polls `GET /api/v1/estimates/{id}` every 5 seconds (up to 10 minutes) until all returned `id`s reach `completed` or `failed`.

**Example:**

```bash
curl -X POST https://api.aufraeumhelden.com/api/v1/estimates/depth-sensor \
  -H "Authorization: Bearer <token>" \
  -F "quote_id=uuid-here" \
  -F "images=@room1.jpg" \
  -F "images=@room2.jpg"
```

**Used by:**
- `src/routes/admin/quotes/+page.svelte` — photo mode during quote creation
- `src/routes/admin/quotes/[id]/+page.svelte` — `uploadPhotos()`

---

### POST /api/v1/estimates/video

Uploads one or more room walkthrough videos for 3D volume analysis.

**Authentication:** Required

**Request body:** `multipart/form-data`

| Field | Type | Description |
|-------|------|-------------|
| `quote_id` | string | UUID of the quote |
| `video` | File[] | One or more video files (MP4, MOV, WebM, MKV, AVI — max 500 MB each) |

**Response:**

```typescript
{
  id: string;
  status: "processing" | "completed" | "failed";
}[]
```

The frontend polls `GET /api/v1/estimates/{id}` the same way as depth-sensor.

**Example:**

```bash
curl -X POST https://api.aufraeumhelden.com/api/v1/estimates/video \
  -H "Authorization: Bearer <token>" \
  -F "quote_id=uuid-here" \
  -F "video=@walkthrough.mp4"
```

**Used by:**
- `src/routes/admin/quotes/+page.svelte` — video mode during quote creation
- `src/routes/admin/quotes/[id]/+page.svelte` — `uploadVideos()`

---

### GET /api/v1/estimates/{id}

Polls the processing status of a single estimation job.

**Authentication:** Required

**Path parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Estimation UUID |

**Response:**

```typescript
{
  id: string;
  status: "processing" | "completed" | "failed";
}
```

**Example:**

```bash
curl https://api.aufraeumhelden.com/api/v1/estimates/uuid-here \
  -H "Authorization: Bearer <token>"
```

**Used by:** `src/routes/admin/quotes/[id]/+page.svelte` — `pollEstimations()`

---

### DELETE /api/v1/estimates/{id}

Deletes an estimation entry and all its associated items.

**Authentication:** Required

**Path parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Estimation UUID |

**Response:** Unspecified (success or error).

**Example:**

```bash
curl -X DELETE https://api.aufraeumhelden.com/api/v1/estimates/uuid-here \
  -H "Authorization: Bearer <token>"
```

**Used by:** `src/routes/admin/quotes/[id]/+page.svelte` — `deleteEstimation()`

---

### GET /api/v1/estimates/images/{key}

Public image/video proxy. Returns the raw file bytes. **No authentication required.**

Because this endpoint is public, images and videos can be embedded directly in `<img src>` and `<video>` tags. The `key` is a relative path returned in `source_image_urls` or `source_video_url` fields. Prefix with `API_BASE` when constructing the full URL.

**Authentication:** Public (no token)

**Path parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `key` | string | File key/path (URL-encoded if it contains slashes) |

**Response:** Raw binary (image or video), with appropriate `Content-Type`.

**Example:**

```html
<img src="https://api.aufraeumhelden.com/api/v1/estimates/images/quotes/abc123/photo1.jpg" />
```

**Used by:** `src/routes/admin/quotes/[id]/+page.svelte` — gallery and video display via `API_BASE + url`

---

## 5. Offers

### GET /api/v1/admin/offers

Returns a paginated list of offers with optional status filter.

**Authentication:** Required

**Query parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `status` | string | No | Filter: `draft`, `sent`, `accepted`, `rejected` |
| `limit` | integer | No | Page size (default: 20) |
| `offset` | integer | No | Pagination offset (default: 0) |

**Response:**

```typescript
interface OffersResponse {
  offers: {
    id: string;
    offer_number: string | null;       // Human-readable reference, e.g. "ANG-2026-001"
    customer_name: string | null;
    total_brutto_cents: number | null; // Gross price in euro cents
    status: string;
    created_at: string;                // ISO 8601
  }[];
  total: number;
}
```

**Example:**

```bash
curl "https://api.aufraeumhelden.com/api/v1/admin/offers?status=draft&limit=20" \
  -H "Authorization: Bearer <token>"
```

**Used by:** `src/routes/admin/offers/+page.svelte` — `loadOffers()`

---

### GET /api/v1/admin/offers/{id}

Returns full detail for a single offer including line items, pricing, and customer info.

**Authentication:** Required

**Path parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Offer UUID |

**Response:**

```typescript
interface OfferDetail {
  id: string;
  offer_number: string | null;
  quote_id: string;
  customer_name: string;
  customer_email: string;
  origin_address: string;            // Formatted address string
  destination_address: string;       // Formatted address string
  volume_m3: number;
  distance_km: number;
  persons: number;                   // Number of movers
  hours: number;                     // Estimated hours
  rate_cents: number;                // Hourly rate per mover in euro cents
  total_netto_cents: number;         // Net total in euro cents
  total_brutto_cents: number;        // Gross total (netto * 1.19) in euro cents
  line_items: {
    label: string;
    remark: string | null;
    quantity: number;
    unit_price_cents: number;
    total_cents: number;
    is_labor: boolean;               // true for the labor line item
  }[];
  status: string;                    // "draft" | "sent" | "accepted" | "rejected"
  valid_until: string | null;        // ISO 8601 date
  pdf_url: string | null;            // Relative path, fetch via apiDownload()
  created_at: string;
  items: {
    name: string;
    volume_m3: number;
    quantity: number;
    crop_url: string | null;
    source_image_url: string | null;
    bbox: number[] | null;
  }[];
  email_subject: string;             // Pre-filled email subject for sending
  email_body: string;                // Pre-filled email body for sending
}
```

**Example:**

```bash
curl https://api.aufraeumhelden.com/api/v1/admin/offers/uuid-here \
  -H "Authorization: Bearer <token>"
```

**Used by:** `src/routes/admin/offers/[id]/+page.svelte` — `loadOffer()`

---

### POST /api/v1/offers/generate

Generates a new offer from an existing quote. Computes pricing, produces a PDF, and links it to the quote.

**Authentication:** Required

**Request body:**

```typescript
{
  quote_id: string;
  persons: number;
  hours: number;
  rate: number;                        // Hourly rate per mover in euros (not cents)
  price_cents_netto?: number;          // Override net total in euro cents (optional)
  line_items?: {
    description: string;
    quantity: number;
    unit_price: number;                // In euros (not cents)
    remark?: string;
  }[];
}
```

**Response:**

```typescript
{
  id: string;  // UUID of the new offer
}
```

**Example:**

```bash
curl -X POST https://api.aufraeumhelden.com/api/v1/offers/generate \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "quote_id": "uuid-here",
    "persons": 3,
    "hours": 4,
    "rate": 30.00,
    "line_items": [
      {"description": "Transporter", "quantity": 1, "unit_price": 60.00},
      {"description": "Halteverbotszone", "quantity": 2, "unit_price": 100.00}
    ]
  }'
```

**Used by:** `src/routes/admin/quotes/[id]/+page.svelte` — `generateOffer()`

---

### GET /api/v1/offers/{id}/pdf

Downloads the offer as a PDF file.

**Authentication:** Required

**Path parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Offer UUID |

**Response:** PDF binary (`application/pdf`).

**Important:** Must be fetched via `apiDownload()`, not an `<a href>` tag, because the request must include the `Authorization` header.

**Example:**

```typescript
await apiDownload(`/api/v1/offers/${offerId}/pdf`, `Angebot_${offerNumber}.pdf`);
```

**Used by:** `src/routes/admin/offers/[id]/+page.svelte` — PDF download button

---

### PATCH /api/v1/admin/offers/{id}

Updates pricing and line items on an existing offer.

**Authentication:** Required

**Path parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Offer UUID |

**Request body:**

```typescript
{
  price_netto_cents: number;
  persons: number;
  hours: number;
  rate_per_hour_cents: number;
  line_items_json: {
    description: string;
    quantity: number;
    unit_price: number;                // In euros (not cents)
    is_labor: boolean;
    remark: string | null;
  }[];
}
```

**Response:** Unspecified (success or error).

**Example:**

```bash
curl -X PATCH https://api.aufraeumhelden.com/api/v1/admin/offers/uuid-here \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"price_netto_cents":119000,"persons":3,"hours":4,"rate_per_hour_cents":3000,"line_items_json":[{"description":"Transporter","quantity":1,"unit_price":60,"is_labor":false,"remark":null}]}'
```

**Used by:** `src/routes/admin/offers/[id]/+page.svelte` — `saveOffer()`

---

### POST /api/v1/admin/offers/{id}/regenerate

Regenerates the PDF for an offer, optionally with updated pricing parameters.

**Authentication:** Required

**Path parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Offer UUID |

**Request body (all fields optional):**

```typescript
{
  persons?: number;
  hours?: number;
  rate?: number;                       // In euros (not cents)
  price_cents?: number;                // Net total override in euro cents
  line_items?: {
    description: string;
    quantity: number;
    unit_price: number;                // In euros
    remark?: string;
  }[];
}
```

**Response:** Unspecified (success or error).

**Example:**

```bash
curl -X POST https://api.aufraeumhelden.com/api/v1/admin/offers/uuid-here/regenerate \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"persons":3,"hours":4,"rate":30.00}'
```

**Used by:**
- `src/routes/admin/offers/[id]/+page.svelte` — `saveOffer()` (after PATCH), `regenerateOffer()`
- `src/routes/admin/quotes/[id]/+page.svelte` — regeneration flow

---

### POST /api/v1/admin/offers/{id}/re-estimate

Recalculates route distance and regenerates the offer with updated pricing.

**Authentication:** Required

**Path parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Offer UUID |

**Request body:** Empty (`{}`).

**Response:** Unspecified (success or error).

**Example:**

```bash
curl -X POST https://api.aufraeumhelden.com/api/v1/admin/offers/uuid-here/re-estimate \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Used by:**
- `src/routes/admin/offers/[id]/+page.svelte` — `reEstimateOffer()`
- `src/routes/admin/quotes/[id]/+page.svelte` — `reEstimateOffer()`

---

### POST /api/v1/admin/offers/{id}/send

Sends the offer PDF to the customer by email.

**Authentication:** Required

**Path parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Offer UUID |

**Request body:**

```typescript
{
  email_subject: string;
  email_body: string;
}
```

**Response:** Unspecified (success or error). Transitions offer status to `sent`.

**Example:**

```bash
curl -X POST https://api.aufraeumhelden.com/api/v1/admin/offers/uuid-here/send \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"email_subject":"Ihr Umzugsangebot","email_body":"Sehr geehrte..."}'
```

**Used by:** `src/routes/admin/offers/[id]/+page.svelte` — `sendOffer()`

---

### POST /api/v1/admin/offers/{id}/reject

Marks an offer as rejected.

**Authentication:** Required

**Path parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Offer UUID |

**Request body:** Empty or omitted.

**Response:** Unspecified (success or error).

**Example:**

```bash
curl -X POST https://api.aufraeumhelden.com/api/v1/admin/offers/uuid-here/reject \
  -H "Authorization: Bearer <token>"
```

**Used by:** `src/routes/admin/offers/[id]/+page.svelte` — `rejectOffer()`

---

### POST /api/v1/admin/offers/{id}/delete

Deletes an offer.

**Authentication:** Required

**Path parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Offer UUID |

**Request body:** Empty or omitted.

**Response:** Unspecified (success or error).

**Example:**

```bash
curl -X POST https://api.aufraeumhelden.com/api/v1/admin/offers/uuid-here/delete \
  -H "Authorization: Bearer <token>"
```

**Used by:** `src/routes/admin/offers/[id]/+page.svelte` — `deleteOffer()`

---

## 6. Customers

### GET /api/v1/admin/customers

Returns a paginated, searchable list of customers.

**Authentication:** Required

**Query parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `search` | string | No | Full-text search across name and email |
| `limit` | integer | No | Page size (default: 20) |
| `offset` | integer | No | Pagination offset (default: 0) |

**Response:**

```typescript
interface CustomersResponse {
  customers: {
    id: string;
    email: string;
    name: string | null;
    phone: string | null;
    created_at: string;   // ISO 8601
  }[];
  total: number;
}
```

**Example:**

```bash
curl "https://api.aufraeumhelden.com/api/v1/admin/customers?search=mueller&limit=20" \
  -H "Authorization: Bearer <token>"
```

**Used by:**
- `src/routes/admin/customers/+page.svelte` — `loadCustomers()`
- `src/routes/admin/quotes/+page.svelte` — customer typeahead (`search` + `limit=8`)

---

### POST /api/v1/admin/customers

Creates a new customer.

**Authentication:** Required

**Request body:**

```typescript
{
  email: string;           // Required. Must be unique.
  name: string | null;
  phone: string | null;
}
```

**Response:**

```typescript
{
  id: string;              // UUID of the new customer
  email: string;
  name: string | null;
  phone: string | null;
  created_at: string;
}
```

**Example:**

```bash
curl -X POST https://api.aufraeumhelden.com/api/v1/admin/customers \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"email":"kunde@beispiel.de","name":"Maria Muster","phone":"+49 30 123456"}'
```

**Used by:**
- `src/routes/admin/customers/+page.svelte` — `handleCreateCustomer()`
- `src/routes/admin/quotes/+page.svelte` — inline customer creation during quote creation

---

### GET /api/v1/admin/customers/{id}

Returns full customer detail including linked quotes and offers.

**Authentication:** Required

**Path parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Customer UUID |

**Response:**

```typescript
interface CustomerDetail {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  created_at: string;
  quotes: {
    id: string;
    status: string;
    estimated_volume_m3: number | null;
    preferred_date: string | null;
    created_at: string;
  }[];
  offers: {
    id: string;
    quote_id: string;
    price_cents: number;               // Net price in euro cents
    status: string;
    created_at: string;
    sent_at: string | null;
  }[];
}
```

**Example:**

```bash
curl https://api.aufraeumhelden.com/api/v1/admin/customers/uuid-here \
  -H "Authorization: Bearer <token>"
```

**Used by:** `src/routes/admin/customers/[id]/+page.svelte` — `loadCustomer()`

---

### PATCH /api/v1/admin/customers/{id}

Updates customer fields.

**Authentication:** Required

**Path parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Customer UUID |

**Request body (all fields optional):**

```typescript
{
  name?: string | null;
  phone?: string | null;
  email?: string;
}
```

**Response:** Unspecified (success or error).

**Example:**

```bash
curl -X PATCH https://api.aufraeumhelden.com/api/v1/admin/customers/uuid-here \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Maria Mustermann","phone":"+49 30 654321"}'
```

**Used by:** `src/routes/admin/customers/[id]/+page.svelte` — `saveCustomer()`

---

### POST /api/v1/admin/customers/{id}/delete

Deletes a customer and all associated data.

**Authentication:** Required

**Path parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Customer UUID |

**Request body:** Empty or omitted.

**Response:** Unspecified (success or error).

**Example:**

```bash
curl -X POST https://api.aufraeumhelden.com/api/v1/admin/customers/uuid-here/delete \
  -H "Authorization: Bearer <token>"
```

**Used by:** `src/routes/admin/customers/[id]/+page.svelte` — `deleteCustomer()`

---

## 7. Calendar

### GET /api/v1/calendar/schedule

Returns day schedules (bookings + availability) for a date range. Used to render the monthly calendar view.

**Authentication:** Required

**Query parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `from` | string | Yes | Start date `YYYY-MM-DD` (inclusive) |
| `to` | string | Yes | End date `YYYY-MM-DD` (inclusive) |

**Response:**

The API may return either an array directly or a wrapped object. The frontend handles both:

```typescript
DaySchedule[] | { dates: DaySchedule[] }
```

Where `DaySchedule` is:

```typescript
interface DaySchedule {
  date: string;             // YYYY-MM-DD
  bookings: {
    id: string;
    quote_id: string | null;
    customer_name: string | null;
    customer_email: string | null;
    departure_address: string | null;
    arrival_address: string | null;
    volume_m3: number | null;
    offer_price_cents: number | null;
    description: string | null;
    status: string;         // "pending" | "confirmed" | "cancelled"
  }[];
  availability: {
    capacity: number;       // Maximum simultaneous bookings
    booked: number;         // Current confirmed booking count
    available: boolean;     // capacity > booked
    remaining: number;      // capacity - booked
  };
}
```

**Example:**

```bash
curl "https://api.aufraeumhelden.com/api/v1/calendar/schedule?from=2026-03-01&to=2026-03-31" \
  -H "Authorization: Bearer <token>"
```

**Used by:** `src/routes/admin/calendar/+page.svelte` — `loadSchedule()`

---

### PUT /api/v1/calendar/capacity/{date}

Sets or overrides the booking capacity for a specific date.

**Authentication:** Required

**Path parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `date` | string | `YYYY-MM-DD` |

**Request body:**

```typescript
{
  capacity: number;   // Max simultaneous bookings (integer >= 0)
}
```

**Response:** Unspecified (success or error).

**Example:**

```bash
curl -X PUT https://api.aufraeumhelden.com/api/v1/calendar/capacity/2026-03-15 \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"capacity":2}'
```

**Used by:** `src/routes/admin/calendar/+page.svelte` — `saveCapacity()`

---

### POST /api/v1/calendar/bookings

Creates a manual booking for a date (not linked to a quote).

**Authentication:** Required

**Request body:**

```typescript
{
  booking_date: string;          // YYYY-MM-DD
  customer_name: string | null;
  customer_email: string | null;
  description: string | null;
}
```

**Response:** Unspecified (success or error).

**Example:**

```bash
curl -X POST https://api.aufraeumhelden.com/api/v1/calendar/bookings \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"booking_date":"2026-03-15","customer_name":"Hans Test","customer_email":"hans@test.de","description":"Privatumzug Berlin"}'
```

**Used by:** `src/routes/admin/calendar/+page.svelte` — `createBooking()`

---

### PATCH /api/v1/calendar/bookings/{id}

Updates the status of an existing booking.

**Authentication:** Required

**Path parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Booking UUID |

**Request body:**

```typescript
{
  status: "confirmed" | "cancelled";
}
```

**Response:** Unspecified (success or error).

**Example:**

```bash
curl -X PATCH https://api.aufraeumhelden.com/api/v1/calendar/bookings/uuid-here \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"status":"confirmed"}'
```

**Used by:** `src/routes/admin/calendar/+page.svelte` — `confirmBooking()`, `cancelBooking()`

---

### DELETE /api/v1/calendar/bookings/{id}

Permanently deletes a booking.

**Authentication:** Required

**Path parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Booking UUID |

**Response:** Unspecified (success or error).

**Example:**

```bash
curl -X DELETE https://api.aufraeumhelden.com/api/v1/calendar/bookings/uuid-here \
  -H "Authorization: Bearer <token>"
```

**Used by:** `src/routes/admin/calendar/+page.svelte` — `deleteBooking()`

---

## 8. Emails

### GET /api/v1/admin/emails

Returns a paginated list of email threads.

**Authentication:** Required

**Query parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `search` | string | No | Full-text search across customer name, email, and subject |
| `limit` | integer | No | Page size (default: 20) |
| `offset` | integer | No | Pagination offset (default: 0) |

**Response:**

```typescript
interface EmailThreadsResponse {
  threads: {
    id: string;
    customer_id: string;
    customer_email: string;
    customer_name: string | null;
    quote_id: string | null;
    subject: string | null;
    message_count: number;
    last_message_at: string | null;    // ISO 8601
    last_direction: "inbound" | "outbound" | null;
    created_at: string;
  }[];
  total: number;
}
```

**Example:**

```bash
curl "https://api.aufraeumhelden.com/api/v1/admin/emails?search=muster&limit=20" \
  -H "Authorization: Bearer <token>"
```

**Used by:** `src/routes/admin/emails/+page.svelte` — `loadThreads()`

---

### GET /api/v1/admin/emails/{id}

Returns a thread with all its messages.

**Authentication:** Required

**Path parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Thread UUID |

**Response:**

```typescript
interface ThreadResponse {
  thread: {
    id: string;
    customer_id: string;
    customer_email: string;
    customer_name: string | null;
    quote_id: string | null;
    subject: string | null;
    created_at: string;
  };
  messages: {
    id: string;
    direction: "inbound" | "outbound";
    from_address: string;
    to_address: string;
    subject: string | null;
    body_text: string | null;
    llm_generated: boolean;           // true if generated by the LLM auto-responder
    status: string;                   // "draft" | "sent"
    created_at: string;
  }[];
}
```

**Example:**

```bash
curl https://api.aufraeumhelden.com/api/v1/admin/emails/uuid-here \
  -H "Authorization: Bearer <token>"
```

**Used by:** `src/routes/admin/emails/[id]/+page.svelte` — `loadThread()`

---

### POST /api/v1/admin/emails/compose

Creates a new outbound email thread and saves the message as a draft.

**Authentication:** Required

**Request body:**

```typescript
{
  customer_email: string;
  subject: string;
  body_text: string;
}
```

**Response:**

```typescript
{
  thread_id: string;
  message_id: string;
}
```

**Example:**

```bash
curl -X POST https://api.aufraeumhelden.com/api/v1/admin/emails/compose \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"customer_email":"kunde@beispiel.de","subject":"Ihr Umzug","body_text":"Sehr geehrte Damen und Herren..."}'
```

**Used by:** `src/routes/admin/emails/+page.svelte` — `handleCompose()`

---

### POST /api/v1/admin/emails/{threadId}/reply

Adds a new outbound draft message to an existing thread.

**Authentication:** Required

**Path parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `threadId` | string | Thread UUID |

**Request body:**

```typescript
{
  subject: string | null;
  body_text: string;
}
```

**Response:** Unspecified (success or error).

**Example:**

```bash
curl -X POST https://api.aufraeumhelden.com/api/v1/admin/emails/uuid-here/reply \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"subject":null,"body_text":"Danke fuer Ihre Nachricht..."}'
```

**Used by:** `src/routes/admin/emails/[id]/+page.svelte` — `saveReply()`

---

### POST /api/v1/admin/emails/messages/{msgId}/send

Sends a draft message to the customer.

**Authentication:** Required

**Path parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `msgId` | string | Message UUID |

**Request body:** Empty or omitted.

**Response:**

```typescript
{
  message: string;   // Human-readable confirmation
}
```

**Example:**

```bash
curl -X POST https://api.aufraeumhelden.com/api/v1/admin/emails/messages/uuid-here/send \
  -H "Authorization: Bearer <token>"
```

**Used by:** `src/routes/admin/emails/[id]/+page.svelte` — `sendDraft()`

---

### POST /api/v1/admin/emails/messages/{msgId}/discard

Discards a draft message without sending.

**Authentication:** Required

**Path parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `msgId` | string | Message UUID |

**Request body:** Empty or omitted.

**Response:** Unspecified (success or error).

**Example:**

```bash
curl -X POST https://api.aufraeumhelden.com/api/v1/admin/emails/messages/uuid-here/discard \
  -H "Authorization: Bearer <token>"
```

**Used by:** `src/routes/admin/emails/[id]/+page.svelte` — `discardDraft()`

---

### PATCH /api/v1/admin/emails/messages/{msgId}

Updates the subject and/or body of a draft message.

**Authentication:** Required

**Path parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `msgId` | string | Message UUID |

**Request body:**

```typescript
{
  subject?: string | null;
  body_text?: string | null;
}
```

**Response:** Unspecified (success or error).

**Example:**

```bash
curl -X PATCH https://api.aufraeumhelden.com/api/v1/admin/emails/messages/uuid-here \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"body_text":"Aktualisierter Nachrichtentext..."}'
```

**Used by:** `src/routes/admin/emails/[id]/+page.svelte` — `saveEdit()`

---

### POST /api/v1/admin/emails/messages/{msgId}/regenerate

Asks the LLM to regenerate the body of a draft message.

**Authentication:** Required

**Path parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `msgId` | string | Message UUID |

**Request body:** Empty or omitted.

**Response:** Unspecified (success or error).

**Example:**

```bash
curl -X POST https://api.aufraeumhelden.com/api/v1/admin/emails/messages/uuid-here/regenerate \
  -H "Authorization: Bearer <token>"
```

**Used by:** `src/routes/admin/emails/[id]/+page.svelte` (regenerate button, per CLAUDE.md endpoint list)

---

## 9. Users

### GET /api/v1/admin/users

Returns all admin users.

**Authentication:** Required

**Query parameters:** None

**Response:**

```typescript
{
  users: {
    id: string;
    email: string;
    name: string;
    role: "admin" | "operator";
    created_at: string;      // ISO 8601
  }[];
}
```

**Example:**

```bash
curl https://api.aufraeumhelden.com/api/v1/admin/users \
  -H "Authorization: Bearer <token>"
```

**Used by:** `src/routes/admin/settings/+page.svelte` — `loadUsers()`

---

### POST /api/v1/admin/users/{id}/delete

Deletes an admin user.

**Authentication:** Required

**Path parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | User UUID |

**Request body:** Empty or omitted.

**Response:** Unspecified (success or error).

**Example:**

```bash
curl -X POST https://api.aufraeumhelden.com/api/v1/admin/users/uuid-here/delete \
  -H "Authorization: Bearer <token>"
```

**Used by:** `src/routes/admin/settings/+page.svelte` — `requestDeleteUser()`

---

## 10. Distance

### POST /api/v1/distance/calculate

Calculates the driving route between two addresses and returns the geometry for map rendering and distance in km.

**Authentication:** Required

**Request body:**

```typescript
{
  addresses: [string, string];   // [origin address string, destination address string]
}
```

**Response:**

```typescript
{
  legs: {
    geometry: [number, number][];  // Array of [longitude, latitude] coordinate pairs
    // additional leg fields may be present
  }[];
}
```

Note: The geometry uses `[longitude, latitude]` order (GeoJSON convention). The frontend swaps to `[latitude, longitude]` for Leaflet.

**Example:**

```bash
curl -X POST https://api.aufraeumhelden.com/api/v1/distance/calculate \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"addresses":["Musterstr. 1, 10115 Berlin","Beispielweg 5, 20095 Hamburg"]}'
```

**Used by:**
- `src/routes/admin/quotes/[id]/+page.svelte` — `loadQuote()` (non-blocking route map)
- `src/routes/admin/offers/[id]/+page.svelte` — `loadOffer()` (non-blocking route map)

---

## 11. Addresses

### PATCH /api/v1/admin/addresses/{id}

Updates fields on an existing address record (linked to a quote's origin or destination).

**Authentication:** Required

**Path parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Address UUID |

**Request body:**

```typescript
{
  street?: string;
  postal_code?: string;
  city?: string;
  floor?: string;        // e.g. "EG", "1. OG", "DG", "UG", "0" (ground floor numeric)
  elevator?: boolean;
}
```

**Response:** Unspecified (success or error).

**Example:**

```bash
curl -X PATCH https://api.aufraeumhelden.com/api/v1/admin/addresses/uuid-here \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"street":"Neue Str. 10","city":"Berlin","floor":"3. OG","elevator":true}'
```

**Used by:** `src/routes/admin/quotes/[id]/+page.svelte` — `saveAddress()` (inline address editor for origin and destination)

---

## Appendix: Currency and date conventions

| Convention | Detail |
|------------|--------|
| Currency storage | All monetary values are stored and transmitted as **integer euro cents** |
| Currency display | `formatEuro(cents)` → `"1.234,56 EUR"` (German locale, de-DE) |
| Date display | `formatDate(iso)` → `"25.02.2026"` |
| Datetime display | `formatDateTime(iso)` → `"25.02.2026, 14:30"` |
| VAT | 19% applied on output: `brutto = Math.round(netto * 1.19)` |

## Appendix: Quote status lifecycle

```
pending
  └── volume_estimated   (after depth-sensor or video estimation)
        └── offer_generated
              └── offer_sent
                    ├── accepted
                    │     ├── done
                    │     │     └── paid
                    │     └── (stays accepted)
                    └── rejected

Any status can transition directly to rejected or cancelled via setQuoteStatus().
```

## Appendix: Booking status lifecycle

```
pending → confirmed
pending → cancelled
confirmed → cancelled
```

## Appendix: Offer status lifecycle

```
draft → sent → accepted
             → rejected
```

## Appendix: File download pattern

PDF and other protected binary downloads must use `apiDownload()` instead of `<a href>` tags, because the browser cannot attach the `Authorization` header to anchor navigation:

```typescript
import { apiDownload } from '$lib/utils/api.svelte';

await apiDownload(`/api/v1/offers/${offerId}/pdf`, `Angebot_${offerNumber}.pdf`);
```

The function fetches the file with auth headers, creates a temporary object URL, and programmatically clicks a hidden `<a>` element to trigger the browser's native download dialog.
