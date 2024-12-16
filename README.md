# AI Memoir Editor

## Project Overview
An AI-powered web application for editing autobiographical manuscripts, providing advanced editing and analysis capabilities.

## Prerequisites
- Node.js (v18+ recommended)
- npm or yarn
- OpenAI API Key

## Setup Instructions

1. Clone the repository
```bash
git clone https://github.com/alexfinnemore/ai-memoir-editor.git
cd ai-memoir-editor
```

2. Install Dependencies
```bash
# Frontend
cd frontend
npm install

# Backend
cd ../backend
npm install
```

3. Configure Environment
- Create a `.env` file in the backend directory
- Add your OpenAI API key:
```
OPENAI_API_KEY=your_api_key_here
```

4. Run the Application
```bash
# Start backend (from backend directory)
npm run dev

# Start frontend (from frontend directory)
npm start
```

## Key Features
- Manuscript upload
- AI-powered editing
- Grammar and style suggestions
- Engagement analysis

## Technologies
- React
- Node.js
- Express
- OpenAI GPT
