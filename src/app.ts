import express from 'express';
import dotenv from 'dotenv';
import sequelize from './config/database';
import urlRoutes from './routes/urlRoutes';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();

app.use(express.json());
app.use('/api', urlRoutes);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

sequelize.sync().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});

export default app;