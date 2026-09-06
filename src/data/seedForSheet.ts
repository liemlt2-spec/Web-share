import { INITIAL_PROJECTS } from './initialData';

export interface SeedProject {
  id: string;
  title: string;
  url: string;
  description: string;
  country: string;
  category: string;
  educationLevel: string;
  status: string;
  isFamous: boolean;
  authorName: string;
  authorContact: string;
  createdAt: string;
  previewImage: string;
  tags: string[];
  views: number;
  likes: number;
}

export const SEED_FOR_SHEET: SeedProject[] = INITIAL_PROJECTS.filter(
  (p) => p.status === 'approved' && p.isFamous
).map((p) => ({
  id: p.id,
  title: p.title,
  url: p.url,
  description: p.description,
  country: p.country,
  category: p.category,
  educationLevel: p.educationLevel,
  status: 'approved',
  isFamous: true,
  authorName: p.authorName,
  authorContact: p.authorContact || '',
  createdAt: p.createdAt,
  previewImage: p.previewImage || '',
  tags: Array.isArray(p.tags) ? p.tags : [],
  views: p.views || 0,
  likes: p.likes || 0,
}));