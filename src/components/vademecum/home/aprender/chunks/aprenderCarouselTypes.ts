export interface AprenderItem {
  id: string;
  image: string;
  text: string;
  fullName: string;
  descricao?: string;
  borderColor?: string;
  glowColor?: string;
  progress: number;
  showPlayButton: boolean;
  position: string;
}

export interface HomeAprenderCarouselProps {
  hideBlog?: boolean;
}
