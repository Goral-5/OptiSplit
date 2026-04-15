# OptiSplit – Smart Group Expense Management System

OptiSplit is a full-stack web application designed to simplify group expense tracking and debt settlement. It enables users to split expenses, track balances, and settle debts efficiently using optimized transaction logic.

---

## Overview

Managing shared expenses in groups often leads to confusion, manual calculations, and redundant transactions. OptiSplit provides a structured system to:

- Record group expenses  
- Define split logic  
- Track real-time balances  
- Optimize settlements  

The system minimizes the number of transactions required to settle all debts.

---

## Key Features

### Group Expense Management
- Create and manage groups  
- Add members  
- Track shared expenses  

### Flexible Expense Splitting
- Equal split  
- Percentage split  
- Exact amount split  
- Share-based split  

### Multiple Payer Support
- Supports multiple contributors in one expense  

### Real-Time Balance Tracking
- Shows creditors and debtors clearly  
- Updates automatically  

### Debt Optimization
- Minimizes number of transactions using algorithm  

### Settlement System
- Group-level settlement  
- Expense-level settlement  
- Payment history tracking  

### Personal Expense Tracking
- Manage individual expenses separately  

### Real-Time Updates
- Socket-based synchronization  

---

## Technology Stack

### Frontend
- React (Vite)  
- React Query  
- Tailwind CSS  
- shadcn/ui  

### Backend
- Node.js  
- Express.js  
- MongoDB (Mongoose)  
- Clerk Authentication  
- Socket.io  

---

## Project Structure

```
OptiSplit/
├── optisplit/
│   ├── client/          # Frontend
│   │   ├── src/
│   │   └── package.json
│   │
│   └── server/          # Backend
│       ├── controllers/
│       ├── models/
│       ├── routes/
│       ├── services/
│       ├── middleware/
│       └── package.json
│
├── .gitignore
└── README.md
```

---

## Installation

### Prerequisites
- Node.js v16+  
- MongoDB  
- npm or yarn  

---

### Clone Repository

```bash
git clone <repository-url>
cd OptiSplit
```

---

### Environment Variables

#### Server (.env)

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/optisplit
JWT_SECRET=your-secret-key
ALLOWED_ORIGINS=http://localhost:5173
```

#### Client (.env)

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_APP_NAME=OptiSplit
```

---

### Install Dependencies

#### Backend

```bash
cd optisplit/server
npm install
```

#### Frontend

```bash
cd optisplit/client
npm install
```

---

### Run Application

#### Backend

```bash
npm start
```

#### Frontend

```bash
npm run dev
```

---

## Application Flow

1. User logs in  
2. Creates or joins a group  
3. Adds an expense  
4. Selects split type  
5. System calculates balances  
6. Optimization algorithm runs  
7. Settlement suggestions generated  

---

## Debt Optimization Logic

### Formula

```
balance = paid - owes
```

### Algorithm Steps

1. Calculate net balance for all users  
2. Separate creditors and debtors  
3. Sort both lists  
4. Match highest debtor with highest creditor  
5. Settle minimum amount  
6. Repeat until all balances are zero  

### Result

- Reduces redundant transactions  
- Produces minimal settlement steps  

---

## Database Design

### Collections

- Users  
- Groups  
- Expenses  
- Balances  
- Settlements  

---

## Deployment

### Frontend
- Vercel  

### Backend
- Render / Railway  

---

## Troubleshooting

**CORS Error**  
Check `ALLOWED_ORIGINS` matches frontend URL  

**MongoDB Error**  
Verify connection string  

**Environment Variables Not Working**  
Restart server after changes  

---

## Security

- Clerk Authentication  
- Environment-based configuration  
- API validation  
- MongoDB transactions  

---

## Future Scope

- Payment gateway integration  
- Partial settlements  
- Analytics dashboard  
- Mobile application  
- Offline support  

---

## License

MIT License
