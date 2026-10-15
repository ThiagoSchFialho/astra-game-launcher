import express, { Request, Response } from 'express';
import { GamesModel } from '../models/games.model';

const gamesModel = new GamesModel();
const router = express.Router();

interface CreateGameInput {
    title: string;
    steam_id: number;
    release_date: string;
    rtime_last_played: string;
    playtime: number;
    status: string;
    developer?: string;
    cover_square?: string | undefined;
    personal_rating?: number | undefined;
    beatable?: boolean | undefined;
    hidden?: boolean | undefined;
    installed?: boolean | undefined;
}

router.post('/', async function (req: Request, res: Response) {
    const {
        title,
        steam_id,
        developer,
        release_date,
        rtime_last_played,
        playtime = 0,
        status,
        cover_square,
        personal_rating,
        beatable,
        hidden,
        installed
    }: CreateGameInput = req.body;

    const requiredFields: Record<string, unknown> = { title, steam_id, status };

    for (const [field, value] of Object.entries(requiredFields)) {
        if (!value) {
            return res.status(400).json({ error: `${field} não informado.` });
        }
    }

    try {
        const game = await gamesModel.createGame({
            title,
            steam_id,
            rtime_last_played,
            playtime,
            status,
            ...(release_date !== undefined && { release_date }),
            ...(developer !== undefined && { developer }),
            ...(cover_square !== undefined && { cover_square }),
            ...(personal_rating !== undefined && { personal_rating }),
            ...(beatable !== undefined && { beatable }),
            ...(hidden !== undefined && { hidden }),
            ...(installed !== undefined && { installed })
        });

        if (!game) {
            return res.status(500).json({ error: "Erro ao criar jogo." });
        }

        return res.status(201).json(game);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Erro interno do servidor." });
    }
});

router.get('/', async function (req: Request, res: Response) {
    const { steam_id } = req.query;

    try {
        if (steam_id) {
            const game = await gamesModel.getGameBySteamId(Number(steam_id));
            if (!game) {
                return res.status(404).json({ error: "Nenhum jogo encontrado." });
            }
            return res.status(200).json(game);
        }

        const games = await gamesModel.getAllGames();
        if (!games?.length) {
            return res.status(404).json({ error: "Nenhum jogo encontrado." });
        }
        return res.status(200).json(games);

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Erro interno do servidor." });
    }
});

router.get('/with-genres', async function (req: Request, res: Response) {
    const { steam_id } = req.query;

    try {
        if (steam_id) {
            const game = await gamesModel.getGameBySteamIdWithGenres(Number(steam_id));
            if (!game) {
                return res.status(404).json({ error: "Nenhum jogo encontrado." });
            }
            return res.status(200).json(game);
        }

        const games = await gamesModel.getAllGamesWithGenres();
        if (!games?.length) {
            return res.status(404).json({ error: "Nenhum jogo encontrado." });
        }
        return res.status(200).json(games);

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Erro interno do servidor." });
    }
});

router.get('/with-genres/:id', async function (req: Request, res: Response) {
    const { id } = req.params;

    try {
        const game = await gamesModel.getGameByIdWithGenres(Number(id));
        if (!game) {
            return res.status(404).json({ error: "Nenhum jogo encontrado." });
        }
        return res.status(200).json(game);

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Erro interno do servidor." });
    }
});

router.get('/:id', async function (req: Request, res: Response) {
    const { id } = req.params;

    try {
        const game = await gamesModel.getGameById(Number(id));
        if (!game) {
            return res.status(404).json({ error: "Nenhum jogo encontrado." });
        }
        return res.status(200).json(game);

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Erro interno do servidor." });
    }
});

router.put('/:id', async function (req: Request, res: Response) {
    const { id } = req.params;
    
    if (!id) {
        return res.status(400).json({ error: "Id não informado." });
    }

    const {
        title,
        steam_id,
        developer,
        release_date,
        rtime_last_played,
        playtime = 0,
        status,
        cover_square,
        personal_rating,
        beatable,
        hidden,
        installed
    }: CreateGameInput = req.body;

    const requiredFields: Record<string, unknown> = { title, steam_id, status };

    for (const [field, value] of Object.entries(requiredFields)) {
        if (!value) {
            return res.status(400).json({ error: `${field} não informado.` });
        }
    }

    try {
        const game = await gamesModel.getGameById(Number(id));

        if (!game) {
            return res.status(404).json({ error: "Jogo encontrado." });
        }

        const updatedGame = await gamesModel.updateGame(Number(id), {
            title,
            steam_id,
            rtime_last_played: String(new Date(rtime_last_played).getTime() / 1000),
            playtime,
            status,
            ...(release_date !== undefined && { release_date }),
            ...(developer !== undefined && { developer }),
            ...(cover_square !== undefined && { cover_square }),
            ...(personal_rating !== undefined && { personal_rating }),
            ...(beatable !== undefined && { beatable }),
            ...(hidden !== undefined && { hidden }),
            ...(installed !== undefined && { installed })
        });

        if (!updatedGame) {
            return res.status(500).json({ error: "Erro ao atualizar jogo." });
        }

        return res.status(200).json(updatedGame);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Erro interno do servidor." });
    }
});

router.patch('/:id/status', async function (req: Request, res: Response) {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
        return res.status(400).json({ error: "status não informado." });
    }

    try {
        const updatedGame = await gamesModel.updateGameStatus(Number(id), status);

        if (!updatedGame) {
            return res.status(404).json({ error: "Jogo não encontrado." });
        }

        return res.status(200).json(updatedGame);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Erro interno do servidor." });
    }
});

router.patch('/:id/hidden', async function (req: Request, res: Response) {
    const { id } = req.params;
    const { hidden } = req.body;

    if (typeof hidden !== 'boolean') {
        return res.status(400).json({ error: "hidden não informado ou inválido." });
    }

    try {
        const updatedGame = await gamesModel.updateGameHidden(Number(id), hidden);

        if (!updatedGame) {
            return res.status(404).json({ error: "Jogo não encontrado." });
        }

        return res.status(200).json(updatedGame);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Erro interno do servidor." });
    }
});

router.patch('/:id/beatable', async function (req: Request, res: Response) {
    const { id } = req.params;
    const { beatable } = req.body;

    if (typeof beatable !== 'boolean') {
        return res.status(400).json({ error: "beatable não informado ou inválido." });
    }

    try {
        const updatedGame = await gamesModel.updateGameBeatable(Number(id), beatable);

        if (!updatedGame) {
            return res.status(404).json({ error: "Jogo não encontrado." });
        }

        return res.status(200).json(updatedGame);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Erro interno do servidor." });
    }
});

router.patch('/:id/rtime_last_played', async function (req: Request, res: Response) {
    const { id } = req.params;
    const { rtime_last_played } = req.body;

    if (typeof rtime_last_played !== 'string') {
        return res.status(400).json({ error: "rtime_last_played não informado ou inválido." });
    }

    try {
        const updatedGame = await gamesModel.updateGameRtimeLastPlayed(Number(id), rtime_last_played);

        if (!updatedGame) {
            return res.status(404).json({ error: "Jogo não encontrado." });
        }

        return res.status(200).json(updatedGame);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Erro interno do servidor." });
    }
});

router.delete('/:id', async function (req: Request, res: Response) {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ error: "Id não informado." });
    }

    try {
        const game = await gamesModel.deleteGame(Number(id));

        if (!game) {
            return res.status(500).json({ error: "Erro ao excluir o jogo." });
        }

        return res.status(200).json(game);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Erro interno do servidor." });
    }
});

export default router;