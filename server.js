require('dotenv').config();
const express = require('express');
const cors = require('cors');

const whatsappRoutes = require('./routes/whatsapp');
const webhookRoutes = require('./routes/webhook');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/whatsapp', whatsappRoutes);
app.use('/webhook', webhookRoutes);

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'atendeai-lify-backend rodando', endpoints: ['/webhook/whatsapp-meta', '/api/whatsapp/send-message'] });
});

app.listen(PORT, () => {
  console.log(`atendeai-lify-backend rodando na porta ${PORT}`);
}); 