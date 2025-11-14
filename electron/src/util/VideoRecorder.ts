import { createFFmpeg, type FFmpeg } from "@ffmpeg/ffmpeg";

export interface VideoRecordingProgress {
    action: string;
    done: number;
    of: number;
}

export class VideoRecorder {
    private fps: number;
    private chunks: string[] = [];
    private totalFrames: number = 0;
    private data: Uint8Array = new Uint8Array();
    private videoReadyCallback: (ready: boolean) => void = () => {};
    private recordingVideoCallback: (ready: boolean) => void = () => {};
    private progressCallback: (progress: VideoRecordingProgress) => void = ({}) => {};
    private recordingFinishedCallback: () => void = () => {};
    private ffmpeg: FFmpeg;

    public isRecording: boolean = false;

    constructor(fps: number) {
        this.fps = fps;
        this.ffmpeg = createFFmpeg({ log: false });  
    }

    setVideoReadyCallback(callback: (ready: boolean) => void): void {
        this.videoReadyCallback = callback;
    }

    setProgressCallback(callback: (progress: VideoRecordingProgress) => void): void {
        this.progressCallback = callback;
    }

    setRecordingVideoCallback(callback: (ready: boolean) => void): void {
        this.recordingVideoCallback = callback;
    }

    setRecordingFinishedCallback(callback: () => void): void {
        this.recordingFinishedCallback = callback;
    }

    cleanupFFmpeg(): void {
        if (this.ffmpeg) {
            for (let i = 0; i < this.totalFrames; i++) {
                const fileName = `frame${String(i).padStart(4, '0')}.png`;
                try { this.ffmpeg.FS('unlink', fileName); console.log("Unlinked file:", fileName); } catch {}
            }
            try { this.ffmpeg.FS('unlink', 'out.mp4'); console.log("Unlinked file: out.mp4"); } catch {}
        }
    }

    startCapture(): void {          
        this.videoReadyCallback(false);
        this.recordingVideoCallback(true);
        this.isRecording = true;
    }

    setTotalFrames(totalFrames: number): void {
        this.totalFrames = totalFrames;
    }

    async addFrame(dataURL: string): Promise<void> {
        this.chunks.push(dataURL);
        this.progressCallback({
            action: "Collecting Frames",
            done: this.chunks.length,
            of: this.totalFrames
        });
        if (this.chunks.length >= this.totalFrames) {
            this.isRecording = false;
            this.stopCapture();
        }
    }

    // GPT assisted
    async stopCapture(): Promise<void> {
        if (!this.ffmpeg.isLoaded()) {
            await this.ffmpeg.load();
        }

        this.ffmpeg.setProgress(({ ratio }) => {
            this.progressCallback({
                action: "Rendering Video",
                done: Math.round(ratio * 100),
                of: 100
            });
        });

        // write files to ffmpeg FS
        for (let i = 0; i < this.chunks.length; i++) {
            const data = this.chunks[i].replace(/^data:image\/png;base64,/, '');
            const fileName = `frame${String(i).padStart(4, '0')}.png`;
            this.ffmpeg.FS('writeFile', fileName, Uint8Array.from(atob(data), c => c.charCodeAt(0)));
            this.progressCallback({
                action: "Preparing Frames",
                done: i + 1,
                of: this.chunks.length
            });
            await new Promise(r => setTimeout(r, 0));
        }

        // create video
        await this.ffmpeg.run(
            '-framerate', String(this.fps),
            '-i', 'frame%04d.png',
            '-c:v', 'libx264',
            '-pix_fmt', 'yuv420p',
            'out.mp4'
        );

        // get video data from FS
        this.data = this.ffmpeg.FS('readFile', 'out.mp4');
        this.cleanupFFmpeg();
        this.videoReadyCallback(true);
        this.recordingVideoCallback(false);
        this.recordingFinishedCallback();
        this.chunks = [];
    }

    getVideoBlob(): Blob | null {

        const blob = new Blob([this.data], { type: 'video/mp4' });

        this.data = new Uint8Array(); // Reset data after getting the blob

        return blob;
    }
}