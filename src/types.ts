export type CountryCode = 'VN' | 'US' | 'JP' | 'KR' | 'FR' | 'GB' | 'DE' | 'SG' | 'GLOBAL';

export type CategoryId = 
  | 'math'              // Toán học
  | 'physics'           // Vật lý
  | 'chemistry'         // Hóa học
  | 'biology'           // Sinh học
  | 'informatics'       // Tin học & Công nghệ
  | 'literature'        // Ngữ văn
  | 'english'           // Tiếng Anh
  | 'history'           // Lịch sử
  | 'geography'         // Địa lý
  | 'natural_sciences'  // Khoa học tự nhiên (KHTN)
  | 'stem'              // STEM & Thí nghiệm ảo
  | 'general';          // Môn học khác

export type EducationLevelId =
  | 'all'
  | 'primary'      // Tiểu học (Lớp 1 - 5)
  | 'secondary'    // THCS (Lớp 6 - 9)
  | 'highschool'   // THPT (Lớp 10 - 12)
  | 'university'   // Đại học & Sau đại học
  | 'vocational'   // Nghề & Kỹ năng
  | 'general';     // Mọi cấp học

export interface WebProject {
  id: string;
  title: string;
  url: string;
  description: string;
  country: CountryCode;
  category: CategoryId;
  educationLevel: EducationLevelId;
  status: 'approved' | 'pending' | 'rejected';
  createdAt: string; // ISO string
  previewImage?: string;
  authorName: string;
  authorContact?: string;
  tags: string[];
  views: number;
  likes: number;
  isFamous?: boolean; // Website mô phỏng nổi tiếng (PhET, GeoGebra, NetSim...)
}

export const LANGUAGE_CODES = [
  'vi',
  'en',
  'th',
  'my',
  'lo',
  'km',
  'id',
  'ms',
  'tl',
  'tet',
] as const;

/**
 * Ngôn ngữ được hỗ trợ: Tiếng Anh + ngôn ngữ của 11 nước Đông Nam Á
 * (Việt Nam, Singapore – English, Thái Lan, Myanmar, Lào, Campuchia,
 *  Indonesia, Malaysia, Brunei – Melayu, Philippines, Đông Timor – Tetun)
 */
export type Language = (typeof LANGUAGE_CODES)[number];

export type ViewMode = 'compact' | 'expanded';

export interface SubjectOption {
  id: CategoryId;
  name: string;
}

export const VN_SUBJECTS: SubjectOption[] = [
  { id: 'math', name: 'Toán học 📐' },
  { id: 'physics', name: 'Vật lí ⚡' },
  { id: 'chemistry', name: 'Hóa học 🧪' },
  { id: 'biology', name: 'Sinh học 🧬' },
  { id: 'informatics', name: 'Tin học 💻' },
  { id: 'literature', name: 'Ngữ văn 📖' },
  { id: 'english', name: 'Tiếng Anh 🇬🇧' },
  { id: 'history', name: 'Lịch sử 🏛️' },
  { id: 'geography', name: 'Địa lí 🌍' },
  { id: 'natural_sciences', name: 'Khoa học tự nhiên (KHTN) 🔬' },
  { id: 'stem', name: 'STEM & Thí nghiệm ảo 🚀' },
  { id: 'general', name: 'Môn học khác 🎨' },
];

export interface FilterState {
  searchQuery: string;
  category: CategoryId | 'ALL';
  educationLevel: EducationLevelId | 'ALL';
  sortBy: 'newest' | 'oldest' | 'most_liked' | 'most_viewed';
  onlyFamous: boolean;
}

