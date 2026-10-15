import express, { Request, Response } from 'express';
import { GenresModel } from '../models/genres.model';

const genresModel = new GenresModel();
const router = express.Router();

router.post('/', async function (req: Request, res: Response) {
    const { name } = req.body;

    if (!name) {
        return res.status(400).json({ error: "Nome não informado." });
    }

    try {
        const genre = await genresModel.createGenre(name);

        if (!genre) {
            return res.status(500).json({ error: "Erro ao criar gênero." });
        }

        return res.status(201).json(genre);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Erro interno do servidor." });
    }
});

router.get('/', async function (req: Request, res: Response) {
    try {
        const genres = await genresModel.getAllGenres();

        if (!genres?.length) {
            return res.status(404).json({ error: "Nenhum gênero encontrado." });
        }

        return res.status(200).json(genres);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Erro interno do servidor." });
    }
});

router.get('/:id', async function (req: Request, res: Response) {
    const { id } = req.params;

    try {
        const genre = await genresModel.getGenre(Number(id));

        if (!genre) {
            return res.status(404).json({ error: "Nenhum gênero encontrado." });
        }

        return res.status(200).json(genre);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Erro interno do servidor." });
    }
});

router.put('/:id', async function (req: Request, res: Response) {
    const { id } = req.params;
    const { name } = req.body;

    if (!name) {
        return res.status(400).json({ error: "Nome não informado." });
    }

    try {
        const genre = await genresModel.getGenre(Number(id));

        if (!genre) {
            return res.status(404).json({ error: "Gênero não encontrado." });
        }

        const updatedGenre = await genresModel.updateGenre(Number(id), name);

        if (!updatedGenre) {
            return res.status(500).json({ error: "Erro ao atualizar gênero." });
        }

        return res.status(201).json(updatedGenre);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Erro interno do servidor." });
    }
});

router.delete('/:id', async function (req: Request, res: Response) {
    const { id } = req.params;

    try {
        const genre = await genresModel.deleteGenre(Number(id));

        if (!genre) {
            return res.status(500).json({ error: "Erro ao excluir o gênero." });
        }

        return res.status(200).json(genre);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Erro interno do servidor." });
    }
});

export default router;