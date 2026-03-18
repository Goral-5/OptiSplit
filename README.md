# 💰 OptiSplit - Smart Group Expense Splitter

A production-grade expense splitting application inspired by Splitwise. Split bills, track debts, and settle up with friends and groups.

## ✨ Features

- **Group Expenses** - Create groups and split expenses among members
- **4 Split Types:**
  - Equal split (divide equally)
  - Percentage split (custom percentages)
  - Exact amounts (specific amounts per person)
  - Shares split (weighted distribution)
- **Live Preview** - See who owes what in real-time
- **Multiple Payers** - Support for multiple people paying
- **Smart Balances** - Automatic creditor/debtor tracking
- **Debt Optimization** - Minimize transactions needed
- **Individual Expenses** - Track personal expenses separately
- **Real-time Updates** - Socket-based synchronization

---

## 🚀 Quick Start

### Prerequisites

- Node.js v16+
- MongoDB v4.4+
- npm or yarn

### Installation

#### 1. Clone the repository

```bash
git clone <repository-url>
cd OptiSplit
```

#### 2. Set up environment variables

**Create `optisplit/server/.env`:**
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/optisplit
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d
ALLOWED_ORIGINS=http://localhost:5173
```

**Create `optisplit/client/.env`:**
```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_APP_NAME=OptiSplit
```

⚠️ **Note:** `.env` files are gitignored. You must create them manually.

#### 3. Install dependencies

**Server:**
```bash
cd optisplit/server
npm install
```

**Client:**
```bash
cd optisplit/client
npm install
```

#### 4. Start MongoDB

Make sure MongoDB is running:
```bash
mongod
```

#### 5. Run the application

You need TWO terminals:

**Terminal 1 - Backend:**
```bash
cd optisplit/server
npm start
```
Server runs on `http://localhost:5000`

**Terminal 2 - Frontend:**
```bash
cd optisplit/client
npm run dev
```
Client runs on `http://localhost:5173`

---

## 📱 Usage

### Creating a Group Expense

1. Go to `/app/expenses/new`
2. Select "Group Expense"
3. Choose a group
4. Enter description and amount (e.g., "Dinner", ₹100)
5. Select who paid
6. Choose split type (Equal, Percentage, Exact, or Shares)
7. View live preview
8. Click "Create Expense"
9. Success! Form resets automatically

### Understanding Balances

- **Green badge** = "Gets ₹X" (creditor - people owe them)
- **Red badge** = "Owes ₹X" (debtor - they need to pay)
- Dashboard shows your overall net balance

---

## 🏗️ Architecture

**Frontend:**
- React 18 + Vite
- React Query for data fetching
- Tailwind CSS + shadcn/ui
- Socket.io for real-time updates

**Backend:**
- Node.js + Express
- MongoDB + Mongoose
- Clerk authentication
- Socket.io for live sync

**Project Structure:**
```
OptiSplit/
├── optisplit/
│   ├── client/          # React frontend
│   │   ├── src/
│   │   ├── .env
│   │   └── package.json
│   └── server/          # Node.js backend
│       ├── controllers/
│       ├── models/
│       ├── routes/
│       ├── services/
│       ├── .env
│       └── package.json
├── .gitignore
└── README.md
```

---

## 🔧 Available Scripts

### Server

```bash
cd optisplit/server
npm start          # Start with nodemon
npm run prod       # Production mode
```

### Client

```bash
cd optisplit/client
npm run dev        # Development server
npm run build      # Build for production
npm run preview    # Preview build
```

---

## 🐛 Troubleshooting

**MongoDB connection error?**
```bash
mongod --dbpath <your-data-path>
```

**Port already in use?**
Change PORT in `server/.env` or kill process using port 5000/5173

**CORS error?**
Check `ALLOWED_ORIGINS` in server `.env` includes your frontend URL

**Environment variables not loading?**
Restart server after creating `.env` file

---

## 🗄️ Database Schema

**Main Collections:**
- Groups - Group info and members
- Expenses - All expense data with splits
- Balances - Who owes whom
- Settlements - Payment records

---

## 🔐 Security

- Clerk authentication
- Environment variables for secrets
- Input validation
- CORS protection
- MongoDB transactions for financial data

---

## 📝 Environment Variables Reference

### Server (.env)

| Variable | Required | Description |
|----------|----------|-------------|
| PORT | Yes | Server port (default: 5000) |
| MONGODB_URI | Yes | MongoDB connection string |
| JWT_SECRET | Yes | JWT signing key (change in production!) |
| ALLOWED_ORIGINS | Yes | Comma-separated frontend URLs |

### Client (.env)

| Variable | Required | Description |
|----------|----------|-------------|
| VITE_API_BASE_URL | Yes | Backend API URL |
| VITE_APP_NAME | No | App display name |

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/name`)
3. Commit changes (`git commit -m 'Add feature'`)
4. Push to branch
5. Open Pull Request

---

## 📄 License

MIT License - feel free to use this project!

---

## 🙏 Acknowledgments

- Inspired by Splitwise
- Built with modern React best practices
- UI components from shadcn/ui

---

**Happy Splitting! **
