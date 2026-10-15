import express, { Request, Response } from 'express';
import { CollectionGamesModel } from '../models/collectionGames.model';

const collectionGamesModel = new CollectionGamesModel();

const router = express.Router();

router.post('/', async function (req: Request, res: Response) {
    const { collection_id, game_id } = req.body;

    if (!collection_id || !game_id) {
        return res.status(400).json({ error: "collection_id e game_id não informados" });
    }

    try {
        const collectionGame = await collectionGamesModel.createCollectionGames(collection_id, game_id);

        if (!collectionGame) {
            return res.status(500).json({ error: "Erro ao criar relação entre coleção e jogo." });
        }

        return res.status(201).json(collectionGame);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Erro interno do servidor." });
    }
});

router.get('/', async function (req: Request, res: Response) {
    try {
        const collectionGames = await collectionGamesModel.getAllCollectionGames();

        if (!collectionGames?.length) {
            return res.status(404).json({ error: "Nenhuma relação encontrada." });
        }

        return res.status(200).json(collectionGames);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Erro interno do servidor." });
    }
});

router.get('/game/:id', async function (req: Request, res: Response) {
    const { id } = req.params;

    try {
        const collectionGame = await collectionGamesModel.getCollectionGamesByGameId(Number(id));

        if (!collectionGame) {
            return res.status(404).json({ error: "Nenhuma relação encontrada." });
        }

        return res.status(200).json(collectionGame);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Erro interno do servidor." });
    }
});

router.get('/:id', async function (req: Request, res: Response) {
    const { id } = req.params;

    try {
        const collectionGame = await collectionGamesModel.getCollectionGames(Number(id));

        if (!collectionGame) {
            return res.status(404).json({ error: "Nenhuma relação encontrada." });
        }

        return res.status(200).json(collectionGame);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Erro interno do servidor." });
    }
});

router.put('/:id', async function (req: Request, res: Response) {
    const { id } = req.params;
    const { collection_id, game_id } = req.body;

    if (!collection_id || !game_id) {
        return res.status(400).json({ error: "collection_id e game_id não informados" });
    }

    try {
        const collectionGame = await collectionGamesModel.getCollectionGames(Number(id));

        if (!collectionGame) {
            return res.status(404).json({ error: "Relação não encontrada." });
        }

        const updatedCollectionGame = await collectionGamesModel.updateCollectionGames(Number(id), collection_id, game_id);

        if (!updatedCollectionGame) {
            return res.status(500).json({ error: "Erro ao atualizar relação." });
        }

        return res.status(200).json(updatedCollectionGame);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Erro interno do servidor." });
    }
});

router.delete('/relation', async function (req: Request, res: Response) {
    const { game_id, collection_id } = req.body;

    try {
        const collectionGame = await collectionGamesModel.deleteCollectionGamesByRelation(Number(game_id), Number(collection_id));

        if (!collectionGame) {
            return res.status(500).json({ error: "Erro ao excluir relação." });
        }

        return res.status(200).json(collectionGame);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Erro interno do servidor." });
    }
});

router.delete('/:id', async function (req: Request, res: Response) {
    const { id } = req.params;

    try {
        const collectionGame = await collectionGamesModel.deleteCollectionGames(Number(id));

        if (!collectionGame) {
            return res.status(500).json({ error: "Erro ao excluir relação." });
        }

        return res.status(200).json(collectionGame);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Erro interno do servidor." });
    }
});

export default router;