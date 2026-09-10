# Circuit Daily

Companion repository for the Free Computer Courses NestJS blog course.
Each numbered folder is a complete runnable snapshot (NestJS + Handlebars + Bootstrap + Passport + TypeORM + Postgres).

| Snapshot | Focus |
|---|---|
| `01-Getting-Started` | Nest hello |
| `02-Routing` | Controllers |
| `03-Layout-And-UI` | Handlebars + Bootstrap |
| `04-Data-Layer` | TypeORM + Postgres |
| `05-Feed-And-Detail` | Feed and detail |
| `06-Registration` | Registration + bcrypt |
| `07-Login-And-Sessions` | Passport + sessions |
| `08-Profiles-And-Media` | Profiles and uploads |
| `09-Posts-CRUD-And-Ownership` | Owned CRUD |
| `10-Pagination-And-Search` | Page size 5 + search |
| `11-Password-Reset` | Reset tokens |
| `12-Deploy` | Railway |

## Quick start

```bash
docker compose up -d
cd 07-Login-And-Sessions
npm install
cp .env.example .env
npm run start:dev
```

Seeds (stages 04+): `ada@example.com` / `grace@example.com` / `password123`.
App port: 3001. Postgres host port: 5437 with databases `circuit_01`–`circuit_12`.
