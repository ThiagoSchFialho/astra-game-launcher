import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './styles.css';

import CollectionFolder from '../../components/CollectionFolder/CollectionFolder';
import JoystickSetup from '../../components/JoystickSetup/JoystickSetup';
import Keyboard from '../../components/Keyboard/Keyboard';

import { useCollection } from '../../hooks/useCollection';
import { useSound } from '../../hooks/useSound';
import plus from '../../assets/icons/plus.svg';
import type { ICollection } from '../../types/collectionsType';

const BUTTON_INDEX = 0;

const Collections: React.FC = () => {
    const navigation = useNavigate();
    const { playSelectSound, playConfirmSound, playPopupSound } = useSound();
    const { fetchCollections, createCollection } = useCollection();
    const [isCollectionFormOpen, setIsCollectionFormOpen] = useState(false);
    const [collectionsList, setCollectionsList] = useState<ICollection[]>([]);
    const [collectionTitle, setCollectionTitle] = useState<string | undefined>('');
    const [selectedIndex, setSelectedIndex] = useState(1);
    const [commandCoolDown, setCommandCoolDown] = useState(false);
    const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const getCollections = async () => {
            setIsLoading(true);
            const collections = await fetchCollections();
            if (collections) {
                setIsLoading(false);
                setCollectionsList(collections);
            }
            if (collections.length === 0) {
                setSelectedIndex(0);
            }
        }

        getCollections();
    }, []);

    const handleCreateCollection = async (phrase: string) => {
        playConfirmSound();
        setCollectionTitle(phrase);

        if (collectionTitle && collectionTitle !== '') {
            const result = await createCollection(collectionTitle);
            if (!result) {
                return;
            }
            window.location.reload();
        }
    }

    // --- Refs para evitar stale closure no joystickNavigation -------------
    const selectedIndexRef = useRef(selectedIndex);
    useEffect(() => {
        selectedIndexRef.current = selectedIndex;
    }, [selectedIndex]);

    const itemsLengthRef = useRef(collectionsList.length);
    useEffect(() => {
        itemsLengthRef.current = collectionsList.length;
    }, [collectionsList.length]);
    // ------------------------------------------------------------------

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
            const currentIndex = selectedIndexRef.current;
            const length = itemsLengthRef.current;
            const onButton = currentIndex === BUTTON_INDEX;

            if (onButton) {
                if (command === 'baixo' && length > 0) {
                    playSelectSound();
                    setSelectedIndex(1);
                } else if (command === 'A') {
                    if (commandCoolDown) return;
                    playPopupSound();
                    setIsCollectionFormOpen(true);
                }
                return;
            }

            if (command === 'esquerda') {
                if (currentIndex >= 2) {
                    playSelectSound();
                    setSelectedIndex(currentIndex - 1);
                }
            } else if (command === 'direita') {
                if (currentIndex !== length) {
                    playSelectSound();
                    setSelectedIndex(currentIndex + 1);
                }
            } else if (command === 'cima') {
                if (currentIndex <= 3) {
                    playSelectSound();
                    setSelectedIndex(BUTTON_INDEX);
                } else {
                    playSelectSound();
                    setSelectedIndex(currentIndex - 4);
                }
            } else if (command === 'baixo') {
                if (currentIndex < length - 3) {
                    playSelectSound();
                    setSelectedIndex(currentIndex + 4);
                }
            } else if (command === 'A') {
                if (commandCoolDown) return;
                playConfirmSound();
                const collection = collectionsList[currentIndex - 1];
                if (collection) {
                    navigation(`/collection/${collection.id}`);
                }
            }
        }
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
            {!isCollectionFormOpen && <JoystickSetup command={joystickNavigation} />}
            <div className="main-content">
                <div ref={scrollContainerRef} className="collections-scroll-container">
                    <div className="collections-header">
                        <div
                            className={selectedIndex === BUTTON_INDEX ? 'focused create-collection-btn' : 'create-collection-btn'}
                        >
                            <img src={plus} />
                            <p>Criar coleção</p>
                        </div>
                    </div>
                    <div className="collection-folders-container" ref={scrollContainerRef}>
                        {isLoading ? (
                            <div className="message-container">
                                <h3>Carregando...</h3>
                            </div>
                        ) : (
                            collectionsList.length === 0 ? (
                                <div className="message-container">
                                    <h3>Nenhuma coleção ainda.</h3>
                                </div>
                            ) : (
                                collectionsList.map((collection, index) => (
                                <div key={collection.id} ref={(el) => { itemRefs.current[index + 1] = el }}>
                                    <CollectionFolder
                                        collection={collection}
                                        isFocused={selectedIndex === index + 1}
                                    />
                                </div>
                            )))
                        )}
                    </div>
                </div>
            </div>

            {isCollectionFormOpen && (
                <>
                    <div className="collection-title-form-container">
                        <div className="collection-title-form-header">
                            <h2>Criar Coleção</h2>
                        </div>
                        <form onSubmit={(e) => e.preventDefault()}>
                            <label htmlFor="collection-title">Nome da Coleção</label>
                            <div className="input-container">
                                <input
                                    type="text"
                                    name="collection-title"
                                    id="collection-title"
                                    maxLength={35}
                                    required
                                    value={collectionTitle}
                                />
                            </div>
                        </form>
                    </div>
                    <Keyboard onKeyPressed={setCollectionTitle} onDone={handleCreateCollection} onClose={() => setIsCollectionFormOpen(false)}/>
                </>
            )}
        </>
    )
}

export default Collections;