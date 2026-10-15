import express, { Request, Response } from 'express';
import { GameGenresModel } from '../models/gameGenres.model';

const gameGenresModel = new GameGenresModel();
const router = express.Router();

router.post('/', async function (req: Request, res: Response) {
    const { game_id, genre_id } = req.body;

    if (!game_id || !genre_id) {
        return res.status(400).json({ error: "game_id e genre_id não informados" });
    }

    try {
        const gameGenre = await gameGenresModel.createGameGenre(game_id, genre_id);

        if (!gameGenre) {
            return res.status(500).json({ error: "Erro ao criar relação entre jogo e gênero." });
        }

        return res.status(201).json(gameGenre);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Erro interno do servidor." });
    }
});

router.get('/', async function (req: Request, res: Response) {
    try {
        const gameGenres = await gameGenresModel.getAllGameGenres();

        if (!gameGenres?.length) {
            return res.status(404).json({ error: "Nenhuma relação encontrada." });
        }

        return res.status(200).json(gameGenres);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Erro interno do servidor." });
    }
});

router.get('/:id', async function (req: Request, res: Response) {
    const { id } = req.params;

    try {
        const gameGenre = await gameGenresModel.getGameGenre(Number(id));

        if (!gameGenre) {
            return res.status(404).json({ error: "Nenhuma relação encontrada." });
        }

        return res.status(200).json(gameGenre);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Erro interno do servidor." });
    }
});

router.put('/:id', async function (req: Request, res: Response) {
    const { id } = req.params;
    const { game_id, genre_id } = req.body;

    if (!game_id || !genre_id) {
        return res.status(400).json({ error: "game_id e genre_id não informados" });
    }

    try {
        const gameGenre = await gameGenresModel.getGameGenre(Number(id));

        if (!gameGenre) {
            return res.status(404).json({ error: "Relação não encontrada." });
        }

        const updatedGameGenre = await gameGenresModel.updateGameGenre(Number(id), game_id, genre_id);

        if (!updatedGameGenre) {
            return res.status(500).json({ error: "Erro ao atualizar relação." });
        }

        return res.status(201).json(updatedGameGenre);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Erro interno do servidor." });
    }
});

router.delete('/:id', async function (req: Request, res: Response) {
    const { id } = req.params;

    try {
        const gameGenre = await gameGenresModel.deleteGameGenre(Number(id));

        if (!gameGenre) {
            return res.status(500).json({ error: "Erro ao excluir relação." });
        }

        return res.status(200).json(gameGenre);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Erro interno do servidor." });
    }
});

export default router;