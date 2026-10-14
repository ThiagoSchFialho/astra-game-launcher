import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import './styles.css';
import GameList from '../../components/GameList/GameList';
import { useCollection } from '../../hooks/useCollection';
import type { ICollection } from '../../types/collectionsType';


const Collection: React.FC = () => {
    const { collectionId, gameId } = useParams<{ collectionId: string, gameId: string }>();
    const { getCollectionWithGames } = useCollection();
    const [collection, setCollection] = useState<ICollection>();

    const getCollection = async () => {
        if (!collectionId) return;
        const collection = await getCollectionWithGames(collectionId);
        if (collection) {
            setCollection(collection);
        }
    }
    useEffect(() => {
        getCollection();
    }, []);

    return (
        <>
            <GameList list={collection?.games ?? []} page="collection" collectionId={collectionId} selectedGame={gameId ?? ''}/>
        </>
    )
}
export default Collection;