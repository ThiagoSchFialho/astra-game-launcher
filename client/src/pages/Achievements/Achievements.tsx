import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDb } from "../../hooks/useDb";
import type { Game } from "../../types/gamesType";
import { orderBy } from "../../utils/orderBy";
import "./styles.css";
import { getGameCover } from "../../utils/getGameCover";
import JoystickSetup from "../../components/JoystickSetup/JoystickSetup";
import { useSound } from "../../hooks/useSound";
import GameAchievementPage from "../../components/GameAchievementPage/GameAchievementPage";
import { useNavigate, useParams } from 'react-router-dom';

interface GameAchievementProgress {
    game_id: number;
    unlocked: number;
    total: number;
}

type GameWithAchievements = Game & {
    progress: { unlocked: number; total: number };
};

type SortMode = "recent" | "achievements";

const Achievements: React.FC = () => {
    const { id, originPage, collectionId } = useParams<{ id: string, originPage: string, collectionId: string }>();
    const navigation = useNavigate();
    const { playSelectSound, playConfirmSound } = useSound();
    const { fetchGames, getAchievementsProgress } = useDb();
    const [games, setGames] = useState<GameWithAchievements[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState<boolean>(false);
    const [isOnGameAchievementPage, setIsOnGameAchievementPage] = useState<boolean>(false);
    const [commandCoolDown, setCommandCoolDown] = useState<boolean>(false);
    const [sortMode, setSortMode] = useState<SortMode>("recent");
    const [selectedGameId, setSelectedGameId] = useState<number>(0);

    useEffect(() => {
        if(id) {
            setSelectedGameId(Number(id));
            setIsOnGameAchievementPage(true);
        }
    })

    const getPercent = (g: GameWithAchievements) =>
        g.progress.total > 0 ? g.progress.unlocked / g.progress.total : 0;

    const sortedGames = useMemo(() => {
        const byRecent = orderBy(games, "rtime_last_played", "desc");

        if (sortMode === "recent") return byRecent;

        return [...byRecent].sort((a, b) => {
            const diff = getPercent(b) - getPercent(a);
            if (diff !== 0) return diff;
            return b.progress.unlocked - a.progress.unlocked;
        });
    }, [games, sortMode]);

    const loadGames = async () => {
        const gamesList = await fetchGames();
        const progressList = await getAchievementsProgress();

        if (!gamesList || !progressList) return;

        const gamesWithProgress = gamesList.map((game: Game) => {
            const progress = progressList.find(
                (p: GameAchievementProgress) => p.game_id === Number(game.id)
            );

            return {
                ...game,
                progress: {
                    unlocked: progress?.unlocked ?? 0,
                    total: progress?.total ?? 0,
                },
            };
        });

        setGames(gamesWithProgress);
    };

    useEffect(() => {
        loadGames();
    }, []);

    const unlockedAchievementsCount = games.reduce((sum, game) => sum + game.progress.unlocked, 0);

    const selectedIndexRef = useRef(selectedIndex);
    useEffect(() => {
        selectedIndexRef.current = selectedIndex;
    }, [selectedIndex]);

    const sortedGamesRef = useRef(sortedGames);
    useEffect(() => {
        sortedGamesRef.current = sortedGames;
    }, [sortedGames]);

    const itemsLengthRef = useRef(sortedGames.length);
    useEffect(() => {
        itemsLengthRef.current = sortedGames.length;
    }, [sortedGames.length]);

    const joystickNavigation = (command: string) => {
        if (command === 'START') {
            setIsHeaderMenuOpen(!isHeaderMenuOpen);
        }

        if (isHeaderMenuOpen) {
            if (command === 'B' || command === 'A') {
                setIsHeaderMenuOpen(false);
            }
            return;
        }

        const currentIndex = selectedIndexRef.current;
        const length = itemsLengthRef.current;  

        if (command === 'cima') {
            if (currentIndex !== 0) {
                playSelectSound();
                setSelectedIndex(currentIndex - 1);
            }
        } else if (command === 'baixo') {
            if (currentIndex < length - 1) {
                playSelectSound();
                setSelectedIndex(currentIndex + 1);
            }
        } else if (command === 'A') {
            if (commandCoolDown) return;
            playConfirmSound();
            const game = sortedGamesRef.current[currentIndex];
            setSelectedGameId(Number(game.id));
            setIsOnGameAchievementPage(true);
        } else if (command === 'X') {
            playSelectSound();
            setSortMode((prev) => (prev === "recent" ? "achievements" : "recent"));
            setSelectedIndex(0);
        }
    };

    const handleCloseGameAchievementPage = () => {
        if (originPage) {
            if (originPage === 'collection') {
                navigation(`/game-page/${originPage}/${collectionId}/${id}`);
            } else {
                navigation(`/game-page/${originPage}/${id}`);
            }
        }
        setCommandCoolDown(true);
        setIsOnGameAchievementPage(false);
        setTimeout(() => {
            setCommandCoolDown(false);
        }, 50);
    };

    // SCROLL ==========================================================================
    const SCROLL_DURATION = 90;

    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const itemRefs = useRef<Record<number, HTMLDivElement | null>>({});
    const animationRef = useRef<number | null>(null);

    useEffect(() => {
        const container = scrollContainerRef.current;
        const el = itemRefs.current[selectedIndex];
        if (!container || !el) return;

        const containerRect = container.getBoundingClientRect();
        const elRect = el.getBoundingClientRect();

        const elTopInContainer = elRect.top - containerRect.top + container.scrollTop;
        const target =
            elTopInContainer - container.clientHeight / 2 + elRect.height / 2;

        const start = container.scrollTop;
        const distance = target - start;
        const startTime = performance.now();

        if (animationRef.current !== null) cancelAnimationFrame(animationRef.current);

        const easeInOut = (t: number) =>
            t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

        const step = (now: number) => {
            const progress = Math.min((now - startTime) / SCROLL_DURATION, 1);
            container.scrollTop = start + distance * easeInOut(progress);

            if (progress < 1) {
                animationRef.current = requestAnimationFrame(step);
            } else {
                animationRef.current = null;
            }
        };

        animationRef.current = requestAnimationFrame(step);

        return () => {
            if (animationRef.current !== null) cancelAnimationFrame(animationRef.current);
        };
    }, [selectedIndex]);
    // SCROLL ==========================================================================

    return (
        <>

            {isOnGameAchievementPage && selectedGameId !== undefined && (
                <GameAchievementPage gameId={String(selectedGameId)} onExitGamePage={handleCloseGameAchievementPage} />
            )}

            {!isOnGameAchievementPage && (
                <JoystickSetup command={joystickNavigation} />
            )}

            <div className="main-content" style={{ display: isOnGameAchievementPage ? 'none' : undefined }}>
                <div className="achievements-page-header">
                    <p className="achievements-qnt">Numero de conquistas: {unlockedAchievementsCount}</p>
                    <div className="achievement-sort-label-container">
                        <div className="x-btn-icon">
                            <p>X</p>
                        </div>
                        <p className="achievement-sort-label">
                            Ordenado por: {sortMode === "recent" ? "Último jogado" : "Mais conquistas"}
                        </p>
                    </div>
                    <div className="achievements-degrade"></div>
                </div>
                <div className="game-achievements-progress-main-container" ref={scrollContainerRef}>
                    {sortedGames.map((game, index) => (
                        <div
                            key={game.id}
                            ref={(el) => { itemRefs.current[index] = el; }}
                            className={selectedIndex === index ? "game-achievements-progress-container game-achievements-progress-container-focused" : "game-achievements-progress-container"}>
                            <img
                                className="achievement-game-img"
                                src={getGameCover(game.title, 'square', 'jpg')}
                            />
                            <div className="achievement-data-container">
                                <div className="achievement-game-title-percent">
                                    <p className="achievement-game-title">{game.title}</p>
                                    <p className="achievement-game-percent">
                                        {game.progress.total > 0
                                            ? Math.floor((game.progress.unlocked / game.progress.total) * 100)
                                            : 0}%
                                    </p>
                                </div>
                                <div className="achievement-progress-bar">
                                    <div
                                        className="achievement-progress-fill"
                                        style={{
                                            width: `${game.progress.total > 0
                                                ? (game.progress.unlocked / game.progress.total) * 100
                                                : 0}%`,
                                        }}
                                    />
                                    <span className="achievement-progress-label">
                                        {game.progress.unlocked}/{game.progress.total}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
};

export default Achievements;