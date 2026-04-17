# OptiSplit – Smart Group Expense Management System

OptiSplit is a scalable, full-stack web application designed to streamline group expense tracking and financial settlements. It provides an intuitive interface combined with robust backend logic to manage shared expenses efficiently while minimizing redundant transactions through an optimized debt settlement algorithm.

The system is built with modern web technologies and follows best practices in software architecture, ensuring reliability, maintainability, and performance.

---

## 1. Introduction

In real-world scenarios such as trips, shared accommodations, and team activities, managing expenses among multiple individuals often leads to confusion, calculation errors, and unnecessary financial exchanges.

OptiSplit addresses these challenges by:

- Structuring expense recording and sharing
- Automating balance calculations
- Minimizing settlement transactions
- Providing real-time synchronization across users

The application ensures financial transparency and eliminates ambiguity in shared expense management.

---

## 2. Core Features

### 2.1 Group Expense Management
- Create, join, and manage groups
- Dynamically add or remove members
- Maintain centralized expense records per group

### 2.2 Flexible Expense Splitting Mechanisms
Supports multiple real-world splitting strategies:

- **Equal Split** – Distributes cost equally among participants  
- **Percentage Split** – Allocates expense based on defined percentages  
- **Exact Split** – Assigns fixed amounts to each participant  
- **Share-Based Split** – Uses weighted shares for distribution  

### 2.3 Multi-Payer Support
- Allows multiple users to contribute to a single expense
- Automatically adjusts net balances accordingly

### 2.4 Real-Time Balance Tracking
- Displays net balances (creditor/debtor)
- Instant updates using WebSockets
- Clear financial visibility for all users

### 2.5 Debt Optimization Engine
- Implements a greedy-based algorithm
- Reduces number of transactions required for settlement
- Ensures efficient and minimal financial exchanges

### 2.6 Settlement System
- Group-level settlement (overall balances)
- Expense-level settlement (per transaction)
- Persistent payment history

### 2.7 Personal Expense Tracking
- Allows users to track non-group expenses independently

### 2.8 Real-Time Synchronization
- Uses Socket.io for instant updates across all connected users

---

## 3. Technology Stack

### Frontend
- React (Vite)
- React Query (data fetching and caching)
- Tailwind CSS (UI styling)
- shadcn/ui (component library)
- Socket.io Client

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- Clerk Authentication
- Socket.io (real-time communication)

---

## 4. System Architecture

The application follows a modular three-tier architecture:

### 4.1 Presentation Layer
- Built using React
- Handles UI rendering and user interactions

### 4.2 Application Layer
- Node.js + Express backend
- Contains business logic and API handling

### 4.3 Data Layer
- MongoDB database
- Stores users, groups, expenses, and balances

This separation ensures scalability and maintainability of the system.

---

## 5. Project Structure

```
OptiSplit/
├── optisplit/
│   ├── client/                # Frontend application
│   │   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── package.json
│   │
│   └── server/                # Backend application
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

## 6. Installation and Setup

### 6.1 Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud)
- npm or yarn

---

### 6.2 Clone Repository

```bash
git clone <repository-url>
cd OptiSplit
```

---

### 6.3 Environment Configuration

#### Backend (`optisplit/server/.env`)

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/optisplit
JWT_SECRET=your-secret-key
ALLOWED_ORIGINS=http://localhost:5173
```

#### Frontend (`optisplit/client/.env`)

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_APP_NAME=OptiSplit
```

---

### 6.4 Install Dependencies

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

### 6.5 Run Application

#### Start Backend

```bash
npm start
```

#### Start Frontend

```bash
npm run dev
```

---

## 7. Application Workflow

1. User authenticates using Clerk  
2. User creates or joins a group  
3. Expense is added with participants  
4. Split type is selected  
5. System calculates individual shares  
6. Net balances are computed  
7. Optimization algorithm minimizes transactions  
8. Settlement suggestions are generated  
9. Users complete settlements  

---

## 8. Debt Optimization Algorithm

### 8.1 Mathematical Model

```
Net Balance = Amount Paid - Amount Owed
```

### 8.2 Algorithm Steps

1. Compute net balance for each user  
2. Separate users into:
   - Creditors (positive balance)
   - Debtors (negative balance)  
3. Sort both groups in descending order  
4. Match highest debtor with highest creditor  
5. Transfer minimum possible amount  
6. Update balances  
7. Repeat until all balances are settled  

### 8.3 Advantages

- Reduces transaction count significantly  
- Eliminates circular debt chains  
- Improves efficiency and usability  

---

## 9. Database Design

### Collections

- **Users** – Authentication and profile data  
- **Groups** – Group information and member list  
- **Expenses** – Expense records and split data  
- **Balances** – Aggregated debts between users  
- **Settlements** – Payment records  

---

## 10. Deployment

### Frontend
- Hosted on Vercel

### Backend
- Hosted on Render or Railway

Ensure environment variables are configured for production deployment.

---

## 11. Troubleshooting

**CORS Issues**  
Verify `ALLOWED_ORIGINS` includes frontend domain  

**Database Connection Errors**  
Ensure MongoDB URI is valid and accessible  

**Environment Variables Not Loading**  
Restart server after updating `.env`  

---

## 12. Security Considerations

- Authentication managed via Clerk  
- Sensitive data stored using environment variables  
- Input validation at API level  
- MongoDB transactions for financial consistency  

---

## 13. Future Enhancements

- Integration with payment gateways (UPI, Stripe)  
- Partial settlement support  
- Advanced analytics and reporting dashboard  
- Mobile application development  
- Offline-first architecture with sync  

---

## 14. License

This project is licensed under the MIT License.
