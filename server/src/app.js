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
