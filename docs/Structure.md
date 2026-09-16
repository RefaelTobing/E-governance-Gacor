raku-jakarta/
├── apps/
│   └── web/
│       ├── public/
│       ├── src/
│       │   ├── config/
│       │   │   ├── categories.js         # kosong/placeholder — diisi saat fitur ruang-publik digarap
│       │   │   ├── api.js                # base URL + shape endpoint map (kosong)
│       │   │   └── constants.js          # kosong
│       │   │
│       │   ├── routes/
│       │   │   ├── route-config.js       # array kosong + komentar contoh format entri
│       │   │   ├── RequireAuth.jsx       # skeleton guard, logic auth belum diisi
│       │   │   └── RequireAdmin.jsx      # skeleton guard untuk prefix /dashboard
│       │   │
│       │   ├── layouts/
│       │   │   ├── PublicLayout.jsx      # shell kosong (navbar placeholder + <Outlet/>)
│       │   │   └── AdminLayout.jsx       # shell kosong (sidebar placeholder + <Outlet/>)
│       │   │
│       │   ├── features/
│       │   │   └── .gitkeep              # sengaja kosong — folder per fitur dibuat saat fitur digarap
│       │   │
│       │   ├── components/
│       │   │   └── .gitkeep              # tempat komponen generik lintas-fitur nanti
│       │   │
│       │   ├── hooks/
│       │   │   └── .gitkeep              # tempat hook lintas-fitur nanti
│       │   │
│       │   ├── context/
│       │   │   └── AuthContext.jsx       # skeleton context (shape kosong: user, role, login, logout)
│       │   │
│       │   ├── utils/
│       │   │   └── .gitkeep
│       │   │
│       │   ├── App.jsx                    # render route-config.js (masih kosong, jadi cuma NotFound)
│       │   └── main.jsx
│       │
│       ├── .env.example
│       ├── package.json
│       └── vite.config.js
│
├── backend/
│   ├── app/
│   │   ├── main.py                        # FastAPI app kosong + health check endpoint
│   │   ├── core/
│   │   │   ├── config.py                  # settings dasar (env loader)
│   │   │   ├── security.py                # skeleton JWT util, belum ada logic role
│   │   │   └── database.py                # koneksi MySQL (SQLAlchemy engine/session)
│   │   ├── models/
│   │   │   └── .gitkeep
│   │   ├── schemas/
│   │   │   └── .gitkeep
│   │   ├── api/v1/
│   │   │   └── .gitkeep                   # router per fitur ditambah belakangan
│   │   ├── services/
│   │   │   └── .gitkeep
│   │   ├── etl/
│   │   │   └── .gitkeep
│   │   └── middleware/
│   │       └── .gitkeep
│   ├── alembic/
│   │   └── versions/.gitkeep
│   ├── storage/
│   │   ├── laporan/.gitkeep
│   │   └── ruang-publik/.gitkeep
│   ├── tests/
│   │   ├── unit/.gitkeep
│   │   ├── postman/.gitkeep
│   │   └── load/.gitkeep
│   ├── requirements.txt
│   └── .env.example
│
├── docs/
│   ├── PRD_Raku_Jakarta.docx
│   ├── CONVENTIONS.md
│   └── decision-log.md
│
├── docker-compose.yml
└── README.md