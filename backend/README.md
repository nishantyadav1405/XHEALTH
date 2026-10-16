# CareBridge AI — TypeScript backend

Backend implementation for the **CareBridge AI hackathon prototype**, based on the supplied master prompt. All demo data is fictional. **Do not use with real patient data or claim compliance.**

## Folder structure

```text
carebridge-ai-backend/
├── src/
│   ├── server.ts                 # Express routes, authentication, validation, authorization
│   └── security.ts               # Consent expiry/revocation/doctor matching helpers
├── supabase/migrations/
│   ├── 001_initial.sql           # 10 relational tables, indexes, RLS, private storage
│   ├── 002_encounter_authorship.sql
│   └── 003_demo_storage.sql
├── scripts/seed-demo.ts          # Fictional Rahul Sharma + 3 organizations + 6 records
├── tests/security.test.ts        # Grant authorization unit tests
├── .env.example
├── package.json
└── tsconfig.json
```

## Setup

1. Create a **new dedicated Supabase project** for synthetic data.
2. Run the SQL migrations in filename order using Supabase SQL Editor.
3. Copy `.env.example` to `.env` and supply Supabase URL, anon key, service-role key. **Service-role key must never be included in frontend code.**
4. Run `npm install`, then `npm run dev` to start at `http://localhost:4000`.
5. To seed fictional records, add `ALLOW_DEMO_SEED=true` to `.env`, run `npm run seed:demo`, then remove that flag. **Seed creates demo Auth accounts with known passwords; never run against a real environment.**
6. In your React frontend, authenticate using Supabase JS, and send `Authorization: Bearer <session.access_token>` on API calls.
7. Run `npm run build` and `npm test` to typecheck and test when dependencies are installed.

## API endpoints

| Method | Endpoint | Role | Function |
|---|---|---|---|
| GET | `/health` | Public | Health response |
| GET | `/api/me` | Authenticated | Current profile |
| GET | `/api/records` | Patient | Owned medical records |
| GET | `/api/timeline` | Patient | Chronological history |
| GET | `/api/documents` | Patient | List/search owned documents (`q`, `category`) |
| GET | `/api/documents/:id` | Patient | Document metadata + extraction history |
| POST | `/api/documents/upload-url` | Patient | Private signed upload URL |
| POST | `/api/documents/:id/complete` | Patient | Verify upload exists |
| GET | `/api/documents/:id/url` | Patient | Short-lived private file URL |
| DELETE | `/api/documents/:id` | Patient | Delete owned document |
| POST | `/api/documents/:id/demo-extract` | Patient | Explicit deterministic demo extraction |
| GET | `/api/extractions` | Patient | Processing history |
| POST | `/api/extractions/:id/review` | Patient | Correct/mark reviewed extraction |
| GET | `/api/observations` | Patient | Laboratory observation data |
| GET | `/api/medications` | Patient | Documented medications |
| GET | `/api/organizations` | Authenticated | Fictional organizations |
| GET | `/api/doctors` | Patient | Fictional doctor options |
| POST | `/api/grants` | Patient | Consent + opaque token link |
| GET | `/api/grants` | Patient | Active/expired/revoked grants |
| POST | `/api/grants/:id/revoke` | Patient | Revoke grant |
| GET | `/api/doctor/shared/:token` | Doctor | Scoped authorized records |
| GET | `/api/doctor/shared/:token/handover` | Doctor | Source-linked record compilation |
| GET | `/api/doctor/shared/:token/documents/:documentId/url` | Doctor | Authorized short-lived source file URL |
| POST | `/api/doctor/shared/:token/encounters` | Doctor | Append fictional encounter note |
| GET | `/api/audit` | Patient | Patient access history |

### Example patient-to-doctor flow

1. Log in as the fictional patient and fetch `/api/records`.
2. Create a grant using `POST /api/grants` with JSON:
   ```json
   {"doctor_id":"<doctor-uuid>","record_ids":["<record-uuid>"],"purpose":"Fictional continuity consultation","expires_in_minutes":60}
   ```
3. The response includes `share_url`. Render a QR code for that URL **in the frontend**. The URL contains an opaque token, not health data.
4. Log in as the selected doctor and GET `/api/doctor/shared/<token>`.
5. Return to the patient and POST `/api/grants/<grant-id>/revoke`.
6. Retry the doctor request; the server returns HTTP 403.

## Known limitations / work remaining

- **AI:** Only a deterministic metadata-only demo processor is implemented; it does not parse uploaded PDF/images. A real vision LLM, OCR, validated extraction schema and prompt-injection defenses still require implementation. Do not label demo extraction as AI-powered analysis.
- **Security:** This is not audited for clinical production. Signed document URLs remain usable until their 30-second expiration after grant revocation. Harden with authenticated streaming/proxy or a different access architecture for immediate file revocation. Atomic authorization+read, storage malware scanning, MIME verification, durable distributed rate limits, and full integration tests are still needed.
- **Seed data:** Six consistent fictional records and their source text documents are created. These are synthetic placeholders, not real medical PDFs.
- **Export:** Handover is returned as JSON for frontend PDF export; a dedicated PDF generation API is not included.
- **Demo reset:** Re-seeding is idempotent for records by title; a destructive reset endpoint is intentionally not exposed.
- **Authentication:** Demo accounts use published test credentials; they must never exist in production.
- **Testing:** Unit tests cover consent matching and expiry, but not a full running Supabase integration or cross-patient database authorization.

This package is a substantial backend foundation and end-to-end demo API, **not a claim that every master-prompt acceptance criterion has been completed**.


## Corrections

- The combined source has been split into actual project files.
- Grant queries now propagate database failures instead of treating them as invalid grants.
- Linked source documents cannot be deleted via the API while referenced by medical records.
- Duplicate demo extraction attempts are rejected; the processor remains metadata-only.
- Several previously unchecked database updates now fail visibly.
- No live Supabase integration testing has been performed.
