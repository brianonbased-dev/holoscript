/**
 * AudioMixer.ts
 *
 * Channel-based volume mixer with mute groups.
 * Routes audio sources through named channels for independent volume control.
 */

export interface MixerChannel {
    name: string;
    volume: number;    // 0-1
    muted: boolean;
}

export class AudioMixer {
    private channels: Map<string, MixerChannel> = new Map();
    private masterVolume: number = 1.0;
    private masterMuted: boolean = false;

    constructor() {
        // Default channels
        this.createChannel('master', 1.0);
        this.createChannel('sfx', 1.0);
        this.createChannel('music', 0.5);
        this.createChannel('ambient', 0.6);
        this.createChannel('ui', 0.8);
        this.createChannel('voice', 1.0);
    }

    /**
     * Create or update a channel.
     */
    createChannel(name: string, volume: number = 1.0): void {
        this.channels.set(name, { name, volume, muted: false });
    }

    /**
     * Set channel volume.
     */
    setChannelVolume(name: string, volume: number): void {
        const ch = this.channels.get(name);
        if (ch) ch.volume = Math.max(0, Math.min(1, volume));
    }

    /**
     * Get channel volume.
     */
    getChannelVolume(name: string): number {
        return this.channels.get(name)?.volume ?? 1;
    }

    /**
     * Mute/unmute a channel.
     */
    setChannelMuted(name: string, muted: boolean): void {
        const ch = this.channels.get(name);
        if (ch) ch.muted = muted;
    }

    /**
     * Check if a channel is muted.
     */
    isChannelMuted(name: string): boolean {
        return this.channels.get(name)?.muted ?? false;
    }

    /**
     * Compute the effective volume for a source on a given channel.
     */
    getEffectiveVolume(channelName: string, sourceVolume: number): number {
        if (this.masterMuted) return 0;

        const ch = this.channels.get(channelName);
        if (!ch || ch.muted) return 0;

        return sourceVolume * ch.volume * this.masterVolume;
    }

    /**
     * Set master volume.
     */
    setMasterVolume(volume: number): void {
        this.masterVolume = Math.max(0, Math.min(1, volume));
    }

    getMasterVolume(): number {
        return this.masterVolume;
    }

    /**
     * Mute/unmute all audio.
     */
    setMasterMuted(muted: boolean): void {
        this.masterMuted = muted;
    }

    isMasterMuted(): boolean {
        return this.masterMuted;
    }

    /**
     * List all channels.
     */
    getChannels(): MixerChannel[] {
        return Array.from(this.channels.values());
    }

    /**
     * Mute a group of channels.
     */
    muteGroup(channelNames: string[]): void {
        for (const name of channelNames) {
            this.setChannelMuted(name, true);
        }
    }

    /**
     * Unmute a group of channels.
     */
    unmuteGroup(channelNames: string[]): void {
        for (const name of channelNames) {
            this.setChannelMuted(name, false);
        }
    }
}
