import { supabase } from './supabase';

const BUCKET_NAME = 'tickets';
const AVATAR_BUCKET_NAME = 'avatars';
const TRAVEL_IMAGE_BUCKET_NAME = 'travel-images';

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
 * 프로필 사진을 Supabase Storage에 업로드
 * @param {File} file - 업로드할 파일
 * @param {string} userId - 사용자 ID
 * @returns {Promise<{data: {path: string, publicUrl: string} | null, error: Error | null}>}
 */
export async function uploadAvatar(file, userId) {
  try {
    // 파일 크기 제한 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('파일 크기는 5MB 이하여야 합니다.');
    }

    // 이미지 파일만 허용
    if (!file.type.startsWith('image/')) {
      throw new Error('이미지 파일만 업로드 가능합니다.');
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/avatar-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    // 기존 아바타 삭제 (있으면)
    const { data: existingFiles } = await supabase.storage
      .from(AVATAR_BUCKET_NAME)
      .list(`${userId}/`, {
        search: 'avatar-',
      });

    if (existingFiles && existingFiles.length > 0) {
      const filesToDelete = existingFiles.map((f) => `${userId}/${f.name}`);
      await supabase.storage.from(AVATAR_BUCKET_NAME).remove(filesToDelete);
    }

    // 파일 업로드
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(AVATAR_BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) throw uploadError;

    // 공개 URL 가져오기
    const { data: urlData } = supabase.storage
      .from(AVATAR_BUCKET_NAME)
      .getPublicUrl(filePath);

    return {
      data: {
        path: filePath,
        publicUrl: urlData.publicUrl,
      },
      error: null,
    };
  } catch (error) {
    console.error('아바타 업로드 실패:', error);
    return {
      data: null,
      error,
    };
  }
}

/**
 * 프로필 사진 삭제
 * @param {string} userId - 사용자 ID
 * @returns {Promise<{error: Error | null}>}
 */
export async function deleteAvatar(userId) {
  try {
    const { data: files, error: listError } = await supabase.storage
      .from(AVATAR_BUCKET_NAME)
      .list(`${userId}/`, {
        search: 'avatar-',
      });

    if (listError) {
      console.warn('아바타 파일 목록 조회 실패:', listError);
      // 파일이 없을 수도 있으므로 에러를 던지지 않음
    }

    if (files && files.length > 0) {
      const filesToDelete = files.map((f) => `${userId}/${f.name}`);
      const { error } = await supabase.storage
        .from(AVATAR_BUCKET_NAME)
        .remove(filesToDelete);

      if (error) throw error;
    }

    return { error: null };
  } catch (error) {
    console.error('아바타 삭제 실패:', error);
    return { error };
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

/**
 * 여행 대표 이미지를 Supabase Storage에 업로드
 * @param {File} file - 업로드할 파일
 * @param {string} userId - 사용자 ID
 * @param {string} travelId - 여행 ID (선택사항, 없으면 임시 ID 사용)
 * @returns {Promise<{data: {path: string, publicUrl: string} | null, error: Error | null}>}
 */
export async function uploadTravelImage(file, userId, travelId = null) {
  try {
    // 파일 크기 제한 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      throw new Error('파일 크기는 10MB 이하여야 합니다.');
    }

    // 이미지 파일만 허용
    if (!file.type.startsWith('image/')) {
      throw new Error('이미지 파일만 업로드 가능합니다.');
    }

    const fileExt = file.name.split('.').pop();
    const tempId = travelId || `temp-${Date.now()}`;
    const fileName = `${userId}/${tempId}-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    // 파일 업로드
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(TRAVEL_IMAGE_BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) throw uploadError;

    // 공개 URL 가져오기
    const { data: urlData } = supabase.storage
      .from(TRAVEL_IMAGE_BUCKET_NAME)
      .getPublicUrl(filePath);

    return {
      data: {
        path: filePath,
        publicUrl: urlData.publicUrl,
      },
      error: null,
    };
  } catch (error) {
    console.error('여행 이미지 업로드 실패:', error);
    return {
      data: null,
      error,
    };
  }
}

