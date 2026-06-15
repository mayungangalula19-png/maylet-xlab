import { useState } from 'react';
import type { CreatePostPayload, PostType } from '../../types/community.types';

interface CreatePostModalProps {
  onClose: () => void;
  onSubmit: (payload: CreatePostPayload) => Promise<void>;
  posting: boolean;
  error: string | null;
}

export default function CreatePostModal({ onClose, onSubmit, posting, error }: CreatePostModalProps) {
  const [type, setType] = useState<PostType>('update');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');

  const canSubmit = title.trim().length >= 3 && content.trim().length >= 10;

  return (
    <div className="mxl-comm__modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="create-post-title">
      <div className="mxl-comm__modal">
        <h3 id="create-post-title">Create ecosystem post</h3>
        {error && <p className="mxl-comm__error">{error}</p>}
        <label htmlFor="post-type">Post type</label>
        <select id="post-type" value={type} onChange={(e) => setType(e.target.value as PostType)}>
          <option value="research">Research update</option>
          <option value="project">Project update</option>
          <option value="update">General update</option>
          <option value="announcement">Announcement</option>
        </select>
        <label htmlFor="post-title">Title</label>
        <input id="post-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={160} />
        <label htmlFor="post-content">Content</label>
        <textarea id="post-content" value={content} onChange={(e) => setContent(e.target.value)} maxLength={4000} />
        <label htmlFor="post-tags">Tags (comma or # separated)</label>
        <input id="post-tags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="#AI, #Energy" />
        <div className="mxl-comm__modal-foot">
          <button type="button" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="mxl-comm__btn-primary"
            disabled={posting || !canSubmit}
            onClick={() => void onSubmit({ type, title, content, tags })}
          >
            {posting ? 'Publishing…' : 'Publish'}
          </button>
        </div>
      </div>
    </div>
  );
}
