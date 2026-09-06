export interface AprenderItem {
  id: string;
  image: string;
  text: string;
  fullName: string;
  progress: number;
  showPlayButton: boolean;
  position: string;
}

export interface HomeAprenderCarouselProps {
  hideBlog?: boolean;
}
