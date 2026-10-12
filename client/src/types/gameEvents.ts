export interface GameEvent {
    type: 'started' | 'stopped';
    steamId: number;
}