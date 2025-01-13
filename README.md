# Hush - Video Audio Enhancement Application

## Overview
Hush is a full-stack application that enhances the audio quality of uploaded videos using AI-powered audio processing. The application is built with Next.js for the frontend, Flask for the backend, and uses Supabase for authentication and storage.

## Features
- User authentication via Supabase
- Video upload and processing
- AI-powered audio enhancement using DeepFilterNet
- Real-time processing status updates
- Secure file handling and storage
- Responsive design

## Tech Stack
- Frontend: Next.js, TypeScript, Styled Components
- Backend: Flask, Python
- Database: PostgreSQL (via Supabase)
- Authentication: Supabase Auth
- Storage: Supabase Storage
- Audio Processing: DeepFilterNet, FFmpeg

## Prerequisites
- Node.js (v14 or higher)
- Python 3.11
- FFmpeg
- PostgreSQL
- Supabase account

## Project Structure
```
├── frontend/          # Next.js frontend application
├── backend/           # Flask backend server
├── lib/              # Shared library code
├── prisma/           # Database schema and migrations
└── supabase/         # Supabase configuration
```

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/hush.git
cd hush
```

2. Install dependencies:
```bash
# Root dependencies
npm install

# Frontend dependencies
cd frontend
npm install

# Backend dependencies
cd ../backend
pip install -r requirements.txt
```

3. Set up environment variables:

Create a `.env` file in the root directory:
```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Database
DATABASE_URL=your_database_url
```

4. Set up the database:
```bash
cd frontend
npx prisma generate
npx prisma db push
```

5. Start the development servers:

In one terminal (frontend):
```bash
cd frontend
npm run dev
```

In another terminal (backend):
```bash
cd backend
python server.py
```

The application will be available at `http://localhost:3000`

## Configuration

### Supabase Setup
1. Create a new Supabase project
2. Enable authentication and storage
3. Configure authentication providers as needed
4. Update environment variables with your Supabase credentials

### Backend Configuration
The backend server (referenced in `backend/server.py`) handles:
- Video upload processing
- Audio extraction and enhancement
- File management
- Authentication verification

## Contributing
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License
ISC License

## Support
For questions or issues, please open a GitHub issue or contact the maintainers.

## Acknowledgments
- DeepFilterNet for audio enhancement
- Supabase for backend infrastructure
- Next.js team for the frontend framework
- FFmpeg for media processing
