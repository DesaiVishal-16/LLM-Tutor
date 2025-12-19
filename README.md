# LLM Tutor - Render Deployment

Simple LLM-powered tutor demo with explain, quiz, and simplify modes.

## 🚀 Quick Start

### Local Development
```bash
npm install
npm run dev
```
Visit: http://localhost:3000

### Deployment (Render)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push
   ```

2. **Create Render Service**
   - Go to [render.com](https://render.com)
   - Create new Web Service
   - Connect your repository
   - Configure:
     - **Build Command**: `npm install`
     - **Start Command**: `npm start`
     - **Environment Variables**: `OPENAI_API_KEY`

3. **Test**
   - Health: `https://your-app.onrender.com/api/health`
   - Frontend: `https://your-app.onrender.com`

## 📁 Project Structure

```
llm-tutor/
├── api/
│   └── server.js          # Express backend
├── public/
│   ├── index.html         # Frontend
│   ├── style.css
│   └── script.js
├── .env                   # Local environment variables
├── .gitignore
├── package.json
└── README.md
```

## 🔧 Environment Variables

- `OPENAI_API_KEY` - Your OpenAI API key (required)
- `OPENAI_MODEL` - Model to use (default: `gpt-4o-mini`)
- `PORT` - Server port (default: 3000)

## 🎯 Features

- **Explain Mode**: Detailed explanations with examples
- **Quiz Mode**: Interactive Q&A
- **Simplify Mode**: Simple explanations for beginners
- **Demo Mode**: Automatic fallback if API fails

## 📝 API Endpoints

- `GET /api/health` - Health check
- `POST /api/chat` - Send chat messages

## 🛠️ Tech Stack

- **Backend**: Node.js, Express, OpenAI API
- **Frontend**: HTML, CSS, Vanilla JavaScript
- **Icons**: Remix Icons

---

**Powered by Udayam AI Labs**
