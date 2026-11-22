const fs = require('fs');
const path = require('path');

// Tự động nạp cấu hình .env (hỗ trợ cả chạy từ thư mục gốc và thư mục server)
function loadEnvironment() {
  const candidatePaths = [
    path.resolve(__dirname, '../.env'),
    path.resolve(process.cwd(), 'server/.env'),
    path.resolve(process.cwd(), '.env'),
  ];

  for (const envPath of candidatePaths) {
    if (fs.existsSync(envPath)) {
      try {
        if (typeof process.loadEnvFile === 'function') {
          process.loadEnvFile(envPath);
        } else {
          const content = fs.readFileSync(envPath, 'utf8');
          for (const line of content.split(/\r?\n/)) {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('#')) {
              const eqIdx = trimmed.indexOf('=');
              if (eqIdx > 0) {
                const key = trimmed.substring(0, eqIdx).trim();
                const val = trimmed.substring(eqIdx + 1).trim().replace(/^['"]|['"]$/g, '');
                if (!process.env[key]) {
                  process.env[key] = val;
                }
              }
            }
          }
        }
      } catch (e) {
        // Tiếp tục thử đường dẫn khác nếu có lỗi
      }
    }
  }
}

loadEnvironment();

const express = require('express');
const cors = require('cors');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/v1', apiRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Chào mừng đến với API Nền tảng MediCare Plus',
    docs: '/api/v1/health',
    version: '1.0.0'
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`[MediCare Plus Server] Đang lắng nghe tại cổng http://localhost:${PORT}`);
  });
}

module.exports = app;
