import { useState } from 'react';
import type { PrototypeBuilderMeta } from '../../types/prototypeBuilder.types';
import { newBuilderId } from '../../types/prototypeBuilder.types';

interface Props {
  meta: PrototypeBuilderMeta;
  authorName: string;
  disabled?: boolean;
  onChange: (patch: Partial<PrototypeBuilderMeta>) => void;
}

export function CollaborationPanel({ meta, authorName, disabled, onChange }: Props) {
  const [commentText, setCommentText] = useState('');

  const addComment = () => {
    const text = commentText.trim();
    if (!text) return;
    onChange({
      comments: [
        { id: newBuilderId(), author: authorName, text, createdAt: new Date().toISOString() },
        ...meta.comments,
      ],
      activity: [
        {
          id: newBuilderId(),
          type: 'comment' as const,
          message: `${authorName} commented`,
          createdAt: new Date().toISOString(),
        },
        ...meta.activity,
      ].slice(0, 50),
    });
    setCommentText('');
  };

  return (
    <section id="proto-builder-collaboration" className="proto-builder-panel">
      <header className="proto-builder-panel__head">
        <h2>Collaboration</h2>
        <p>Comments, mentions, and team activity feed.</p>
      </header>

      <div className="proto-collab-compose">
        <textarea
          rows={3}
          value={commentText}
          disabled={disabled}
          placeholder={`Add a comment… Use @mention for teammates`}
          onChange={(e) => setCommentText(e.target.value)}
        />
        <button type="button" className="proto-btn proto-btn--secondary" disabled={disabled || !commentText.trim()} onClick={addComment}>
          Post comment
        </button>
      </div>

      {meta.comments.length === 0 ? (
        <p className="proto-muted">No comments yet. Start a discussion with your team.</p>
      ) : (
        <ul className="proto-collab-comments">
          {meta.comments.map((c) => (
            <li key={c.id}>
              <strong>{c.author}</strong>
              <time>{new Date(c.createdAt).toLocaleString()}</time>
              <p>{c.text}</p>
            </li>
          ))}
        </ul>
      )}

      <h3 className="proto-collab-activity-title">Activity feed</h3>
      {meta.activity.length === 0 ? (
        <p className="proto-muted">Activity will appear as you edit the prototype.</p>
      ) : (
        <ul className="proto-collab-activity">
          {meta.activity.slice(0, 15).map((a) => (
            <li key={a.id}>
              <span className={`proto-collab-activity__type proto-collab-activity__type--${a.type}`}>{a.type}</span>
              <span>{a.message}</span>
              <time>{new Date(a.createdAt).toLocaleString()}</time>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
