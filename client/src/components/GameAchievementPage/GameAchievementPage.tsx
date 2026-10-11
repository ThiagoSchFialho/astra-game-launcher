import React, { useEffect, useRef, useState } from 'react';
import './styles.css';

import JoystickSetup from '../../components/JoystickSetup/JoystickSetup';
import { useDb } from '../../hooks/useDb';
import { useSound } from '../../hooks/useSound';

import type { Game } from '../../types/gamesType';
import type { Achievement } from '../../types/achievementType';

interface GamePageProps {
    gameId: string,
    onExitGamePage: () => void
}

type Column = 'left' | 'right';

const SCROLL_DURATION = 90;

const easeInOut = (t: number) =>
    t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

function formatarData(data: string | null): string {
    if (!data) return '--/--/---- --:--';

    const match = data.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/);
    if (!match) return '--/--/---- --:--';

    const [, ano, mes, dia, hora, minuto] = match;
    return `${dia}/${mes}/${ano} ${hora}:${minuto}`;
}

const GameAchievementPage: React.FC<GamePageProps> = ({ gameId, onExitGamePage }) => {
    const { getGameById, getAchievements } = useDb();
    const { playSelectSound } = useSound();

    const [currentGame, setCurrentGame] = useState<Game>();
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false);

    const [activeColumn, setActiveColumn] = useState<Column>('left');
    const [indexes, setIndexes] = useState<Record<Column, number>>({ left: 0, right: 0 });

    useEffect(() => {
        (async () => {
            const game = await getGameById(String(gameId));
            if (game) setCurrentGame(game);

            const data = await getAchievements(String(gameId));
            if (data) setAchievements(data);
        })();
    }, [gameId]);

    const unlockedAchievements = achievements.filter((a) => a.unlocked).sort((a, b) => b.global_percent! - a.global_percent!);
    const lockedAchievements = achievements.filter((a) => !a.unlocked).sort((a, b) => b.global_percent! - a.global_percent!);

    const achievementsLabel = achievements.length
        ? `${unlockedAchievements.length} / ${achievements.length}`
        : '—';

    const percent = achievements.length > 0
        ? (unlockedAchievements.length / achievements.length) * 100
        : 0;

    const stateRef = useRef({
        activeColumn,
        indexes,
        isHeaderMenuOpen,
        lengths: { left: 0, right: 0 } as Record<Column, number>,
    });

    stateRef.current = {
        activeColumn,
        indexes,
        isHeaderMenuOpen,
        lengths: { left: unlockedAchievements.length, right: lockedAchievements.length },
    };

    const joystickNavigation = (command: string) => {
        const { activeColumn, indexes, isHeaderMenuOpen, lengths } = stateRef.current;

        if (command === 'START') {
            setIsHeaderMenuOpen(!isHeaderMenuOpen);
            return;
        }

        if (isHeaderMenuOpen) {
            if (command === 'B' || command === 'A') setIsHeaderMenuOpen(false);
            return;
        }

        const currentIndex = indexes[activeColumn];
        const length = lengths[activeColumn];

        switch (command) {
            case 'cima':
                if (currentIndex > 0) {
                    playSelectSound();
                    setIndexes((prev) => ({ ...prev, [activeColumn]: currentIndex - 1 }));
                }
                break;

            case 'baixo':
                if (currentIndex < length - 1) {
                    playSelectSound();
                    setIndexes((prev) => ({ ...prev, [activeColumn]: currentIndex + 1 }));
                }
                break;

            case 'esquerda':
            case 'direita': {
                const target: Column = command === 'esquerda' ? 'left' : 'right';
                if (target === activeColumn || lengths[target] === 0) break;

                playSelectSound();
                setIndexes((prev) => ({
                    ...prev,
                    [target]: Math.min(prev[target], lengths[target] - 1),
                }));
                setActiveColumn(target);
                break;
            }

            case 'B':
                onExitGamePage();
                break;
        }
    };

    // ===== Scroll (uma ref de container e de itens para cada coluna) =====
    const containerRefs = useRef<Record<Column, HTMLDivElement | null>>({ left: null, right: null });
    const itemRefs = useRef<Record<Column, Record<number, HTMLDivElement | null>>>({ left: {}, right: {} });
    const animationRef = useRef<number | null>(null);

    const activeIndex = indexes[activeColumn];

    useEffect(() => {
        const container = containerRefs.current[activeColumn];
        const el = itemRefs.current[activeColumn][activeIndex];
        if (!container || !el) return;

        const containerRect = container.getBoundingClientRect();
        const elRect = el.getBoundingClientRect();

        const elTopInContainer = elRect.top - containerRect.top + container.scrollTop;
        const target = elTopInContainer - container.clientHeight / 2 + elRect.height / 2;

        const start = container.scrollTop;
        const distance = target - start;
        const startTime = performance.now();

        if (animationRef.current !== null) cancelAnimationFrame(animationRef.current);

        const step = (now: number) => {
            const progress = Math.min((now - startTime) / SCROLL_DURATION, 1);
            container.scrollTop = start + (distance + 82) * easeInOut(progress);

            animationRef.current = progress < 1 ? requestAnimationFrame(step) : null;
        };

        animationRef.current = requestAnimationFrame(step);

        return () => {
            if (animationRef.current !== null) cancelAnimationFrame(animationRef.current);
        };
    }, [activeColumn, activeIndex, achievements]);

    // ===== Render de cada item =====
    const renderItem = (achievement: Achievement, index: number, column: Column) => {
        const isFocused = activeColumn === column && indexes[column] === index;

        return (
            <div
                className={
                    isFocused
                        ? 'game-achievements-page-container game-achievements-page-container-focused'
                        : 'game-achievements-page-container'
                }
                ref={(el) => { itemRefs.current[column][index] = el; }}
                key={achievement.id}
            >
                <img
                    className="game-achievement-page-icon"
                    src={achievement.unlocked ? achievement.icon! : achievement.icon_gray!}
                    alt={achievement.display_name ?? achievement.api_name}
                    title={achievement.display_name ?? achievement.api_name}
                />
                <div className="game-achievement-page-info-container">
                    <div className="game-achievement-page-name-description-container">
                        <p className="game-achievement-page-name">{achievement.display_name}</p>
                        <p className="game-achievement-page-description">
                            {achievement.description ? achievement.description : '|Secret achievement|'}
                        </p>
                    </div>

                    <div className="game-achievement-page-time-global-percent-container">
                        <div>
                            <p className="game-achievement-page-time">🕑 {formatarData(achievement.unlocked_at)}</p>
                        </div>
                        <p className="game-achievement-page-global-percent">{achievement.global_percent}%</p>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <>
            <JoystickSetup command={joystickNavigation} />
            <div className="background"></div>

            <div className="main-content">
                <div className="game-achievements-page-header">
                    <p className="game-achievement-page-progress">{achievementsLabel}</p>
                    <div className="game-achievement-page-progress-bar-container">
                        <div className="game-achievement-page-progress-bar">
                            <div
                                className="game-achievement-page-progress-fill"
                                style={{ width: `${percent}%` }}
                            />
                        </div>
                        <p className="game-achievement-page-game-percent">{Math.floor(percent)}%</p>
                    </div>
                </div>

                <div className="game-achievements-columns">
                    <div
                        className="game-achievements-page"
                        ref={(el) => { containerRefs.current.left = el; }}
                    >
                        {unlockedAchievements.map((a, i) => renderItem(a, i, 'left'))}
                    </div>

                    <div
                        className="game-achievements-page"
                        ref={(el) => { containerRefs.current.right = el; }}
                    >
                        {lockedAchievements.map((a, i) => renderItem(a, i, 'right'))}
                    </div>
                </div>
            </div>
        </>
    );
};

export default GameAchievementPage;