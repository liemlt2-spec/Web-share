import { Language, LocalizedProjectContent, WebProject } from '../types';
import { LOCALIZED_EN } from './projectLocales/en';
import { LOCALIZED_TH } from './projectLocales/th';
import { LOCALIZED_MY } from './projectLocales/my';
import { LOCALIZED_LO } from './projectLocales/lo';
import { LOCALIZED_KM } from './projectLocales/km';
import { LOCALIZED_ID } from './projectLocales/id';
import { LOCALIZED_MS } from './projectLocales/ms';
import { LOCALIZED_TL } from './projectLocales/tl';
import { LOCALIZED_TET } from './projectLocales/tet';

const LOCALES: Record<Exclude<Language, 'vi'>, LocalizedProjectContent[]> = {
  en: LOCALIZED_EN,
  th: LOCALIZED_TH,
  my: LOCALIZED_MY,
  lo: LOCALIZED_LO,
  km: LOCALIZED_KM,
  id: LOCALIZED_ID,
  ms: LOCALIZED_MS,
  tl: LOCALIZED_TL,
  tet: LOCALIZED_TET,
};

const INDEX: Record<string, Record<string, LocalizedProjectContent>> = {};
for (const lang of Object.keys(LOCALES) as Exclude<Language, 'vi'>[]) {
  const byId: Record<string, LocalizedProjectContent> = {};
  for (const item of LOCALES[lang]) byId[item.id] = item;
  INDEX[lang] = byId;
}

/**
 * Trả về dữ liệu nội dung (tiêu đề, mô tả, tác giả, thẻ từ khóa) đã được
 * bản địa hóa theo ngôn ngữ đang chọn. Với tiếng Việt hoặc các bài không có
 * bản dịch, trả về dữ liệu gốc (không đổi reference).
 */
export function localizeProject(project: WebProject, lang: Language): WebProject {
  if (lang === 'vi') return project;
  const content = INDEX[lang]?.[project.id];
  if (!content) return project;
  return {
    ...project,
    title: content.title,
    description: content.description,
    authorName: content.authorName,
    tags: content.tags,
  };
}