project-root/
│
├── src/
│   ├── controllers/          # Controllers for handling requests
│   │   ├── admin/            # Admin-specific controllers
│   │   └── api/             # User-specific controllers
│   ├── entities/             # TypeORM entities
│   ├── migrations/           # Database migrations
│   ├── middlewares/          # Express middlewares
│   ├── repositories/         # Custom repositories
│   ├── services/             # Business logic
│   ├── subscribers/          # TypeORM event subscribers
│   ├── utils/                # Utility functions
│   ├── validators/           # Validation logic
│   ├── routes/               # Route definitions
│   │   ├── admin.ts          # Admin routes
│   │   └── app.ts           # User routes
│   ├── config/               # Configuration files
│   │   └── database.ts       # Database configuration
│   ├── index.ts              # Entry point of the application
│   └── app.ts                # Express app setup
│
├── tests/                    # Test cases
│
├── .env                      # Environment variables
├── .eslintrc.js              # ESLint configuration
├── .gitignore                # Git ignore file
├── ormconfig.json            # TypeORM configuration
├── package.json              # NPM dependencies and scripts
├── tsconfig.json             # TypeScript configuration
└── README.md                 # Project documentation
