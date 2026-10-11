import React, { useState, useEffect, useRef } from 'react';
import './styles.css';

import GameCardPortrait from '../GameCardPortrait/GameCardPortrait';
import JoystickSetup from '../JoystickSetup/JoystickSetup';
import GamePage from '../GamePage/GamePage';

import { useSound } from '../../hooks/useSound';

import { getGameCover } from '../../utils/getGameCover';

import type { Game } from '../../types/gamesType';

import goldenTrophy from '../../assets/golden_trophy.png';
import clock from '../../assets/icons/clock.svg';

type ScreenItem = {
    id: Game['id'];
    steamId: Game['steam_id'];
    status: Game['status'];
    img: string;
    name: Game['title'];
    playtime: number;
    installed: boolean;
    action: () => void | Promise<void>;
};

interface HorizontalGameListProps {
    list: Game[];
    onReloadList: () => void;
    page?: string;
    onBack?: () => void;
}

const HorizontalGameList: React.FC<HorizontalGameListProps> = ({
    list,
    onReloadList,
    page,
    onBack,
}) => {
    const { playSelectSound, playConfirmSound, playPopupSound } = useSound();
    const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
    const [selectedIndex, setSelectedIndex] = useState<number>(0);
    const [commandCoolDown, setCommandCoolDown] = useState<boolean>(false);
    const [isOnGamePage, setIsOnGamePage] = useState<boolean>(false);
    const [selectedGameId, setSelectedGameId] = useState<Game['id'] | undefined>(undefined);
    const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState<boolean>(false);

    useEffect(() => {
        const selectedIndexAux = selectedIndex;

        onReloadList();
        setSelectedIndex(selectedIndexAux);
    }, [isOnGamePage]);

    const gameCardsItems: ScreenItem[] = list.map((game) => ({
        id: game.id,
        steamId: game.steam_id,
        status: game.status,
        img: getGameCover(game.title, 'portrait', 'png'),
        name: game.title,
        playtime: game.playtime,
        installed: game.installed,
        action: () => { setSelectedGameId(game.id); setIsOnGamePage(true); },
    }));

    const selectedIndexRef = useRef(selectedIndex);
    useEffect(() => {
        selectedIndexRef.current = selectedIndex;
    }, [selectedIndex]);

    const itemsLengthRef = useRef(gameCardsItems.length);
    useEffect(() => {
        itemsLengthRef.current = gameCardsItems.length;
    }, [gameCardsItems.length]);

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

        if (command === 'esquerda') {
            if (currentIndex !== 0) {
                playSelectSound();
                setSelectedIndex(currentIndex - 1);
            }
        } else if (command === 'direita') {
            if (currentIndex < length - 1) {
                playSelectSound();
                setSelectedIndex(currentIndex + 1);
            }
        } else if (command === 'A') {
            if (commandCoolDown) return;
            playConfirmSound();
            gameCardsItems[currentIndex]?.action();
        } else if (command === 'B') {
            if (commandCoolDown) return;
            onBack?.();
        } else if (command === 'Y') {
            playPopupSound();
            setIsMenuOpen(true);
        }
    };

    const handleCloseMenu = () => {
        setCommandCoolDown(true);
        setTimeout(() => {
            setCommandCoolDown(false);
        }, 50);
        setIsMenuOpen(false);
    };

    const handleCloseGamePage = () => {
        setCommandCoolDown(true);
        setIsOnGamePage(false);
        setTimeout(() => {
            setCommandCoolDown(false);
        }, 50);
        setIsMenuOpen(false);
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

        const elLeftInContainer = elRect.left - containerRect.left + container.scrollLeft;
        const target =
            elLeftInContainer - container.clientWidth / 2 + elRect.width / 2;

        const start = container.scrollLeft;
        const distance = target - start;
        const startTime = performance.now();

        if (animationRef.current !== null) cancelAnimationFrame(animationRef.current);

        const easeInOut = (t: number) =>
            t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

        const step = (now: number) => {
            const progress = Math.min((now - startTime) / SCROLL_DURATION, 1);
            container.scrollLeft = start + distance * easeInOut(progress);

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
            {isOnGamePage && selectedGameId !== undefined && (
                <GamePage gameId={selectedGameId} onExitGamePage={handleCloseGamePage} />
            )}

            {!isMenuOpen && !isOnGamePage && (
                <JoystickSetup command={joystickNavigation} />
            )}

            <div className="main-content" style={{ display: isOnGamePage ? 'none' : undefined }}>
                <div className="horizontal-game-list-container">
                    <div className="horizontal-list-game-container" ref={scrollContainerRef}>
                        {gameCardsItems.length === 0 ? (
                            <div className="message-container">
                                <h3>Nenhum jogo aqui.</h3>
                            </div>
                        ) : (
                            gameCardsItems.map((item, index) => (
                                <div
                                    key={item.id}
                                    ref={(el) => { itemRefs.current[index] = el; }}
                                    onClick={() => { setSelectedGameId(item.id); setIsOnGamePage(true); }}
                                >
                                    <GameCardPortrait
                                        id={item.id}
                                        steamId={item.steamId}
                                        img={item.img}
                                        name={item.name}
                                        page={page ?? ''}
                                        playtime={item.playtime}
                                        isFocused={selectedIndex === index}
                                        isOpen={isMenuOpen && selectedIndex === index}
                                        onCloseMenu={handleCloseMenu}
                                    />
                                    <div className={`game-fast-info ${selectedIndex === index ? 'open' : ''}`}>
                                        <p>{item.name}</p>
                                        <div className="home-icon-container">
                                            <img src={clock} />
                                            <p> 
                                                {item.playtime < 60
                                                    ? `${item.playtime}m`
                                                    : `${Math.floor(item.playtime / 60)}h${item.playtime % 60 > 0 ? ` ${item.playtime % 60}m` : ''}`}
                                            </p>
                                        </div>
                                        <div className="home-icon-container">
                                            {item.status === 'completed' && (
                                                <>
                                                    <img className="trophy-icon" src={goldenTrophy} />
                                                    <p>Zerado</p>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
                <div className="game-count">Jogos: {gameCardsItems.length}</div>
            </div>
        </>
    );
};

export default HorizontalGameList;