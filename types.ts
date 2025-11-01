export interface ItineraryActivity {
    time: string;
    description: string;
    category: 'connection' | 'nature' | 'culture' | 'community' | 'spirituality';
}

export interface ItineraryDay {
    day: string;
    title: string;
    activities: ItineraryActivity[];
}

export interface InstagramPost {
    id: string;
    src: string;
    alt: string;
    caption: string;
    likes: number;
    comments: number;
}

export interface Testimonial {
    quote: string;
    author: string;
    location: string;
}

export interface GuestInfo {
  id: number;
  name: string;
  idType: string;
  idNumber: string;
}

export type GuestDetails = {
  name: string;
  idType: string;
  idNumber: string;
};