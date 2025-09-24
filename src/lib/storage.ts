// Simple file handling without Supabase Storage
export class StorageService {
  /**
   * Convert file to base64 data URL for immediate use
   */
  static async uploadImage(file: File, userId: string): Promise<{ url: string; path: string } | null> {
    try {
      // Convert file to base64 data URL
      const dataUrl = await this.fileToDataUrl(file);
      
      return {
        url: dataUrl,
        path: `local/${userId}/${file.name}`
      };
    } catch (error) {
      console.error('Error processing image:', error);
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
    // Data URLs don't need deletion
    return true;
  }

  /**
   * Get public URL for an image (return as-is for data URLs)
   */
  static getImageUrl(path: string): string {
    return path;
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