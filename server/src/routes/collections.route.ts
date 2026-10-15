import express, { Request, Response } from 'express';
import { CollectionsModel } from '../models/collections.model';

const collectionsModel = new CollectionsModel();
const router = express.Router();

router.post('/', async function (req: Request, res: Response) {
    const { title } = req.body;

    if (!title) {
        return res.status(400).json({ error: "Título não informado." });
    }

    try {
        const collection = await collectionsModel.createCollection(title);

        if (!collection) {
            return res.status(500).json({ error: "Erro ao criar coleção." });
        }

        return res.status(201).json(collection);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Erro interno do servidor." });
    }
});

router.get('/with-games', async function (req: Request, res: Response) {
    try {
        const collections = await collectionsModel.getAllCollectionsWithGames();

        if (!collections?.length) {
            return res.status(404).json({ error: "Nenhuma coleção encontrada." });
        }

        return res.status(200).json(collections);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Erro interno do servidor." });
    }
});

router.get('/', async function (req: Request, res: Response) {
    try {
        const collections = await collectionsModel.getAllCollections();

        if (!collections?.length) {
            return res.status(404).json({ error: "Nenhuma coleção encontrada." });
        }

        return res.status(200).json(collections);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Erro interno do servidor." });
    }
});

router.get('/:id', async function (req: Request, res: Response) {
    const { id } = req.params;

    try {
        const collection = await collectionsModel.getCollection(Number(id));

        if (!collection) {
            return res.status(404).json({ error: "Nenhuma coleção encontrada." });
        }

        return res.status(200).json(collection);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Erro interno do servidor." });
    }
});

router.get('/:id/with-games', async function (req: Request, res: Response) {
    const { id } = req.params;

    try {
        const collection = await collectionsModel.getCollectionWithGames(Number(id));

        if (!collection) {
            return res.status(404).json({ error: "Coleção não encontrada." });
        }

        return res.status(200).json(collection);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Erro interno do servidor." });
    }
});

router.put('/:id', async function (req: Request, res: Response) {
    const { id } = req.params;
    const { title } = req.body;

    if (!title) {
        return res.status(400).json({ error: "Título não informado." });
    }

    try {
        const collection = await collectionsModel.getCollection(Number(id));

        if (!collection) {
            return res.status(404).json({ error: "Coleção não encontrada." });
        }

        const updatedCollection = await collectionsModel.updateCollection(Number(id), title);

        if (!updatedCollection) {
            return res.status(500).json({ error: "Erro ao atualizar coleção." });
        }

        return res.status(201).json(updatedCollection);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Erro interno do servidor." });
    }
});

router.delete('/:id', async function (req: Request, res: Response) {
    const { id } = req.params;

    try {
        const collection = await collectionsModel.deleteCollection(Number(id));

        if (!collection) {
            return res.status(500).json({ error: "Erro ao excluir a coleção." });
        }

        return res.status(200).json(collection);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Erro interno do servidor." });
    }
});

export default router;