EquiLens – Complete Architecture Explanation


🌐 Live Demo

Frontend: https://equilens-black.vercel.app

Backend API: https://equilens-wzch.onrender.com
1. User Request

The workflow starts when a user opens the EquiLens website and enters either a company name like Apple, Microsoft, or TCS, or a stock ticker such as AAPL.

When the user clicks Analyze, the frontend sends this request to the backend through a secure REST API.

Purpose

Accept user input
Start the investment research process
2. React Frontend

The frontend is built using React with Vite for fast development and Tailwind CSS for styling.

Its responsibilities include:

Accepting company search input
Displaying loading animations
Showing charts
Displaying financial metrics
Showing AI-generated recommendations
Displaying SWOT analysis
Displaying news articles

The frontend never accesses the database directly.

Instead, every request is sent to the backend.

Why React?

Because React provides

Component-based architecture
Fast rendering
Easy state management
Responsive UI
3. Clerk Authentication

Before accessing protected features, the user must sign in.

Clerk handles

Google Login
Email Login
Session Management
JWT Token Generation

Whenever a user makes an API request,

the frontend automatically sends the Clerk JWT token.

The backend verifies this token before processing the request.

Why Clerk?

Instead of writing authentication ourselves,

Clerk provides

Secure authentication
Email verification
OAuth login
User management

which saves development time.

4. Express Backend

The backend is built using Node.js and Express.js.

It acts as the brain of the application.

Responsibilities include

Receiving API requests
Authentication verification
Input validation
Calling external APIs
AI prompt generation
Saving data
Returning responses

Example

User searches

Apple

Backend receives

POST /api/analyze
5. Input Validation

Before processing any request,

the backend validates

Empty input
Invalid characters
Request size
Authenticated user

If validation fails,

the request is rejected immediately.

This prevents

Invalid searches
SQL injection
API abuse
6. Symbol Resolver

This is one of the most important modules.

Users usually type

Apple

instead of

AAPL

The Symbol Resolver converts

Apple

↓

AAPL

or

TCS

↓

TCS.NS

It also detects

SpaceX

↓

Private Company

↓

Reject Request

because private companies don't have public stock market data.

7. Financial Data Collection

Once the stock symbol is found,

EquiLens requests financial information from

Financial Modeling Prep API

The API provides

Company Profile
Market Capitalization
Revenue
Net Income
PE Ratio
EPS
Industry
CEO
Employees

Example

Apple

↓

Market Cap

↓

Revenue

↓

PE Ratio

These values are real financial data.

The AI never generates these numbers.

8. Handling Missing Data

Some international companies,

especially Indian companies,

have limited financial data in the free FMP plan.

Instead of crashing,

EquiLens

Uses available profile data
Sets unavailable metrics to "N/A"
Continues analysis

This technique is called

Graceful Degradation

which improves user experience.

9. News Collection

Financial numbers alone aren't enough.

Recent news affects stock prices.

EquiLens uses

Tavily Search API

to collect

Latest news
Company announcements
Market events

Example

Apple

↓

Latest iPhone Launch

↓

AI Investments

↓

Revenue Growth

These articles are included in the AI prompt.

10. AI Analysis

Now the backend has

Company Profile
Financial Data
News Articles

These are combined into a structured prompt and sent to

Google Gemini 2.5 Flash

Gemini generates

Investment Recommendation
SWOT Analysis
Risk Analysis
Business Summary
Confidence Score

The AI does not calculate financial ratios.

It only interprets verified data.

This reduces hallucinations.

11. Automatic AI Fallback

Free AI models have quota limits.

If Gemini returns

429 Too Many Requests

EquiLens automatically switches to

Groq

using

Llama 3.3 70B

The user never notices the change.

This increases

Reliability
Availability
12. Database Storage

Once analysis is completed,

the backend stores

Company Information
AI Report
Search History
Favorites

inside

PostgreSQL

using

Prisma ORM

Why?

Because next time,

the report can be retrieved faster.

13. Response Generation

Finally,

the backend returns a JSON response

containing

Company Profile
Financial Metrics
News
Recommendation
SWOT
Charts
Confidence Score

The frontend displays everything on the dashboard.

14. Dashboard

The dashboard is responsible for presenting information visually.

It displays

Company Overview
Stock Symbol
Market Cap
Revenue Chart
SWOT Cards
Buy / Pass Recommendation
Recent News
Confidence Meter

The dashboard never performs calculations.

It only renders backend responses.

Why This Architecture?

This architecture follows the Single Responsibility Principle (SRP).

Every module has only one responsibility.

Module	Responsibility
React	User Interface
Clerk	Authentication
Express	API Logic
Symbol Resolver	Company → Stock Symbol
FMP	Financial Data
Tavily	News Collection
Gemini	AI Analysis
Groq	AI Backup
PostgreSQL	Data Storage
Prisma	Database Communication

Because every module is independent,

the project becomes

Easier to maintain
Easier to debug
Easier to extend
Easier to scale
Complete Workflow
User
     │
     ▼
React Frontend
     │
     ▼
Clerk Authentication
     │
     ▼
Express Backend
     │
     ▼
Input Validation
     │
     ▼
Symbol Resolver
     │
     ▼
Financial Modeling Prep
     │
     ▼
Tavily Search API
     │
     ▼
Gemini AI
     │
Quota Exceeded?
     │
 ┌── Yes ─────────► Groq AI
 │
 └── No
     │
     ▼
PostgreSQL Database
     │
     ▼
Dashboard Response

Above is the full Explantion for project.