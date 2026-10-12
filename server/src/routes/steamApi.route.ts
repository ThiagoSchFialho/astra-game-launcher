import express, { Request, Response } from 'express';
import { CreateGameInput } from "../models/interfaces/games.interface.model";
import { GamesModel } from '../models/games.model';
import { UsersModel } from '../models/users.model';
import { AchievementsModel } from '../models/achievements.model';

const router = express.Router();
const userModel = new UsersModel();
const gamesModel = new GamesModel();
const achievementsModel = new AchievementsModel();

interface SteamOwnedGame {
    appid: number;
    name: string;
    playtime_forever: number;
    rtime_last_played?: number;
    img_icon_url?: string;
}

interface AppDetails {
    developer: string | null;
    release_date: string | null;
}

interface SyncResult {
    steam_id: number;
    status: 'created' | 'updated' | 'error';
    game?: any;
    error?: string;
}

interface SteamAchievementSchemaEntry {
    name: string;
    displayName: string;
    description?: string;
    icon: string;
    icongray: string;
}
 
interface SteamPlayerAchievementEntry {
    apiname: string;
    achieved: number;
    unlocktime: number;
}

interface SteamGlobalPercentEntry {
    name: string;
    percent: number | string;
}

const BATCH_SIZE = 5;
const BATCH_DELAY_MS = 1000;

function delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function resolveStatus(
    sg: SteamOwnedGame,
    existingGame: any
): string {
    if (existingGame?.status === 'completed') {
        return 'completed';
    }

    return sg.playtime_forever > 0 ? 'played' : 'not-played';
}

async function fetchAppDetails(appid: number): Promise<AppDetails | null> {
    try {
        const res = await fetch(`https://store.steampowered.com/api/appdetails?appids=${appid}`);
        if (!res.ok) return null;

        const json = await res.json();
        const entry = json[String(appid)];

        if (!entry?.success || !entry.data) return null;

        return {
            developer: entry.data.developers?.[0] ?? null,
            release_date: entry.data.release_date?.date || null,
        };
    } catch (error) {
        console.error(`Erro ao buscar appdetails de ${appid}:`, error);
        return null;
    }
}

function buildCoverSquare(sg: SteamOwnedGame): string | undefined {
    return sg.img_icon_url
        ? `https://media.steampowered.com/steamcommunity/public/images/apps/${sg.appid}/${sg.img_icon_url}.jpg`
        : undefined;
}

async function fetchSteamLibrary(user: any): Promise<SteamOwnedGame[]> {
    const url = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${user.steam_api_key}&steamid=${user.steam_id}&include_appinfo=true&include_played_free_games=true`;

    const steamRes = await fetch(url);

    if (!steamRes.ok) {
        console.error(`Steam API respondeu ${steamRes.status}`);
        throw new Error("STEAM_API_ERROR");
    }

    const data = await steamRes.json();
    return data.response.games ?? [];
}

async function fetchAchievementSchema(appid: number, apiKey: string): Promise<SteamAchievementSchemaEntry[] | null> {
    try {
        const res = await fetch(`https://api.steampowered.com/ISteamUserStats/GetSchemaForGame/v2/?key=${apiKey}&appid=${appid}`);
        if (!res.ok) return null;
 
        const json = await res.json();
        return json?.game?.availableGameStats?.achievements ?? null;
    } catch (error) {
        console.error(`Erro ao buscar schema de conquistas de ${appid}:`, error);
        return null;
    }
}
 
async function fetchPlayerAchievements(appid: number, user: any): Promise<SteamPlayerAchievementEntry[] | null> {
    try {
        const res = await fetch(`https://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v1/?key=${user.steam_api_key}&steamid=${user.steam_id}&appid=${appid}`);
        if (!res.ok) return null;
 
        const json = await res.json();
        if (!json?.playerstats?.success) return null;
 
        return json.playerstats.achievements ?? null;
    } catch (error) {
        console.error(`Erro ao buscar conquistas do jogador para ${appid}:`, error);
        return null;
    }
}

async function fetchGlobalPercentages(appid: number): Promise<SteamGlobalPercentEntry[] | null> {
    try {
        const res = await fetch(`https://api.steampowered.com/ISteamUserStats/GetGlobalAchievementPercentagesForApp/v2/?gameid=${appid}`);
        if (!res.ok) return null;
 
        const json = await res.json();
        return json?.achievementpercentages?.achievements ?? null;
    } catch (error) {
        console.error(`Erro ao buscar raridade das conquistas de ${appid}:`, error);
        return null;
    }
}

/**
 * Sync completo: cria jogos novos e atualiza os existentes, incluindo
 * developer/release_date via Steam Store API. É o caminho
 * mais pesado (uma chamada externa por jogo que precisa de appdetails,
 * em lotes com delay), então só deve ser chamado quando isso realmente
 * for necessário.
 */
async function syncGames(steamGames: SteamOwnedGame[]): Promise<SyncResult[]> {
    const existingGames = await gamesModel.getAllGames();
    const existingBySteamId = new Map(
        existingGames.map((g: any) => [Number(g.steam_id), g])
    );

    const results: SyncResult[] = [];

    for (let i = 0; i < steamGames.length; i += BATCH_SIZE) {
        const batch = steamGames.slice(i, i + BATCH_SIZE);

        const batchResults = await Promise.all(
            batch.map(async (sg): Promise<SyncResult> => {
                try {
                    const gameCheck = existingBySteamId.get(sg.appid);

                    const needsDetails =
                        !gameCheck ||
                        !gameCheck.developer ||
                        !gameCheck.release_date;

                    const details = needsDetails ? await fetchAppDetails(sg.appid) : null;

                    const game: CreateGameInput = {
                        title: sg.name,
                        steam_id: sg.appid,
                        playtime: sg.playtime_forever,
                        status: resolveStatus(sg, gameCheck),
                        developer: details?.developer ?? gameCheck?.developer ?? null,
                        release_date: details?.release_date ?? gameCheck?.release_date ?? null,
                        rtime_last_played: String(sg.rtime_last_played ?? 0),
                        cover_square: buildCoverSquare(sg) ?? gameCheck?.cover_square,
                        personal_rating: gameCheck?.personal_rating ?? undefined,
                        beatable: gameCheck?.beatable ?? true,
                        hidden: gameCheck?.hidden ?? false,
                        installed: gameCheck?.installed ?? false,
                    };

                    if (gameCheck?.id) {
                        const updated = await gamesModel.updateGame(gameCheck.id, game);
                        return { steam_id: sg.appid, status: 'updated', game: updated };
                    }

                    const created = await gamesModel.createGame(game);
                    return { steam_id: sg.appid, status: 'created', game: created };
                } catch (error: any) {
                    console.error(`Erro ao sincronizar jogo ${sg.appid}:`, error);
                    return {
                        steam_id: sg.appid,
                        status: 'error',
                        error: error?.message ?? 'Erro desconhecido',
                    };
                }
            })
        );

        results.push(...batchResults);

        if (i + BATCH_SIZE < steamGames.length) {
            await delay(BATCH_DELAY_MS);
        }
    }

    return results;
}

router.get('/sync-and-update-games-from-steam', async (req: Request, res: Response) => {
    try {
        const user = await userModel.getUser();

        if (!user) {
            return res.status(404).json({ error: "Usuário não encontrado." });
        }

        let steamGames: SteamOwnedGame[];
        try {
            steamGames = await fetchSteamLibrary(user);
        } catch {
            return res.status(502).json({ error: "Erro ao consultar a API da Steam." });
        }

        if (!steamGames.length) {
            return res.status(200).json([]);
        }

        const results = await syncGames(steamGames);

        const hasErrors = results.some((r) => r.status === 'error');

        return res.status(hasErrors ? 207 : 200).json(results);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Erro interno do servidor." });
    }
});

/**
 * Syncs "leves": atualizam só uma coluna, direto por steam_id, em uma
 * única query em lote (ver GamesModel.bulkUpdatePlaytime /
 * bulkUpdateRtimeLastPlayed). Não chamam a Steam Store API (appdetails)
 * nem buscam o catálogo inteiro do banco antes — por isso são muito
 * mais rápidos que o sync completo acima. Jogos que ainda não existem
 * no banco são ignorados (essas rotas não criam jogos, só atualizam).
 */
async function handleAttributeSync(
    req: Request,
    res: Response,
    attribute: 'playtime' | 'rtime_last_played'
) {
    try {
        const user = await userModel.getUser();

        if (!user) {
            return res.status(404).json({ error: "Usuário não encontrado." });
        }

        let steamGames: SteamOwnedGame[];
        try {
            steamGames = await fetchSteamLibrary(user);
        } catch {
            return res.status(502).json({ error: "Erro ao consultar a API da Steam." });
        }

        if (!steamGames.length) {
            return res.status(200).json({ updated_count: 0, updated: [] });
        }

        const updated = attribute === 'playtime'
            ? await gamesModel.bulkUpdatePlaytime(
                steamGames.map((sg) => ({
                    steam_id: sg.appid,
                    playtime: sg.playtime_forever,
                }))
            )
            : await gamesModel.bulkUpdateRtimeLastPlayed(
                steamGames.map((sg) => ({
                    steam_id: sg.appid,
                    rtime_last_played: sg.rtime_last_played ?? 0,
                }))
            );

        return res.status(200).json({ updated_count: updated.length, updated });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Erro interno do servidor." });
    }
}

router.get('/sync-playtime-from-steam', (req: Request, res: Response) =>
    handleAttributeSync(req, res, 'playtime')
);

router.get('/sync-rtime-last-played-from-steam', (req: Request, res: Response) =>
    handleAttributeSync(req, res, 'rtime_last_played')
);

async function syncGameAchievements(
    gameId: number,
    steamId: number,
    user: NonNullable<Awaited<ReturnType<typeof userModel.getUser>>>
) {
    const hasSchema = await achievementsModel.hasSchema(gameId);

    if (!hasSchema) {
        const schema = await fetchAchievementSchema(steamId, user.steam_api_key);

        if (schema?.length) {
            await achievementsModel.upsertSchema(gameId, schema.map((a) => ({
                api_name: a.name,
                display_name: a.displayName ?? null,
                description: a.description ?? null,
                icon: a.icon ?? null,
                icon_gray: a.icongray ?? null,
            })));
        }
    }

    if (await achievementsModel.needsGlobalPercent(gameId)) {
        const percentages = await fetchGlobalPercentages(steamId);

        const entries = (percentages ?? [])
            .map((p) => ({ api_name: p.name, global_percent: Number(p.percent) }))
            .filter((e) => Number.isFinite(e.global_percent));

        if (entries.length) {
            await achievementsModel.bulkUpdateGlobalPercent(gameId, entries);
        }
    }

    const playerAchievements = await fetchPlayerAchievements(steamId, user);

    if (playerAchievements?.length) {
        await achievementsModel.bulkUpdateUnlocked(gameId, playerAchievements.map((a) => ({
            api_name: a.apiname,
            unlocked: a.achieved === 1,
            unlocked_at: a.unlocktime > 0 ? a.unlocktime : null,
        })));
    }
}

router.get('/sync-achievements-from-steam', async (req: Request, res: Response) => {
    try {
        const user = await userModel.getUser();
 
        if (!user) {
            return res.status(404).json({ error: "Usuário não encontrado." });
        }
 
        const trackedGames = await gamesModel.getGameIdsBySteamId();
 
        if (!trackedGames.length) {
            return res.status(200).json([]);
        }
 
        const results: { steam_id: number; status: 'synced' | 'error'; error?: string }[] = [];
 
        for (let i = 0; i < trackedGames.length; i += BATCH_SIZE) {
            const batch = trackedGames.slice(i, i + BATCH_SIZE);
 
            const batchResults = await Promise.all(
                batch.map(async ({ id, steam_id }) => {
                    try {
                        await syncGameAchievements(id, steam_id, user);
                        return { steam_id, status: 'synced' as const };
                    } catch (error: any) {
                        console.error(`Erro ao sincronizar conquistas de ${steam_id}:`, error);
                        return { steam_id, status: 'error' as const, error: error?.message ?? 'Erro desconhecido' };
                    }
                })
            );
 
            results.push(...batchResults);
 
            if (i + BATCH_SIZE < trackedGames.length) {
                await delay(BATCH_DELAY_MS);
            }
        }
 
        const hasErrors = results.some((r) => r.status === 'error');
        return res.status(hasErrors ? 207 : 200).json(results);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Erro interno do servidor." });
    }
});

router.get('/sync-achievements-from-steam/:steamId', async (req: Request, res: Response) => {
    try {
        const steamId = Number(req.params.steamId);

        if (!Number.isInteger(steamId) || steamId <= 0) {
            return res.status(400).json({ error: "steamId inválido." });
        }

        const user = await userModel.getUser();

        if (!user) {
            return res.status(404).json({ error: "Usuário não encontrado." });
        }

        const trackedGames = await gamesModel.getGameIdsBySteamId();
        const game = trackedGames.find((g: any) => Number(g.steam_id) === steamId);

        if (!game) {
            return res.status(404).json({ error: "Jogo não encontrado na sua biblioteca." });
        }

        try {
            await syncGameAchievements(game.id, steamId, user);
            return res.status(200).json({ steam_id: steamId, status: 'synced' });
        } catch (error: any) {
            console.error(`Erro ao sincronizar conquistas de ${steamId}:`, error);
            return res.status(502).json({
                steam_id: steamId,
                status: 'error',
                error: error?.message ?? 'Erro desconhecido',
            });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Erro interno do servidor." });
    }
});

export default router;
