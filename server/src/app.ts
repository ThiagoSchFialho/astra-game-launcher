import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { gameWatcher } from './services/gameWatcher.service';
import usersRouter from './routes/users.route';
import gamesRouter from './routes/games.route';
import genresRouter from './routes/genres.route';
import gameGenresRouter from './routes/gameGenres.route';
import collectionsRouter from './routes/collections.route';
import collectionGamesRouter from './routes/collectionGames.route';
import steamApiRouter from './routes/steamApi.route';
import systemRouter from "./routes/system.route";
import achievementsRouter from "./routes/achievements.route";
import gameEvents from "./routes/gameEvents.route";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: process.env.frontend_host,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());
app.use('/users', usersRouter);
app.use('/games', gamesRouter);
app.use('/genres', genresRouter);
app.use('/game-genres', gameGenresRouter);
app.use('/collections', collectionsRouter);
app.use('/collection-games', collectionGamesRouter);
app.use('/steam-api', steamApiRouter);
app.use("/system", systemRouter);
app.use("/achievements", achievementsRouter);
app.use("/game-events", gameEvents);

app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'API rodando!' });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  gameWatcher.start();
});