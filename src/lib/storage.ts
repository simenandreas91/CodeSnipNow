import { supabase, hasValidSupabaseCredentials } from './supabase';

const SNIPPET_IMAGES_BUCKET = 'snippet-pictures';

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
        return this.uploadImageFallback(file, userId);
      }

      const { data: publicUrlData, error: urlError } = supabase.storage
        .from(SNIPPET_IMAGES_BUCKET)
        .getPublicUrl(filePath);

      if (urlError || !publicUrlData?.publicUrl) {
        console.error('Error getting public URL for image:', urlError);
        return this.uploadImageFallback(file, userId);
      }

      return {
        url: publicUrlData.publicUrl,
        path: filePath
      };
    } catch (error) {
      console.error('Error processing image:', error);
      return this.uploadImageFallback(file, userId);
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
    if (!hasValidSupabaseCredentials || !supabase || path.startsWith('local/')) {
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

    if (!hasValidSupabaseCredentials || !supabase) {
      return path;
    }

    const { data } = supabase.storage
      .from(SNIPPET_IMAGES_BUCKET)
      .getPublicUrl(path);

    return data?.publicUrl || path;
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
}
