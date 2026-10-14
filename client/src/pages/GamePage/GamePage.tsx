import React, { useEffect, useState } from 'react';
import './styles.css';

import GameLandscape from '../../components/GameLandscape/GameLandscape';
import JoystickSetup from '../../components/JoystickSetup/JoystickSetup';

import { useDb } from '../../hooks/useDb';

import { getGameCover } from '../../utils/getGameCover';

import played from '../../assets/icons/played.svg';
import notPlayed from '../../assets/icons/not-played.svg';
import completed from '../../assets/icons/completed.svg';
import totalTime from '../../assets/icons/total-time.svg';
import trophy from '../../assets/icons/trophy.svg';
import checked from '../../assets/icons/checked.svg';
import notChecked from '../../assets/icons/not-checked.svg';
import goldenTrophy from '../../assets/golden_trophy.png';
import silverTrophy from '../../assets/silver_trophy.png';
import bronzeTrophy from '../../assets/bronze_trophy.png';

import type { Game } from '../../types/gamesType';
import { useSound } from '../../hooks/useSound';
import type { Achievement } from '../../types/achievementType';
import { useNavigate, useParams } from 'react-router-dom';

interface ScreenItems {
    label: string
    type: string
    action: () => void | Promise<void>
}

type Tier = 'bronze' | 'silver' | 'gold';

const getTier = (globalPercent: number | null | undefined): Tier => {
    const p = globalPercent ?? 100;

    if (p <= 15) return 'gold';
    if (p > 50) return 'bronze';
    return 'silver';
}

const getTrophySrc = (tier: string) => {
    if (tier === 'bronze') {
        return bronzeTrophy;
    } else if (tier === 'silver') {
        return silverTrophy;
    } else {
        return goldenTrophy;
    }
}

const statusConfig = {
    played: { icon: played, label: 'Jogado', color: '#539FE9' },
    'not-played': { icon: notPlayed, label: 'Não jogado', color: '#D4AC27' },
    completed: { icon: completed, label: 'Zerado', color: '#7B5CFF' },
};

const BANNER_INDEX = 999;

const MAX_RECENT_ACHIEVEMENTS = 5;

const NAVIGATION_MAP: Record<number, Partial<Record<string, number>>> = {
    0: { cima: BANNER_INDEX, baixo: 1, direita: 4 },
    1: { cima: 0, baixo: 2, direita: 5 },
    2: { cima: 1, direita: 3 },
    3: { cima: 1, esquerda: 2, direita: 6 },
    4: { cima: BANNER_INDEX, baixo: 5, esquerda: 0 },
    5: { cima: 4, baixo: 6, esquerda: 1 },
    6: { cima: 5, esquerda: 3 },
};

const GamePage: React.FC = () => {
    const { id, collectionId, page } = useParams<{ id: string, collectionId: string, page: string }>();
    const navigation = useNavigate();
    const { getGameById, getAchievements, handleStartGame, updateHidden, updateBeatable } = useDb();
    const { playCursorSound, playConfirmSound } = useSound();
    const [currentGame, setCurrentGame] = useState<Game>();
    const currentStatus = statusConfig[currentGame?.status ?? 'not-played'];
    const [selectedIndex, setSelectedIndex] = useState(BANNER_INDEX);
    const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false);
    const [achievements, setAchievements] = useState<Achievement[]>([]);

    const getGame = async () => {
        const game = await getGameById(String(id));
        if (game) {
            setCurrentGame(game);
        }
    }

    const loadAchievements = async () => {
        const data = await getAchievements(String(id));
        if (data) {
            setAchievements(data);
        }
    }

    useEffect(() => {
        getGame();
        loadAchievements();
    }, []);

    const unlockedAchievements = achievements.filter((a) => a.unlocked);

    const recentAchievements = unlockedAchievements
        .filter((a) => a.icon && a.unlocked_at)
        .sort((a, b) => new Date(b.unlocked_at!).getTime() - new Date(a.unlocked_at!).getTime())
        .slice(0, MAX_RECENT_ACHIEVEMENTS);

    const achievementsLabel = achievements.length
        ? `${unlockedAchievements.length}/${achievements.length}`
        : '—';

    const handleUpdateHidden = async (id: string, hidden: boolean) => {
        const response = await updateHidden(id, hidden);
        if (response) {
            getGame();
        }
    }

    const handleUpdateBeatable = async (id: string, beatable: boolean) => {
        const response = await updateBeatable(id, beatable);
        if (response) {
            getGame();
        }
    }

    const optionsItems: ScreenItems[] = [
        {
            label: 'Adicionar à coleção',
            type: 'button',
            action: () => console.log('action not implemented')
        },
        {
            label: 'Remover da coleção',
            type: 'button',
            action: () => console.log('action not implemented')
        },
        {
            label: 'Zeravel:',
            type: 'attribute',
            action: () => {
                if (currentGame) {
                    handleUpdateBeatable(currentGame.id, currentGame.beatable);
                }
            }
        },
        {
            label: 'Oculto:',
            type: 'attribute',
            action: () => {
                if (currentGame) {
                    handleUpdateHidden(currentGame.id, currentGame.hidden);
                }
            }
        }
    ];

    const statisticsItems: ScreenItems[] = [
        {
            label: 'Status',
            type: 'status',
            action: () => console.log('abrir troca de status')
        },
        {
            label: 'Tempo total',
            type: 'time',
            action: () => console.log('abrir edição de tempo jogado')
        },
        {
            label: 'Conquistas',
            type: 'achievements',
            action: () => console.log('abrir conquistas')
            // action: () => navigation(`/achievements/${currentGame?.id}`)
        }
    ];

    const joystickNavigation = (command: string) => {
        if (command === 'START') {
            setIsHeaderMenuOpen(!isHeaderMenuOpen);
        }

        if (isHeaderMenuOpen) {
            if (command === 'B' || command === 'A') {
                setIsHeaderMenuOpen(false);
            }
        }
        if (!isHeaderMenuOpen) {
            if (command === 'B') {
                if (page === 'collection') {
                    navigation(`/${page}/${collectionId}/${id}`);
                } else {
                    navigation(`/${page}/${id}`);
                }
                return;
            }

            if (selectedIndex === BANNER_INDEX) {
                if (command === 'baixo') {
                    playCursorSound();
                    setSelectedIndex(0);
                } else if (command === 'A' && currentGame) {
                    handleStartGame(currentGame.id, currentGame.steam_id);
                }
                return;
            }

            if (command === 'A') {
                playConfirmSound();
                const item = selectedIndex < 4
                    ? optionsItems[selectedIndex]
                    : statisticsItems[selectedIndex - 4];
                item.action();
                return;
            }

            const nextIndex = NAVIGATION_MAP[selectedIndex]?.[command];
            if (nextIndex !== undefined) {
                playCursorSound();
                setSelectedIndex(nextIndex);
            }
        }
    };

    return (
        <>
            <JoystickSetup command={joystickNavigation} />
            <div className="background"></div>
            <div className="main-content">
                {!currentGame ? (
                    <p className="error-message">Jogo não encontrado</p>
                ) : (
                    <div className="game-page-container">
                        <h1 className="game-page-title">{currentGame?.title}</h1>
                        <GameLandscape
                            id={currentGame.steam_id}
                            steamId={currentGame.steam_id}
                            img={getGameCover(currentGame.title, 'landscape', 'jpg')}
                            name={currentGame.title}
                            isFocused={selectedIndex === 999}
                            isInstalled={currentGame.installed}
                        />

                        <div className="game-page-details-container">
                            <div className="game-page-details-section" style={{border: 'none'}}>
                                <h2 className="game-page-details-section-title">Opções</h2>
                                <div className="game-page-options-container">
                                    {optionsItems.map((item, index) => {
                                        const gridArea = item.type === 'attribute'
                                            ? (index === 2 ? 'attr1' : 'attr2')
                                            : (index === 0 ? 'button1' : 'button2');

                                        return (
                                            <div
                                                key={index}
                                                style={{ gridArea }}
                                                className={selectedIndex === index ?
                                                    "game-page-details-item options-item-focused" :
                                                    "game-page-details-item"
                                                }
                                            >
                                                <p>{item.label}</p>
                                                {item.label === 'Oculto:' && (
                                                    <img src={currentGame.hidden ? checked : notChecked} />
                                                )}
                                                {item.label === 'Zeravel:' && (
                                                    <img src={currentGame.beatable ? checked : notChecked} />
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>

                            <div className="game-page-details-section">
                                <h2 className="game-page-details-section-title">Estatísticas</h2>
                                <div className="game-page-statistics-container">
                                    <div className={selectedIndex === 4 ?
                                        "game-page-details-item options-item-focused" :
                                        "game-page-details-item"
                                    }>
                                        <div>
                                            <img src={currentStatus.icon} />
                                            <p style={{ color: currentStatus.color, fontWeight: '500' }}>{currentStatus.label}</p>
                                        </div>
                                    </div>
                                    <div className={selectedIndex === 5 ?
                                        "game-page-details-item options-item-focused" :
                                        "game-page-details-item"
                                    }>
                                        <div>
                                            <img src={totalTime} />
                                            <p className="title">Tempo total</p>
                                        </div>
                                        <p>{currentGame.playtime < 60
                                            ? `${currentGame.playtime}min`
                                            : `${Math.floor(currentGame.playtime / 60)}h${currentGame.playtime % 60 > 0 ? ` ${currentGame.playtime % 60}min` : ''}`}
                                        </p>
                                    </div>
                                    <div className={selectedIndex === 6 ?
                                        "game-page-details-item options-item-focused" :
                                        "game-page-details-item"
                                    }>
                                        <div>
                                            <img src={trophy} />
                                            <p className="title">Conquistas</p>
                                        </div>
                                        <p>{achievementsLabel}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="game-page-details-section">
                                <h2 className="game-page-details-section-title">Últimas conquistas</h2>
                                <div className="game-page-achievements">
                                    {recentAchievements.map((achievement) => (
                                        <div className="game-page-achievements-icon-container">
                                            <img
                                                key={achievement.id}
                                                className={`game-page-achievement-icon ${getTier(achievement.global_percent)}`}
                                                src={achievement.icon!}
                                                alt={achievement.display_name ?? achievement.api_name}
                                                title={achievement.display_name ?? achievement.api_name}
                                            />
                                            <img className="achievement-tier-trophy" src={getTrophySrc(getTier(achievement.global_percent))} />
                                            <p className="game-page-achievement-label">{achievement.display_name}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    )
}

export default GamePage;
