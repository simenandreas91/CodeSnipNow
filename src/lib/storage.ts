import { supabase, hasValidSupabaseCredentials } from './supabase';

const bucketFromEnv = (import.meta.env.VITE_SUPABASE_SNIPPET_IMAGES_BUCKET || '').trim();
const SNIPPET_IMAGES_BUCKET = bucketFromEnv || 'snippet-pictures';
const CUSTOM_PUBLIC_BASE = (import.meta.env.VITE_SUPABASE_STORAGE_PUBLIC_URL || '').replace(/\/$/, '');
const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');

const encodePath = (input: string) =>
  input
    .split('/')
    .map(segment => encodeURIComponent(segment))
    .join('/');

// Storage helper with Supabase backend and local fallback
export class StorageService {
  /**
   * Convert file to base64 data URL for immediate use
   */
  static async uploadImage(file: File, userId: string): Promise<{ url: string; path: string } | null> {
    if (!hasValidSupabaseCredentials || !supabase) {
      return this.uploadImageFallback(file, userId);
    }

    try {
      const extension = file.name.split('.').pop() || 'png';
      const baseName = file.name.replace(/\.[^/.]+$/, '');
      const sanitizedName = baseName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      const filePath = `${userId}/${Date.now()}-${sanitizedName || 'snippet'}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from(SNIPPET_IMAGES_BUCKET)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type
        });

      if (uploadError) {
        console.error('Error uploading image to Supabase:', uploadError);
        const message =
          uploadError.message ||
          uploadError.name ||
          'Supabase image upload failedd';
        throw new Error(message);
      }

      const publicUrl = this.buildPublicUrl(filePath);

      return {
        url: publicUrl,
        path: filePath
      };
    } catch (error: any) {
      console.error('Error processing image:', error);
      if (error?.message) {
        throw new Error(error.message);
      }
      throw new Error('Failed to upload image');
    }
  }

  private static async uploadImageFallback(file: File, userId: string) {
    try {
      const dataUrl = await this.fileToDataUrl(file);
      return {
        url: dataUrl,
        path: `local/${userId}/${file.name}`
      };
    } catch (error) {
      console.error('Error processing image in fallback:', error);
      return null;
    }
  }

  /**
   * Convert file to data URL
   */
  private static fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Delete an image (no-op for data URLs)
   */
  static async deleteImage(path: string): Promise<boolean> {
    if (!path || path.startsWith('local/') || path.startsWith('data:')) {
      return true;
    }

    if (!hasValidSupabaseCredentials || !supabase) {
      return true;
    }

    const { error } = await supabase.storage
      .from(SNIPPET_IMAGES_BUCKET)
      .remove([path]);

    if (error) {
      console.error('Error deleting image from Supabase:', error);
      return false;
    }

    return true;
  }

  /**
   * Get public URL for an image (return as-is for data URLs)
   */
  static getImageUrl(path: string): string {
    if (!path || path.startsWith('http') || path.startsWith('data:') || path.startsWith('local/')) {
      return path;
    }

    return this.buildPublicUrl(path);
  }

  /**
   * Process markdown content (no changes needed)
   */
  static processMarkdownImages(markdown: string, imagePaths: Record<string, string>): string {
    return markdown.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, src) => {
      const supabaseUrl = imagePaths[src];
      if (supabaseUrl) {
        return `![${alt}](${supabaseUrl})`;
      }
      return match;
    });
  }

  /**
   * Extract image references from markdown content
   */
  static extractImageReferences(markdown: string): string[] {
    const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
    const images: string[] = [];
    let match;

    while ((match = imageRegex.exec(markdown)) !== null) {
      images.push(match[2]);
    }

    return images;
  }

  private static buildPublicUrl(path: string): string {
    const encodedBucket = encodeURIComponent(SNIPPET_IMAGES_BUCKET);
    const encodedPath = encodePath(path);

    if (CUSTOM_PUBLIC_BASE) {
      return `${CUSTOM_PUBLIC_BASE}/${encodedBucket}/${encodedPath}`;
    }

    if (hasValidSupabaseCredentials && supabase) {
      const { data } = supabase.storage.from(SNIPPET_IMAGES_BUCKET).getPublicUrl(path);
      if (data?.publicUrl) {
        return data.publicUrl;
      }
    }

    if (SUPABASE_URL) {
      return `${SUPABASE_URL}/storage/v1/object/public/${encodedBucket}/${encodedPath}`;
    }

    return path;
  }
}
