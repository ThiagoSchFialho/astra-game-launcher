import React, { useState, useEffect, useRef, useMemo } from 'react';
import './styles.css';

import JoystickSetup from '../JoystickSetup/JoystickSetup';

import { useSound } from '../../hooks/useSound';

import { getGameCover } from '../../utils/getGameCover';

import type { Game } from '../../types/gamesType';
import GameCard from '../GameCard/GameCard';
import { useNavigate } from 'react-router-dom';

type ScreenItem = {
    id: Game['id'];
    steamId: Game['steam_id'];
    img: string;
    name: Game['title'];
    playtime: number;
    installed: boolean;
    action: () => void | Promise<void>;
};

interface GameListProps {
    list: Game[];
    selectedGame: string;
    showHeader?: boolean;
}

type FilterOption = {
    id: string;
    label: string;
    test: (g: Game) => boolean;
    excludes?: string;
};

const FILTER_OPTIONS: FilterOption[] = [
    { id: 'played',     label: 'Jogados',     test: (g) => g.playtime > 0,   excludes: 'not_played' },
    { id: 'not_played', label: 'Não jogados', test: (g) => g.playtime === 0, excludes: 'played' },
    { id: 'hidden',     label: 'Ocultos',     test: (g) => Boolean(g.hidden) },
    { id: 'completed',  label: 'Zerados',     test: (g) => g.status === 'completed' },
    { id: 'installed',  label: 'Instalados',  test: (g) => g.installed },
];

type OrderOption = {
    id: string;
    label: string;
    compare: (a: Game, b: Game) => number;
};

const ORDER_OPTIONS: OrderOption[] = [
    { id: 'name_asc',    label: 'Nome A-Z',     compare: (a, b) => a.title.localeCompare(b.title, 'pt-BR') },
    { id: 'name_desc',   label: 'Nome Z-A',     compare: (a, b) => b.title.localeCompare(a.title, 'pt-BR') },
    { id: 'most_played', label: 'Mais jogados', compare: (a, b) => b.playtime - a.playtime },
];

const COLUMNS = 5;

const GameList: React.FC<GameListProps> = ({
    list,
    selectedGame,
    showHeader = true,
}) => {
    const navigation = useNavigate();
    const { playSelectSound, playConfirmSound, playPopupSound } = useSound();
    const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
    const [selectedIndex, setSelectedIndex] = useState<number>(0);
    const [commandCoolDown, setCommandCoolDown] = useState<boolean>(false);
    const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState<boolean>(false);

    const [isOnPageHeader, setIsOnPageHeader] = useState<boolean>(false);
    const [headerIndex, setHeaderIndex] = useState<0 | 1>(0);
    const [openPanel, setOpenPanel] = useState<'filters' | 'order' | null>(null);
    const [panelIndex, setPanelIndex] = useState<number>(0);
    const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
    const [selectedOrder, setSelectedOrder] = useState<string>('name_asc');

    const initialSelectDoneRef = useRef<boolean>(false);
    const instantScrollRef = useRef<boolean>(false);

    const visibleList = useMemo(() => {
        const activeTests = FILTER_OPTIONS
            .filter((f) => selectedFilters.includes(f.id))
            .map((f) => f.test);

        const showOnlyHidden = selectedFilters.includes('hidden');

        const filtered = list.filter((game) => {
            if (game.hidden && !showOnlyHidden) return false;
            return activeTests.every((test) => test(game));
        });

        const compare = ORDER_OPTIONS.find((o) => o.id === selectedOrder)?.compare;
        return compare ? [...filtered].sort(compare) : filtered;
    }, [list, selectedFilters, selectedOrder]);

    const gameCardsItems: ScreenItem[] = visibleList.map((game) => ({
        id: game.id,
        steamId: game.steam_id,
        img: getGameCover(game.title, 'square', 'jpg'),
        name: game.title,
        playtime: game.playtime,
        installed: game.installed,
        action: () => { navigation(`/game-page/library/${game.id}`) }
    }));

    useEffect(() => {
        if (initialSelectDoneRef.current) return;
        if (!selectedGame || gameCardsItems.length === 0) return;

        initialSelectDoneRef.current = true;

        const index = gameCardsItems.findIndex((game) => game.id == selectedGame);
        if (index === -1) return;

        if (index !== selectedIndex) {
            instantScrollRef.current = true;
            setSelectedIndex(index);
        }
    }, [selectedGame, gameCardsItems.length]);

    useEffect(() => {
        if (gameCardsItems.length > 0 && selectedIndex > gameCardsItems.length - 1) {
            setSelectedIndex(gameCardsItems.length - 1);
        }
    }, [gameCardsItems.length]);

    const joystickRef = useRef<(command: string) => void>(() => {});

    const startCooldown = () => {
        setCommandCoolDown(true);
        setTimeout(() => setCommandCoolDown(false), 50);
    };

    const closePanel = () => {
        startCooldown();
        setOpenPanel(null);
    };

    const toggleFilter = (id: string) => {
        const option = FILTER_OPTIONS.find((f) => f.id === id);
        setSelectedFilters((prev) => {
            if (prev.includes(id)) return prev.filter((f) => f !== id);
            const withoutConflict = option?.excludes
                ? prev.filter((f) => f !== option.excludes)
                : prev;
            return [...withoutConflict, id];
        });
        setSelectedIndex(0);
    };

    const handlePanelNav = (command: string) => {
        const options = openPanel === 'filters' ? FILTER_OPTIONS : ORDER_OPTIONS;

        if (command === 'cima') {
            playSelectSound();
            setPanelIndex((i) => Math.max(0, i - 1));
        } else if (command === 'baixo') {
            playSelectSound();
            setPanelIndex((i) => Math.min(options.length - 1, i + 1));
        } else if (command === 'A') {
            playConfirmSound();
            const option = options[panelIndex];
            if (openPanel === 'filters') {
                toggleFilter(option.id);
            } else {
                setSelectedOrder(option.id);
                setSelectedIndex(0);
                closePanel();
            }
        } else if (command === 'B') {
            closePanel();
        }
    };

    // --- Navegação: cabeçalho -----------------------------------------
    const handleHeaderNav = (command: string) => {
        if (command === 'esquerda') {
            playSelectSound();
            setHeaderIndex(0);
        } else if (command === 'direita') {
            playSelectSound();
            setHeaderIndex(1);
        } else if (command === 'baixo' || command === 'B') {
            if (command === 'B' && commandCoolDown) return;
            playSelectSound();
            setIsOnPageHeader(false);
        } else if (command === 'A') {
            if (commandCoolDown) return;
            playConfirmSound();
            const panel = headerIndex === 0 ? 'filters' : 'order';
            setOpenPanel(panel);
            setPanelIndex(
                panel === 'order'
                    ? Math.max(0, ORDER_OPTIONS.findIndex((o) => o.id === selectedOrder))
                    : 0
            );
        }
    };

    // --- Navegação principal ------------------------------------------
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

        if (openPanel) return handlePanelNav(command);
        if (isOnPageHeader) return handleHeaderNav(command);

        const currentIndex = selectedIndex;
        const length = gameCardsItems.length;

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
        } else if (command === 'cima') {
            if (showHeader && currentIndex < COLUMNS) {
                playSelectSound();
                setIsOnPageHeader(true);
            } else if (currentIndex >= COLUMNS) {
                playSelectSound();
                setSelectedIndex(currentIndex - COLUMNS);
            }
        } else if (command === 'baixo') {
            const next = Math.min(currentIndex + COLUMNS, length - 1);
            if (Math.floor(next / COLUMNS) > Math.floor(currentIndex / COLUMNS)) {
                playSelectSound();
                setSelectedIndex(next);
            }
        } else if (command === 'A') {
            if (commandCoolDown) return;
            playConfirmSound();
            gameCardsItems[currentIndex]?.action();
        } else if (command === 'Y') {
            playPopupSound();
            setIsMenuOpen(true);
        }
    };

    joystickRef.current = joystickNavigation;

    const handleCloseMenu = () => {
        setCommandCoolDown(true);
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

        const elTopInContainer = elRect.top - containerRect.top + container.scrollTop;
        const target =
            elTopInContainer - container.clientHeight / 2 + elRect.height / 2;

        if (instantScrollRef.current) {
            instantScrollRef.current = false;
            if (animationRef.current !== null) {
                cancelAnimationFrame(animationRef.current);
                animationRef.current = null;
            }
            container.scrollTop = target;
            return;
        }

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

    const orderLabel = ORDER_OPTIONS.find((o) => o.id === selectedOrder)?.label ?? '';

    return (
        <>
            {!isMenuOpen && (
                <JoystickSetup command={(c: string) => joystickRef.current(c)} />
            )}

            <div className="main-content">

                {showHeader && (
                    <div className="page-header">
                        <div className={`page-header-container ${isOnPageHeader && headerIndex === 0 ? 'focused' : ''}`}>
                            <p>
                                Filtros{selectedFilters.length > 0 && ` (${selectedFilters.length})`}
                            </p>

                            {openPanel === 'filters' && (
                                <ul className="header-panel">
                                    {FILTER_OPTIONS.map((opt, i) => (
                                        <li key={opt.id} className={i === panelIndex ? 'active' : ''}>
                                            <span className="check">
                                                {selectedFilters.includes(opt.id) ? '☑' : '☐'}
                                            </span>
                                            {opt.label}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        <div className={`page-header-container ${isOnPageHeader && headerIndex === 1 ? 'focused' : ''}`}>
                            <p>Ordenar: {orderLabel}</p>

                            {openPanel === 'order' && (
                                <ul className="header-panel">
                                    {ORDER_OPTIONS.map((opt, i) => (
                                        <li key={opt.id} className={i === panelIndex ? 'active' : ''}>
                                            <span className="check">
                                                {selectedOrder === opt.id ? '●' : '○'}
                                            </span>
                                            {opt.label}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        <div className="degrade"></div>
                    </div>
                )}

                <div className="game-list-container">
                    <div className="list-game-container" ref={scrollContainerRef}>
                        {gameCardsItems.length === 0 ? (
                            <div className="message-container">
                                <h3>Nenhum jogo aqui.</h3>
                            </div>
                        ) : (
                            gameCardsItems.map((item, index) => (
                                <div
                                    key={item.id}
                                    ref={(el) => { itemRefs.current[index] = el; }}
                                    className="game-card-container"
                                >
                                    <GameCard
                                        id={item.id}
                                        steamId={item.steamId}
                                        img={item.img}
                                        name={item.name}
                                        playtime={item.playtime}
                                        isFocused={!isOnPageHeader && !openPanel && selectedIndex === index}
                                        isOpen={isMenuOpen && selectedIndex === index}
                                        onCloseMenu={handleCloseMenu}
                                    />
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

export default GameList;