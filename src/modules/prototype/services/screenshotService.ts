import { supabase } from '../../../lib/supabase/client';
import {
  isImageFileName,
  validatePrototypeUploadFile,
  type PrototypeScreenshot,
  type ScreenshotCategory,
  type ScreenshotDescription,
} from '../types/prototype.types';

const SCREENSHOT_MAX_BYTES = 10 * 1024 * 1024;

function mapRow(row: Record<string, unknown>): PrototypeScreenshot {
  return {
    id: String(row.id),
    prototypeId: String(row.prototype_id),
    userId: String(row.user_id),
    title: String(row.title),
    url: String(row.url),
    category: (row.category as ScreenshotCategory) ?? 'ui',
    context: row.context ? String(row.context) : null,
    purpose: row.purpose ? String(row.purpose) : null,
    uxDescription: row.ux_description ? String(row.ux_description) : null,
    functionality: row.functionality ? String(row.functionality) : null,
    userValue: row.user_value ? String(row.user_value) : null,
    isHero: Boolean(row.is_hero),
    sortOrder: Number(row.sort_order ?? 0),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function isMissingTable(error: unknown): boolean {
  const code = String((error as { code?: string })?.code ?? '');
  return code === '42P01' || code === 'PGRST205';
}

async function uploadImage(userId: string, prototypeId: string, file: File): Promise<string> {
  if (!isImageFileName(file.name)) {
    throw new Error('Only image files are supported (PNG, JPG, GIF, WebP)');
  }
  validatePrototypeUploadFile(file, SCREENSHOT_MAX_BYTES);

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `${userId}/${prototypeId}/screenshots/${Date.now()}-${safeName}`;
  const { error } = await supabase.storage.from('prototypes').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from('prototypes').getPublicUrl(path);
  return data.publicUrl;
}

export const screenshotService = {
  async list(prototypeId: string): Promise<PrototypeScreenshot[]> {
    const { data, error } = await supabase
      .from('prototype_screenshots')
      .select('*')
      .eq('prototype_id', prototypeId)
      .order('is_hero', { ascending: false })
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      if (isMissingTable(error)) return [];
      throw error;
    }

    return ((data ?? []) as Record<string, unknown>[]).map(mapRow);
  },

  async upload(
    prototypeId: string,
    userId: string,
    file: File,
    meta: {
      title: string;
      category?: ScreenshotCategory;
      context?: string;
      description?: ScreenshotDescription;
      isHero?: boolean;
    }
  ): Promise<PrototypeScreenshot> {
    const url = await uploadImage(userId, prototypeId, file);
    const title = meta.title.trim() || file.name.replace(/\.[^.]+$/, '');
    const category = meta.category ?? 'ui';
    const isHero = meta.isHero ?? false;

    if (isHero) {
      await supabase
        .from('prototype_screenshots')
        .update({ is_hero: false, updated_at: new Date().toISOString() })
        .eq('prototype_id', prototypeId);
    }

    const existing = await screenshotService.list(prototypeId);
    const sortOrder = existing.length;

    const { data, error } = await supabase
      .from('prototype_screenshots')
      .insert({
        prototype_id: prototypeId,
        user_id: userId,
        title,
        url,
        category,
        context: meta.context?.trim() || null,
        purpose: meta.description?.purpose ?? null,
        ux_description: meta.description?.uxDescription ?? null,
        functionality: meta.description?.functionality ?? null,
        user_value: meta.description?.userValue ?? null,
        is_hero: isHero || existing.length === 0,
        sort_order: sortOrder,
      })
      .select()
      .single();

    if (error) {
      if (isMissingTable(error)) {
        throw new Error('Screenshot gallery is not configured. Run migration 20240615000004_prototype_screenshots.sql');
      }
      throw error;
    }

    if (!meta.description && !existing.some((s) => s.isHero) && data) {
      await supabase
        .from('prototypes')
        .update({ thumbnail_url: url, updated_at: new Date().toISOString() })
        .eq('id', prototypeId)
        .eq('user_id', userId);
    }

    return mapRow(data as Record<string, unknown>);
  },

  async updateDescriptions(
    screenshotId: string,
    description: ScreenshotDescription
  ): Promise<void> {
    const { error } = await supabase
      .from('prototype_screenshots')
      .update({
        title: description.title,
        purpose: description.purpose,
        ux_description: description.uxDescription,
        functionality: description.functionality,
        user_value: description.userValue,
        updated_at: new Date().toISOString(),
      })
      .eq('id', screenshotId);

    if (error) throw error;
  },

  async setHero(prototypeId: string, screenshotId: string): Promise<void> {
    await supabase
      .from('prototype_screenshots')
      .update({ is_hero: false, updated_at: new Date().toISOString() })
      .eq('prototype_id', prototypeId);

    const { data, error } = await supabase
      .from('prototype_screenshots')
      .update({ is_hero: true, updated_at: new Date().toISOString() })
      .eq('id', screenshotId)
      .eq('prototype_id', prototypeId)
      .select('url')
      .single();

    if (error) throw error;

    if (data?.url) {
      await supabase
        .from('prototypes')
        .update({ thumbnail_url: String(data.url), updated_at: new Date().toISOString() })
        .eq('id', prototypeId);
    }
  },

  async remove(screenshotId: string, prototypeId: string): Promise<void> {
    const { error } = await supabase
      .from('prototype_screenshots')
      .delete()
      .eq('id', screenshotId)
      .eq('prototype_id', prototypeId);

    if (error) throw error;
  },
};
