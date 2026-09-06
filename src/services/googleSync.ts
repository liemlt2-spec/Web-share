import { WebProject } from '../types';

export const STORAGE_KEY_APPSCRIPT_URL = 'webhub_google_appscript_url';
export const STORAGE_KEY_LAST_SYNC = 'webhub_google_last_sync';
export const STORAGE_KEY_AUTO_SYNC = 'webhub_google_auto_sync';

/**
 * Mặc định Web App URL của Google Apps Script "WebHub Sync API" 
 * (liên kết với Google Sheets: 14pkkqUKFDAcxfyVKPzU0_NlXKdE-KsCjlVQys5rk5zk).
 * LƯU Ý: URL đuôi /exec là bản production cho toàn bộ người dùng website.
 * Đuôi /dev chỉ dùng để TEST (chỉ người có quyền sửa script truy cập được).
 */
export const DEFAULT_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbw7QvnRI3e2l_0B7Nl4KDeLEOT3CWo-P_CcjWGD5XIoT7XVBhsiWG3OKEVrOcihLyUm/exec';

export interface SyncResult {
  success: boolean;
  message: string;
  count?: number;
  data?: WebProject[];
}

/**
 * Get stored Google Apps Script Web App URL
 */
export function getStoredScriptUrl(): string {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_APPSCRIPT_URL);
    // Lần đầu truy cập (chưa lưu cấu hình nào): tự động kết nối sẵn với WebHub API
    if (stored === null) {
      return DEFAULT_SCRIPT_URL;
    }
    return stored;
  } catch {
    return DEFAULT_SCRIPT_URL;
  }
}

/**
 * Save Google Apps Script Web App URL
 */
export function setStoredScriptUrl(url: string): void {
  try {
    localStorage.setItem(STORAGE_KEY_APPSCRIPT_URL, url.trim());
  } catch (e) {
    console.error('Error saving Google Script URL', e);
  }
}

/**
 * Get last sync timestamp
 */
export function getLastSyncTime(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY_LAST_SYNC);
  } catch {
    return null;
  }
}

/**
 * Set last sync timestamp
 */
export function setLastSyncTime(): void {
  try {
    localStorage.setItem(STORAGE_KEY_LAST_SYNC, new Date().toISOString());
  } catch {
    // Ignore
  }
}

/**
 * Check if auto-sync is enabled
 */
export function isAutoSyncEnabled(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY_AUTO_SYNC) !== 'false';
  } catch {
    return true;
  }
}

/**
 * Set auto-sync toggle
 */
export function setAutoSyncEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY_AUTO_SYNC, enabled ? 'true' : 'false');
  } catch {
    // Ignore
  }
}

/**
 * Clean & normalize script URL
 */
export function cleanScriptUrl(rawUrl: string): string {
  let url = rawUrl.trim();
  // Nếu người dùng dán thẳng link Google Sheets (https://docs.google.com/spreadsheets/...)
  // thì tự động trỏ về Web App URL "WebHub Sync API" đã cấu hình để đồng bộ qua Sheets đó.
  if (url.includes('docs.google.com/spreadsheets') && DEFAULT_SCRIPT_URL) {
    return DEFAULT_SCRIPT_URL;
  }
  return url;
}

/**
 * Fetch projects from Google Apps Script Web App
 */
export async function fetchProjectsFromSheet(scriptUrl: string): Promise<SyncResult> {
  const url = cleanScriptUrl(scriptUrl);
  if (!url) {
    return { success: false, message: 'Chưa cấu hình đường dẫn Google Apps Script.' };
  }

  // If user passed a spreadsheet URL directly rather than web app
  if (url.includes('docs.google.com/spreadsheets')) {
    return {
      success: false,
      message: 'Đây là đường dẫn Google Sheets trực tiếp. Để kết nối 2 chiều an toàn, bạn cần tạo Web App thông qua Google Apps Script (Xem hướng dẫn bên dưới).',
    };
  }

  try {
    const fetchUrl = url.includes('?') ? `${url}&action=getProjects` : `${url}?action=getProjects`;
    const response = await fetch(fetchUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP Error ${response.status}`);
    }

    const result = await response.json();
    const rawList: any[] = result && Array.isArray(result.data) 
      ? result.data 
      : (Array.isArray(result) ? result : []);

    if (rawList.length > 0) {
      const normalizedProjects: WebProject[] = rawList.map((item: any, idx: number) => {
        const isFamous = Boolean(
          item.isFamous === true ||
          String(item.isFamous).toUpperCase() === 'TRUE' ||
          String(item.isFamous).toUpperCase() === 'YES' ||
          item.isFamous === 1 ||
          String(item.isFamous) === '1' ||
          String(item.id || '').startsWith('phet-') ||
          String(item.id || '').startsWith('geogebra-') ||
          String(item.id || '').startsWith('famous-')
        );

        return {
          id: String(item.id || `proj-gs-${idx}-${Date.now()}`),
          title: String(item.title || 'Mô phỏng không tên'),
          url: String(item.url || ''),
          description: String(item.description || ''),
          country: (item.country || 'VN') as any,
          category: (item.category || 'general') as any,
          educationLevel: (item.educationLevel || 'all') as any,
          status: (item.status === 'pending' || item.status === 'rejected') ? item.status : 'approved',
          createdAt: item.createdAt || new Date().toISOString(),
          previewImage: item.previewImage || undefined,
          authorName: String(item.authorName || (isFamous ? 'Nền tảng quốc tế' : 'Thành viên')),
          authorContact: item.authorContact ? String(item.authorContact) : undefined,
          tags: Array.isArray(item.tags)
            ? item.tags
            : (item.tags ? String(item.tags).split(',').map((t: string) => t.trim()) : []),
          views: Number(item.views) || 0,
          likes: Number(item.likes) || 0,
          isFamous: isFamous,
        };
      });

      setLastSyncTime();
      return {
        success: true,
        message: `Đã đồng bộ thành công ${normalizedProjects.length} mô phỏng từ Google Sheets!`,
        count: normalizedProjects.length,
        data: normalizedProjects,
      };
    }

    if (result && result.status === 'success') {
      return {
        success: true,
        message: 'Google Sheets hiện chưa có dòng dữ liệu nào. Bạn có thể bấm "Đẩy dữ liệu lên Sheets" để khởi tạo!',
        count: 0,
        data: [],
      };
    }

    return {
      success: false,
      message: result.message || 'Không thể trích xuất danh sách dữ liệu từ Google Sheets.',
    };
  } catch (err: any) {
    console.error('Fetch Google Sheet Error:', err);
    return {
      success: false,
      message: `Không thể kết nối đến Google Apps Script (${err.message || 'Lỗi mạng hoặc CORS'}). Hãy kiểm tra quyền "Bất kỳ ai (Anyone)" khi triển khai Web App.`,
    };
  }
}

/**
 * Push all projects to Google Apps Script
 */
export async function pushProjectsToSheet(scriptUrl: string, projects: WebProject[]): Promise<SyncResult> {
  const url = cleanScriptUrl(scriptUrl);
  if (!url) {
    return { success: false, message: 'Chưa cấu hình đường dẫn Google Apps Script.' };
  }

  if (url.includes('docs.google.com/spreadsheets')) {
    return {
      success: false,
      message: 'Vui lòng sử dụng Web App URL từ Google Apps Script để đồng bộ.',
    };
  }

  try {
    const payload = JSON.stringify({
      action: 'syncAll',
      projects: projects,
      timestamp: new Date().toISOString(),
    });

    // Send as text/plain to avoid CORS preflight issues with Google Apps Script
    await fetch(url, {
      method: 'POST',
      mode: 'no-cors', // standard for Apps Script webhook
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: payload,
    });

    setLastSyncTime();
    return {
      success: true,
      message: `Đã gửi toàn bộ ${projects.length} website lên Google Sheets thành công!`,
      count: projects.length,
    };
  } catch (err: any) {
    console.error('Push to Google Sheet Error:', err);
    return {
      success: false,
      message: `Không thể gửi dữ liệu lên Google Sheets: ${err.message}`,
    };
  }
}

/**
 * Push a single new project submission to Google Apps Script
 */
export async function pushSingleProjectToSheet(scriptUrl: string, project: WebProject): Promise<void> {
  const url = cleanScriptUrl(scriptUrl);
  if (!url || url.includes('docs.google.com/spreadsheets')) return;

  try {
    await fetch(url, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({
        action: 'addProject',
        project: project,
      }),
    });
  } catch (e) {
    console.warn('Silent fail pushing single project to Google Sheet', e);
  }
}

/**
 * Upsert (thêm mới hoặc cập nhật) toàn bộ thông tin của 1 mô phỏng vào một hàng của Google Sheets,
 * gồm title, url, mô tả, ảnh đại diện, tags, views, likes... Dùng khi admin duyệt/từ chối
 * để mọi thiết bị truy cập khác khi tải dữ liệu từ Sheets sẽ có ngay thông tin đầy đủ.
 */
export async function upsertProjectToSheet(scriptUrl: string, project: WebProject): Promise<void> {
  const url = cleanScriptUrl(scriptUrl);
  if (!url || url.includes('docs.google.com/spreadsheets')) return;

  try {
    await fetch(url, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({
        action: 'upsertProject',
        project: project,
      }),
    });
  } catch (e) {
    console.warn('Silent fail upserting project to Google Sheet', e);
  }
}

/**
 * Update project status in Google Apps Script
 */
export async function updateProjectStatusInSheet(
  scriptUrl: string,
  projectId: string,
  newStatus: 'approved' | 'rejected'
): Promise<void> {
  const url = cleanScriptUrl(scriptUrl);
  if (!url || url.includes('docs.google.com/spreadsheets')) return;

  try {
    await fetch(url, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({
        action: 'updateStatus',
        projectId,
        status: newStatus,
      }),
    });
  } catch (e) {
    console.warn('Silent fail updating project status to Google Sheet', e);
  }
}

/**
 * Fetch pending/new submissions from the dedicated submissions tab (WebHub_Submissions)
 */
export async function fetchSubmissionsFromSheet(scriptUrl: string): Promise<SyncResult> {
  const url = cleanScriptUrl(scriptUrl);
  if (!url || url.includes('docs.google.com/spreadsheets')) {
    return { success: false, message: 'Đây là đường dẫn Google Sheets trực tiếp. Vui lòng dùng Web App URL.' };
  }

  try {
    const fetchUrl = url.includes('?') ? `${url}&action=getSubmissions` : `${url}?action=getSubmissions`;
    const response = await fetch(fetchUrl, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });
    if (!response.ok) throw new Error(`HTTP Error ${response.status}`);

    const result = await response.json();
    const rawList: any[] = result && Array.isArray(result.data) ? result.data : [];
    const projects: WebProject[] = rawList.map((item: any, idx: number) => ({
      id: String(item.id || `sub-gs-${idx}-${Date.now()}`),
      title: String(item.title || 'Mô phỏng không tên'),
      url: String(item.url || ''),
      description: String(item.description || ''),
      country: (item.country || 'VN') as any,
      category: (item.category || 'general') as any,
      educationLevel: (item.educationLevel || 'all') as any,
      status: (item.status === 'pending' || item.status === 'rejected') ? item.status : 'pending',
      createdAt: item.createdAt || new Date().toISOString(),
      previewImage: item.previewImage || undefined,
      authorName: String(item.authorName || 'Thành viên'),
      authorContact: item.authorContact ? String(item.authorContact) : undefined,
      tags: Array.isArray(item.tags)
        ? item.tags
        : (item.tags ? String(item.tags).split(',').map((t: string) => t.trim()) : []),
      views: Number(item.views) || 0,
      likes: Number(item.likes) || 0,
      isFamous: Boolean(item.isFamous),
    }));

    return { success: true, message: `Đã tải ${projects.length} dự án mới từ Google Sheets`, count: projects.length, data: projects };
  } catch (err: any) {
    console.error('Fetch Submissions Error:', err);
    return { success: false, message: `Không thể tải dự án mới: ${err.message || 'Lỗi mạng hoặc CORS'}` };
  }
}

/**
 * Delete submission(s) from the dedicated submissions tab (admin add/delete management)
 */
export async function deleteSubmissionsFromSheet(scriptUrl: string, projectIds: string[]): Promise<void> {
  const url = cleanScriptUrl(scriptUrl);
  if (!url || url.includes('docs.google.com/spreadsheets') || projectIds.length === 0) return;

  try {
    await fetch(url, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'deleteProject', ids: projectIds }),
    });
  } catch (e) {
    console.warn('Silent fail deleting submissions from Google Sheet', e);
  }
}

/**
 * Complete Google Apps Script template code that the user can copy and paste into Google Sheets
 */
export const GOOGLE_APPS_SCRIPT_CODE = `/**
 * Google Apps Script - WebHub Showcase Cloud Backend
 * WebHub bây giờ quản lý 2 TAB trên Google Sheets:
 *   1. WEBHUB_PROJECTS      -> Các mô phỏng ĐÃ DUYỆT (nổi tiếng + bài cộng đồng) đang hiển thị.
 *   2. WEBHUB_SUBMISSIONS   -> Các DỰ ÁN MỚI do người dùng đăng tải (chờ duyệt / từ chối)
 *                              để admin quản lý NHẬP - XÓA ngay trên bảng tính.
 * 
 * HƯỚNG DẪN CÀI ĐẶT 4 BƯỚC:
 * 1. Mở file Google Sheets mới trên Google Drive (đặt tên ví dụ: WebHub_Database).
 * 2. Chọn menu: Tiện ích mở rộng (Extensions) -> Apps Script.
 * 3. Xóa hết mã cũ trong file Code.gs, dán toàn bộ đoạn code này vào và bấm "Lưu" (Ctrl+S).
 * 4. Bấm nút "Triển khai" (Deploy) -> "Tùy chọn triển khai mới" (New deployment).
 *    - Chọn loại: "Ứng dụng web" (Web App)
 *    - Mô tả: WebHub Sync API
 *    - Thực thi dưới dạng: "Tôi" (Me)
 *    - Người có quyền truy cập: "Bất kỳ ai" (Anyone) -> RẤT QUAN TRỌNG ĐỂ TRUY XUẤT ĐƯỢC!
 * 5. Bấm "Triển khai" (Deploy), cấp quyền và sao chép "URL ứng dụng web" (Web App URL)
 *    (có dạng: https://script.google.com/macros/s/.../exec) dán vào ô trên website!
 */

const MAIN_SHEET = "WebHub_Projects";
const SUBMISSION_SHEET = "WebHub_Submissions";

const HEADERS = [
  "ID",
  "Title",
  "URL",
  "Description",
  "Country",
  "Category",
  "EducationLevel",
  "Status",
  "IsFamous",
  "AuthorName",
  "AuthorContact",
  "CreatedAt",
  "PreviewImage",
  "Tags",
  "Views",
  "Likes"
];

function ensureSheet(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(HEADERS);
    const headerRange = sheet.getRange(1, 1, 1, HEADERS.length);
    headerRange.setFontWeight("bold");
    headerRange.setBackground("#4338CA"); // Indigo 700
    headerRange.setFontColor("#FFFFFF");
    sheet.setFrozenRows(1);
    sheet.setColumnWidth(1, 140); // ID
    sheet.setColumnWidth(2, 220); // Title
    sheet.setColumnWidth(3, 260); // URL
    sheet.setColumnWidth(4, 280); // Description
    sheet.setColumnWidth(8, 100); // Status
    sheet.setColumnWidth(9, 100); // IsFamous
  }
  return sheet;
}

// Đọc toàn bộ dữ liệu của 1 tab thành danh sách project (tự nhận diện cột theo tên)
function parseRows(sheet) {
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return { rows: [] };
  const headers = data[0].map(function (h) { return String(h).trim().toLowerCase(); });
  const col = function (name, defaultIdx) {
    const idx = headers.indexOf(name.toLowerCase());
    return idx >= 0 ? idx : defaultIdx;
  };
  const projects = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row[col("id", 0)] && !row[col("title", 1)] && !row[col("url", 2)]) continue;
    const rawFamous = row[col("isfamous", 8)];
    const isFamous = (
      rawFamous === true ||
      String(rawFamous).toUpperCase() === "TRUE" ||
      String(rawFamous).toUpperCase() === "YES" ||
      rawFamous === 1 ||
      String(rawFamous) === "1"
    );
    projects.push({
      id: String(row[col("id", 0)] || ("proj-" + i)),
      title: String(row[col("title", 1)] || ""),
      url: String(row[col("url", 2)] || ""),
      description: String(row[col("description", 3)] || ""),
      country: String(row[col("country", 4)] || "VN"),
      category: String(row[col("category", 5)] || "general"),
      educationLevel: String(row[col("educationlevel", 6)] || "all"),
      status: String(row[col("status", 7)] || "approved"),
      isFamous: isFamous,
      authorName: String(row[col("authorname", 9)] || (isFamous ? "Nền tảng quốc tế" : "Thành viên")),
      authorContact: String(row[col("authorcontact", 10)] || ""),
      createdAt: row[col("createdat", 11)] ? (row[col("createdat", 11)] instanceof Date ? row[col("createdat", 11)].toISOString() : String(row[col("createdat", 11)])) : new Date().toISOString(),
      previewImage: String(row[col("previewimage", 12)] || ""),
      tags: row[col("tags", 13)] ? String(row[col("tags", 13)]).split(",").map(function (t) { return t.trim(); }) : [],
      views: Number(row[col("views", 14)] || 0),
      likes: Number(row[col("likes", 15)] || 0)
    });
  }
  return { rows: projects };
}

// Chuyển project thành 1 hàng 16 cột
function projectToRow(p) {
  return [
    p.id || ("proj-" + new Date().getTime()),
    p.title || "",
    p.url || "",
    p.description || "",
    p.country || "VN",
    p.category || "general",
    p.educationLevel || "all",
    p.status || "approved",
    p.isFamous ? true : false,
    p.authorName || "Thành viên",
    p.authorContact || "",
    p.createdAt || new Date().toISOString(),
    p.previewImage || "",
    Array.isArray(p.tags) ? p.tags.join(", ") : "",
    p.views || 0,
    p.likes || 0
  ];
}

// Thêm mới hoặc ghi đè toàn bộ hàng của 1 project theo ID
function upsertRow(sheet, project) {
  const row = projectToRow(project);
  const data = sheet.getDataRange().getValues();
  let foundRow = -1;
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(project.id)) { foundRow = i; break; }
  }
  if (foundRow >= 0) {
    sheet.getRange(foundRow + 1, 1, 1, row.length).setValues([row]);
  } else {
    sheet.appendRow(row);
  }
}

// Xóa các hàng theo danh sách ID, trả về số dòng đã xóa
function deleteRowsById(sheet, ids) {
  const data = sheet.getDataRange().getValues();
  const removed = [];
  for (let i = data.length - 1; i >= 1; i--) {
    if (ids.indexOf(String(data[i][0])) >= 0) {
      sheet.deleteRow(i + 1);
      removed.push(String(data[i][0]));
    }
  }
  return removed;
}

// Đọc dữ liệu theo GET - hỗ trợ 2 loại:
//   ?action=getProjects    -> dữ liệu ĐÃ DUYỆT trên MAIN_SHEET (mặc định, dùng cho đồng bộ chính)
//   ?action=getSubmissions -> dự án MỚI trên SUBMISSION_SHEET (quản lý bài chờ duyệt)
function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) || "getProjects";
    if (action === "getSubmissions") {
      const result = parseRows(ensureSheet(SUBMISSION_SHEET));
      return createJsonResponse({ status: "success", total: result.rows.length, data: result.rows });
    }
    const result = parseRows(ensureSheet(MAIN_SHEET));
    return createJsonResponse({ status: "success", total: result.rows.length, data: result.rows });
  } catch (error) {
    return createJsonResponse({ status: "error", message: error.toString() });
  }
}

// Xử lý ghi dữ liệu (POST) - quản lý 2 tab:
//   SUBMISSION_SHEET: dự án mới người dùng đăng (chờ duyệt / từ chối) để admin quản lý THÊM - XÓA.
//   MAIN_SHEET:       mô phỏng ĐÃ DUYỆT đang hiển thị trên website.
function doPost(e) {
  try {
    // Đọc body ĐÚNG charset UTF-8 (tránh lỗi tiếng Việt / ký tự SEA bị vỡ chữ trong sheet).
    const postData = e.postData;
    const rawBody = postData
      ? (typeof postData.getDataAsString === "function"
          ? postData.getDataAsString("UTF-8")
          : postData.contents)
      : "{}";
    const payload = JSON.parse(rawBody);

    // 1. Đồng bộ dữ liệu ĐÃ DUYỆT lên MAIN_SHEET (chỉ lấy status approved, khởi tạo hoặc ghi đè)
    if (payload.action === "syncAll" && Array.isArray(payload.projects)) {
      const sheet = ensureSheet(MAIN_SHEET);
      const lastRow = sheet.getLastRow();
      if (lastRow > 1) {
        sheet.deleteRows(2, lastRow - 1);
      }

      const newRows = payload.projects
        .filter(function (p) { return String(p.status || "approved") === "approved"; })
        .map(projectToRow);

      if (newRows.length > 0) {
        sheet.getRange(2, 1, newRows.length, newRows[0].length).setValues(newRows);
      }

      return createJsonResponse({
        status: "success",
        message: "Đã đồng bộ toàn bộ " + newRows.length + " mô phỏng đã duyệt lên tab WebHub_Projects thành công!"
      });
    }

    // 2. Người dùng đăng bài mới -> thêm vào SUBMISSION_SHEET (chờ admin duyệt)
    if (payload.action === "addProject" && payload.project) {
      ensureSheet(SUBMISSION_SHEET).appendRow(projectToRow(payload.project));
      return createJsonResponse({ status: "success", message: "Đã ghi nhận bài đăng mới vào tab WebHub_Submissions" });
    }

    // 3. Upsert TOÀN BỘ thông tin 1 mô phỏng (dùng khi admin duyệt/từ chối).
    //    Luôn ghi vào SUBMISSION_SHEET để admin còn quản lý; nếu bài đã DUYỆT thì đồng bộ thêm vào MAIN_SHEET.
    if (payload.action === "upsertProject" && payload.project) {
      const p = payload.project;
      upsertRow(ensureSheet(SUBMISSION_SHEET), p);
      if (String(p.status) === "approved") {
        upsertRow(ensureSheet(MAIN_SHEET), p);
      }
      return createJsonResponse({ status: "success", message: "Đã đồng bộ thông tin mô phỏng vào Google Sheets" });
    }

    // 4. Cập nhật trạng thái duyệt (approved / rejected). Nếu APPROVED thì sao chép sang MAIN_SHEET.
    if (payload.action === "updateStatus" && payload.projectId && payload.status) {
      const sSheet = ensureSheet(SUBMISSION_SHEET);
      const data = sSheet.getDataRange().getValues();
      for (let i = 1; i < data.length; i++) {
        if (String(data[i][0]) === String(payload.projectId)) {
          sSheet.getRange(i + 1, 8).setValue(payload.status);
          if (payload.status === "approved") {
            const result = parseRows(sSheet);
            for (let j = 0; j < result.rows.length; j++) {
              if (String(result.rows[j].id) === String(payload.projectId)) {
                upsertRow(ensureSheet(MAIN_SHEET), result.rows[j]);
                break;
              }
            }
          }
          return createJsonResponse({ status: "success", message: "Đã cập nhật trạng thái bài viết" });
        }
      }
      return createJsonResponse({ status: "error", message: "Không tìm thấy bài viết trong WebHub_Submissions" });
    }

    // 5. Chuyển đổi cờ Nổi tiếng (isFamous: true/false) trên MAIN_SHEET
    if (payload.action === "toggleFamous" && payload.projectId) {
      const sheet = ensureSheet(MAIN_SHEET);
      const data = sheet.getDataRange().getValues();
      for (let i = 1; i < data.length; i++) {
        if (String(data[i][0]) === String(payload.projectId)) {
          const currentVal = data[i][8];
          const newVal = !(currentVal === true || String(currentVal).toUpperCase() === "TRUE");
          sheet.getRange(i + 1, 9).setValue(newVal);
          return createJsonResponse({ status: "success", message: "Đã cập nhật phân loại nổi tiếng", isFamous: newVal });
        }
      }
      return createJsonResponse({ status: "error", message: "Không tìm thấy bài viết trong WebHub_Projects" });
    }

    // 6. Xóa dự án khỏi SUBMISSION_SHEET (admin quản lý THÊM - XÓA trên bảng tính)
    if (payload.action === "deleteProject") {
      const ids = Array.isArray(payload.ids) ? payload.ids : [payload.projectId];
      const removed = deleteRowsById(ensureSheet(SUBMISSION_SHEET), ids);
      return createJsonResponse({ status: "success", message: "Đã xóa " + removed.length + " dự án khỏi tab WebHub_Submissions", removed: removed.length });
    }

    return createJsonResponse({ status: "ignored", message: "Không có hành động phù hợp" });
  } catch (error) {
    return createJsonResponse({ status: "error", message: error.toString() });
  }
}

function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
`;
