import express, { Request, Response } from 'express';
import { AchievementsModel } from '../models/achievements.model';

const router = express.Router();
const achievementsModel = new AchievementsModel();

router.get('/progress', async function (req: Request, res: Response) {
    try {
        const progress = await achievementsModel.getProgressForAllGames();
        return res.status(200).json(progress);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Erro interno do servidor." });
    }
});

router.get('/progress/:gameId', async function (req: Request, res: Response) {
    const { gameId } = req.params;

    try {
        const progress = await achievementsModel.getProgressByGameId(Number(gameId));

        if (!progress) {
            return res.status(404).json({ error: "Nenhuma conquista encontrada para esse jogo." });
        }

        return res.status(200).json(progress);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Erro interno do servidor." });
    }
});

router.get('/:gameId', async function (req: Request, res: Response) {
    const { gameId } = req.params;

    try {
        const achievements = await achievementsModel.getByGameId(Number(gameId));

        if (!achievements.length) {
            return res.status(404).json({ error: "Nenhuma conquista encontrada para esse jogo." });
        }

        return res.status(200).json(achievements);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Erro interno do servidor." });
    }
});

export default router;
