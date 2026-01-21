# Structure minimale recommandée

## Racine
├── .env.example
├── .env.local
├── .gitignore
├── README.md
├── docker-compose.yml
├── docker-compose.prod.yml
├── start.sh
└── cleanup.sh

## Backend
backend/
├── package.json
├── app.js
├── .env
├── Dockerfile
├── Dockerfile.prod
├── prisma/
│   └── schema.prisma
├── models/
├── controllers/
├── routes/
├── middleware/
├── utils/
├── public/
│   ├── images/
│   └── uploads/
└── logs/

## Frontend
frontend/
├── package.json
├── vite.config.js
├── index.html
├── .env
├── Dockerfile
├── src/
└── public/

## Documentation
docs/
└── USER_MANUAL.md
