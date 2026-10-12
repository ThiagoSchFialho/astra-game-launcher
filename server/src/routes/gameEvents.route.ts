import express, { Request, Response } from 'express';
import { gameWatcher } from '../services/gameWatcher.service';

const router = express.Router();

router.get('/game-events', (req: Request, res: Response) => {
    res.set({
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
    });
    res.flushHeaders();

    const send = (type: 'started' | 'stopped') => (steamId: number) =>
        res.write(`data: ${JSON.stringify({ type, steamId })}\n\n`);

    const onStarted = send('started');
    const onStopped = send('stopped');

    // estado atual ao conectar
    if (gameWatcher.runningAppId) onStarted(gameWatcher.runningAppId);

    gameWatcher.on('started', onStarted);
    gameWatcher.on('stopped', onStopped);

    req.on('close', () => {
        gameWatcher.off('started', onStarted);
        gameWatcher.off('stopped', onStopped);
    });
});

export default router;