import { memo, useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { initials, sanitizeText, timeAgo } from '../../lib/communityUtils';
import type { CollaborationAction, CommunityComment, CommunityPost } from '../../types/community.types';

export interface PostCardProps {
  post: CommunityPost;
  liked: boolean;
  saved: boolean;
  comments: CommunityComment[];
  showComments: boolean;
  onLike: (id: string) => void;
  onShare: (id: string) => void;
  onSave: (id: string) => void;
  onToggleComments: (id: string) => void;
  onComment: (postId: string, text: string) => void;
  onCollaboration: (action: CollaborationAction, post: CommunityPost) => void;
}

const PostCard = memo(function PostCard({
  post,
  liked,
  saved,
  comments,
  showComments,
  onLike,
  onShare,
  onSave,
  onToggleComments,
  onComment,
  onCollaboration,
}: PostCardProps) {
  const [draft, setDraft] = useState('');
  const commentId = useId();

  return (
    <article className="mxl-comm__card" aria-labelledby={`post-${post.id}-title`}>
      <div className="mxl-comm__card-head">
        <div className="mxl-comm__avatar" aria-hidden="true">
          {initials(post.author.name)}
        </div>
        <div className="mxl-comm__meta">
          <strong>{post.author.name}</strong>
          <span>
            {post.author.role} · {post.author.expertise} · {timeAgo(post.createdAt)}
          </span>
        </div>
        <span className="mxl-comm__type">{post.type}</span>
      </div>
      <h3 id={`post-${post.id}-title`}>{post.title}</h3>
      <p dangerouslySetInnerHTML={{ __html: sanitizeText(post.content) }} />
      <div className="mxl-comm__tags">
        {post.tags.map((tag) => (
          <span key={tag}>{tag}</span>
        ))}
      </div>
      <div className="mxl-comm__collab">
        {post.teamId && (
          <Link to={`/teams/${post.teamId}`} onClick={() => onCollaboration('join_team', post)}>
            Join Team
          </Link>
        )}
        {post.projectId && (
          <>
            <Link
              to={`/projects/${post.projectId}`}
              onClick={() => onCollaboration('contribute_project', post)}
            >
              Contribute to Project
            </Link>
            <Link
              to={`/research/${post.projectId}`}
              onClick={() => onCollaboration('view_research', post)}
            >
              View Research Details
            </Link>
          </>
        )}
        <button type="button" onClick={() => onCollaboration('request_collaboration', post)}>
          Request Collaboration
        </button>
      </div>
      <div className="mxl-comm__actions">
        <button type="button" className={liked ? 'is-on' : ''} onClick={() => onLike(post.id)}>
          ♥ {post.engagement.likes + (liked ? 1 : 0)}
        </button>
        <button type="button" onClick={() => onToggleComments(post.id)}>
          💬 {post.engagement.comments + comments.length}
        </button>
        <button type="button" onClick={() => onShare(post.id)}>
          ↗ Share {post.engagement.shares}
        </button>
        <button type="button" className={saved ? 'is-on' : ''} onClick={() => onSave(post.id)}>
          {saved ? '★ Saved' : '☆ Save'}
        </button>
      </div>
      {showComments && (
        <div className="mxl-comm__comments">
          {comments.map((c) => (
            <div key={c.id} className="mxl-comm__comment">
              <strong>{c.author.name}: </strong>
              <span dangerouslySetInnerHTML={{ __html: sanitizeText(c.content, 800) }} />
            </div>
          ))}
          <form
            className="mxl-comm__comment-form"
            onSubmit={(e) => {
              e.preventDefault();
              if (!draft.trim()) return;
              onComment(post.id, draft);
              setDraft('');
            }}
          >
            <label className="sr-only" htmlFor={commentId}>
              Add comment
            </label>
            <input
              id={commentId}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Add a comment…"
              maxLength={500}
            />
            <button type="submit" className="mxl-comm__btn-primary">
              Post
            </button>
          </form>
        </div>
      )}
    </article>
  );
});

export default PostCard;
