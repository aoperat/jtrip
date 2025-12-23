import { supabase } from './supabase';

const BUCKET_NAME = 'tickets';

/**
 * 티켓 이미지를 Supabase Storage에 업로드
 * @param {File} file - 업로드할 파일
 * @param {string} userId - 사용자 ID
 * @param {string} ticketTypeId - 티켓 타입 ID
 * @returns {Promise<{data: {path: string, publicUrl: string} | null, error: Error | null}>}
 */
export async function uploadTicketImage(file, userId, ticketTypeId) {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${ticketTypeId}-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    // 파일 업로드
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) throw uploadError;

    // 공개 URL 가져오기
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    return {
      data: {
        path: filePath,
        publicUrl: urlData.publicUrl,
      },
      error: null,
    };
  } catch (error) {
    console.error('이미지 업로드 실패:', error);
    return {
      data: null,
      error,
    };
  }
}

/**
 * 티켓 이미지 삭제
 * @param {string} filePath - 삭제할 파일 경로
 * @returns {Promise<{error: Error | null}>}
 */
export async function deleteTicketImage(filePath) {
  try {
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('이미지 삭제 실패:', error);
    return { error };
  }
}

/**
 * 카메라에서 이미지 캡처
 * @returns {Promise<File | null>}
 */
export async function captureImageFromCamera() {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment'; // 후면 카메라 사용

    input.onchange = (e) => {
      const file = e.target.files?.[0];
      resolve(file || null);
    };

    input.click();
  });
}

/**
 * 앨범에서 이미지 선택
 * @returns {Promise<File | null>}
 */
export async function selectImageFromAlbum() {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';

    input.onchange = (e) => {
      const file = e.target.files?.[0];
      resolve(file || null);
    };

    input.click();
  });
}

