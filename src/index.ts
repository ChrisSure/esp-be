import express from 'express';
import dotenv from 'dotenv';
import multer from 'multer';
import path from 'path';
import cors from 'cors';
import { MainController } from './controllers/main';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// CORS configuration - Permissive for development
app.use(
  cors({
    origin: true, // Allow all origins during development
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'],
    allowedHeaders: ['*'], // Allow all headers
    credentials: true,
    optionsSuccessStatus: 200,
    preflightContinue: false,
  })
);

// Debug middleware to log requests
app.use((req, res, next) => {
  console.log(
    `${new Date().toISOString()} - ${req.method} ${req.path} - Origin: ${req.headers.origin}`
  );
  next();
});

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype === 'audio/mp3' ||
      file.mimetype === 'audio/mpeg' ||
      path.extname(file.originalname).toLowerCase() === '.mp3'
    ) {
      cb(null, true);
    } else {
      cb(new Error('Only MP3 files are allowed'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Note: Static file serving removed since we now stream audio directly

// Routes
app.get('/', MainController.getHelloWorld);

// Test endpoint for CORS debugging
app.get('/test-cors', (req, res) => {
  res.json({
    message: 'CORS is working!',
    timestamp: new Date().toISOString(),
  });
});

app.post('/record', upload.single('audio'), MainController.processAudioRecord);

// Start server only if this file is run directly
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

export default app;
