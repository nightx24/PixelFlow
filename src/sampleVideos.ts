import { VideoEntry } from './types.ts';

export const INITIAL_VIDEOS: VideoEntry[] = [
  {
    id: 'sample-1',
    name: 'Big_Buck_Bunny_1080p.mp4',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    durationMs: 596000, // 9:56
    sizeBytes: 158200000, // ~150.9 MB
    folder: 'Movies',
    thumbnailUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=500&auto=format&fit=crop&q=80',
    dateAdded: Date.now() - 1000 * 60 * 60 * 24 * 3,
  },
  {
    id: 'sample-2',
    name: 'Tears_of_Steel_4K_Teaser.mp4',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    durationMs: 734000, // 12:14
    sizeBytes: 198500000, // ~189.3 MB
    folder: 'Movies',
    thumbnailUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500&auto=format&fit=crop&q=80',
    dateAdded: Date.now() - 1000 * 60 * 60 * 24 * 2,
  },
  {
    id: 'sample-3',
    name: 'Elephants_Dream_OpenMovie.mp4',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    durationMs: 653000, // 10:53
    sizeBytes: 142000000, // ~135.4 MB
    folder: 'Movies',
    thumbnailUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&auto=format&fit=crop&q=80',
    dateAdded: Date.now() - 1000 * 60 * 60 * 24 * 5,
  },
  {
    id: 'sample-4',
    name: 'VID_20261011_ForestTrail_4K.mp4',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    durationMs: 15000, // 0:15
    sizeBytes: 15400000, // ~14.7 MB
    folder: 'Camera',
    thumbnailUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=500&auto=format&fit=crop&q=80',
    dateAdded: Date.now() - 1000 * 60 * 60 * 12,
  },
  {
    id: 'sample-5',
    name: 'VID_20261009_SunsetCoast.mp4',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    durationMs: 15000,
    sizeBytes: 16100000,
    folder: 'Camera',
    thumbnailUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500&auto=format&fit=crop&q=80',
    dateAdded: Date.now() - 1000 * 60 * 60 * 48,
  },
  {
    id: 'sample-6',
    name: 'UI_Design_Walkthrough_Record.mp4',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    durationMs: 60000,
    sizeBytes: 28400000,
    folder: 'Screen Recordings',
    thumbnailUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=500&auto=format&fit=crop&q=80',
    dateAdded: Date.now() - 1000 * 60 * 60 * 6,
  },
  {
    id: 'sample-7',
    name: 'Cyberpunk_City_Drone_Pass.mp4',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
    durationMs: 15000,
    sizeBytes: 18200000,
    folder: 'Downloads',
    thumbnailUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=500&auto=format&fit=crop&q=80',
    dateAdded: Date.now() - 1000 * 60 * 60 * 18,
  },
  {
    id: 'sample-8',
    name: 'Sound_Design_Reel_2026.mp4',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
    durationMs: 15000,
    sizeBytes: 19800000,
    folder: 'Downloads',
    thumbnailUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80',
    dateAdded: Date.now() - 1000 * 60 * 60 * 36,
  }
];
