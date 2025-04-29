# AI Interview Assistant

A real-time AI-powered interview assistant that listens to your questions and provides instant responses. Built with Next.js, TypeScript, and OpenAI.

## Features

- 🎤 Real-time speech recognition
- ⚡ Instant AI responses
- 📱 Responsive design for desktop and mobile
- 🎨 Modern UI with animations
- 🔒 Secure API handling

## Prerequisites

- Node.js 18+ installed
- OpenAI API key

## Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd interview-assistant
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file in the root directory and add your OpenAI API key:
```
OPENAI_API_KEY=your_api_key_here
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. Click the "Start Listening" button to begin recording your question
2. Speak your interview question clearly
3. Click "Stop Listening" when you're done
4. Wait for the AI to process and provide an answer
5. The response will appear in the AI Response section

## Technologies Used

- Next.js 14
- TypeScript
- Tailwind CSS
- OpenAI API
- React Speech Recognition
- Framer Motion
- React Hot Toast

## Production Deployment

To deploy the application to production:

1. Build the application:
```bash
npm run build
```

2. Start the production server:
```bash
npm start
```

Make sure to set the `OPENAI_API_KEY` environment variable in your production environment.

## Browser Compatibility

The speech recognition feature works best in:
- Google Chrome
- Microsoft Edge
- Safari (iOS and macOS)

Some browsers may have limited or no support for speech recognition.

## License

MIT 