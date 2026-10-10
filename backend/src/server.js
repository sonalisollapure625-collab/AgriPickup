import app from './app.js';
import { config } from './config/environment.js';

const PORT = config.port;

app.listen(PORT, () => {
  console.log(`🌾 AgriPickup Backend running on port ${PORT} [${config.env}]`);
  console.log(`🌿 Health check available at: http://localhost:${PORT}/api/health`);
});
