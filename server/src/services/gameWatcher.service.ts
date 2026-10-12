import { execFile } from 'child_process';
import { promisify } from 'util';
import { EventEmitter } from 'events';

const execFileAsync = promisify(execFile);

async function getRunningAppId(): Promise<number> {
    const { stdout } = await execFileAsync('reg', [
        'query', 'HKCU\\Software\\Valve\\Steam', '/v', 'RunningAppID',
    ]);
    const match = stdout.match(/RunningAppID\s+REG_DWORD\s+0x([0-9a-fA-F]+)/);
    return match?.[1] ? parseInt(match[1], 16) : 0;
}

class GameWatcher extends EventEmitter {
    private current = 0;
    private timer?: NodeJS.Timeout;

    start(intervalMs = 2000) {
        this.timer = setInterval(async () => {
            try {
                const id = await getRunningAppId();
                if (id === this.current) return;

                const previous = this.current;
                this.current = id;

                if (previous) this.emit('stopped', previous);
                if (id) this.emit('started', id);
            } catch (error) {
                console.error('Erro ao ler RunningAppID:', error);
            }
        }, intervalMs);
    }

    stop() {
        if (this.timer) clearInterval(this.timer);
    }

    get runningAppId() {
        return this.current;
    }
}

export const gameWatcher = new GameWatcher();