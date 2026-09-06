import { WebProject } from '../types';

export const STORAGE_KEY_APPSCRIPT_URL = 'webhub_google_appscript_url';
export const STORAGE_KEY_LAST_SYNC = 'webhub_google_last_sync';
export const STORAGE_KEY_AUTO_SYNC = 'webhub_google_auto_sync';

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
    return localStorage.getItem(STORAGE_KEY_APPSCRIPT_URL) || '';
  } catch {
    return '';
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
  // If user pasted a Google Sheets edit URL directly:
  // e.g., https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
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
 * Complete Google Apps Script template code that the user can copy and paste into Google Sheets
 */
export const GOOGLE_APPS_SCRIPT_CODE = `/**
 * Google Apps Script - WebHub Showcase Cloud Backend
 * Tự động đồng bộ website đã duyệt, chờ duyệt, bài đăng tải và trang nổi tiếng lên Google Sheets
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

const SHEET_NAME = "WebHub_Projects";

function getOrCreateSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    // Tạo hàng tiêu đề chuẩn 16 cột
    const headers = [
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
    sheet.appendRow(headers);
    
    // Định dạng tiêu đề đẹp mắt
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setFontWeight("bold");
    headerRange.setBackground("#4338CA"); // Indigo 700
    headerRange.setFontColor("#FFFFFF");
    sheet.setFrozenRows(1);
    
    // Tự động căn chỉnh độ rộng cột
    sheet.setColumnWidth(1, 140); // ID
    sheet.setColumnWidth(2, 220); // Title
    sheet.setColumnWidth(3, 260); // URL
    sheet.setColumnWidth(4, 280); // Description
    sheet.setColumnWidth(8, 100); // Status
    sheet.setColumnWidth(9, 100); // IsFamous
  }
  return sheet;
}

// Xử lý đọc dữ liệu (GET) - Tối ưu truy xuất nhanh và thông minh theo tên cột
function doGet(e) {
  try {
    const sheet = getOrCreateSheet();
    const data = sheet.getDataRange().getValues();
    
    if (data.length <= 1) {
      return createJsonResponse({ status: "success", total: 0, data: [] });
    }
    
    const headers = data[0].map(function(h) {
      return String(h).trim().toLowerCase();
    });
    
    // Hàm tìm vị trí cột theo tên hoặc theo vị trí mặc định
    function col(name, defaultIdx) {
      const idx = headers.indexOf(name.toLowerCase());
      return idx >= 0 ? idx : defaultIdx;
    }
    
    const colId = col("id", 0);
    const colTitle = col("title", 1);
    const colUrl = col("url", 2);
    const colDesc = col("description", 3);
    const colCountry = col("country", 4);
    const colCategory = col("category", 5);
    const colLevel = col("educationlevel", 6);
    const colStatus = col("status", 7);
    const colFamous = col("isfamous", 8);
    const colAuthor = col("authorname", 9);
    const colContact = col("authorcontact", 10);
    const colCreated = col("createdat", 11);
    const colImage = col("previewimage", 12);
    const colTags = col("tags", 13);
    const colViews = col("views", 14);
    const colLikes = col("likes", 15);
    
    const projects = [];
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row[colId] && !row[colTitle] && !row[colUrl]) continue; // Bỏ qua dòng trống
      
      const rawFamous = row[colFamous];
      const isFamous = (
        rawFamous === true || 
        String(rawFamous).toUpperCase() === "TRUE" || 
        String(rawFamous).toUpperCase() === "YES" || 
        rawFamous === 1 || 
        String(rawFamous) === "1"
      );
      
      const project = {
        id: String(row[colId] || ("proj-" + i)),
        title: String(row[colTitle] || ""),
        url: String(row[colUrl] || ""),
        description: String(row[colDesc] || ""),
        country: String(row[colCountry] || "VN"),
        category: String(row[colCategory] || "general"),
        educationLevel: String(row[colLevel] || "all"),
        status: String(row[colStatus] || "approved"),
        isFamous: isFamous,
        authorName: String(row[colAuthor] || (isFamous ? "Nền tảng quốc tế" : "Thành viên")),
        authorContact: String(row[colContact] || ""),
        createdAt: row[colCreated] ? (row[colCreated] instanceof Date ? row[colCreated].toISOString() : String(row[colCreated])) : new Date().toISOString(),
        previewImage: String(row[colImage] || ""),
        tags: row[colTags] ? String(row[colTags]).split(",").map(function(t) { return t.trim(); }) : [],
        views: Number(row[colViews] || 0),
        likes: Number(row[colLikes] || 0)
      };
      projects.push(project);
    }
    
    return createJsonResponse({
      status: "success",
      total: projects.length,
      data: projects
    });
  } catch (error) {
    return createJsonResponse({ status: "error", message: error.toString() });
  }
}

// Xử lý thêm mới, đồng bộ hoặc cập nhật (POST)
function doPost(e) {
  try {
    const sheet = getOrCreateSheet();
    const contents = e.postData ? e.postData.contents : "{}";
    const payload = JSON.parse(contents);
    
    // 1. Đồng bộ toàn bộ dữ liệu từ website lên Google Sheets (khởi tạo hoặc ghi đè)
    if (payload.action === "syncAll" && Array.isArray(payload.projects)) {
      const lastRow = sheet.getLastRow();
      if (lastRow > 1) {
        sheet.deleteRows(2, lastRow - 1);
      }
      
      const newRows = payload.projects.map(function(p) {
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
          p.authorName || "",
          p.authorContact || "",
          p.createdAt || new Date().toISOString(),
          p.previewImage || "",
          Array.isArray(p.tags) ? p.tags.join(", ") : "",
          p.views || 0,
          p.likes || 0
        ];
      });
      
      if (newRows.length > 0) {
        sheet.getRange(2, 1, newRows.length, newRows[0].length).setValues(newRows);
      }
      
      return createJsonResponse({ 
        status: "success", 
        message: "Đã đồng bộ toàn bộ " + newRows.length + " mô phỏng lên Google Sheets thành công!" 
      });
    }
    
    // 2. Tự động thêm 1 bài mới khi người dùng đăng tải từ website
    if (payload.action === "addProject" && payload.project) {
      const p = payload.project;
      sheet.appendRow([
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
      ]);
      return createJsonResponse({ status: "success", message: "Đã ghi nhận bài đăng mới vào Google Sheets" });
    }
    
    // 3. Cập nhật trạng thái duyệt (approved / rejected)
    if (payload.action === "updateStatus" && payload.projectId && payload.status) {
      const data = sheet.getDataRange().getValues();
      for (let i = 1; i < data.length; i++) {
        if (String(data[i][0]) === String(payload.projectId)) {
          sheet.getRange(i + 1, 8).setValue(payload.status);
          return createJsonResponse({ status: "success", message: "Đã cập nhật trạng thái bài viết" });
        }
      }
    }
    
    // 4. Chuyển đổi cờ Nổi tiếng (isFamous: true/false)
    if (payload.action === "toggleFamous" && payload.projectId) {
      const data = sheet.getDataRange().getValues();
      for (let i = 1; i < data.length; i++) {
        if (String(data[i][0]) === String(payload.projectId)) {
          const currentVal = data[i][8];
          const newVal = !(currentVal === true || String(currentVal).toUpperCase() === "TRUE");
          sheet.getRange(i + 1, 9).setValue(newVal);
          return createJsonResponse({ status: "success", message: "Đã cập nhật phân loại nổi tiếng", isFamous: newVal });
        }
      }
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
