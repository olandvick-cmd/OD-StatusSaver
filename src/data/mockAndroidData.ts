export interface SimulatedStatus {
  id: string;
  title: string;
  url: string;
  mediaType: 'IMAGE' | 'VIDEO';
  source: 'STANDARD' | 'BUSINESS';
  sizeBytes: number;
  lastModified: number;
  duration?: string;
  isSaved?: boolean;
}

export const INITIAL_STATUSES: SimulatedStatus[] = [
  {
    id: "wa_img_01",
    title: "IMG-20261028-WA0014.jpg",
    url: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=80",
    mediaType: "IMAGE",
    source: "STANDARD",
    sizeBytes: 1420000,
    lastModified: Date.now() - 3600000 * 2,
    isSaved: false
  },
  {
    id: "wa_vid_01",
    title: "VID-20261028-WA0022.mp4",
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    mediaType: "VIDEO",
    source: "STANDARD",
    sizeBytes: 4890000,
    duration: "0:15",
    lastModified: Date.now() - 3600000 * 4,
    isSaved: false
  },
  {
    id: "wa_img_02",
    title: "IMG-20261028-WA0031.jpg",
    url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80",
    mediaType: "IMAGE",
    source: "STANDARD",
    sizeBytes: 980000,
    lastModified: Date.now() - 3600000 * 6,
    isSaved: true
  },
  {
    id: "wa_vid_02",
    title: "VID-20261028-WA0045.mp4",
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4",
    mediaType: "VIDEO",
    source: "STANDARD",
    sizeBytes: 6120000,
    duration: "0:24",
    lastModified: Date.now() - 3600000 * 9,
    isSaved: false
  },
  // WhatsApp Business Statuses
  {
    id: "biz_img_01",
    title: "BIZ-20261028-CATALOG-01.jpg",
    url: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800&auto=format&fit=crop&q=80",
    mediaType: "IMAGE",
    source: "BUSINESS",
    sizeBytes: 1840000,
    lastModified: Date.now() - 3600000 * 1,
    isSaved: false
  },
  {
    id: "biz_img_02",
    title: "BIZ-20261028-PROMO-SUMMER.jpg",
    url: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&auto=format&fit=crop&q=80",
    mediaType: "IMAGE",
    source: "BUSINESS",
    sizeBytes: 2100000,
    lastModified: Date.now() - 3600000 * 3,
    isSaved: false
  },
  {
    id: "biz_vid_01",
    title: "BIZ-20261028-SHOWCASE.mp4",
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
    mediaType: "VIDEO",
    source: "BUSINESS",
    sizeBytes: 7420000,
    duration: "0:30",
    lastModified: Date.now() - 3600000 * 8,
    isSaved: true
  }
];

export interface RemoteConfigSettings {
  adMobEnabled: boolean;
  adMobBannerEnabled: boolean;
  interstitialFrequencySaves: number;
  minSupportedVersion: string;
  announcementActive: boolean;
  announcementText: string;
  enableBusinessDetection: boolean;
  enableCrashlyticsNonPii: boolean;
}

export const DEFAULT_CONFIG: RemoteConfigSettings = {
  adMobEnabled: true,
  adMobBannerEnabled: true,
  interstitialFrequencySaves: 3,
  minSupportedVersion: "1.0.0",
  announcementActive: false,
  announcementText: "Welcome to OD Status Saver! All media processing remains 100% on your device.",
  enableBusinessDetection: true,
  enableCrashlyticsNonPii: true
};
